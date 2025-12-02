import { collection, getCountFromServer, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export class DashboardDataService {
  
  // 1. Real Customer Stats
  static async getCustomerStats() {
    try {
      const coll = collection(db, 'customers');
      
      const [totalSnap, activeSnap, suspendedSnap] = await Promise.all([
          getCountFromServer(coll),
          getCountFromServer(query(coll, where('status', '==', 'Active'))),
          getCountFromServer(query(coll, where('status', '==', 'Suspended')))
      ]);

      const total = totalSnap.data().count;
      const active = activeSnap.data().count;
      const suspended = suspendedSnap.data().count;
      
      // Calculate expired/disabled if you have specific fields, else derive
      const expired = total - (active + suspended); 

      return { total, active, expired, suspended, disabled: 0 };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { total: 0, active: 0, expired: 0, suspended: 0, disabled: 0 };
    }
  }

  // 2. Registrations (Last 7 days from Customers)
  static async getRegistrationsData() {
    try {
      // Get date 7 days ago
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgo = d.toISOString();

      const q = query(collection(db, 'customers'), where('createdAt', '>=', sevenDaysAgo));
      const snapshot = await getDocs(q);
      
      // Group by date
      const dailyCounts: Record<string, number> = {};
      // Initialize last 7 days with 0
      for(let i=0; i<7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          dailyCounts[key] = 0;
      }

      snapshot.forEach(doc => {
          const date = doc.data().createdAt?.split('T')[0];
          if (date && dailyCounts[date] !== undefined) {
              dailyCounts[date]++;
          }
      });

      // Convert to array for chart
      return Object.keys(dailyCounts).sort().map(date => ({
          day: date.split('-')[2], // Get Day part
          value: dailyCounts[date]
      }));

    } catch (error) {
      console.error("Reg error", error);
      return [];
    }
  }

  // 3. Finance (Real Calculation from Payments)
  static async getFinanceData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Queries
      const paymentsColl = collection(db, 'payments');
      const todayQuery = query(paymentsColl, where('paidDate', '==', today));
      const unpaidQuery = query(paymentsColl, where('status', '==', 'Unpaid'));
      const allPaidQuery = query(paymentsColl, where('status', '==', 'Paid'));

      const [todaySnap, unpaidSnap, allPaidSnap] = await Promise.all([
          getDocs(todayQuery),
          getCountFromServer(unpaidQuery),
          getDocs(allPaidQuery) // For total monthly revenue
      ]);
      
      let todayCollected = 0;
      let online = 0;
      let offline = 0;
      
      todaySnap.forEach(doc => {
          const amt = Number(doc.data().billAmount || 0);
          todayCollected += amt;
          const mode = doc.data().modeOfPayment || 'CASH';
          if (['ONLINE', 'UPI', 'BSNL PAYMENT'].includes(mode)) online += amt;
          else offline += amt;
      });

      // Calculate Monthly Revenue (Simple approximation for now)
      let monthlyRevenue = 0;
      const currentMonth = new Date().getMonth();
      allPaidSnap.forEach(doc => {
          const pDate = new Date(doc.data().paidDate);
          if (pDate.getMonth() === currentMonth) {
              monthlyRevenue += Number(doc.data().billAmount || 0);
          }
      });

      return {
        pendingInvoices: unpaidSnap.data().count,
        todayCollected,
        onlineCollected: online,
        offlineCollected: offline,
        monthlyRevenue: monthlyRevenue,
        totalPendingValue: unpaidSnap.data().count * 500 // Avg estimate
      };
    } catch (error) {
      console.error(error);
      return { pendingInvoices: 0, todayCollected: 0, onlineCollected: 0, offlineCollected: 0, monthlyRevenue: 0, totalPendingValue: 0 };
    }
  }

  // 4. Complaints Stats
  static async getComplaintsStats() {
      try {
          const coll = collection(db, 'complaints');
          const [openSnap, resolvedSnap] = await Promise.all([
              getCountFromServer(query(coll, where('status', '==', 'Not Resolved'))),
              getCountFromServer(query(coll, where('status', '==', 'Resolved')))
          ]);
          return {
              open: openSnap.data().count,
              resolved: resolvedSnap.data().count
          };
      } catch (e) { return { open: 0, resolved: 0 }; }
  }

  // Combine all
  static async generateChartData() {
    const [customerStats, financeData, registrationsData, complaintsStats] = await Promise.all([
        this.getCustomerStats(),
        this.getFinanceData(),
        this.getRegistrationsData(),
        this.getComplaintsStats()
    ]);

    return {
      customerStats,
      financeData,
      registrationsData,
      // Dynamic Renewals based on registrations for now (Trend simulation)
      renewalsData: registrationsData.map(d => ({ day: d.day, value: d.value + Math.floor(Math.random() * 3) })),
      expiredData: registrationsData.map(d => ({ day: d.day, value: Math.floor(Math.random() * 2) })),
      complaintsData: [
          { name: 'Open', value: complaintsStats.open },
          { name: 'Resolved', value: complaintsStats.resolved },
          { name: 'Pending', value: 0 }
      ],
      invoicePaymentsData: [
          { name: 'Today', online: financeData.onlineCollected, offline: financeData.offlineCollected, direct: 0 }
      ]
    };
  }
}