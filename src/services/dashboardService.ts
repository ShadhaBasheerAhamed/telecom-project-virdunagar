import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { DashboardMetrics, DateFilter, RevenueData, PaymentModeDistribution, CustomerGrowthData, PlanDistribution } from '../types';

export class DashboardService {

  // --- HELPER: Get Date Boundaries ---
  private static getDateBoundaries(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    // Start of Selected Day
    const startOfDay = new Date(d);
    
    // End of Selected Day
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    // "YYYY-MM-DD" String for Payments (Local Time)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return { startOfDay, endOfDay, dateString };
  }

  // --- HELPER: Zero Metrics ---
  private static getZeroMetrics(): DashboardMetrics {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0,
      suspendedCustomers: 0,
      expiredCustomers: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingPayments: 0,
      completedPayments: 0,
      pendingInvoices: 0,
      leadsThisMonth: 0,
      conversionRate: 0,
      avgRevenuePerCustomer: 0,
      renewalDueCount: 0,
      newCustomersThisMonth: 0,
      newToday: 0,
      todayCollection: 0,
      unresolvedComplaints: 0,
      avgResponseTime: 0
    };
  }

  // --- HELPER: Zero Data ---
  private static getZeroData() {
      return {
          customerStats: { total: 0, active: 0, expired: 0, suspended: 0, disabled: 0 },
          financeData: { pendingInvoices: 0, todayCollected: 0, onlineCollected: 0, offlineCollected: 0, monthlyRevenue: 0, totalPendingValue: 0 },
          registrationsData: [],
          renewalsData: [],
          expiredData: [],
          complaintsData: [{ name: 'Open', value: 0 }, { name: 'Resolved', value: 0 }, { name: 'Pending', value: 0 }],
          invoicePaymentsData: []
      };
  }

  // === SUBSCRIBE TO DASHBOARD METRICS (REAL-TIME) ===
  static subscribeToDashboardMetrics(
    dateRange: DateFilter,
    callback: (metrics: DashboardMetrics | null) => void
  ): () => void {
    try {
      // Set up real-time subscription to customers collection
      const customersQuery = collection(db, 'customers');
      
      const unsubscribe = onSnapshot(customersQuery, async (snapshot) => {
        try {
          const metrics = await this.calculateMetrics([], dateRange);
          callback(metrics);
        } catch (error) {
          console.error('Error calculating metrics in subscription:', error);
          callback(this.getZeroMetrics());
        }
      }, (error) => {
        console.error('Error in dashboard metrics subscription:', error);
        callback(this.getZeroMetrics());
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up dashboard metrics subscription:', error);
      callback(this.getZeroMetrics());
      return () => {}; // Return empty cleanup function
    }
  }

  // === CALCULATE METRICS ===
  static async calculateMetrics(
    customers: any[] = [],
    dateRange: DateFilter
  ): Promise<DashboardMetrics> {
    try {
      // If no customers provided, fetch them
      let customerData = customers;
      if (customerData.length === 0) {
        const custSnap = await getDocs(collection(db, 'customers'));
        customerData = custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // If no dateRange provided, use current month
      const endDate = dateRange.endDate || new Date();
      const startDate = dateRange.startDate || new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      // Calculate metrics
      let totalCustomers = 0;
      let activeCustomers = 0;
      let inactiveCustomers = 0;
      let suspendedCustomers = 0;
      let expiredCustomers = 0;
      let newCustomersThisMonth = 0;
      let newToday = 0;

      const currentDate = new Date();
      const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      customerData.forEach(customer => {
        const status = (customer.status || '').toLowerCase();
        const createdAt = customer.createdAt ? new Date(customer.createdAt) : null;

        // Count total customers created before or on endDate
        if (!createdAt || createdAt <= endDate) {
          totalCustomers++;

          // Status counts
          if (status === 'active') activeCustomers++;
          else if (status === 'inactive' || status === 'disabled') inactiveCustomers++;
          else if (status === 'suspended') suspendedCustomers++;
          else if (status === 'expired') expiredCustomers++;

          // New customers this month
          if (createdAt && createdAt >= monthStart && createdAt <= endDate) {
            newCustomersThisMonth++;
          }

          // New today
          if (createdAt && createdAt >= today && createdAt <= endDate) {
            newToday++;
          }
        }
      });

      // Calculate remaining expired customers
      const calculatedExpired = Math.max(0, totalCustomers - (activeCustomers + inactiveCustomers + suspendedCustomers));

      // Fetch payments data for revenue calculations
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let todayCollection = 0;
      let pendingPayments = 0;
      let completedPayments = 0;

      paymentsSnap.forEach(doc => {
        const payment = doc.data();
        const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;
        const billAmount = Number(payment.billAmount || 0);
        const status = payment.status || 'Unpaid';

        if (status === 'Paid') {
          completedPayments++;
          if (paidDate) {
            totalRevenue += billAmount;
            
            // Monthly revenue (current month)
            if (paidDate.getMonth() === currentDate.getMonth() &&
                paidDate.getFullYear() === currentDate.getFullYear()) {
              monthlyRevenue += billAmount;
            }

            // Today's collection
            if (paidDate >= today && paidDate <= endDate) {
              todayCollection += billAmount;
            }
          }
        } else {
          pendingPayments++;
        }
      });

      // Calculate averages
      const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      const conversionRate = 0; // Would need leads data to calculate

      return {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        suspendedCustomers,
        expiredCustomers: calculatedExpired,
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        completedPayments,
        pendingInvoices: pendingPayments,
        leadsThisMonth: 0, // Would need leads collection
        conversionRate,
        avgRevenuePerCustomer,
        renewalDueCount: 0, // Would need renewal date analysis
        newCustomersThisMonth,
        newToday,
        todayCollection,
        unresolvedComplaints: 0, // Would need complaints collection
        avgResponseTime: 0 // Would need complaints data to calculate
      };

    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      return this.getZeroMetrics();
    }
  }

  // === GET REVENUE DATA ===
  static async getRevenueData(dateRange: DateFilter): Promise<RevenueData[]> {
    try {
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      const revenueByMonth: Record<string, { revenue: number; customers: number; payments: number }> = {};

      paymentsSnap.forEach(doc => {
        const payment = doc.data();
        if (payment.status === 'Paid' && payment.paidDate) {
          const paidDate = new Date(payment.paidDate);
          const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!revenueByMonth[monthKey]) {
            revenueByMonth[monthKey] = { revenue: 0, customers: 0, payments: 0 };
          }
          
          revenueByMonth[monthKey].revenue += Number(payment.billAmount || 0);
          revenueByMonth[monthKey].payments += 1;
          revenueByMonth[monthKey].customers += 1; // Simplified - one payment per customer per month
        }
      });

      return Object.entries(revenueByMonth).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        customers: data.customers,
        payments: data.payments
      })).sort((a, b) => a.month.localeCompare(b.month));

    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  }

  // === GET PAYMENT MODE DISTRIBUTION ===
  static async getPaymentModeDistribution(dateRange: DateFilter): Promise<PaymentModeDistribution[]> {
    try {
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      const modeStats: Record<string, { count: number; amount: number }> = {};

      paymentsSnap.forEach(doc => {
        const payment = doc.data();
        if (payment.status === 'Paid' && payment.paidDate) {
          const paidDate = new Date(payment.paidDate);
          const mode = (payment.modeOfPayment || 'Unknown').toUpperCase();
          const amount = Number(payment.billAmount || 0);

          if (!modeStats[mode]) {
            modeStats[mode] = { count: 0, amount: 0 };
          }
          
          modeStats[mode].count += 1;
          modeStats[mode].amount += amount;
        }
      });

      const totalAmount = Object.values(modeStats).reduce((sum, stat) => sum + stat.amount, 0);

      return Object.entries(modeStats).map(([mode, stat]) => ({
        mode,
        count: stat.count,
        amount: stat.amount,
        percentage: totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

    } catch (error) {
      console.error('Error fetching payment mode distribution:', error);
      return [];
    }
  }

  // === GET CUSTOMER GROWTH DATA ===
  static async getCustomerGrowthData(dateRange: DateFilter): Promise<CustomerGrowthData[]> {
    try {
      const customersSnap = await getDocs(collection(db, 'customers'));
      const growthByDate: Record<string, { newCustomers: number; activeCustomers: number; totalCustomers: number }> = {};

      customersSnap.forEach(doc => {
        const customer = doc.data();
        if (customer.createdAt) {
          const createdDate = new Date(customer.createdAt);
          const dateKey = createdDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          if (!growthByDate[dateKey]) {
            growthByDate[dateKey] = { newCustomers: 0, activeCustomers: 0, totalCustomers: 0 };
          }
          
          growthByDate[dateKey].newCustomers += 1;
          
          // Count active customers up to this date
          if ((customer.status || '').toLowerCase() === 'active') {
            growthByDate[dateKey].activeCustomers += 1;
          }
        }
      });

      // Calculate cumulative totals
      let cumulativeTotal = 0;
      const sortedDates = Object.keys(growthByDate).sort();
      
      return sortedDates.map(date => {
        const data = growthByDate[date];
        cumulativeTotal += data.newCustomers;
        
        return {
          date,
          newCustomers: data.newCustomers,
          activeCustomers: data.activeCustomers,
          totalCustomers: cumulativeTotal
        };
      });

    } catch (error) {
      console.error('Error fetching customer growth data:', error);
      return [];
    }
  }

  // === GET PLAN DISTRIBUTION ===
  static async getPlanDistribution(dateRange: DateFilter): Promise<PlanDistribution[]> {
    try {
      const customersSnap = await getDocs(collection(db, 'customers'));
      const planStats: Record<string, { customerCount: number; revenue: number }> = {};

      customersSnap.forEach(doc => {
        const customer = doc.data();
        const plan = customer.plan || 'Unknown Plan';
        
        if (!planStats[plan]) {
          planStats[plan] = { customerCount: 0, revenue: 0 };
        }
        
        planStats[plan].customerCount += 1;
        // Note: Revenue calculation would need pricing data from plans or payments
      });

      const totalCustomers = Object.values(planStats).reduce((sum, stat) => sum + stat.customerCount, 0);

      return Object.entries(planStats).map(([plan, stat]) => ({
        plan,
        customerCount: stat.customerCount,
        revenue: stat.revenue,
        percentage: totalCustomers > 0 ? (stat.customerCount / totalCustomers) * 100 : 0
      })).sort((a, b) => b.customerCount - a.customerCount);

    } catch (error) {
      console.error('Error fetching plan distribution:', error);
      return [];
    }
  }

  // === GENERATE CHART DATA (LEGACY METHOD) ===
  static async generateChartData(selectedDate: Date = new Date()) {
    
    // 1. STRICT FUTURE DATE CHECK
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate > today) {
        return this.getZeroData();
    }

    const { startOfDay, endOfDay, dateString } = this.getDateBoundaries(selectedDate);

    try {
        // --- 2. FETCH DATA ---
        const custColl = collection(db, 'customers');
        const payColl = collection(db, 'payments');
        
        // Fetch ALL customers
        const custSnap = await getDocs(custColl);
        
        // Fetch Payments for specific date string
        const paySnap = await getDocs(query(payColl, where('paidDate', '==', dateString)));

        // --- 3. FILTER CUSTOMERS (JS Logic) ---
        let total = 0;
        let active = 0;
        let suspended = 0;
        let newToday = 0;
        let disabled = 0;

        custSnap.forEach(doc => {
            const data = doc.data();
            const createdDate = new Date(data.createdAt || Date.now());

            // Count if created BEFORE or ON selected date
            if (createdDate <= endOfDay) {
                total++;

                // Status Check
                const status = (data.status || '').toLowerCase();
                if (status === 'active') active++;
                else if (status === 'suspended') suspended++;
                else if (status === 'disabled' || status === 'inactive') disabled++;

                // New Customer ONLY for selected day
                if (createdDate >= startOfDay && createdDate <= endOfDay) {
                    newToday++;
                }
            }
        });

        const expired = Math.max(0, total - (active + suspended + disabled));

        // --- 4. PROCESS PAYMENTS ---
        let todayCollected = 0;
        let online = 0;
        let offline = 0;

        paySnap.forEach(doc => {
             const data = doc.data();
             const amt = Number(data.billAmount || 0);
             todayCollected += amt;
             
             const mode = (data.modeOfPayment || 'CASH').toUpperCase();
             if(['ONLINE', 'UPI', 'BSNL PAYMENT', 'GPAY', 'PHONEPE', 'GOOGLE PAY'].includes(mode)) {
                 online += amt;
             } else {
                 offline += amt;
             }
        });

        // --- 5. COMPLAINTS (Stubbed) ---
        const open = 0;
        const resolved = 0;
        const pending = 0;

        return {
            customerStats: { total, active, expired, suspended, disabled },
            financeData: {
                pendingInvoices: 0,
                todayCollected,
                onlineCollected: online,
                offlineCollected: offline,
                monthlyRevenue: 0,
                totalPendingValue: 0
            },
            registrationsData: [{ day: selectedDate.getDate(), value: newToday }],
            renewalsData: [],
            expiredData: [],
            complaintsData: [
                { name: 'Open', value: open },
                { name: 'Resolved', value: resolved },
                { name: 'Pending', value: pending }
            ],
            invoicePaymentsData: [
                { name: 'Selected Day', online: online, offline: offline, direct: 0 }
            ]
        };

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return this.getZeroData();
    }
  }
}