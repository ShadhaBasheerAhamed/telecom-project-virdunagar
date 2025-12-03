// Payment interface
export interface Payment {
  id: string;
  landlineNo: string;
  customerName: string;
  rechargePlan: string;
  duration: string;
  billAmount: number;
  commission: number;
  status: 'Paid' | 'Unpaid';
  paidDate: string;
  modeOfPayment: string;
  renewalDate: string;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

// Common master record types
export interface MasterRecord {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Plan specific fields
export interface Plan extends MasterRecord {
  price: number;
  gst: number;
  total: number;
  validity?: string; // e.g., "30 Days", "1 Month"
}

// Employee specific fields
export interface Employee extends MasterRecord {
  mobile: string;
  address: string;
  aadhaar: string;
}

// Department specific fields
export interface Department extends MasterRecord {
  head: string;
  location: string;
}

// Designation specific fields
export interface Designation extends MasterRecord {
  department: string;
}

// User specific fields
export interface User extends MasterRecord {
  role: string;
  lastLogin: string;
}

// OLT IP specific fields
export interface OltIp extends MasterRecord {}

// Network Provider specific fields
export interface NetworkProvider {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

// Inventory Product
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: 'Nos' | 'Mtr'; 
  gst: number; // Percentage (e.g., 18)
  image: string; 
}

// --- SHARED CUSTOMER INTERFACE ---
export interface Customer {
  id: string;
  landline: string; // Unique Identifier
  landlineNo?: string; // Alternative field name
  name: string;
  mobileNo: string;
  altMobileNo: string;
  vlanId: string;
  bbId: string;
  voipPassword: string;
  
  // Dynamic Master Record Links
  ontMake: string; 
  ontType: string;
  ontMacAddress: string;
  ontBillNo: string;
  
  // ONT Status Logic
  ont: 'Paid ONT' | 'Free ONT' | 'Offer Price' | 'Rented ONT';
  offerPrize: string; // Only if 'Offer Price' is selected
  
  routerMake: string;
  routerMacId: string;
  oltIp: string; // Dropdown from Master Records
  
  installationDate: string;
  
  // Status Logic Update
  status: 'Active' | 'Inactive' | 'Suspended' | 'Expired'; 
  planStatus?: string; // e.g., "Plan Active", "Plan Expired"
  ottSubscription?: string; // New Field
  
  source: 'BSNL' | 'RMAX' | 'Private';
  email?: string;
  plan?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  renewalDate?: string;
}

export interface Lead {
  id: string;
  customerName: string;
  phoneNo: string;
  address: string;
  remarks: string;
  followupDate: string;
  status: 'Success' | 'Rejected' | 'Sale' | 'Pending';
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== DASHBOARD ANALYTICS TYPES ====================
export interface DashboardMetrics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  suspendedCustomers: number;
  suspendedCount?: number;
  expiredCustomers: number;
  expiredToday?: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  pendingInvoices?: number;
  leadsThisMonth: number;
  conversionRate: number;
  avgRevenuePerCustomer: number;
  renewalDueCount: number;
  newCustomersThisMonth: number;
  newToday?: number;
  todayCollection?: number;
  unresolvedComplaints?: number;
  avgResponseTime?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  customers: number;
  payments: number;
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
  startDate: Date;
  endDate: Date;
  label: string;
}

// ==================== NOTIFICATION TYPES ====================
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'renewal' | 'payment' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'customer' | 'payment' | 'system' | 'lead' | 'renewal';
  isRead: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  userId?: string;
  entityId?: string; // Related customer, payment, etc. ID
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  categories: {
    customer: boolean;
    payment: boolean;
    system: boolean;
    lead: boolean;
    renewal: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface NotificationSettings {
  enableRenewalAlerts: boolean;
  renewalDays: number[];
  enablePaymentAlerts: boolean;
  enableLowBalanceAlert: boolean;
  enableNewCustomerAlert: boolean;
}

// ==================== EXPORT TYPES ====================
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  filename: string;
  includeHeaders: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  columns?: string[];
}

export interface ChartExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'pdf';
  filename: string;
  quality: number;
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  includeHeaders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  columns?: string[];
}

export interface ExportJob {
  id: string;
  type: 'table' | 'chart' | 'dashboard';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

// ==================== AUTH TYPES ====================
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  permissions: Permission[];
  avatar?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==================== FILTER TYPES ====================
export interface DateFilter {
  type: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'thisYear' | 'custom';
  startDate?: Date;
  endDate?: Date;
  label: string;
}

export interface TableFilters {
  search?: string;
  status?: string;
  source?: string;
  plan?: string;
  dateRange?: DateFilter;
  customFilters?: Record<string, any>;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// ==================== ANALYTICS TYPES ====================
export interface AnalyticsData {
  metrics: DashboardMetrics;
  revenueData: RevenueData[];
  paymentModeDistribution: PaymentModeDistribution[];
  customerGrowthData: CustomerGrowthData[];
  planDistribution: PlanDistribution[];
  topCustomers: Customer[];
  renewalTrends: RenewalTrend[];
  conversionData: ConversionData;
}

export interface RenewalTrend {
  month: string;
  renewals: number;
  expectedRenewals: number;
  actualRenewals: number;
  revenue: number;
}

export interface ConversionData {
  leads: number;
  prospects: number;
  customers: number;
  conversionRate: number;
  averageTimeToConvert: number;
}

// ==================== UTILITY TYPES ====================
export type DataSource = 'BSNL' | 'RMAX' | 'Private' | 'All';
export type Page = 'dashboard' | 'customers' | 'complaints' | 'leads' | 'payment' | 'master-records' | 'reports' | 'inventory' | 'network-providers';
export type UserRole = 'Super Admin' | 'Sales' | 'Maintenance';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// ==================== STATE MANAGEMENT TYPES ====================
export interface DashboardState {
  metrics: DashboardMetrics | null;
  filters: TableFilters;
  dateRange: DateFilter;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;
}

export interface ExportState {
  jobs: ExportJob[];
  isExporting: boolean;
  error: string | null;
  currentJob: ExportJob | null;
}