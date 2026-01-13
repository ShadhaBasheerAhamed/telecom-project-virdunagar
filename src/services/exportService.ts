import type {
  ExportOptions,
  ChartExportOptions,
  Customer,
  Payment
} from '../types';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportChart,
  validateExportData,
  triggerDownload
} from '../utils/exportHelpers';
import { CustomerService } from './customerService';
import { PaymentService } from './paymentService';
import { LeadService } from './leadService';

export const ExportService = {

  // ==================== CUSTOMER EXPORTS ====================
  exportCustomers: async (options: ExportOptions, filters?: any): Promise<boolean> => {
    try {
      // Fetch customer data
      let customers: Customer[] = [];
      if (filters) {
        // Apply filters if provided
        // This would need to be implemented based on specific filter requirements
        customers = await CustomerService.getCustomers();
      } else {
        customers = await CustomerService.getCustomers();
      }

      // Validate data
      const validation = validateExportData(customers);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Perform export based on format
      const filename = options.filename || `customers_export_${new Date().toISOString().split('T')[0]}`;

      switch (options.format) {
        case 'csv':
          exportToCSV(customers, filename, options);
          break;
        case 'excel':
          await exportToExcel(customers, filename, options);
          break;
        case 'pdf':
          await exportToPDF(customers, filename, options);
          break;
        case 'json':
          const jsonContent = JSON.stringify(customers, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          triggerDownload(blob, `${filename}.json`);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      console.log('Customer export completed');
      return true;
    } catch (error) {
      console.error('Error exporting customers:', error);
      return false;
    }
  },

  // ==================== PAYMENT EXPORTS ====================
  exportPayments: async (options: ExportOptions, filters?: any): Promise<boolean> => {
    try {
      // Fetch payment data
      let payments: Payment[] = [];
      if (filters?.source) {
        payments = await PaymentService.getPaymentsBySource(filters.source);
      } else {
        payments = await PaymentService.getPayments();
      }

      // Apply date range filter if specified
      if (options.dateRange) {
        const startDate = options.dateRange.start;
        const endDate = options.dateRange.end;
        payments = payments.filter(payment => {
          const paidDate = new Date(payment.paidDate);
          return paidDate >= startDate && paidDate <= endDate;
        });
      }

      const validation = validateExportData(payments);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const filename = options.filename || `payments_export_${new Date().toISOString().split('T')[0]}`;

      switch (options.format) {
        case 'csv':
          exportToCSV(payments, filename, options);
          break;
        case 'excel':
          await exportToExcel(payments, filename, options);
          break;
        case 'pdf':
          await exportToPDF(payments, filename, options);
          break;
        case 'json':
          const jsonContent = JSON.stringify(payments, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          triggerDownload(blob, `${filename}.json`);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      console.log('Payment export completed');
      return true;
    } catch (error) {
      console.error('Error exporting payments:', error);
      return false;
    }
  },

  // ==================== LEAD EXPORTS ====================
  exportLeads: async (options: ExportOptions, filters?: any): Promise<boolean> => {
    try {
      const leads = await LeadService.getLeads();

      // Apply status filter if specified
      let filteredLeads = leads;
      if (filters?.status) {
        filteredLeads = leads.filter(lead => lead.status === filters.status);
      }

      const validation = validateExportData(filteredLeads);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const filename = options.filename || `leads_export_${new Date().toISOString().split('T')[0]}`;

      switch (options.format) {
        case 'csv':
          exportToCSV(filteredLeads, filename, options);
          break;
        case 'excel':
          await exportToExcel(filteredLeads, filename, options);
          break;
        case 'pdf':
          await exportToPDF(filteredLeads, filename, options);
          break;
        case 'json':
          const jsonContent = JSON.stringify(filteredLeads, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          triggerDownload(blob, `${filename}.json`);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      console.log('Lead export completed');
      return true;
    } catch (error) {
      console.error('Error exporting leads:', error);
      return false;
    }
  },

  // ==================== CHART EXPORTS ====================
  exportChart: async (
    chartElement: HTMLElement,
    options: ChartExportOptions
  ): Promise<boolean> => {
    try {
      // Perform chart export
      await exportChart(chartElement, options.filename || 'chart_export', options);
      console.log('Chart export completed');
      return true;
    } catch (error) {
      console.error('Error exporting chart:', error);
      return false;
    }
  },

  // ==================== DASHBOARD EXPORTS ====================
  exportDashboard: async (
    dashboardData: any,
    options: ExportOptions
  ): Promise<boolean> => {
    try {
      // Create a comprehensive dashboard report
      const reportData = {
        generatedAt: new Date().toISOString(),
        metrics: dashboardData.metrics || {},
        revenueData: dashboardData.revenueData || [],
        customerGrowth: dashboardData?.customerGrowthData || [],
        paymentDistribution: dashboardData.paymentModeDistribution || [],
        planDistribution: dashboardData.planDistribution || []
      };

      const filename = options.filename || `dashboard_export_${new Date().toISOString().split('T')[0]}`;

      switch (options.format) {
        case 'csv':
          // Convert dashboard data to CSV format
          const csvData = ExportService.flattenDashboardData(reportData);
          exportToCSV(csvData, filename, options);
          break;
        case 'pdf':
          await exportToPDF([reportData], filename, options);
          break;
        case 'json':
          const jsonContent = JSON.stringify(reportData, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          triggerDownload(blob, `${filename}.json`);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      console.log('Dashboard export completed');
      return true;
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      return false;
    }
  },

  // ==================== UTILITY METHODS ====================
  flattenDashboardData: (dashboardData: any): any[] => {
    const flattened: any[] = [];

    // Add metrics as a single row
    if (dashboardData.metrics) {
      flattened.push({
        section: 'metrics',
        ...dashboardData.metrics
      });
    }

    // Add revenue data rows
    if (dashboardData.revenueData) {
      dashboardData.revenueData.forEach((item: any, index: number) => {
        flattened.push({
          section: 'revenue',
          sequence: index + 1,
          ...item
        });
      });
    }

    // Add customer growth data rows
    if (dashboardData.customerGrowth) {
      dashboardData.customerGrowth.forEach((item: any, index: number) => {
        flattened.push({
          section: 'customer_growth',
          sequence: index + 1,
          ...item
        });
      });
    }

    return flattened;
  },

  validateExportOptions: (options: ExportOptions): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!options.format || !['csv', 'excel', 'pdf', 'json'].includes(options.format)) {
      errors.push('Valid format (csv, excel, pdf, json) is required');
    }

    if (!options.filename || options.filename.trim().length === 0) {
      errors.push('Filename is required');
    }

    if (options.dateRange) {
      if (options.dateRange.start >= options.dateRange.end) {
        errors.push('Start date must be before end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};