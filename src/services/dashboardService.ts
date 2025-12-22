import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ExpiredOverviewService } from './expiredOverviewService';
import type { DashboardMetrics, DateFilter, RevenueData, PaymentModeDistribution, CustomerGrowthData, PlanDistribution } from '../types';
import type { Complaint } from '../components/pages/Complaints';

export class DashboardService {
   
  // ---------------------------------------------------------------------------
  // 1. HELPER: DATE BOUNDARIES (Local Time Fixed)
  // ---------------------------------------------------------------------------
  // [Command] Calculates specific Start and End timestamps to filter database queries accurately.
  // [Command] Uses LOCAL time components to avoid UTC timezone mismatches (fixing the 0.00 issue).
  private static getDateBoundaries(date: Date, range: string = 'week') {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    // [Command] Set Start of the Day
    let startOfDay = new Date(d);
    
    // [Command] Set End of Day to the last millisecond of the day
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    // [Command] Adjust Start Date based on the selected range filter
    if (range === 'week') {
      startOfDay.setDate(d.getDate() - 6); // Go back 6 days
    } else if (range === 'month') {
      startOfDay = new Date(d.getFullYear(), d.getMonth(), 1); // Go to 1st of month
    } else if (range === 'year') {
      startOfDay = new Date(d.getFullYear(), 0, 1); // Go to Jan 1st
    }

    // [Command] Format Date String manually (YYYY-MM-DD) using Local Time to match DB storage
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return { startOfDay, endOfDay, dateString };
  }

  // ---------------------------------------------------------------------------
  // 2. HELPER: ZERO METRICS
  // ---------------------------------------------------------------------------
  // [Command] Returns a default object with zeros to prevent UI crashes if data loading fails.
  private static getZeroMetrics(): DashboardMetrics {
    return {
      totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0, suspendedCustomers: 0, expiredCustomers: 0,
      totalRevenue: 0, monthlyRevenue: 0, pendingPayments: 0, completedPayments: 0, pendingInvoices: 0,
      leadsThisMonth: 0, conversionRate: 0, avgRevenuePerCustomer: 0, renewalDueCount: 0,
      newCustomersThisMonth: 0, newToday: 0, todayCollection: 0, unresolvedComplaints: 0, avgResponseTime: 0
    };
  }

  // ---------------------------------------------------------------------------
  // 3. HELPER: ZERO CHART DATA
  // ---------------------------------------------------------------------------
  // [Command] Returns empty arrays for charts. Used when selecting a future date.
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
    
  // ---------------------------------------------------------------------------
  // 4. GET REAL-TIME FINANCE STATS (COLLECTION & COMMISSION)
  // ---------------------------------------------------------------------------
  // [Command] Fetches live financial totals from 'payments' collection.
  // [Command] Filters strictly by Source (BSNL/RMAX) and the specific Date selected.
  static async getFinanceStats(source: string, date: Date) {
    try {
        // [Command] Get the correctly formatted local date string
        const { dateString } = this.getDateBoundaries(date, 'today');

        // --- PART A: CALCULATE COLLECTED AMOUNT & COMMISSION ---
        
        // [Command] Start Query: Select 'payments' where status is 'Paid'
        let q = query(collection(db, 'payments'), where('status', '==', 'Paid'));
        
        // [Command] Filter: Apply Source filter if specific source selected
        if (source !== 'All') {
            q = query(q, where('source', '==', source));
        }
        
        // [Command] Filter: Match specific date string
        q = query(q, where('paidDate', '==', dateString));

        const snapshot = await getDocs(q);
        
        let totalCollected = 0;
        let totalCommission = 0;

        // [Command] Loop through results and sum up amounts
        snapshot.forEach(doc => {
            const data = doc.data();
            // [Command] Sum Bill Amount safely
            totalCollected += Number(data.billAmount) || 0;
            // [Command] Sum Commission safely
            totalCommission += Number(data.commission) || 0;
        });

        // --- PART B: CALCULATE PENDING INVOICES ---
        
        // [Command] Start Query: Select 'payments' where status is 'Unpaid'
        let qUnpaid = query(collection(db, 'payments'), where('status', '==', 'Unpaid'));
        
        // [Command] Filter: Apply Source filter to Unpaid query as well
        if (source !== 'All') qUnpaid = query(qUnpaid, where('source', '==', source));
        
        const snapUnpaid = await getDocs(qUnpaid);
        const pendingInvoices = snapUnpaid.size; // Count documents

        return {
            todayCollected: totalCollected,
            todayCommission: totalCommission,
            pendingInvoices
        };
    } catch (error) {
        console.error("Error fetching finance stats:", error);
        return { todayCollected: 0, todayCommission: 0, pendingInvoices: 0 };
    }
  }

