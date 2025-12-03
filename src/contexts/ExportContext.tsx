import React, { createContext, useContext, useReducer, useCallback, ReactNode, useState } from 'react';
import type {
  ExportJob,
  ExportOptions,
  ChartExportOptions,
  ExportState
} from '../types';
import { ExportService } from '../services/exportService';

interface ExportContextType extends ExportState {
  exportCustomers: (options: ExportOptions, filters?: any) => Promise<string | null>;
  exportPayments: (options: ExportOptions, filters?: any) => Promise<string | null>;
  exportLeads: (options: ExportOptions, filters?: any) => Promise<string | null>;
  exportChart: (chartElement: HTMLElement, options: ChartExportOptions) => Promise<string | null>;
  exportDashboard: (dashboardData: any, options: ExportOptions) => Promise<string | null>;
  exportMultiple: (exports: Array<{
    type: 'customers' | 'payments' | 'leads' | 'dashboard';
    options: ExportOptions;
    filters?: any;
  }>) => Promise<string[]>;
  getExportJob: (jobId: string) => Promise<ExportJob | null>;
  refreshExportHistory: () => Promise<void>;
  resetState: () => void;
}

type ExportAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_JOBS'; payload: ExportJob[] }
  | { type: 'ADD_JOB'; payload: ExportJob }
  | { type: 'UPDATE_JOB'; payload: { id: string; updates: Partial<ExportJob> } }
  | { type: 'REMOVE_JOB'; payload: string }
  | { type: 'SET_CURRENT_JOB'; payload: ExportJob | null }
  | { type: 'RESET_STATE' };

const initialState: ExportState = {
  jobs: [],
  isExporting: false,
  error: null,
  currentJob: null
};

const exportReducer = (state: ExportState, action: ExportAction): ExportState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isExporting: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isExporting: false };
    
    case 'SET_JOBS':
      return { ...state, jobs: action.payload, isExporting: false, error: null };
    
    case 'ADD_JOB':
      return { 
        ...state, 
        jobs: [action.payload, ...state.jobs],
        isExporting: false 
      };
    
    case 'UPDATE_JOB':
      const updatedJobs = state.jobs.map(job => 
        job.id === action.payload.id 
          ? { ...job, ...action.payload.updates }
          : job
      );
      const updatedCurrentJob = state.currentJob?.id === action.payload.id
        ? { ...state.currentJob, ...action.payload.updates }
        : state.currentJob;
      
      return {
        ...state,
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
        isExporting: false
      };
    
    case 'REMOVE_JOB':
      return {
        ...state,
        jobs: state.jobs.filter(job => job.id !== action.payload),
        currentJob: state.currentJob?.id === action.payload ? null : state.currentJob
      };
    
    case 'SET_CURRENT_JOB':
      return { ...state, currentJob: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

const ExportContext = createContext<ExportContextType | undefined>(undefined);

interface ExportProviderProps {
  children: ReactNode;
}

export const ExportProvider: React.FC<ExportProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(exportReducer, initialState);

  const exportCustomers = useCallback(async (
    options: ExportOptions, 
    filters?: any
  ): Promise<string | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const jobId = await ExportService.exportCustomers(options, filters);
      if (jobId) {
        dispatch({ type: 'SET_ERROR', payload: null });
        // Refresh export history
        await refreshExportHistory();
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create export job' });
      }
      
      return jobId;
    } catch (error) {
      console.error('Error exporting customers:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export customers' });
      return null;
    }
  }, []);

  const exportPayments = useCallback(async (
    options: ExportOptions, 
    filters?: any
  ): Promise<string | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const jobId = await ExportService.exportPayments(options, filters);
      if (jobId) {
        dispatch({ type: 'SET_ERROR', payload: null });
        await refreshExportHistory();
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create export job' });
      }
      
      return jobId;
    } catch (error) {
      console.error('Error exporting payments:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export payments' });
      return null;
    }
  }, []);

  const exportLeads = useCallback(async (
    options: ExportOptions, 
    filters?: any
  ): Promise<string | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const jobId = await ExportService.exportLeads(options, filters);
      if (jobId) {
        dispatch({ type: 'SET_ERROR', payload: null });
        await refreshExportHistory();
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create export job' });
      }
      
      return jobId;
    } catch (error) {
      console.error('Error exporting leads:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export leads' });
      return null;
    }
  }, []);

  const exportChart = useCallback(async (
    chartElement: HTMLElement, 
    options: ChartExportOptions
  ): Promise<string | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const jobId = await ExportService.exportChart(chartElement, options);
      if (jobId) {
        dispatch({ type: 'SET_ERROR', payload: null });
        await refreshExportHistory();
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to export chart' });
      }
      
      return jobId;
    } catch (error) {
      console.error('Error exporting chart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export chart' });
      return null;
    }
  }, []);

  const exportDashboard = useCallback(async (
    dashboardData: any, 
    options: ExportOptions
  ): Promise<string | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const jobId = await ExportService.exportDashboard(dashboardData, options);
      if (jobId) {
        dispatch({ type: 'SET_ERROR', payload: null });
        await refreshExportHistory();
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to export dashboard' });
      }
      
      return jobId;
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export dashboard' });
      return null;
    }
  }, []);

  const exportMultiple = useCallback(async (
    exports: Array<{
      type: 'customers' | 'payments' | 'leads' | 'dashboard';
      options: ExportOptions;
      filters?: any;
    }>
  ): Promise<string[]> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const jobIds = await ExportService.exportMultiple(exports);
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Refresh export history
      await refreshExportHistory();
      
      return jobIds;
    } catch (error) {
      console.error('Error exporting multiple:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export multiple items' });
      return [];
    }
  }, []);

  const getExportJob = useCallback(async (jobId: string): Promise<ExportJob | null> => {
    try {
      return await ExportService.getExportJob(jobId);
    } catch (error) {
      console.error('Error getting export job:', error);
      return null;
    }
  }, []);

  const refreshExportHistory = useCallback(async () => {
    try {
      const jobs = await ExportService.getExportHistory();
      dispatch({ type: 'SET_JOBS', payload: jobs });
    } catch (error) {
      console.error('Error refreshing export history:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load export history' });
    }
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value: ExportContextType = {
    ...state,
    exportCustomers,
    exportPayments,
    exportLeads,
    exportChart,
    exportDashboard,
    exportMultiple,
    getExportJob,
    refreshExportHistory,
    resetState
  };

  return (
    <ExportContext.Provider value={value}>
      {children}
    </ExportContext.Provider>
  );
};

