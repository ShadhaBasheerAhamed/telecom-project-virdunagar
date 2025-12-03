import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from '../firebase/config';
import { db } from '../firebase/config';
import type {
  ExportOptions,
  ChartExportOptions,
  ExportJob,
  Customer,
  Payment,
  Lead
} from '../types';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportChart,
  createExportJob,
  validateExportData,
  triggerDownload
} from '../utils/exportHelpers';
import { CustomerService } from './customerService';
import { PaymentService } from './paymentService';
import { LeadService } from './leadService';

const EXPORT_JOBS_COLLECTION = 'export_jobs';

export const ExportService = {

  // ==================== EXPORT JOB MANAGEMENT ====================
  createExportJob: async (job: ExportJob): Promise<string | null> => {
    try {
      const docRef = await addDoc(collection(db, EXPORT_JOBS_COLLECTION), {
        ...job,
        createdAt: new Date().toISOString()
      });

      console.log('Export job created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating export job:', error);
      return null;
    }
  },

  updateExportJob: async (jobId: string, updates: Partial<ExportJob>): Promise<boolean> => {
    try {
      const jobRef = doc(db, EXPORT_JOBS_COLLECTION, jobId);
      await updateDoc(jobRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating export job:', error);
      return false;
    }
  },

  getExportJob: async (jobId: string): Promise<ExportJob | null> => {
    try {
      const jobDoc = await getDocs(query(
        collection(db, EXPORT_JOBS_COLLECTION),
        where('id', '==', jobId),
        limit(1)
      ));

      if (jobDoc.empty) {
        return null;
      }

      const doc = jobDoc.docs[0];
      return { id: doc.id, ...doc.data() } as ExportJob;
    } catch (error) {
      console.error('Error fetching export job:', error);
      return null;
    }
  },

  // ==================== CUSTOMER EXPORTS ====================
  exportCustomers: async (options: ExportOptions, filters?: any): Promise<string | null> => {
    try {
      const job = createExportJob('customers', options);
      const jobId = await ExportService.createExportJob(job);
      
      if (!jobId) {
        throw new Error('Failed to create export job');
      }

      // Update job status to processing
      await ExportService.updateExportJob(jobId, { status: 'processing', progress: 10 });

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

        await ExportService.updateExportJob(jobId, { progress: 50 });

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

        // Update job as completed
        await ExportService.updateExportJob(jobId, { 
          status: 'completed', 
          progress: 100,
          completedAt: new Date().toISOString()
        });

        console.log('Customer export completed:', jobId);
        return jobId;
      } catch (error) {
        // Update job as failed
        await ExportService.updateExportJob(jobId, { 
          status: 'failed', 
          progress: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } catch (error) {
      console.error('Error exporting customers:', error);
      return null;
    }
  },

  // ==================== PAYMENT EXPORTS ====================
  exportPayments: async (options: ExportOptions, filters?: any): Promise<string | null> => {
    try {
      const job = createExportJob('payments', options);
      const jobId = await ExportService.createExportJob(job);
      
      if (!jobId) {
        throw new Error('Failed to create export job');
      }

      await ExportService.updateExportJob(jobId, { status: 'processing', progress: 10 });

      try {
        // Fetch payment data
        let payments: Payment[] = [];
        if (filters?.source) {
          payments = await PaymentService.getPaymentsBySource(filters.source);
        } else {
          payments = await PaymentService.getPayments();
        }

        await ExportService.updateExportJob(jobId, { progress: 50 });

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

        await ExportService.updateExportJob(jobId, { 
          status: 'completed', 
          progress: 100,
          completedAt: new Date().toISOString()
        });

        console.log('Payment export completed:', jobId);
        return jobId;
      } catch (error) {
        await ExportService.updateExportJob(jobId, { 
          status: 'failed', 
          progress: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } catch (error) {
      console.error('Error exporting payments:', error);
      return null;
    }
  },

  // ==================== LEAD EXPORTS ====================
  exportLeads: async (options: ExportOptions, filters?: any): Promise<string | null> => {
    try {
      const job = createExportJob('leads', options);
      const jobId = await ExportService.createExportJob(job);
      
      if (!jobId) {
        throw new Error('Failed to create export job');
      }

      await ExportService.updateExportJob(jobId, { status: 'processing', progress: 10 });

      try {
        const leads = await LeadService.getLeads();
        
        await ExportService.updateExportJob(jobId, { progress: 50 });

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

        await ExportService.updateExportJob(jobId, { 
          status: 'completed', 
          progress: 100,
          completedAt: new Date().toISOString()
        });

        console.log('Lead export completed:', jobId);
        return jobId;
      } catch (error) {
        await ExportService.updateExportJob(jobId, { 
          status: 'failed', 
          progress: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } catch (error) {
      console.error('Error exporting leads:', error);
      return null;
    }
  },

  // ==================== CHART EXPORTS ====================
  exportChart: async (
    chartElement: HTMLElement,
    options: ChartExportOptions
  ): Promise<string | null> => {
    try {
      // Convert ChartExportOptions to ExportOptions format
      const exportOptions: ExportOptions = {
        format: options.format === 'png' || options.format === 'jpeg' || options.format === 'svg' ? 'pdf' : 'pdf',
        filename: options.filename,
        includeHeaders: options.includeHeaders || false,
        dateRange: options.dateRange,
        filters: options.filters,
        columns: options.columns || undefined
      };
      
      const job = createExportJob('chart', exportOptions);
      const jobId = await ExportService.createExportJob(job);
      
      if (!jobId) {
        throw new Error('Failed to create export job');
      }

      await ExportService.updateExportJob(jobId, { status: 'processing', progress: 25 });

      try {
        // Perform chart export
        await exportChart(chartElement, options.filename || 'chart_export', options);

        await ExportService.updateExportJob(jobId, { 
          status: 'completed', 
          progress: 100,
          completedAt: new Date().toISOString()
        });

        console.log('Chart export completed:', jobId);
        return jobId;
      } catch (error) {
        await ExportService.updateExportJob(jobId, { 
          status: 'failed', 
          progress: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } catch (error) {
      console.error('Error exporting chart:', error);
      return null;
    }
  },

  // ==================== DASHBOARD EXPORTS ====================
  exportDashboard: async (
    dashboardData: any,
    options: ExportOptions
  ): Promise<string | null> => {
    try {
      const job = createExportJob('dashboard', options);
      const jobId = await ExportService.createExportJob(job);
      
      if (!jobId) {
        throw new Error('Failed to create export job');
      }

      await ExportService.updateExportJob(jobId, { status: 'processing', progress: 10 });

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

        await ExportService.updateExportJob(jobId, { 
          status: 'completed', 
          progress: 100,
          completedAt: new Date().toISOString()
        });

        console.log('Dashboard export completed:', jobId);
        return jobId;
      } catch (error) {
        await ExportService.updateExportJob(jobId, { 
          status: 'failed', 
          progress: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      return null;
    }
  },

  // ==================== BULK EXPORTS ====================
  exportMultiple: async (
    exports: Array<{
      type: 'customers' | 'payments' | 'leads' | 'dashboard';
      options: ExportOptions;
      filters?: any;
    }>
  ): Promise<string[]> => {
    const jobIds: string[] = [];
    
    for (const exportConfig of exports) {
      try {
        let jobId: string | null = null;
        
        switch (exportConfig.type) {
          case 'customers':
            jobId = await ExportService.exportCustomers(exportConfig.options, exportConfig.filters);
            break;
          case 'payments':
            jobId = await ExportService.exportPayments(exportConfig.options, exportConfig.filters);
            break;
          case 'leads':
            jobId = await ExportService.exportLeads(exportConfig.options, exportConfig.filters);
            break;
          case 'dashboard':
            jobId = await ExportService.exportDashboard({}, exportConfig.options);
            break;
        }
        
        if (jobId) {
          jobIds.push(jobId);
        }
      } catch (error) {
        console.error(`Error in bulk export for ${exportConfig.type}:`, error);
      }
    }
    
    return jobIds;
  },

  // ==================== EXPORT HISTORY ====================
  getExportHistory: async (limitCount = 50): Promise<ExportJob[]> => {
    try {
      const q = query(
        collection(db, EXPORT_JOBS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExportJob[];
    } catch (error) {
      console.error('Error fetching export history:', error);
      return [];
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
  },

  // ==================== EXPORT CLEANUP ====================
  cleanupOldExportJobs: async (daysOld = 30): Promise<number> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const q = query(
        collection(db, EXPORT_JOBS_COLLECTION),
        where('createdAt', '<', cutoffDate.toISOString())
      );

      const snapshot = await getDocs(q);
      const oldJobs = snapshot.docs;
      
      // In a real implementation, you would delete these jobs
      // For now, we'll just log them
      console.log(`Found ${oldJobs.length} old export jobs to clean up`);
      
      return oldJobs.length;
    } catch (error) {
      console.error('Error cleaning up old export jobs:', error);
      return 0;
    }
  }
};