  // ---------------------------------------------------------------------------
  // 5. GET COMPLAINTS STATUS DATA
  // ---------------------------------------------------------------------------
  // [Command] Fetches complaints and groups them by status (Open/Resolved/Pending).
  static async getComplaintsStatusData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All'): Promise<any[]> {
    try {
      const complaintsSnap = await getDocs(collection(db, 'complaints'));
      const complaints = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
      
      const { startOfDay, endOfDay } = this.getDateBoundaries(selectedDate, range);
      
      // [Command] Filter complaints by date range AND source
      const filteredComplaints = complaints.filter(complaint => {
        if (!complaint.bookingDate) return false;
        const complaintDate = new Date(complaint.bookingDate);
        const isInDateRange = complaintDate >= startOfDay && complaintDate <= endOfDay;
        
        const complaintSource = complaint.source || '';
        const matchesSource = dataSource === 'All' || complaintSource === dataSource;
        
        return isInDateRange && matchesSource;
      });

      const statusCounts = { 'Open': 0, 'Resolved': 0, 'Pending': 0 };

      filteredComplaints.forEach(complaint => {
        const status = complaint.status || 'Open';
        const chartStatus = status === 'Not Resolved' ? 'Open' : status;
        if (statusCounts.hasOwnProperty(chartStatus)) {
          statusCounts[chartStatus]++;
        }
      });

      return [
        { name: 'Open', value: statusCounts['Open'] },
        { name: 'Resolved', value: statusCounts['Resolved'] },
        { name: 'Pending', value: statusCounts['Pending'] }
      ];

    } catch (error) {
      console.error('Error fetching complaints status data:', error);
      return [{ name: 'Open', value: 0 }, { name: 'Resolved', value: 0 }, { name: 'Pending', value: 0 }];
    }
  }

  // ---------------------------------------------------------------------------
  // 6. GET EXPIRED OVERVIEW DATA
  // ---------------------------------------------------------------------------
  // [Command] Delegates expiration stats fetching to ExpiredOverviewService.
  static async getExpiredOverviewData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All'): Promise<any[]> {
    try {
      const { startOfDay, endOfDay } = this.getDateBoundaries(selectedDate, range);
      
      let groupPeriod: 'day' | 'week' | 'month' | 'year' = 'day';
      if (range === 'year') groupPeriod = 'month';

      const chartData = await ExpiredOverviewService.getExpiredChartData(startOfDay, endOfDay, groupPeriod, dataSource);
      return chartData;
    } catch (error) {
      console.error('Error fetching expired overview data:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 7. LIVE DASHBOARD METRICS LISTENER
  // ---------------------------------------------------------------------------
  // [Command] Sets up a listener on the 'customers' collection for real-time updates.
  static subscribeToDashboardMetrics(
    dateRange: DateFilter,
    callback: (metrics: DashboardMetrics | null) => void
  ): () => void {
    try {
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
      return () => {}; 
    }
  }

  // ---------------------------------------------------------------------------
  // 8. CALCULATE CORE METRICS
  // ---------------------------------------------------------------------------
  // [Command] Aggregates totals for Revenue, Customers, and Statuses from raw data.
  static async calculateMetrics(
    customers: any[] = [],
    dateRange: DateFilter
  ): Promise<DashboardMetrics> {
    try {
      let customerData = customers;
      if (customerData.length === 0) {
        const custSnap = await getDocs(collection(db, 'customers'));
        customerData = custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      const endDate = dateRange.endDate || new Date();
      // const startDate = dateRange.startDate || new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      let totalCustomers = 0, activeCustomers = 0, inactiveCustomers = 0, suspendedCustomers = 0, expiredCustomers = 0;
      let newCustomersThisMonth = 0, newToday = 0;

      const currentDate = new Date();
      const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      customerData.forEach(customer => {
        const status = (customer.status || '').toLowerCase();
        const createdAt = customer.createdAt ? new Date(customer.createdAt) : null;

        if (!createdAt || createdAt <= endDate) {
          totalCustomers++;
          if (status === 'active') activeCustomers++;
          else if (status === 'inactive' || status === 'disabled') inactiveCustomers++;
          else if (status === 'suspended') suspendedCustomers++;
          else if (status === 'expired') expiredCustomers++;

          if (createdAt && createdAt >= monthStart && createdAt <= endDate) newCustomersThisMonth++;
          if (createdAt && createdAt >= today && createdAt <= endDate) newToday++;
        }
      });
      
      const calculatedExpired = Math.max(0, totalCustomers - (activeCustomers + inactiveCustomers + suspendedCustomers));

      const paymentsSnap = await getDocs(collection(db, 'payments'));
      let totalRevenue = 0, monthlyRevenue = 0, todayCollection = 0, pendingPayments = 0, completedPayments = 0;

      paymentsSnap.forEach(doc => {
        const payment = doc.data();
        const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;
        const billAmount = Number(payment.billAmount || 0);
        const status = payment.status || 'Unpaid';

        if (status === 'Paid') {
          completedPayments++;
          if (paidDate) {
            totalRevenue += billAmount;
            if (paidDate.getMonth() === currentDate.getMonth() && paidDate.getFullYear() === currentDate.getFullYear()) {
              monthlyRevenue += billAmount;
            }
            if (paidDate >= today && paidDate <= endDate) {
              todayCollection += billAmount;
            }
          }
        } else {
          pendingPayments++;
        }
      });

      const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      return {
        totalCustomers, activeCustomers, inactiveCustomers, suspendedCustomers, expiredCustomers: calculatedExpired,
        totalRevenue, monthlyRevenue, pendingPayments, completedPayments, pendingInvoices: pendingPayments,
        leadsThisMonth: 0, conversionRate: 0, avgRevenuePerCustomer, renewalDueCount: 0,
        newCustomersThisMonth, newToday, todayCollection, unresolvedComplaints: 0, avgResponseTime: 0
      };

    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      return this.getZeroMetrics();
    }
  }

  // ---------------------------------------------------------------------------
  // 9. GET REVENUE DATA (CHART)
  // ---------------------------------------------------------------------------
  // [Command] Prepares data for Revenue Line Charts (grouped by month).
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
          revenueByMonth[monthKey].customers += 1; 
        }
      });

      return Object.entries(revenueByMonth).map(([month, data]) => ({
        month, revenue: data.revenue, customers: data.customers, payments: data.payments
      })).sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 10. GET PAYMENT MODE DISTRIBUTION
  // ---------------------------------------------------------------------------
  // [Command] Aggregates payment modes (Cash, UPI, etc.) for Bar Charts.
  static async getPaymentModeDistribution(dateRange: DateFilter): Promise<PaymentModeDistribution[]> {
    try {
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      const modeStats: Record<string, { count: number; amount: number }> = {};

      paymentsSnap.forEach(doc => {
        const payment = doc.data();
        if (payment.status === 'Paid' && payment.paidDate) {
          const mode = (payment.modeOfPayment || 'Unknown').toUpperCase();
          const amount = Number(payment.billAmount || 0);
          if (!modeStats[mode]) modeStats[mode] = { count: 0, amount: 0 };
          modeStats[mode].count += 1;
          modeStats[mode].amount += amount;
        }
      });

      const totalAmount = Object.values(modeStats).reduce((sum, stat) => sum + stat.amount, 0);
      return Object.entries(modeStats).map(([mode, stat]) => ({
        mode, count: stat.count, amount: stat.amount,
        percentage: totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error('Error fetching payment mode distribution:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 11. GET CUSTOMER GROWTH DATA
  // ---------------------------------------------------------------------------
  // [Command] Tracks new customer additions over time.
  static async getCustomerGrowthData(dateRange: DateFilter): Promise<CustomerGrowthData[]> {
    try {
      const customersSnap = await getDocs(collection(db, 'customers'));
      const growthByDate: Record<string, { newCustomers: number; activeCustomers: number; totalCustomers: number }> = {};

      customersSnap.forEach(doc => {
        const customer = doc.data();
        if (customer.createdAt) {
          const createdDate = new Date(customer.createdAt);
          const dateKey = createdDate.toISOString().split('T')[0]; 
          if (!growthByDate[dateKey]) growthByDate[dateKey] = { newCustomers: 0, activeCustomers: 0, totalCustomers: 0 };
          growthByDate[dateKey].newCustomers += 1;
          if ((customer.status || '').toLowerCase() === 'active') growthByDate[dateKey].activeCustomers += 1;
        }
      });

      let cumulativeTotal = 0;
      const sortedDates = Object.keys(growthByDate).sort();
      return sortedDates.map(date => {
        const data = growthByDate[date];
        cumulativeTotal += data.newCustomers;
        return { date, newCustomers: data.newCustomers, activeCustomers: data.activeCustomers, totalCustomers: cumulativeTotal };
      });
    } catch (error) {
      console.error('Error fetching customer growth data:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 12. GET PLAN DISTRIBUTION
  // ---------------------------------------------------------------------------
  // [Command] Counts how many customers are on each Plan.
  static async getPlanDistribution(dateRange: DateFilter): Promise<PlanDistribution[]> {
    try {
      const customersSnap = await getDocs(collection(db, 'customers'));
      const planStats: Record<string, { customerCount: number; revenue: number }> = {};

      customersSnap.forEach(doc => {
        const customer = doc.data();
        const plan = customer.plan || 'Unknown Plan';
        if (!planStats[plan]) planStats[plan] = { customerCount: 0, revenue: 0 };
        planStats[plan].customerCount += 1;
      });

      const totalCustomers = Object.values(planStats).reduce((sum, stat) => sum + stat.customerCount, 0);
      return Object.entries(planStats).map(([plan, stat]) => ({
        plan, customerCount: stat.customerCount, revenue: stat.revenue,
        percentage: totalCustomers > 0 ? (stat.customerCount / totalCustomers) * 100 : 0
      })).sort((a, b) => b.customerCount - a.customerCount);
    } catch (error) {
      console.error('Error fetching plan distribution:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 13. GENERATE ALL CHART DATA (MAIN AGGREGATOR)
  // ---------------------------------------------------------------------------
  // [Command] The main function called by EnhancedDashboard.
  // [Command] Orchestrates fetching of all necessary data points.
  static async generateChartData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All') {
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkDate = new Date(selectedDate);
      checkDate.setHours(0, 0, 0, 0);
  
      // [Command] Optimization: Return empty data if selected date is in the future
      if (checkDate > today) {
          return this.getZeroData();
      }
  
      const { startOfDay, endOfDay, dateString } = this.getDateBoundaries(selectedDate, range);
  
      try {
          const custColl = collection(db, 'customers');
          const payColl = collection(db, 'payments');
          
          // [Command] Fetch All Customers
          const custSnap = await getDocs(custColl);
          
          // [Command] Fetch Daily Payments (Filtered by Date & Source)
          let payDailyQuery = query(payColl, where('paidDate', '==', dateString));
          if (dataSource !== 'All') {
              payDailyQuery = query(payColl, where('paidDate', '==', dateString), where('source', '==', dataSource));
          }
          const payDailySnap = await getDocs(payDailyQuery);
          
          // [Command] Fetch Range Payments (Filtered by Source)
          let payAllQuery = query(payColl);
          if (dataSource !== 'All') {
              payAllQuery = query(payColl, where('source', '==', dataSource));
          }
          const payAllSnap = await getDocs(payAllQuery);
  
          // --- CALCULATE CUSTOMER STATS ---
          let total = 0, active = 0, suspended = 0, newToday = 0, disabled = 0;
          
          const chartMap = new Map<string, number>();
          const labels: string[] = [];
  
          // [Command] Initialize Chart Buckets (Time buckets)
          if (range === 'year') {
              for(let i=0; i<12; i++) {
                  const monthName = new Date(selectedDate.getFullYear(), i, 1).toLocaleString('default', { month: 'short' });
                  labels.push(monthName);
                  chartMap.set(monthName, 0);
              }
          } else {
              let loopDate = new Date(startOfDay);
              while(loopDate <= endOfDay) {
                  const label = range === 'today' ? 'Today' : loopDate.getDate().toString();
                  if(range !== 'today') labels.push(label);
                  chartMap.set(label, 0);
                  loopDate.setDate(loopDate.getDate() + 1);
              }
              if(range === 'today') { labels.push('Today'); chartMap.set('Today', 0); }
          }
  
          // [Command] Process Customer Snapshot
          custSnap.forEach(doc => {
              const data = doc.data();
              const createdDate = new Date(data.createdAt || Date.now());
              
              // [Command] Apply Data Source Filter
              const customerSource = data.source || '';
              if (dataSource !== 'All' && customerSource !== dataSource) {
                  return; 
              }
  
              if (createdDate <= endOfDay) {
                  total++;
                  const status = (data.status || '').toLowerCase();
                  if (status === 'active') active++;
                  else if (status === 'suspended') suspended++;
                  else if (status === 'disabled' || status === 'inactive') disabled++;
  
                  const d = new Date(selectedDate); d.setHours(0,0,0,0);
                  const e = new Date(selectedDate); e.setHours(23,59,59,999);
                  if (createdDate >= d && createdDate <= e) newToday++;
              }
  
              if (createdDate >= startOfDay && createdDate <= endOfDay) {
                  let key = '';
                  if (range === 'year') key = createdDate.toLocaleString('default', { month: 'short' });
                  else if (range === 'today') key = 'Today';
                  else key = createdDate.getDate().toString();
  
                  if (chartMap.has(key)) {
                      chartMap.set(key, chartMap.get(key)! + 1);
                  }
              }
          });
  
          const expired = Math.max(0, total - (active + suspended + disabled));
  
          // --- CALCULATE FINANCE STATS (From Snapshots) ---
          let todayCollected = 0;
          let online = 0; 
          let offline = 0;
  
          // [Command] Calculate Daily Total from Snapshot
          payDailySnap.forEach(doc => {
               const data = doc.data();
               if(data.status === 'Paid') {
                   const amt = Number(data.billAmount || 0);
                   todayCollected += amt;
               }
          });
  
          // [Command] Calculate Range Stats (Online vs Offline)
          payAllSnap.forEach(doc => {
               const data = doc.data();
               if(data.status === 'Paid') {
                   const pDateStr = data.paidDate; 
                   if(pDateStr) {
                       const pDate = new Date(pDateStr);
                       if(pDate >= startOfDay && pDate <= endOfDay) {
                           const amt = Number(data.billAmount || 0);
                           const mode = (data.modeOfPayment || 'CASH').toUpperCase();
                           if(['ONLINE', 'UPI', 'BSNL PAYMENT', 'GPAY', 'PHONEPE', 'GOOGLE PAY'].includes(mode)) online += amt;
                           else offline += amt;
                       }
                   }
               }
          });
  
          // [Command] Fetch specialized data (Complaints / Expired)
          const complaintsData = await DashboardService.getComplaintsStatusData(selectedDate, range, dataSource);
          const expiredData = await DashboardService.getExpiredOverviewData(selectedDate, range, dataSource);
  
          const chartData = labels.map(label => ({
              name: label,
              value: chartMap.get(label) || 0
          }));
  
          // [Command] Return Final Aggregated Object
          return {
              customerStats: { total, active, expired, suspended, disabled },
              financeData: {
                  pendingInvoices: 0, todayCollected, onlineCollected: online, offlineCollected: offline, monthlyRevenue: 0, totalPendingValue: 0
              },
              registrationsData: chartData,
              renewalsData: chartData.map(d => ({ ...d, value: Math.floor(d.value * 0.8) })),
              expiredData: expiredData, 
              complaintsData: complaintsData, 
              invoicePaymentsData: [{ name: range === 'today' ? 'Today' : 'Range', online, offline, direct: 0 }]
          };
  
      } catch (error) {
          console.error("Dashboard Data Error:", error);
          return this.getZeroData();
      }
  }
}