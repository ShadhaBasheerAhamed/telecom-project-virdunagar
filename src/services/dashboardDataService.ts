import { collection, getCountFromServer, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export class DashboardDataService {
  
  // 1. Real Customer Stats
  static async getCustomerStats() {
    try {
      const coll = collection(db, 'customers');
      
      // Parallel queries for speed
      const [totalSnap, activeSnap, expiredSnap] = await Promise.all([
          getCountFromServer(coll),
          getCountFromServer(query(coll, where('status', '==', 'Active'))),
          getCountFromServer(query(coll, where('status', '==', 'Expired')))
      ]);

      return {
        total: totalSnap.data().count,
        active: activeSnap.data().count,
        expired: expiredSnap.data().count,
        suspended: 0, // Add query if needed
        disabled: 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { total: 0, active: 0, expired: 0, suspended: 0, disabled: 0 };
    }
  }

  // 2. Registrations (Last 7 days from Leads)
  static async getRegistrationsData() {
    try {
      // In a real scenario, you'd query leads/customers created in last 7 days
      // For now, returning a static structure but you can query 'createdAt' field
      return Array.from({ length: 7 }, (_, i) => ({
        day: (new Date().getDate() - (6-i)).toString(),
        value: Math.floor(Math.random() * 5) // Replace with real query count
      }));
    } catch (error) {
      return [];
    }
  }

  // 3. Finance (Total Today, Month from Payments)
  static async getFinanceData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const paymentsRef = collection(db, 'payments');
      
      // Query today's payments
      const todayQuery = query(paymentsRef, where('paidDate', '==', today));
      const todaySnap = await getDocs(todayQuery);
      
      let todayCollected = 0;
      todaySnap.forEach(doc => {
          todayCollected += Number(doc.data().billAmount || 0);
      });

      return {
        pendingInvoices: 12, // Replace with query for status='Unpaid'
        todayCollected: todayCollected,
        yesterdayCollected: 0, 
        renewedToday: todaySnap.size,
        renewedYesterday: 0,
        renewedThisMonth: 0
      };
    } catch (error) {
      console.error(error);
      return { pendingInvoices: 0, todayCollected: 0, yesterdayCollected: 0, renewedToday: 0, renewedYesterday: 0, renewedThisMonth: 0 };
    }
  }

  // Combine all
  static async generateChartData() {
    const [customerStats, financeData] = await Promise.all([
        this.getCustomerStats(),
        this.getFinanceData()
    ]);

    // Some data is still mocked for UI demo purposes if database is empty
    const registrationsData = await this.getRegistrationsData();
    
    return {
      customerStats,
      financeData,
      registrationsData,
      // Mocking complex charts until enough data exists
      renewalsData: registrationsData.map(d => ({ day: d.day, value: d.value + 2 })),
      expiredData: registrationsData.map(d => ({ day: d.day, value: Math.max(0, d.value - 1) })),
      complaintsData: [
          { name: 'Open', value: 5 },
          { name: 'Resolved', value: 20 },
          { name: 'Pending', value: 2 }
      ],
      onlineUsersData: [],
      invoicePaymentsData: [],
      onlinePaymentsData: []
    };
  }
}