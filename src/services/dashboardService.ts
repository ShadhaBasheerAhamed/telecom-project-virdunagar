import api from './api';
import type { DashboardMetrics, DateFilter, RevenueData, PaymentModeDistribution, CustomerGrowthData, PlanDistribution } from '../types';

export class DashboardService {

  // Get zero metrics as fallback
  private static getZeroMetrics(): DashboardMetrics {
    return {
      totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0, suspendedCustomers: 0, expiredCustomers: 0,
      totalRevenue: 0, monthlyRevenue: 0, pendingPayments: 0, completedPayments: 0, pendingInvoices: 0,
      leadsThisMonth: 0, conversionRate: 0, avgRevenuePerCustomer: 0, renewalDueCount: 0,
      newCustomersThisMonth: 0, newToday: 0, todayCollection: 0, unresolvedComplaints: 0, avgResponseTime: 0
    };
  }

  // Get dashboard metrics from Express API
  static async calculateMetrics(
    customers: any[] = [],
    dateRange: DateFilter
  ): Promise<DashboardMetrics> {
    try {
      const response = await api.get('/dashboard/stats');
      const stats = response.data;

      return {
        totalCustomers: Number(stats.customers.total) || 0,
        activeCustomers: Number(stats.customers.active) || 0,
        inactiveCustomers: Number(stats.customers.inactive) || 0,
        suspendedCustomers: Number(stats.customers.suspended) || 0,
        expiredCustomers: Number(stats.customers.expired) || 0,
        totalRevenue: Number(stats.payments.total_revenue) || 0,
        monthlyRevenue: Number(stats.payments.monthly_revenue) || 0,
        pendingPayments: Number(stats.payments.pending_payments) || 0,
        completedPayments: Number(stats.payments.completed_payments) || 0,
        pendingInvoices: Number(stats.payments.pending_payments) || 0,
        leadsThisMonth: Number(stats.leads.total_leads) || 0,
        conversionRate: 0,
        avgRevenuePerCustomer: Number(stats.customers.total) > 0
          ? Number(stats.payments.total_revenue) / Number(stats.customers.total)
          : 0,
        renewalDueCount: 0,
        newCustomersThisMonth: 0,
        newToday: Number(stats.new_today) || 0,
        todayCollection: Number(stats.payments.today_collection) || 0,
        unresolvedComplaints: Number(stats.complaints.open_complaints) || 0,
        avgResponseTime: 0
      };
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      return this.getZeroMetrics();
    }
  }

