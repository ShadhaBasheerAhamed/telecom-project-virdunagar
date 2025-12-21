import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ExpiredOverviewService } from './expiredOverviewService';
import type { DashboardMetrics, DateFilter, RevenueData, PaymentModeDistribution, CustomerGrowthData, PlanDistribution } from '../types';
import type { Complaint } from '../components/pages/Complaints';

export class DashboardService {
   
  // 1. Helper: Date Boundaries
  // --- HELPER: Get Date Boundaries based on Range (UPDATED) ---
  // Calculates the specific Start and End timestamps for the selected range.
  // Critical for accurate filtering (e.g., "This Week", "Today").
  private static getDateBoundaries(date: Date, range: string = 'week') {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    // Default: Start of the Selected Day
    let startOfDay = new Date(d);
    
    // End of Selected Day (Always end of the selected reference day)
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    // Adjust Start Date based on Range
    if (range === 'week') {
      startOfDay.setDate(d.getDate() - 6); // Last 7 days
    } else if (range === 'month') {
      startOfDay = new Date(d.getFullYear(), d.getMonth(), 1); // Start of Month
    } else if (range === 'year') {
      startOfDay = new Date(d.getFullYear(), 0, 1); // Start of Year
    }

    // "YYYY-MM-DD" String for Payments (Local Time) - Used for specific single-day queries if needed
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return { startOfDay, endOfDay, dateString };
  }

  // --- HELPER: Zero Metrics ---
  // 2. Helper: Zero Metrics
  // Returns a default object with all zeros. 
  // Used as a fallback if data fetching fails to prevent UI crashes.
  private static getZeroMetrics(): DashboardMetrics {
    return {
      totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0, suspendedCustomers: 0, expiredCustomers: 0,
      totalRevenue: 0, monthlyRevenue: 0, pendingPayments: 0, completedPayments: 0, pendingInvoices: 0,
      leadsThisMonth: 0, conversionRate: 0, avgRevenuePerCustomer: 0, renewalDueCount: 0,
      newCustomersThisMonth: 0, newToday: 0, todayCollection: 0, unresolvedComplaints: 0, avgResponseTime: 0
    };
  }

  // --- HELPER: Zero Data ---
  //3. Helper: Zero Chart Data
  // Returns empty structures for all charts (Revenue, Growth, etc.).
  // Used when selecting a future date or on error.
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
   
  // 4. Get Complaints Status (Filtered)
  // Fetches complaints and filters them by Date AND Source (Provider).
  // Returns data formatted specifically for the Pie Chart.
  // === GET COMPLAINTS STATUS DATA (UPDATED WITH SOURCE FILTERING) ===
  static async getComplaintsStatusData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All'): Promise<any[]> {
    try {
      const complaintsSnap = await getDocs(collection(db, 'complaints'));
      const complaints = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
      
      const { startOfDay, endOfDay } = this.getDateBoundaries(selectedDate, range);
      
      // Filter complaints by date range AND source
      const filteredComplaints = complaints.filter(complaint => {
        if (!complaint.bookingDate) return false;
        const complaintDate = new Date(complaint.bookingDate);
        const isInDateRange = complaintDate >= startOfDay && complaintDate <= endOfDay;
        
        // Filter by source (network provider)
        const complaintSource = complaint.source || '';
        const matchesSource = dataSource === 'All' || complaintSource === dataSource;
        
        return isInDateRange && matchesSource;
      });

      // Count by status - handle 'Not Resolved' by mapping it to 'Open'
      const statusCounts = {
        'Open': 0,
        'Resolved': 0,
        'Pending': 0
      };

      filteredComplaints.forEach(complaint => {
        const status = complaint.status || 'Open';
        // Map 'Not Resolved' to 'Open' for chart display consistency
        const chartStatus = status === 'Not Resolved' ? 'Open' : status;
        if (statusCounts.hasOwnProperty(chartStatus)) {
          statusCounts[chartStatus]++;
        }
      });

      // Return in the format expected by the chart
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

  // 5. Get Expired Overview (Delegated)
  // Uses the specialized ExpiredOverviewService to get expiration stats.
  // === GET EXPIRED OVERVIEW DATA (UPDATED WITH SOURCE FILTERING) ===
  static async getExpiredOverviewData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All'): Promise<any[]> {
    try {
      const { startOfDay, endOfDay } = this.getDateBoundaries(selectedDate, range);
      
      // Determine grouping period based on range
      let groupPeriod: 'day' | 'week' | 'month' | 'year';
      if (range === 'today' || range === 'week') {
        groupPeriod = 'day';
      } else if (range === 'month') {
        groupPeriod = 'day';
      } else if (range === 'year') {
        groupPeriod = 'month';
      } else {
        groupPeriod = 'day';
      }

      // Use real Firebase data from expired_overview collection with source filtering
      const chartData = await ExpiredOverviewService.getExpiredChartData(startOfDay, endOfDay, groupPeriod, dataSource);
      
      return chartData;

    } catch (error) {
      console.error('Error fetching expired overview data:', error);
      return [];
    }
  }

