// Enhanced Types for Dynamic System
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'payment' | 'customer' | 'complaint' | 'system' | 'renewal';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  data?: any;
  actionUrl?: string;
  actionLabel?: string;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
  label: string;
}

export interface ChartExportOptions {
  format: 'csv' | 'pdf' | 'image';
  filename: string;
  title?: string;
  includeChart?: boolean;
  dataType?: 'chart' | 'table' | 'report';
}

export interface StatusToggleOptions {
  confirmMessage?: string;
  showNotification?: boolean;
  updateRelatedRecords?: boolean;
}

export interface FilterOptions {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
  value: any;
  caseSensitive?: boolean;
}

export interface RealTimeMetrics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newToday: number;
  expiredToday: number;
  suspendedCount: number;
  renewalDueCount: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayCollection: number;
  pendingInvoices: number;
  unresolvedComplaints: number;
  avgResponseTime: number;
  conversionRate: number;
  lastUpdated: string;
}

export interface PaymentModeDistribution {
  mode: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface CustomerGrowthData {
  date: string;
  newCustomers: number;
  activeCustomers: number;
  totalCustomers: number;
}

export interface PlanDistribution {
  plan: string;
  customerCount: number;
  revenue: number;
  percentage: number;
}

export interface TimeRangeMetrics {
  startDate: string;
  endDate: string;
  label: string;
}

export interface DashboardState {
  metrics: RealTimeMetrics | null;
  filters: TableFilters;
  dateRange: DateRangeFilter;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface TableFilters {
  [key: string]: any;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface StatusUpdateResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
  totalProcessed: number;
}

export interface SearchFilters {
  query: string;
  fields: string[];
  status?: string;
  source?: string;
  dateRange?: DateRangeFilter;
  customFilters?: FilterOptions[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface AnalyticsData {
  revenue: ChartDataPoint[];
  customers: ChartDataPoint[];
  payments: ChartDataPoint[];
  complaints: ChartDataPoint[];
  growth: CustomerGrowthData[];
  distribution: PlanDistribution[];
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultDateRange: string;
  notificationsEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  exportFormat: 'csv' | 'pdf' | 'xlsx';
}

export interface SystemConfig {
  features: {
    notifications: boolean;
    exports: boolean;
    bulkOperations: boolean;
    realTimeUpdates: boolean;
    analytics: boolean;
  };
  limits: {
    maxRecordsPerPage: number;
    maxBulkOperations: number;
    exportTimeout: number;
  };
  paths: {
    dashboard: string;
    customers: string;
    payments: string;
    complaints: string;
  };
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  categories: {
    payment: boolean;
    customer: boolean;
    complaint: boolean;
    system: boolean;
    renewal: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}