export const useExport = (): ExportContextType => {
  const context = useContext(ExportContext);
  if (context === undefined) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
};

// ==================== CUSTOM HOOKS ====================

export const useExportHistory = () => {
  const { jobs, isExporting, error } = useExport();
  return { jobs, isExporting, error };
};

export const useExportJobs = () => {
  const { jobs } = useExport();
  const activeJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');
  
  return { activeJobs, completedJobs, failedJobs };
};

export const useCurrentExport = () => {
  const { currentJob, isExporting } = useExport();
  return { currentJob, isExporting };
};

// ==================== EXPORT ACTION HOOKS ====================

export const useExportActions = () => {
  const { 
    exportCustomers, 
    exportPayments, 
    exportLeads, 
    exportChart, 
    exportDashboard,
    exportMultiple,
    refreshExportHistory 
  } = useExport();
  
  return {
    exportCustomers,
    exportPayments,
    exportLeads,
    exportChart,
    exportDashboard,
    exportMultiple,
    refreshExportHistory
  };
};

// ==================== EXPORT UTILITY HOOKS ====================

export const useExportTemplates = () => {
  const { exportCustomers, exportPayments, exportLeads, exportDashboard } = useExport();
  
  const exportCustomersTemplate = useCallback((filters?: any) => {
    const options: ExportOptions = {
      format: 'csv',
      filename: `customers_export_${new Date().toISOString().split('T')[0]}`,
      includeHeaders: true
    };
    return exportCustomers(options, filters);
  }, [exportCustomers]);

  const exportPaymentsTemplate = useCallback((dateRange?: { start: Date; end: Date }) => {
    const options: ExportOptions = {
      format: 'excel',
      filename: `payments_export_${new Date().toISOString().split('T')[0]}`,
      includeHeaders: true,
      dateRange
    };
    return exportPayments(options);
  }, [exportPayments]);

  const exportLeadsTemplate = useCallback((status?: string) => {
    const options: ExportOptions = {
      format: 'pdf',
      filename: `leads_export_${new Date().toISOString().split('T')[0]}`,
      includeHeaders: true
    };
    return exportLeads(options, status ? { status } : undefined);
  }, [exportLeads]);

  const exportDashboardTemplate = useCallback(() => {
    const options: ExportOptions = {
      format: 'json',
      filename: `dashboard_export_${new Date().toISOString().split('T')[0]}`,
      includeHeaders: true
    };
    return exportDashboard({}, options);
  }, [exportDashboard]);

  return {
    exportCustomersTemplate,
    exportPaymentsTemplate,
    exportLeadsTemplate,
    exportDashboardTemplate
  };
};

// ==================== EXPORT PROGRESS HOOKS ====================

export const useExportProgress = (jobId: string) => {
  const { getExportJob } = useExport();
  const [job, setJob] = React.useState<ExportJob | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);

  React.useEffect(() => {
    if (!jobId) return;

    const pollJobStatus = async () => {
      setIsPolling(true);
      try {
        const jobData = await getExportJob(jobId);
        setJob(jobData);
        
        // Stop polling when job is completed or failed
        if (jobData && (jobData.status === 'completed' || jobData.status === 'failed')) {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setIsPolling(false);
      }
    };

    // Initial fetch
    pollJobStatus();

    // Poll every 2 seconds
    const interval = setInterval(pollJobStatus, 2000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [jobId, getExportJob]);

  return { job, isPolling };
};