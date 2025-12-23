import { collection, getDocs, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore'; 
import { db } from '../firebase/config';
import { ExpiredOverviewService } from './expiredOverviewService';
import type { DashboardMetrics, DateFilter, RevenueData, PaymentModeDistribution, CustomerGrowthData, PlanDistribution } from '../types';
import type { Complaint } from '../components/pages/Complaints';

export class DashboardService {
   
  // ---------------------------------------------------------------------------
  // 1. HELPER: DATE BOUNDARIES (Local Time Fixed)
  // ---------------------------------------------------------------------------
  private static getDateBoundaries(date: Date, range: string = 'week') {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); 
    
    let startOfDay = new Date(d);
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    if (range === 'week') {
      startOfDay.setDate(d.getDate() - 6); 
    } else if (range === 'month') {
      startOfDay = new Date(d.getFullYear(), d.getMonth(), 1); 
    } else if (range === 'year') {
      startOfDay = new Date(d.getFullYear(), 0, 1); 
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return { startOfDay, endOfDay, dateString };
  }

  // ---------------------------------------------------------------------------
  // 2. HELPER: ZERO METRICS
  // ---------------------------------------------------------------------------
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
  private static getZeroData() {
      return {
          customerStats: { total: 0, active: 0, expired: 0, suspended: 0, disabled: 0, expiringSoon: 0 }, // ✅ Added expiringSoon
          financeData: { pendingInvoices: 0, todayCollected: 0, onlineCollected: 0, offlineCollected: 0, monthlyRevenue: 0, totalPendingValue: 0 },
          registrationsData: [],
          renewalsData: [],
          expiredData: [],
          complaintsData: [{ name: 'Open', value: 0 }, { name: 'Resolved', value: 0 }, { name: 'Pending', value: 0 }],
          invoicePaymentsData: []
      };
  }

  // ---------------------------------------------------------------------------
  // ✅ NEW: AUTO-UPDATE OVERDUE COMPLAINTS
  // ---------------------------------------------------------------------------
  static async checkAndSetPendingComplaints() {
      try {
          const today = new Date().toISOString().split('T')[0];
          
          const q = query(
              collection(db, 'complaints'), 
              where('status', 'in', ['Open', 'Not Resolved']), 
              where('resolveDate', '<', today),
              where('resolveDate', '!=', '') 
          );

          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
              const batch = writeBatch(db);
              snapshot.docs.forEach((d) => {
                  batch.update(doc(db, 'complaints', d.id), { status: 'Pending' });
              });
              await batch.commit();
              console.log(`Updated ${snapshot.size} overdue complaints to Pending.`);
          }
      } catch (error) {
          console.error("Auto-pending check failed:", error);
      }
  }
    
  // ---------------------------------------------------------------------------
  // 4. GET REAL-TIME FINANCE STATS (FIXED DATE MATCHING)
  // ---------------------------------------------------------------------------
  static async getFinanceStats(source: string, date: Date) {
    try {
        const { dateString } = this.getDateBoundaries(date, 'today');

        // --- PART A: CALCULATE TODAY'S COLLECTION ---
        let q = query(collection(db, 'payments'), where('status', '==', 'Paid'));
        if (source !== 'All') q = query(q, where('source', '==', source));
        q = query(q, where('paidDate', '==', dateString));

        const snapshot = await getDocs(q);
        
        let totalCollected = 0;
        let totalCommission = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalCollected += Number(data.billAmount) || 0;
            totalCommission += Number(data.commission) || 0;
        });

        // --- PART B: CALCULATE ALL PENDING INVOICES (NO DATE FILTER) ---
        let qUnpaid = query(collection(db, 'payments'), where('status', '==', 'Unpaid'));
        if (source !== 'All') qUnpaid = query(qUnpaid, where('source', '==', source));
        
        const snapUnpaid = await getDocs(qUnpaid);
        const pendingInvoices = snapUnpaid.size;

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
  // 5. GET COMPLAINTS STATUS DATA (FIXED COUNTING LOGIC)
  // ---------------------------------------------------------------------------
  static async getComplaintsStatusData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All'): Promise<any[]> {
    try {
      let q = query(collection(db, 'complaints'));
      if (dataSource !== 'All') {
          q = query(q, where('source', '==', dataSource));
      }

      const complaintsSnap = await getDocs(q);
      const { startOfDay, endOfDay } = this.getDateBoundaries(selectedDate, range);
      
      const statusCounts = { 'Open': 0, 'Resolved': 0, 'Pending': 0 };

      complaintsSnap.forEach(doc => {
          const data = doc.data();
          const status = data.status || 'Open';
          
          // ✅ LOGIC 1: RESOLVED -> Check 'resolveDate'
          if (status === 'Resolved') {
              if (data.resolveDate) { 
                  const rDate = new Date(data.resolveDate);
                  rDate.setHours(0,0,0,0);
                  if (rDate >= startOfDay && rDate <= endOfDay) {
                      statusCounts['Resolved']++;
                  }
              }
          } 
          // ✅ LOGIC 2: OPEN/PENDING -> Check 'bookingDate'
          else {
              if (data.bookingDate) {
                  const bDate = new Date(data.bookingDate);
                  bDate.setHours(0,0,0,0);
                  if (bDate >= startOfDay && bDate <= endOfDay) {
                      if (status === 'Pending') statusCounts['Pending']++;
                      else if (status === 'Open' || status === 'Not Resolved') statusCounts['Open']++;
                  }
              }
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
  // 8. CALCULATE CORE METRICS (UPDATED with Expiring Soon)
  // ---------------------------------------------------------------------------
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

      let totalCustomers = 0, activeCustomers = 0, inactiveCustomers = 0, suspendedCustomers = 0, expiredCustomers = 0;
      let newCustomersThisMonth = 0, newToday = 0;
      let expiringSoon = 0; // ✅ New Counter

      const currentDate = new Date();
      const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7); // 7 days from now

      customerData.forEach(customer => {
        const status = (customer.status || '').toLowerCase();
        const createdAt = customer.createdAt ? new Date(customer.createdAt) : null;

        if (!createdAt || createdAt <= endDate) {
          totalCustomers++;
          if (status === 'active') {
              activeCustomers++;
              // ✅ Check for Expiring Soon (Active + Renewal in next 7 days)
              if (customer.renewalDate) {
                  const rDate = new Date(customer.renewalDate);
                  const rDateOnly = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate());
                  if (rDateOnly >= today && rDateOnly <= nextWeek) {
                      expiringSoon++;
                  }
              }
          }
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
        // @ts-ignore
        expiringSoon: expiringSoon, 
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
  static async generateChartData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All') {
      
      // ✅ TRIGGER AUTO-PENDING CHECK
      await this.checkAndSetPendingComplaints();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkDate = new Date(selectedDate);
      checkDate.setHours(0, 0, 0, 0);
  
      if (checkDate > today) {
          return this.getZeroData();
      }
  
      const { startOfDay, endOfDay, dateString } = this.getDateBoundaries(selectedDate, range);
  
      try {
          const custColl = collection(db, 'customers');
          const payColl = collection(db, 'payments');
          
          const custSnap = await getDocs(custColl);
          
          let payDailyQuery = query(payColl, where('paidDate', '==', dateString));
          if (dataSource !== 'All') {
              payDailyQuery = query(payColl, where('paidDate', '==', dateString), where('source', '==', dataSource));
          }
          const payDailySnap = await getDocs(payDailyQuery);
          
          let payAllQuery = query(payColl);
          if (dataSource !== 'All') {
              payAllQuery = query(payColl, where('source', '==', dataSource));
          }
          const payAllSnap = await getDocs(payAllQuery);
  
          // --- CALCULATE CUSTOMER STATS ---
          let total = 0, active = 0, suspended = 0, newToday = 0, disabled = 0, expiringSoon = 0;
          
          const chartMap = new Map<string, number>();
          const labels: string[] = [];
  
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

          const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  
          custSnap.forEach(doc => {
              const data = doc.data();
              
              const customerSource = data.source || '';
              if (dataSource !== 'All' && customerSource !== dataSource) {
                  return; 
              }
              
              const createdDate = new Date(data.createdAt || Date.now());

              if (createdDate <= endOfDay) {
                  total++;
                  const status = (data.status || '').toLowerCase();
                  if (status === 'active') {
                      active++;
                      // ✅ Calculate Expiring Soon here too for Chart Data consistency
                      if (data.renewalDate) {
                          const rDate = new Date(data.renewalDate);
                          const rDateOnly = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate());
                          if (rDateOnly >= today && rDateOnly <= nextWeek) expiringSoon++;
                      }
                  }
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
  
          // --- CALCULATE FINANCE STATS ---
          let todayCollected = 0;
          let online = 0; 
          let offline = 0;
  
          payDailySnap.forEach(doc => {
               const data = doc.data();
               if(data.status === 'Paid') {
                   const amt = Number(data.billAmount || 0);
                   todayCollected += amt;
               }
          });
  
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
  
          const complaintsData = await DashboardService.getComplaintsStatusData(selectedDate, range, dataSource);
          const expiredData = await DashboardService.getExpiredOverviewData(selectedDate, range, dataSource);
  
          const chartData = labels.map(label => ({
              name: label,
              value: chartMap.get(label) || 0
          }));
  
          const financeOverview = await DashboardService.getFinanceStats(dataSource, selectedDate);

          return {
              customerStats: { total, active, expired, suspended, disabled, expiringSoon }, // ✅ Added
              financeData: {
                  pendingInvoices: financeOverview.pendingInvoices, 
                  todayCollected: financeOverview.todayCollected, 
                  onlineCollected: online, 
                  offlineCollected: offline, 
                  monthlyRevenue: 0, 
                  totalPendingValue: 0
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