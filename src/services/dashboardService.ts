import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  startAt,
  endAt
} from '../firebase/config';
import { db } from '../firebase/config';
import type {
  DashboardMetrics,
  RevenueData,
  PaymentModeDistribution,
  CustomerGrowthData,
  PlanDistribution,
  TimeRangeMetrics,
  DateFilter
} from '../types';
import { CustomerService } from './customerService';
import { PaymentService } from './paymentService';
import { LeadService } from './leadService';
import { ComplaintsService } from './complaintsService';
import { getDateFilter } from '../utils/dateFilters';

const CUSTOMERS_COLLECTION = 'customers';
const PAYMENTS_COLLECTION = 'payments';
const LEADS_COLLECTION = 'leads';

export const DashboardService = {
  
  // ==================== REAL-TIME DASHBOARD METRICS ====================
  subscribeToDashboardMetrics: (
    dateRange: DateFilter,
    callback: (metrics: DashboardMetrics | null) => void
  ) => {
    try {
      const { startDate, endDate } = dateRange;
      
      // Subscribe to customers
      const customersUnsub = onSnapshot(
        collection(db, CUSTOMERS_COLLECTION),
        (snapshot) => {
          const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          DashboardService.calculateMetrics(customers, dateRange).then(callback).catch(console.error);
        }
      );

      // Subscribe to payments
      const paymentsUnsub = onSnapshot(
        query(
          collection(db, PAYMENTS_COLLECTION),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('createdAt', 'desc')
        ),
        (snapshot) => {
          const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          DashboardService.calculateMetrics([], dateRange, payments).then(callback).catch(console.error);
        }
      );

      // Subscribe to leads
      const leadsUnsub = onSnapshot(
        query(
          collection(db, LEADS_COLLECTION),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('createdAt', 'desc')
        ),
        (snapshot) => {
          const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          DashboardService.calculateMetrics([], dateRange, [], leads).then(callback).catch(console.error);
        }
      );

      // Return cleanup function
      return () => {
        customersUnsub();
        paymentsUnsub();
        leadsUnsub();
      };
    } catch (error) {
      console.error('Error subscribing to dashboard metrics:', error);
      callback(null);
    }
  },

  // ==================== METRICS CALCULATION ====================
  calculateMetrics: async (
    customers: any[] = [],
    dateRange: DateFilter,
    payments: any[] = [],
    leads: any[] = []
  ): Promise<DashboardMetrics> => {
    try {
      // If no data provided, fetch it
      if (customers.length === 0) {
        const customerSnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
        customers = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      if (payments.length === 0) {
        const paymentSnapshot = await getDocs(
          query(
            collection(db, PAYMENTS_COLLECTION),
            where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate!)),
            where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate!)),
            orderBy('createdAt', 'desc')
          )
        );
        payments = paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      if (leads.length === 0) {
        const leadSnapshot = await getDocs(
          query(
            collection(db, LEADS_COLLECTION),
            where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate!)),
            where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate!)),
            orderBy('createdAt', 'desc')
          )
        );
        leads = leadSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Calculate basic metrics
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => (c as any).status === 'Active').length;
      const inactiveCustomers = customers.filter(c => (c as any).status === 'Inactive').length;
      const suspendedCustomers = customers.filter(c => (c as any).status === 'Suspended').length;
      const expiredCustomers = customers.filter(c => (c as any).status === 'Expired').length;

      // Calculate revenue metrics
      const totalRevenue = payments.reduce((sum, p) => sum + ((p as any).billAmount || 0), 0);
      const monthlyRevenue = payments
        .filter(p => {
          const paymentDate = new Date((p as any).paidDate || Date.now());
          return paymentDate.getMonth() === new Date().getMonth() &&
                 paymentDate.getFullYear() === new Date().getFullYear();
        })
        .reduce((sum, p) => sum + ((p as any).billAmount || 0), 0);

      // Calculate payment metrics
      const completedPayments = payments.filter(p => (p as any).status === 'Paid').length;
      const pendingPayments = payments.filter(p => (p as any).status === 'Unpaid').length;

      // Calculate today's collection
      const todayCollection = payments
        .filter(p => {
          const paymentDate = new Date((p as any).paidDate || (p as any).createdAt || Date.now());
          const today = new Date();
          return paymentDate.toDateString() === today.toDateString() && (p as any).status === 'Paid';
        })
        .reduce((sum, p) => sum + ((p as any).billAmount || 0), 0);

      // Calculate leads metrics
      const leadsThisMonth = leads.filter(lead => {
        const leadDate = new Date((lead as any).createdAt || Date.now());
        return leadDate.getMonth() === new Date().getMonth() &&
               leadDate.getFullYear() === new Date().getFullYear();
      }).length;

      const convertedLeads = leads.filter(lead => (lead as any).status === 'Sale').length;
      const conversionRate = leadsThisMonth > 0 ? (convertedLeads / leadsThisMonth) * 100 : 0;

      // Calculate average revenue per customer
      const avgRevenuePerCustomer = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;

      // Calculate new customers this month
      const newCustomersThisMonth = customers.filter(customer => {
        const createdDate = new Date((customer as any).createdAt || Date.now());
        return createdDate.getMonth() === new Date().getMonth() &&
               createdDate.getFullYear() === new Date().getFullYear();
      }).length;

      // Calculate renewal due count (customers with renewals in next 30 days)
      const renewalDueCount = customers.filter(customer => {
        // Assuming renewal logic based on installation date and plan validity
        // This would need to be adjusted based on actual business logic
        return (customer as any).renewalDate &&
               new Date((customer as any).renewalDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }).length;

      // Fetch complaints data for additional metrics
      const complaints = await ComplaintsService.getComplaints();
      const unresolvedComplaints = complaints.filter(c => (c as any).status !== 'Resolved').length;
      const avgResponseTime = complaints.length > 0 ?
        complaints.reduce((sum, c) => sum + ((c as any).responseTime || 0), 0) / complaints.length : 0;

      return {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        suspendedCustomers,
        expiredCustomers,
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        completedPayments,
        leadsThisMonth,
        conversionRate,
        avgRevenuePerCustomer,
        renewalDueCount,
        newCustomersThisMonth,
        // Additional fields expected by component
        pendingInvoices: pendingPayments,
        expiredToday: expiredCustomers,
        suspendedCount: suspendedCustomers,
        todayCollection,
        unresolvedComplaints,
        avgResponseTime,
        newToday: newCustomersThisMonth
      };
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      throw error;
    }
  },

  // ==================== REVENUE ANALYTICS ====================
  getRevenueData: async (dateRange: DateFilter): Promise<RevenueData[]> => {
    try {
      const { startDate, endDate } = dateRange;
      
      const paymentSnapshot = await getDocs(
        query(
          collection(db, PAYMENTS_COLLECTION),
          where('paidDate', '>=', Timestamp.fromDate(startDate)),
          where('paidDate', '<=', Timestamp.fromDate(endDate)),
          orderBy('paidDate', 'asc')
        )
      );

      const payments = paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Group by month
      const monthlyData = payments.reduce((acc, payment) => {
        const date = new Date((payment as any).paidDate || (payment as any).createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            revenue: 0,
            customers: 0,
            payments: 0
          };
        }
        
        acc[monthKey].revenue += (payment as any).billAmount || 0;
        acc[monthKey].payments += 1;
        
        return acc;
      }, {} as Record<string, RevenueData>);

      // Get unique customers per month
      const customerCounts = payments.reduce((acc, payment) => {
        const date = new Date((payment as any).paidDate || (payment as any).createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = new Set();
        }
        acc[monthKey].add((payment as any).landlineNo || '');
        
        return acc;
      }, {} as Record<string, Set<string>>);

      // Update customer counts
      Object.keys(monthlyData).forEach(monthKey => {
        monthlyData[monthKey].customers = customerCounts[monthKey]?.size || 0;
      });

      return Object.values(monthlyData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  },

  // ==================== PAYMENT MODE DISTRIBUTION ====================
  getPaymentModeDistribution: async (dateRange: DateFilter): Promise<PaymentModeDistribution[]> => {
    try {
      const { startDate, endDate } = dateRange;
      
      const paymentSnapshot = await getDocs(
        query(
          collection(db, PAYMENTS_COLLECTION),
          where('paidDate', '>=', Timestamp.fromDate(startDate)),
          where('paidDate', '<=', Timestamp.fromDate(endDate)),
          orderBy('paidDate', 'desc')
        )
      );

      const payments = paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Group by payment mode
      const modeData = payments.reduce((acc, payment) => {
        const mode = (payment as any).modeOfPayment || 'Unknown';
        
        if (!acc[mode]) {
          acc[mode] = {
            mode,
            count: 0,
            amount: 0,
            percentage: 0
          };
        }
        
        acc[mode].count += 1;
        acc[mode].amount += (payment as any).billAmount || 0;
        
        return acc;
      }, {} as Record<string, PaymentModeDistribution>);

      // Calculate percentages
      const totalAmount = Object.values(modeData).reduce((sum, mode) => sum + mode.amount, 0);
      Object.values(modeData).forEach(mode => {
        mode.percentage = totalAmount > 0 ? (mode.amount / totalAmount) * 100 : 0;
      });

      return Object.values(modeData);
    } catch (error) {
      console.error('Error fetching payment mode distribution:', error);
      return [];
    }
  },

  // ==================== CUSTOMER GROWTH ANALYTICS ====================
  getCustomerGrowthData: async (dateRange: DateFilter): Promise<CustomerGrowthData[]> => {
    try {
      const { startDate, endDate } = dateRange;
      
      const customerSnapshot = await getDocs(
        query(
          collection(db, CUSTOMERS_COLLECTION),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('createdAt', 'asc')
        )
      );

      const customers = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Group by date
      const dailyData = customers.reduce((acc, customer) => {
        const date = new Date((customer as any).createdAt || Date.now()).toDateString();
        
        if (!acc[date]) {
          acc[date] = {
            date,
            newCustomers: 0,
            activeCustomers: 0,
            totalCustomers: 0
          };
        }
        
        acc[date].newCustomers += 1;
        if ((customer as any).status === 'Active') {
          acc[date].activeCustomers += 1;
        }
        
        return acc;
      }, {} as Record<string, CustomerGrowthData>);

      // Calculate cumulative totals
      let cumulativeNew = 0;
      let cumulativeActive = 0;
      
      Object.keys(dailyData).sort().forEach(date => {
        cumulativeNew += dailyData[date].newCustomers;
        cumulativeActive += dailyData[date].activeCustomers;
        dailyData[date].totalCustomers = cumulativeNew;
        dailyData[date].activeCustomers = cumulativeActive;
      });

      return Object.values(dailyData);
    } catch (error) {
      console.error('Error fetching customer growth data:', error);
      return [];
    }
  },

  // ==================== PLAN DISTRIBUTION ====================
  getPlanDistribution: async (dateRange: DateFilter): Promise<PlanDistribution[]> => {
    try {
      const customerSnapshot = await getDocs(
        query(
          collection(db, CUSTOMERS_COLLECTION),
          orderBy('plan', 'asc')
        )
      );

      const customers = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Group by plan
      const planData = customers.reduce((acc, customer) => {
        const plan = (customer as any).plan || 'Unknown Plan';
        
        if (!acc[plan]) {
          acc[plan] = {
            plan,
            customerCount: 0,
            revenue: 0,
            percentage: 0
          };
        }
        
        acc[plan].customerCount += 1;
        
        return acc;
      }, {} as Record<string, PlanDistribution>);

      // Calculate percentages and get payment data for revenue
      const paymentSnapshot = await getDocs(collection(db, PAYMENTS_COLLECTION));
      const payments = paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate revenue per plan
      Object.keys(planData).forEach(plan => {
        const planCustomers = customers.filter(c => (c as any).plan === plan);
        const planPayments = payments.filter(p => 
          planCustomers.some(c => (c as any).landline === (p as any).landlineNo)
        );
        planData[plan].revenue = planPayments.reduce((sum, p) => sum + ((p as any).billAmount || 0), 0);
      });

      const totalCustomers = customers.length;
      Object.values(planData).forEach(plan => {
        plan.percentage = totalCustomers > 0 ? (plan.customerCount / totalCustomers) * 100 : 0;
      });

      return Object.values(planData);
    } catch (error) {
      console.error('Error fetching plan distribution:', error);
      return [];
    }
  },

  // ==================== TIME RANGE METRICS ====================
  getTimeRangeMetrics: async (dateFilter: DateFilter): Promise<TimeRangeMetrics> => {
    const metrics = await DashboardService.calculateMetrics([], dateFilter);
    const revenueData = await DashboardService.getRevenueData(dateFilter);
    const paymentDistribution = await DashboardService.getPaymentModeDistribution(dateFilter);
    
    return {
      startDate: dateFilter.startDate!,
      endDate: dateFilter.endDate!,
      label: dateFilter.label
    };
  },

  // ==================== HELPER METHODS ====================
  getQuickMetrics: async (): Promise<Partial<DashboardMetrics>> => {
    try {
      const today = getDateFilter('today');
      const thisMonth = getDateFilter('thisMonth');
      
      const [todayMetrics, monthMetrics] = await Promise.all([
        DashboardService.calculateMetrics([], today),
        DashboardService.calculateMetrics([], thisMonth)
      ]);

      return {
        totalRevenue: todayMetrics.totalRevenue,
        monthlyRevenue: monthMetrics.monthlyRevenue,
        activeCustomers: todayMetrics.activeCustomers,
        newCustomersThisMonth: monthMetrics.newCustomersThisMonth
      };
    } catch (error) {
      console.error('Error fetching quick metrics:', error);
      return {};
    }
  }
};