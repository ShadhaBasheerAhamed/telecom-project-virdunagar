import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode
} from 'react';

import type {
  DashboardMetrics,
  DateFilter,
  TableFilters
} from '../types';

import { DashboardService } from '../services/dashboardService';

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

interface DashboardContextType {
  metrics: DashboardMetrics | null;
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  setSelectedDate: (date: Date) => void;
  refreshData: () => Promise<void>;
  resetState: () => void;
}

/* ------------------------------------------------------------------ */
/* STATE */
/* ------------------------------------------------------------------ */

interface DashboardState {
  metrics: DashboardMetrics | null;
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/* ------------------------------------------------------------------ */
/* ACTIONS */
/* ------------------------------------------------------------------ */

type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_METRICS'; payload: DashboardMetrics | null }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_LAST_UPDATED'; payload: string }
  | { type: 'RESET_STATE' };

/* ------------------------------------------------------------------ */
/* INITIAL STATE */
/* ------------------------------------------------------------------ */

const initialState: DashboardState = {
  metrics: null,
  selectedDate: new Date(), // ✅ SINGLE SOURCE OF TRUTH
  isLoading: false,
  error: null,
  lastUpdated: null
};

/* ------------------------------------------------------------------ */
/* REDUCER */
/* ------------------------------------------------------------------ */

const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_METRICS':
      return { ...state, metrics: action.payload, isLoading: false };

    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };

    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

/* ------------------------------------------------------------------ */
/* CONTEXT */
/* ------------------------------------------------------------------ */

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

/* ------------------------------------------------------------------ */
/* PROVIDER */
/* ------------------------------------------------------------------ */

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children
}) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  /* -------------------------------------------------------------- */
  /* HELPER: build DateFilter from selectedDate */
  /* -------------------------------------------------------------- */

  const buildDateRange = (date: Date): DateFilter => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const start = new Date(d);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    return {
      startDate: start,
      endDate: end,
      label: d.toDateString(),
      type: 'custom'
    };
  };

  /* -------------------------------------------------------------- */
  /* FIREBASE REAL-TIME SUBSCRIPTION (NO LOOP) */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const dateRange = buildDateRange(state.selectedDate);

    dispatch({ type: 'SET_LOADING', payload: true });

    unsubscribe = DashboardService.subscribeToDashboardMetrics(
      dateRange,
      (metrics) => {
        dispatch({ type: 'SET_METRICS', payload: metrics });
        dispatch({
          type: 'SET_LAST_UPDATED',
          payload: new Date().toISOString()
        });
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [state.selectedDate]);

  /* -------------------------------------------------------------- */
  /* ACTIONS */
  /* -------------------------------------------------------------- */

  const setSelectedDate = (date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const refreshData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const dateRange = buildDateRange(state.selectedDate);
      const metrics = await DashboardService.calculateMetrics([], dateRange);

      dispatch({ type: 'SET_METRICS', payload: metrics });
      dispatch({
        type: 'SET_LAST_UPDATED',
        payload: new Date().toISOString()
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to refresh dashboard data'
      });
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  /* -------------------------------------------------------------- */
  /* CONTEXT VALUE */
  /* -------------------------------------------------------------- */

  const value: DashboardContextType = {
    metrics: state.metrics,
    selectedDate: state.selectedDate,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    setSelectedDate,
    refreshData,
    resetState
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* HOOK */
/* ------------------------------------------------------------------ */

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      'useDashboard must be used within a DashboardProvider'
    );
  }
  return context;
};
