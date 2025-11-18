// Mock data service for dashboard analytics
// This can be easily replaced with actual Firebase integration later

export class DashboardDataService {
  // Generate mock customer statistics
  static async getCustomerStats() {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        total: 179,
        active: 112,
        expired: 67,
        suspended: 0,
        disabled: 0
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return { total: 179, active: 112, expired: 67, suspended: 0, disabled: 0 };
    }
  }

  // Generate mock registration data
  static async getRegistrationsData() {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return Array.from({ length: 7 }, (_, i) => ({
        day: (21 + i).toString(),
        value: Math.floor(Math.random() * 10)
      }));
    } catch (error) {
      console.error('Error fetching registrations:', error);
      return Array.from({ length: 7 }, (_, i) => ({
        day: (21 + i).toString(),
        value: 0
      }));
    }
  }

  // Generate mock finance data
  static async getFinanceData() {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        pendingInvoices: 96,
        todayCollected: 542,
        yesterdayCollected: 1500,
        renewedToday: 5,
        renewedYesterday: 1203,
        renewedThisMonth: 50000
      };
    } catch (error) {
      console.error('Error fetching finance data:', error);
      return {
        pendingInvoices: 96,
        todayCollected: 542,
        yesterdayCollected: 1500,
        renewedToday: 5,
        renewedYesterday: 1203,
        renewedThisMonth: 50000
      };
    }
  }

  // Generate all chart data at once
  static async generateChartData() {
    try {
      const [customerStats, registrationsData, financeData] = await Promise.all([
        this.getCustomerStats(),
        this.getRegistrationsData(),
        this.getFinanceData()
      ]);

      // Generate realistic mock data based on real patterns
      const renewalsData = Array.from({ length: 7 }, (_, i) => ({
        day: (21 + i).toString(),
        value: Math.floor(Math.random() * 10) + 1
      }));

      const expiredData = Array.from({ length: 7 }, (_, i) => ({
        day: (21 + i).toString(),
        value: Math.floor(Math.random() * 5)
      }));

      const complaintsData = [
        { name: 'Open', value: Math.floor(customerStats.total * 0.1) },
        { name: 'Reopened', value: Math.floor(customerStats.total * 0.05) },
        { name: 'Progress', value: Math.floor(customerStats.total * 0.08) },
        { name: 'Resolved', value: Math.floor(customerStats.total * 0.7) },
        { name: 'Closed', value: Math.floor(customerStats.total * 0.07) },
      ];

      const onlineUsersData = [
        { hour: '00:00', users: 40 },
        { hour: '04:00', users: 35 },
        { hour: '08:00', users: 60 },
        { hour: '12:00', users: 80 },
        { hour: '16:00', users: 100 },
        { hour: '20:00', users: 104 },
        { hour: '23:00', users: 90 },
      ];

      const invoicePaymentsData = [
        { month: 'May', amount: 1200 },
        { month: 'Jun', amount: 1800 },
        { month: 'Jul', amount: 1500 },
        { month: 'Aug', amount: 2200 },
        { month: 'Sep', amount: 1900 },
        { month: 'Oct', amount: 2400 },
      ];

      const onlinePaymentsData = [
        { month: 'May', online: 800, offline: 400 },
        { month: 'Jun', online: 1200, offline: 600 },
        { month: 'Jul', online: 1000, offline: 500 },
        { month: 'Aug', online: 1500, offline: 700 },
        { month: 'Sep', online: 1300, offline: 600 },
        { month: 'Oct', online: 1600, offline: 800 },
      ];

      return {
        customerStats,
        registrationsData,
        renewalsData,
        expiredData,
        complaintsData,
        onlineUsersData,
        invoicePaymentsData,
        onlinePaymentsData,
        financeData
      };
    } catch (error) {
      console.error('Error generating chart data:', error);
      // Return default data structure
      return {
        customerStats: { total: 179, active: 112, expired: 67, suspended: 0, disabled: 0 },
        registrationsData: Array.from({ length: 7 }, (_, i) => ({ day: (21 + i).toString(), value: 0 })),
        renewalsData: Array.from({ length: 7 }, (_, i) => ({ day: (21 + i).toString(), value: Math.floor(Math.random() * 10) + 1 })),
        expiredData: Array.from({ length: 7 }, (_, i) => ({ day: (21 + i).toString(), value: Math.floor(Math.random() * 5) })),
        complaintsData: [
          { name: 'Open', value: 18 },
          { name: 'Reopened', value: 9 },
          { name: 'Progress', value: 14 },
          { name: 'Resolved', value: 125 },
          { name: 'Closed', value: 13 },
        ],
        onlineUsersData: [
          { hour: '00:00', users: 40 },
          { hour: '04:00', users: 35 },
          { hour: '08:00', users: 60 },
          { hour: '12:00', users: 80 },
          { hour: '16:00', users: 100 },
          { hour: '20:00', users: 104 },
          { hour: '23:00', users: 90 },
        ],
        invoicePaymentsData: [
          { month: 'May', amount: 1200 },
          { month: 'Jun', amount: 1800 },
          { month: 'Jul', amount: 1500 },
          { month: 'Aug', amount: 2200 },
          { month: 'Sep', amount: 1900 },
          { month: 'Oct', amount: 2400 },
        ],
        onlinePaymentsData: [
          { month: 'May', online: 800, offline: 400 },
          { month: 'Jun', online: 1200, offline: 600 },
          { month: 'Jul', online: 1000, offline: 500 },
          { month: 'Aug', online: 1500, offline: 700 },
          { month: 'Sep', online: 1300, offline: 600 },
          { month: 'Oct', online: 1600, offline: 800 },
        ],
        financeData: {
          pendingInvoices: 96,
          todayCollected: 542,
          yesterdayCollected: 1500,
          renewedToday: 5,
          renewedYesterday: 1203,
          renewedThisMonth: 50000
        }
      };
    }
  }
}