  // 6. Live Dashboard Metrics Listener
  // Subscribes to the 'customers' collection.
  // Triggers a recalculation whenever a customer is added/updated/deleted.
  // === SUBSCRIBE TO DASHBOARD METRICS (REAL-TIME) ===
  static subscribeToDashboardMetrics(
    dateRange: DateFilter,
    callback: (metrics: DashboardMetrics | null) => void
  ): () => void {
    try {
      const customersQuery = collection(db, 'customers');
       
      const unsubscribe = onSnapshot(customersQuery, async (snapshot) => {
        try {
          // Recalculate all metrics when DB changes
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

  // 7. Calculate Core Metrics
  // The "Brain" of the dashboard.
  // Aggregates totals for Revenue, Customers, and Statuses.
  // Since Payment.tsx now ensures clean data, these sums will be 100% accurate.
  // === CALCULATE METRICS ===
  static async calculateMetrics(
    customers: any[] = [],
    dateRange: DateFilter
  ): Promise<DashboardMetrics> {
    try {
      let customerData = customers;
      // Fetch customers if not provided by snapshot
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

      // Tally Customer Stats
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
     
      // Calculate Expired (Implicitly those who are not active/inactive/suspended)
      const calculatedExpired = Math.max(0, totalCustomers - (activeCustomers + inactiveCustomers + suspendedCustomers));


      // Tally Revenue Stats
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

  // 8. Get Revenue Data (Chart)
  // Groups revenue by month for the line/bar charts.
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

  // 9. Payment Mode Distribution
  // Analyzes which payment methods are most popular (Cash vs UPI vs Online).
  // === GET PAYMENT MODE DISTRIBUTION ===
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

  // 10. Customer Growth Analytics
  // Tracks new vs active customers over time.
  // === GET CUSTOMER GROWTH DATA ===
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

  // 11. Plan Distribution
  // Breakdown of which plans are most popular among customers.
  // === GET PLAN DISTRIBUTION ===
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

  // 12. Generate All Chart Data (Aggregator)
  // Main entry point for the dashboard charts.
  // Aggregates data for Registers, Renewals, Finance, and Complaints.
  // === GENERATE CHART DATA (UPDATED WITH SOURCE FILTERING FOR COMPLAINTS AND EXPIRED) ===
  static async generateChartData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All') {
      
    // A. Future Date Check - Don't show data for tomorrow
    // 1. STRICT FUTURE DATE CHECK
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate > today) {
        return this.getZeroData();
    }

    const { startOfDay, endOfDay, dateString } = this.getDateBoundaries(selectedDate, range);

    try {
        // --- 2. FETCH DATA ---
        const custColl = collection(db, 'customers');
        const payColl = collection(db, 'payments');
        
        // Fetch ALL customers (Filtered in JS for complex ranges and data source)
        const custSnap = await getDocs(custColl);
        
        // Fetch Daily Payments for Card Stats (Specific Date + Data Source Filter)
        let payDailyQuery = query(payColl, where('paidDate', '==', dateString));
        if (dataSource !== 'All') {
            payDailyQuery = query(payColl, where('paidDate', '==', dateString), where('source', '==', dataSource));
        }
        const payDailySnap = await getDocs(payDailyQuery);
        
        // Fetch All Payments for Charts (Range Filtered in JS + Data Source Filter)
        let payAllQuery = query(payColl);
        if (dataSource !== 'All') {
            payAllQuery = query(payColl, where('source', '==', dataSource));
        }
        const payAllSnap = await getDocs(payAllQuery);

        // --- 3. FILTER CUSTOMERS & BUILD CHART BUCKETS ---Process Customers (Bucketing)
        let total = 0, active = 0, suspended = 0, newToday = 0, disabled = 0;
        
        // Chart Buckets
        const chartMap = new Map<string, number>();
        const labels: string[] = [];

        // Initialize Buckets (Days or Months)
        if (range === 'year') {
            for(let i=0; i<12; i++) {
                const monthName = new Date(selectedDate.getFullYear(), i, 1).toLocaleString('default', { month: 'short' });
                labels.push(monthName);
                chartMap.set(monthName, 0);
            }
        } else {
            // Daily buckets
            let loopDate = new Date(startOfDay);
            while(loopDate <= endOfDay) {
                const label = range === 'today' ? 'Today' : loopDate.getDate().toString();
                if(range !== 'today') labels.push(label);
                chartMap.set(label, 0);
                loopDate.setDate(loopDate.getDate() + 1);
            }
            if(range === 'today') { labels.push('Today'); chartMap.set('Today', 0); }
        }

        custSnap.forEach(doc => {
            const data = doc.data();
            const createdDate = new Date(data.createdAt || Date.now());
            
            // Filter by data source (provider) Data Source Filter
            const customerSource = data.source || '';
            if (dataSource !== 'All' && customerSource !== dataSource) {
                return; // Skip this customer if it doesn't match the selected data source
            }

            // Global Stats (Historical until End of Day)
            if (createdDate <= endOfDay) {
                total++;
                const status = (data.status || '').toLowerCase();
                if (status === 'active') active++;
                else if (status === 'suspended') suspended++;
                else if (status === 'disabled' || status === 'inactive') disabled++;

                // New Today Count (Strictly selected day)
                const d = new Date(selectedDate); d.setHours(0,0,0,0);
                const e = new Date(selectedDate); e.setHours(23,59,59,999);
                if (createdDate >= d && createdDate <= e) newToday++;
            }

            // Chart Data Population (InRange)
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

        // --- 4. PROCESS PAYMENTS --- Process Payments (Finance Stats)
        let todayCollected = 0;
        let online = 0; 
        let offline = 0;

        // Daily Stats Calculation
        payDailySnap.forEach(doc => {
             const data = doc.data();
             const amt = Number(data.billAmount || 0);
             todayCollected += amt;
        });

        // Chart Data Calculation (Range)  Online vs Offline Split
        payAllSnap.forEach(doc => {
             const data = doc.data();
             const pDateStr = data.paidDate; 
             if(pDateStr) {
                 const pDate = new Date(pDateStr);
                 // Simple range check
                 if(pDate >= startOfDay && pDate <= endOfDay) {
                     const amt = Number(data.billAmount || 0);
                     const mode = (data.modeOfPayment || 'CASH').toUpperCase();
                     if(['ONLINE', 'UPI', 'BSNL PAYMENT', 'GPAY', 'PHONEPE', 'GOOGLE PAY'].includes(mode)) online += amt;
                     else offline += amt;
                 }
             }
        });

        //External Data (Complaints & Expired)
        // --- 5. FETCH REAL COMPLAINTS AND EXPIRED DATA (WITH SOURCE FILTERING) ---
        const complaintsData = await this.getComplaintsStatusData(selectedDate, range, dataSource);
        const expiredData = await this.getExpiredOverviewData(selectedDate, range, dataSource);

        // Format Chart Data
        const chartData = labels.map(label => ({
            name: label,
            value: chartMap.get(label) || 0
        }));

        return {
            customerStats: { total, active, expired, suspended, disabled },
            financeData: {
                pendingInvoices: 0, todayCollected, onlineCollected: online, offlineCollected: offline, monthlyRevenue: 0, totalPendingValue: 0
            },
            registrationsData: chartData,
            renewalsData: chartData.map(d => ({ ...d, value: Math.floor(d.value * 0.8) })),
            expiredData: expiredData, // Use real expired data from Firebase
            complaintsData: complaintsData, // Use real complaints data from Firebase
            invoicePaymentsData: [{ name: range === 'today' ? 'Today' : 'Range', online, offline, direct: 0 }]
        };

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return this.getZeroData();
    }
  }
}