  // Subscribe to dashboard metrics (using polling)
  static subscribeToDashboardMetrics(
    dateRange: DateFilter,
    callback: (metrics: DashboardMetrics | null) => void
  ): () => void {
    const fetchMetrics = async () => {
      const metrics = await this.calculateMetrics([], dateRange);
      callback(metrics);
    };

    fetchMetrics(); // Initial fetch
    const interval = setInterval(fetchMetrics, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }

  // Get revenue data
  static async getRevenueData(dateRange: DateFilter): Promise<RevenueData[]> {
    try {
      const response = await api.get('/dashboard/revenue-chart');
      return response.data.map((item: any) => ({
        month: item.month,
        revenue: Number(item.revenue) || 0,
        customers: 0,
        payments: Number(item.payment_count) || 0
      }));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  }

  // Get payment mode distribution
  static async getPaymentModeDistribution(dateRange: DateFilter): Promise<PaymentModeDistribution[]> {
    try {
      const response = await api.get('/dashboard/payment-modes');
      const totalAmount = response.data.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

      return response.data.map((item: any) => ({
        mode: item.mode || 'Unknown',
        count: Number(item.count) || 0,
        amount: Number(item.amount) || 0,
        percentage: totalAmount > 0 ? (Number(item.amount) / totalAmount) * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching payment mode distribution:', error);
      return [];
    }
  }

  // Get customer growth data
  static async getCustomerGrowthData(dateRange: DateFilter): Promise<CustomerGrowthData[]> {
    try {
      const response = await api.get('/dashboard/customer-growth');
      let cumulativeTotal = 0;

      return response.data.map((item: any) => {
        cumulativeTotal += Number(item.new_customers) || 0;
        return {
          date: item.date,
          newCustomers: Number(item.new_customers) || 0,
          activeCustomers: 0,
          totalCustomers: cumulativeTotal
        };
      });
    } catch (error) {
      console.error('Error fetching customer growth data:', error);
      return [];
    }
  }

  // Get plan distribution (placeholder - needs backend endpoint)
  static async getPlanDistribution(dateRange: DateFilter): Promise<PlanDistribution[]> {
    try {
      // TODO: Create backend endpoint for plan distribution
      return [];
    } catch (error) {
      console.error('Error fetching plan distribution:', error);
      return [];
    }
  }

  // Simplified chart data generation
  static async generateChartData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All') {
    try {
      const stats = await api.get('/dashboard/stats');
      const complaintsData = stats.data.complaints;

      return {
        customerStats: {
          total: Number(stats.data.customers.total) || 0,
          active: Number(stats.data.customers.active) || 0,
          expired: Number(stats.data.customers.expired) || 0,
          suspended: Number(stats.data.customers.suspended) || 0,
          disabled: Number(stats.data.customers.inactive) || 0,
          expiringSoon: 0
        },
        financeData: {
          pendingInvoices: Number(stats.data.payments.pending_payments) || 0,
          todayCollected: Number(stats.data.payments.today_collection) || 0,
          onlineCollected: 0,
          offlineCollected: 0,
          monthlyRevenue: Number(stats.data.payments.monthly_revenue) || 0,
          totalPendingValue: 0
        },
        registrationsData: [],
        renewalsData: [],
        expiredData: [],
        complaintsData: [
          { name: 'Open', value: Number(complaintsData.open_complaints) || 0 },
          { name: 'Resolved', value: Number(complaintsData.resolved_complaints) || 0 },
          { name: 'Pending', value: Number(complaintsData.pending_complaints) || 0 }
        ],
        invoicePaymentsData: [],
        revenueExpenseData: [],
        customerGrowthData: [],
        technicianLoadData: [],
        topPlansData: [],
        lowStockItems: []
      };
    } catch (error) {
      console.error("Dashboard Data Error:", error);
      return {
        customerStats: { total: 0, active: 0, expired: 0, suspended: 0, disabled: 0, expiringSoon: 0 },
        financeData: { pendingInvoices: 0, todayCollected: 0, onlineCollected: 0, offlineCollected: 0, monthlyRevenue: 0, totalPendingValue: 0 },
        registrationsData: [],
        renewalsData: [],
        expiredData: [],
        complaintsData: [{ name: 'Open', value: 0 }, { name: 'Resolved', value: 0 }, { name: 'Pending', value: 0 }],
        invoicePaymentsData: [],
        revenueExpenseData: [],
        customerGrowthData: [],
        technicianLoadData: [],
        topPlansData: [],
        lowStockItems: []
      };
    }
  }

  // Placeholder methods for compatibility
  static async getFinanceStats(source: string, date: Date) {
    const stats = await api.get('/dashboard/stats');
    return {
      todayCollected: Number(stats.data.payments.today_collection) || 0,
      todayCommission: 0,
      pendingInvoices: Number(stats.data.payments.pending_payments) || 0
    };
  }

  static async getComplaintsStatusData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All'): Promise<any[]> {
    const stats = await api.get('/dashboard/stats');
    const complaints = stats.data.complaints;
    return [
      { name: 'Open', value: Number(complaints.open_complaints) || 0 },
      { name: 'Resolved', value: Number(complaints.resolved_complaints) || 0 },
      { name: 'Pending', value: Number(complaints.pending_complaints) || 0 }
    ];
  }

  static async getExpiredOverviewData(selectedDate: Date = new Date(), range: string = 'week', dataSource: string = 'All'): Promise<any[]> {
    return [];
  }

  static async checkAndSetPendingComplaints() {
    // This would need a backend endpoint to update complaint statuses
    console.log('Auto-pending check - needs backend implementation');
  }
}