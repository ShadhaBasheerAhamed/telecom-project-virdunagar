import type {
  AnalyticsData,
  DashboardMetrics,
  RevenueData,
  PaymentModeDistribution,
  CustomerGrowthData,
  PlanDistribution,
  RenewalTrend,
  ConversionData,
  DateFilter,
  Lead
} from '../types';
import { DashboardService } from './dashboardService';
import { CustomerService } from './customerService';
import { PaymentService } from './paymentService';
import { LeadService } from './leadService';
import { getDateFilter, isDateInRange } from '../utils/dateFilters';

export const AnalyticsService = {

  // ==================== COMPREHENSIVE ANALYTICS ====================
  getComprehensiveAnalytics: async (dateRange: DateFilter): Promise<AnalyticsData> => {
    try {
      // Fetch all required data in parallel
      const [
        metrics,
        revenueData,
        paymentModeDistribution,
        customerGrowthData,
        planDistribution,
        topCustomers,
        renewalTrends,
        conversionData
      ] = await Promise.all([
        DashboardService.calculateMetrics([], dateRange),
        DashboardService.getRevenueData(dateRange),
        DashboardService.getPaymentModeDistribution(dateRange),
        DashboardService.getCustomerGrowthData(dateRange),
        DashboardService.getPlanDistribution(dateRange),
        (this as any).getTopCustomers(dateRange) || [],
        (this as any).getRenewalTrends(dateRange) || [],
        (this as any).getConversionData(dateRange) || { leads: 0, prospects: 0, customers: 0, conversionRate: 0, averageTimeToConvert: 0 }
      ]);

      return {
        metrics,
        revenueData,
        paymentModeDistribution,
        customerGrowthData,
        planDistribution,
        topCustomers: (topCustomers as any[]) || [],
        renewalTrends: (renewalTrends as any[]) || [],
        conversionData: (conversionData as any) || { leads: 0, prospects: 0, customers: 0, conversionRate: 0, averageTimeToConvert: 0 }
      };
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error);
      throw error;
    }
  },

  // ==================== TOP CUSTOMERS ANALYSIS ====================
  getTopCustomers: async (dateRange: DateFilter, limitCount = 10): Promise<any[]> => {
    try {
      const payments = await PaymentService.getPayments();
      const customers = await CustomerService.getCustomers();
      
      // Filter payments by date range
      const filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paidDate);
        return isDateInRange(paymentDate, dateRange.startDate!, dateRange.endDate!);
      });

      // Calculate revenue per customer
      const customerRevenue = filteredPayments.reduce((acc, payment) => {
        const landline = payment.landlineNo;
        if (!acc[landline]) {
          acc[landline] = {
            landline,
            customerName: payment.customerName,
            totalRevenue: 0,
            paymentCount: 0,
            averagePayment: 0,
            lastPaymentDate: null
          };
        }
        
        acc[landline].totalRevenue += payment.billAmount || 0;
        acc[landline].paymentCount += 1;
        acc[landline].lastPaymentDate = new Date(payment.paidDate);
        
        return acc;
      }, {} as Record<string, any>);

      // Calculate averages and sort
      const customersWithAverages = Object.values(customerRevenue).map((customer: any) => {
        customer.averagePayment = customer.totalRevenue / customer.paymentCount;
        return customer;
      });

      return customersWithAverages
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching top customers:', error);
      return [];
    }
  },

  // ==================== RENEWAL TRENDS ANALYSIS ====================
  getRenewalTrends: async (dateRange: DateFilter): Promise<RenewalTrend[]> => {
    try {
      const customers = await CustomerService.getCustomers();
      
      // Group customers by month based on renewal date
      const monthlyRenewals = customers.reduce((acc, customer) => {
        if (!customer.renewalDate) return acc;
        
        const renewalDate = new Date(customer.renewalDate);
        if (!isDateInRange(renewalDate, dateRange.startDate!, dateRange.endDate!)) {
          return acc;
        }
        
        const monthKey = `${renewalDate.getFullYear()}-${String(renewalDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            renewals: 0,
            expectedRenewals: 0,
            actualRenewals: 0,
            revenue: 0
          };
        }
        
        acc[monthKey].renewals += 1;
        
        return acc;
      }, {} as Record<string, RenewalTrend>);

      // Get actual renewal data (customers who renewed)
      const payments = await PaymentService.getPayments();
      const renewedCustomers = payments.filter(payment => {
        const paymentDate = new Date(payment.paidDate);
        return isDateInRange(paymentDate, dateRange.startDate!, dateRange.endDate!) && 
               payment.status === 'Paid';
      });

      // Update actual renewals and revenue
      renewedCustomers.forEach(payment => {
        const paymentDate = new Date(payment.paidDate);
        const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyRenewals[monthKey]) {
          monthlyRenewals[monthKey].actualRenewals += 1;
          monthlyRenewals[monthKey].revenue += payment.billAmount || 0;
        }
      });

      // Calculate expected renewals (simplified - using current month data)
      Object.keys(monthlyRenewals).forEach(month => {
        const renewal = monthlyRenewals[month];
        renewal.expectedRenewals = renewal.renewals; // Simplified calculation
      });

      return Object.values(monthlyRenewals);
    } catch (error) {
      console.error('Error fetching renewal trends:', error);
      return [];
    }
  },

  // ==================== CONVERSION ANALYSIS ====================
  getConversionData: async (dateRange: DateFilter): Promise<ConversionData> => {
    try {
      const leads = await LeadService.getLeads();
      const customers = await CustomerService.getCustomers();
      
      // Filter by date range
      const filteredLeads = leads.filter(lead => {
        const createdAt = (lead as any).createdAt;
        if (!createdAt) return false;
        const leadDate = new Date(createdAt);
        return isDateInRange(leadDate, dateRange.startDate!, dateRange.endDate!);
      });

      const filteredCustomers = customers.filter(customer => {
        if (!customer.createdAt) return false;
        const customerDate = new Date(customer.createdAt);
        return isDateInRange(customerDate, dateRange.startDate!, dateRange.endDate!);
      });

      // Calculate conversion metrics
      const totalLeads = filteredLeads.length;
      const convertedLeads = filteredLeads.filter(lead => lead.status === 'Sale').length;
      const prospects = filteredLeads.filter(lead => lead.status === 'Pending').length;
      
      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      // Calculate average time to convert (simplified)
      const conversionTimes = filteredLeads
        .filter(lead => lead.status === 'Sale')
        .map(lead => {
          const createdAt = (lead as any).createdAt;
          if (!createdAt) return 0;
          const leadDate = new Date(createdAt);
          const customerDate = new Date(); // Simplified - would need actual conversion date
          return Math.floor((customerDate.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
        });

      const averageTimeToConvert = conversionTimes.length > 0 
        ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length 
        : 0;

      return {
        leads: totalLeads,
        prospects,
        customers: filteredCustomers.length + convertedLeads,
        conversionRate,
        averageTimeToConvert
      };
    } catch (error) {
      console.error('Error fetching conversion data:', error);
      return {
        leads: 0,
        prospects: 0,
        customers: 0,
        conversionRate: 0,
        averageTimeToConvert: 0
      };
    }
  },

  // ==================== CUSTOMER SEGMENTATION ====================
  getCustomerSegmentation: async (dateRange: DateFilter) => {
    try {
      const customers = await CustomerService.getCustomers();
      
      // Filter by date range
      const filteredCustomers = customers.filter(customer => {
        if (!customer.createdAt) return false;
        const createdDate = new Date(customer.createdAt);
        return isDateInRange(createdDate, dateRange.startDate!, dateRange.endDate!);
      });

      // Segment by status
      const statusSegments = filteredCustomers.reduce((acc, customer) => {
        const status = customer.status;
        if (!acc[status]) {
          acc[status] = { count: 0, percentage: 0 };
        }
        acc[status].count += 1;
        return acc;
      }, {} as Record<string, { count: number; percentage: number }>);

      // Calculate percentages
      const totalCustomers = filteredCustomers.length;
      Object.keys(statusSegments).forEach(status => {
        statusSegments[status].percentage = totalCustomers > 0 
          ? (statusSegments[status].count / totalCustomers) * 100 
          : 0;
      });

      // Segment by source
      const sourceSegments = filteredCustomers.reduce((acc, customer) => {
        const source = customer.source;
        if (!acc[source]) {
          acc[source] = { count: 0, percentage: 0 };
        }
        acc[source].count += 1;
        return acc;
      }, {} as Record<string, { count: number; percentage: number }>);

      // Calculate percentages for source
      Object.keys(sourceSegments).forEach(source => {
        sourceSegments[source].percentage = totalCustomers > 0 
          ? (sourceSegments[source].count / totalCustomers) * 100 
          : 0;
      });

      return {
        byStatus: statusSegments,
        bySource: sourceSegments,
        totalCustomers
      };
    } catch (error) {
      console.error('Error fetching customer segmentation:', error);
      return {
        byStatus: {},
        bySource: {},
        totalCustomers: 0
      };
    }
  },

  // ==================== REVENUE ANALYSIS ====================
  getRevenueAnalytics: async (dateRange: DateFilter) => {
    try {
      const payments = await PaymentService.getPayments();
      const revenueData = await DashboardService.getRevenueData(dateRange);
      
      // Filter payments by date range
      const filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paidDate);
        return isDateInRange(paymentDate, dateRange.startDate!, dateRange.endDate!);
      });

      // Calculate revenue metrics
      const totalRevenue = filteredPayments.reduce((sum, payment) => sum + (payment.billAmount || 0), 0);
      const averageRevenue = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;
      
      // Calculate revenue growth (simplified)
      const previousPeriodStart = new Date(dateRange.startDate!);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      const previousPeriodEnd = new Date(dateRange.endDate!);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
      
      const previousPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paidDate);
        return isDateInRange(paymentDate, previousPeriodStart, previousPeriodEnd);
      });
      
      const previousRevenue = previousPayments.reduce((sum, payment) => sum + (payment.billAmount || 0), 0);
      const revenueGrowth = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Calculate monthly recurring revenue (MRR)
      const mrr = revenueData.reduce((sum, data) => {
        // Assuming monthly data, add to MRR
        return sum + data.revenue;
      }, 0);

      return {
        totalRevenue,
        averageRevenue,
        revenueGrowth,
        mrr,
        paymentCount: filteredPayments.length,
        revenueData
      };
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return {
        totalRevenue: 0,
        averageRevenue: 0,
        revenueGrowth: 0,
        mrr: 0,
        paymentCount: 0,
        revenueData: []
      };
    }
  },

  // ==================== PERFORMANCE METRICS ====================
  getPerformanceMetrics: async (dateRange: DateFilter) => {
    try {
      const [
        conversionData,
        customerGrowth,
        revenueAnalytics
      ] = await Promise.all([
        (this as any).getConversionData(dateRange) || { leads: 0, prospects: 0, customers: 0, conversionRate: 0, averageTimeToConvert: 0 },
        (this as any).getCustomerSegmentation(dateRange) || { byStatus: {}, bySource: {}, totalCustomers: 0 },
        (this as any).getRevenueAnalytics(dateRange) || { totalRevenue: 0, averageRevenue: 0, revenueGrowth: 0, mrr: 0, paymentCount: 0, revenueData: [] }
      ]);

      // Calculate performance score (composite metric)
      const conversionScore = Math.min((conversionData?.conversionRate || 0) / 10, 1) * 100; // Max 10% conversion = 100 points
      const growthScore = Math.min((customerGrowth?.totalCustomers || 0) / 100, 1) * 100; // Max 100 customers = 100 points
      const revenueScore = Math.min((revenueAnalytics?.revenueGrowth || 0) / 50, 1) * 100; // Max 50% growth = 100 points
      
      const overallScore = (conversionScore + growthScore + revenueScore) / 3;

      return {
        conversionRate: conversionData?.conversionRate || 0,
        conversionScore,
        customerGrowthRate: ((customerGrowth?.totalCustomers || 0) / 30) * 100, // Assuming 30-day period
        growthScore,
        revenueGrowth: revenueAnalytics?.revenueGrowth || 0,
        revenueScore,
        overallScore: Math.round(overallScore)
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        conversionRate: 0,
        conversionScore: 0,
        customerGrowthRate: 0,
        growthScore: 0,
        revenueGrowth: 0,
        revenueScore: 0,
        overallScore: 0
      };
    }
  },

  // ==================== COMPARATIVE ANALYSIS ====================
  comparePeriods: async (currentPeriod: DateFilter, previousPeriod: DateFilter) => {
    try {
      const [currentAnalytics, previousAnalytics] = await Promise.all([
        (this as any).getComprehensiveAnalytics(currentPeriod).catch(() => ({
          metrics: {
            totalCustomers: 0,
            activeCustomers: 0,
            inactiveCustomers: 0,
            suspendedCustomers: 0,
            expiredCustomers: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
            pendingPayments: 0,
            completedPayments: 0,
            leadsThisMonth: 0,
            conversionRate: 0,
            avgRevenuePerCustomer: 0,
            renewalDueCount: 0,
            newCustomersThisMonth: 0
          },
          revenueData: [],
          paymentModeDistribution: [],
          customerGrowthData: [],
          planDistribution: [],
          topCustomers: [],
          renewalTrends: [],
          conversionData: {
            leads: 0,
            prospects: 0,
            customers: 0,
            conversionRate: 0,
            averageTimeToConvert: 0
          }
        })),
        (this as any).getComprehensiveAnalytics(previousPeriod).catch(() => ({
          metrics: {
            totalCustomers: 0,
            activeCustomers: 0,
            inactiveCustomers: 0,
            suspendedCustomers: 0,
            expiredCustomers: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
            pendingPayments: 0,
            completedPayments: 0,
            leadsThisMonth: 0,
            conversionRate: 0,
            avgRevenuePerCustomer: 0,
            renewalDueCount: 0,
            newCustomersThisMonth: 0
          },
          revenueData: [],
          paymentModeDistribution: [],
          customerGrowthData: [],
          planDistribution: [],
          topCustomers: [],
          renewalTrends: [],
          conversionData: {
            leads: 0,
            prospects: 0,
            customers: 0,
            conversionRate: 0,
            averageTimeToConvert: 0
          }
        }))
      ]);

      // Calculate period-over-period changes
      const changes = {
        customers: {
          current: currentAnalytics?.metrics?.totalCustomers || 0,
          previous: previousAnalytics?.metrics?.totalCustomers || 0,
          change: (currentAnalytics?.metrics?.totalCustomers || 0) - (previousAnalytics?.metrics?.totalCustomers || 0),
          changePercentage: (previousAnalytics?.metrics?.totalCustomers || 0) > 0
            ? (((currentAnalytics?.metrics?.totalCustomers || 0) - (previousAnalytics?.metrics?.totalCustomers || 0)) / (previousAnalytics?.metrics?.totalCustomers || 1)) * 100
            : 0
        },
        revenue: {
          current: currentAnalytics?.metrics?.totalRevenue || 0,
          previous: previousAnalytics?.metrics?.totalRevenue || 0,
          change: (currentAnalytics?.metrics?.totalRevenue || 0) - (previousAnalytics?.metrics?.totalRevenue || 0),
          changePercentage: (previousAnalytics?.metrics?.totalRevenue || 0) > 0
            ? (((currentAnalytics?.metrics?.totalRevenue || 0) - (previousAnalytics?.metrics?.totalRevenue || 0)) / (previousAnalytics?.metrics?.totalRevenue || 1)) * 100
            : 0
        },
        conversionRate: {
          current: currentAnalytics?.conversionData?.conversionRate || 0,
          previous: previousAnalytics?.conversionData?.conversionRate || 0,
          change: (currentAnalytics?.conversionData?.conversionRate || 0) - (previousAnalytics?.conversionData?.conversionRate || 0)
        }
      };

      return {
        current: currentAnalytics,
        previous: previousAnalytics,
        changes
      };
    } catch (error) {
      console.error('Error comparing periods:', error);
      throw error;
    }
  },

  // ==================== FORECASTING ====================
  getForecasting: async (dateRange: DateFilter, forecastMonths = 3) => {
    try {
      const historicalData = await DashboardService.getRevenueData(dateRange);
      
      if (historicalData.length < 3) {
        return {
          revenue: [],
          customers: [],
          confidence: 'low'
        };
      }

      // Simple linear regression for forecasting
      const forecast = [];
      const lastMonth = new Date(historicalData[historicalData.length - 1].month + '-01');
      
      for (let i = 1; i <= forecastMonths; i++) {
        const forecastDate = new Date(lastMonth);
        forecastDate.setMonth(forecastDate.getMonth() + i);
        
        // Simple trend calculation (can be improved with more sophisticated algorithms)
        const recentRevenue = historicalData.slice(-3).map(d => d.revenue);
        const avgGrowth = recentRevenue.length > 1
          ? (recentRevenue[recentRevenue.length - 1] - recentRevenue[0]) / (recentRevenue.length - 1)
          : 0;
        
        const lastRevenue = historicalData[historicalData.length - 1].revenue;
        const forecastRevenue = Math.max(0, lastRevenue + (avgGrowth * i));
        
        // Estimate customer growth (simplified)
        const customerGrowth = Math.max(0, i * 5); // Assuming 5 new customers per month
        
        forecast.push({
          month: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
          revenue: Math.round(forecastRevenue),
          customers: customerGrowth
        });
      }

      return {
        revenue: forecast,
        customers: forecast.map(f => ({ month: f.month, customers: f.customers })),
        confidence: historicalData.length >= 6 ? 'high' : 'medium'
      };
    } catch (error) {
      console.error('Error generating forecasts:', error);
      return {
        revenue: [],
        customers: [],
        confidence: 'low'
      };
    }
  }
};