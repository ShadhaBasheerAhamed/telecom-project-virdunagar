import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type {
  DashboardMetrics,
  DateFilter,
  TableFilters,
  LoadingState,
  DashboardState
} from '../types';
import { DashboardService } from '../services/dashboardService';
import { getDateFilter } from '../utils/dateFilters';

interface DashboardContextType extends DashboardState {
  setDateRange: (dateRange: DateFilter) => void;
  setFilters: (filters: TableFilters) => void;
  refreshData: () => Promise<void>;
  resetState: () => void;
}

type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_METRICS'; payload: DashboardMetrics | null }
  | { type: 'SET_DATE_RANGE'; payload: DateFilter }
  | { type: 'SET_FILTERS'; payload: TableFilters }
  | { type: 'SET_LAST_UPDATED'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: DashboardState = {
  metrics: null,
  filters: {},
  dateRange: getDateFilter('thisMonth'),
  isLoading: false,
  error: null,
  lastUpdated: null
};

const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_METRICS':
      return { ...state, metrics: action.payload, isLoading: false, error: null };
    
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Subscribe to real-time dashboard data
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const subscribeToData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        unsubscribe = DashboardService.subscribeToDashboardMetrics(
          state.dateRange,
          (metrics) => {
            dispatch({ type: 'SET_METRICS', payload: metrics });
            dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
          }
        );
      } catch (error) {
        console.error('Error subscribing to dashboard data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load dashboard data' });
      }
    };

    subscribeToData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [state.dateRange]);

  const setDateRange = (dateRange: DateFilter) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: dateRange });
  };

  const setFilters = (filters: TableFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const refreshData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Force refresh by calling the metrics calculation directly
      const metrics = await DashboardService.calculateMetrics([], state.dateRange);
      dispatch({ type: 'SET_METRICS', payload: metrics });
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value: DashboardContextType = {
    ...state,
    setDateRange,
    setFilters,
    refreshData,
    resetState
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

// ==================== CUSTOM HOOKS ====================

export const useDashboardMetrics = () => {
  const { metrics, isLoading, error } = useDashboard();
  return { metrics, isLoading, error };
};

export const useDashboardFilters = () => {
  const { filters, dateRange, setFilters, setDateRange } = useDashboard();
  return { filters, dateRange, setFilters, setDateRange };
};

export const useDashboardActions = () => {
  const { refreshData, resetState } = useDashboard();
  return { refreshData, resetState };
};

// ==================== QUICK ACTIONS ====================

export const useQuickMetrics = () => {
  const { refreshData } = useDashboard();
  
  const getTodaysMetrics = async () => {
    const todayFilter = getDateFilter('today');
    try {
      return await DashboardService.calculateMetrics([], todayFilter);
    } catch (error) {
      console.error('Error fetching today metrics:', error);
      return null;
    }
  };

  const getMonthlyMetrics = async () => {
    const monthlyFilter = getDateFilter('thisMonth');
    try {
      return await DashboardService.calculateMetrics([], monthlyFilter);
    } catch (error) {
      console.error('Error fetching monthly metrics:', error);
      return null;
    }
  };

  return {
    refreshData,
    getTodaysMetrics,
    getMonthlyMetrics
  };
};