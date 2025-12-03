import { useState, useEffect, useRef } from 'react';
import { StatCard } from '../StatCard';
import { ChartPanel } from '../ChartPanel';
import { StatisticsPanel, StatItem } from '../StatisticsPanel';
import { motion } from 'framer-motion';
import { DashboardService } from '../../services/dashboardService';
import { ComplaintsService } from '../../services/complaintsService';
import { exportService } from '../../services/enhancedExportService';
import { EnhancedStatusToggler } from '../../utils/enhancedStatusTogglers';
import { useDashboard, useDashboardMetrics, useQuickMetrics } from '../../contexts/DashboardContext';
import { useNotificationActions } from '../../contexts/NotificationContext';
import type { DataSource } from '../../types';
import { SubHeader } from '../SubHeader'; 
import { Download, RefreshCw, Filter, Calendar, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import {
  ResponsiveContainer,
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface DashboardProps { 
  dataSource: DataSource; 
  theme: 'light' | 'dark'; 
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']; 
const LINE_COLOR_1 = '#818cf8'; 
const AREA_COLOR_1 = '#818cf8';
const BAR_COLOR_1 = '#60a5fa'; 
const BAR_COLOR_2 = '#34d399'; 
const BAR_COLOR_3 = '#fbbf24'; 

export function EnhancedDashboard({ dataSource, theme }: DashboardProps) {
  const isDark = theme === 'dark';
  
  // State Management
  const [chartRefs, setChartRefs] = useState<{ [key: string]: HTMLElement | null }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedChartFilters, setSelectedChartFilters] = useState<{
    [key: string]: 'today' | 'week' | 'month' | 'year';
  }>({});
  
  // Custom hooks
  const { metrics, dateRange, setDateRange, refreshData } = useDashboard();
  const { metrics: dashboardMetrics, isLoading } = useDashboardMetrics();
  const { getTodaysMetrics, getMonthlyMetrics } = useQuickMetrics();
  const { notifySystemAlert } = useNotificationActions();

  // Enhanced Chart Data States
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
  const [customerGrowthData, setCustomerGrowthData] = useState<any[]>([]);
  const [planDistributionData, setPlanDistributionData] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<any[]>([]);

  // Initialize chart references
  const chartContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Helper function to set chart ref
  const setChartRef = (key: string) => (el: HTMLDivElement | null) => {
    chartContainerRefs.current[key] = el;
  };

  // Real-time data fetching
  const fetchEnhancedDashboardData = async () => {
    try {
      setIsRefreshing(true);
      
      // Fetch all dashboard data concurrently
      const [
        revenueAnalytics,
        paymentAnalytics,
        growthAnalytics,
        planAnalytics
      ] = await Promise.all([
        DashboardService.getRevenueData(dateRange),
        DashboardService.getPaymentModeDistribution(dateRange),
        DashboardService.getCustomerGrowthData(dateRange),
        DashboardService.getPlanDistribution(dateRange)
      ]);

      // Fetch complaints data separately since it doesn't take dateRange parameter
      const complaintsAnalytics = await ComplaintsService.getComplaints();

      // Update state with real data
      setRevenueData(revenueAnalytics);
      setPaymentModeData(paymentAnalytics);
      setCustomerGrowthData(growthAnalytics);
      setPlanDistributionData(planAnalytics);
      setComplaintsData(complaintsAnalytics);

    } catch (error) {
      console.error('Enhanced Dashboard Fetch Error:', error);
      toast.error('Failed to load dashboard data');
      notifySystemAlert('Dashboard Error', 'Failed to load dashboard data', 'high');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    fetchEnhancedDashboardData();
  }, [dateRange, dataSource]);

  // Handle date range changes
  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'year') => {
    const dateFilters: any = {
      today: getDateFilter('today'),
      week: getDateFilter('thisWeek'),
      month: getDateFilter('thisMonth'),
      year: getDateFilter('thisYear')
    };
    
    setDateRange(dateFilters[range]);
  };

  // Refresh all data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshData(),
        fetchEnhancedDashboardData()
      ]);
      toast.success('Dashboard data refreshed');
      notifySystemAlert('Dashboard Refreshed', 'All dashboard data has been updated', 'low');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Chart export functions
  const exportChart = async (chartType: string, format: 'csv' | 'pdf' | 'image') => {
    setIsExporting(true);
    try {
      const chartData = getChartData(chartType);
      const filename = `dashboard-${chartType}-${new Date().toISOString().split('T')[0]}`;
      
      switch (format) {
        case 'csv':
          exportService.exportFormattedData(
            chartData,
            filename,
            'csv',
            { dateFields: ['date'], title: `${chartType} Data` }
          );
          break;
        case 'pdf':
          await exportService.exportToPDF(chartData, filename, {
            format: 'pdf',
            filename,
            title: `${chartType} Report`,
            dataType: 'chart'
          });
          break;
        case 'image':
          const chartElement = chartContainerRefs.current[chartType];
          if (chartElement) {
            await exportService.exportChartAsImage(chartElement, filename, 'png');
          }
          break;
      }
      
      toast.success(`${chartType} exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export chart');
    } finally {
      setIsExporting(false);
    }
  };

  // Get chart data based on type
  const getChartData = (chartType: string) => {
    switch (chartType) {
      case 'revenue':
        return revenueData;
      case 'payment-modes':
        return paymentModeData;
      case 'customer-growth':
        return customerGrowthData;
      case 'plan-distribution':
        return planDistributionData;
      case 'complaints':
        return complaintsData;
      default:
        return [];
    }
  };

  // Enhanced Statistics Panels
  const renderEnhancedStatistics = () => {
    if (!metrics) return null;

    return {
      customers: [
        { 
          label: 'Total Customers', 
          value: metrics.totalCustomers || 0,
          trend: (metrics.totalCustomers || 0) > 0 ? '+12%' : '0%',
          trendUp: true 
        },
        { 
          label: 'Active Now', 
          value: metrics.activeCustomers || 0,
          trend: (((metrics.activeCustomers || 0) / (metrics.totalCustomers || 1)) * 100).toFixed(1) + '%',
          trendUp: true,
          textColor: 'text-green-400' 
        },
        { 
          label: 'New (Last 7 Days)', 
          value: metrics.newToday || 0,
          trend: (metrics.newToday || 0) > 0 ? '+' + (metrics.newToday || 0) : '0',
          trendUp: (metrics.newToday || 0) > 0,
          textColor: 'text-blue-400' 
        },
        { 
          label: 'Expiring Soon', 
          value: metrics.renewalDueCount,
          trend: metrics.renewalDueCount > 10 ? 'High' : 'Normal',
          trendUp: false,
          textColor: 'text-orange-500' 
        },
      ],
      expiry: [
        { label: 'Total Expired', value: metrics.expiredToday || 0 },
        { label: 'Suspended', value: metrics.suspendedCount || 0 },
        { label: 'Renewal Pending', value: metrics.pendingInvoices || 0 },
        { label: 'Disabled', value: 0, textColor: 'text-red-400' },
      ],
      finance: [
        { 
          label: "Today's Collection", 
          value: `₹${(metrics.todayCollection || 0).toLocaleString()}`,
          trend: (metrics.todayCollection || 0) > 0 ? '+' + (((metrics.todayCollection || 0) / (metrics.monthlyRevenue || 1)) * 100).toFixed(1) + '%' : '0%',
          trendUp: (metrics.todayCollection || 0) > 0 
        },
        { label: 'Pending Invoices', value: metrics.pendingInvoices || 0 },
        {
          label: 'Monthly Revenue',
          value: `₹${((metrics.monthlyRevenue || 0) / 1000).toFixed(1)}k`,
          isHighlight: true,
          trend: (metrics.monthlyRevenue || 0) > 0 ? '+' + (((metrics.monthlyRevenue || 0) / (metrics.totalRevenue || 1)) * 100).toFixed(1) + '%' : '0%',
          trendUp: true
        },
        {
          label: 'Est. Pending Value',
          value: `₹${(Number(metrics.pendingInvoices || 0) * 500).toLocaleString()}`,
          textColor: 'text-red-500'
        },
      ],
      complaints: [
        { label: 'Open Issues', value: metrics.unresolvedComplaints || 0, textColor: 'text-red-500' },
        { label: 'Resolved', value: Math.max(0, 100 - (metrics.unresolvedComplaints || 0)), textColor: 'text-green-500' },
        { label: 'Pending', value: Math.floor((metrics.unresolvedComplaints || 0) * 0.6), textColor: 'text-yellow-500' },
        { label: 'Avg Response Time', value: `${metrics.avgResponseTime || 0}h` },
      ]
    };
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-cyan-500 border-slate-700 rounded-full animate-spin"></div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const strokeColor = isDark ? '#334155' : '#e2e8f0';
  const stats = renderEnhancedStatistics();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-10"
    >
      <SubHeader theme={theme} />

      {/* Enhanced Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dashboard Analytics
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Real-time insights and metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => handleDateRangeChange(range as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  dateRange.label.toLowerCase().includes(range)
                    ? 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Action Buttons */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="TOTAL" 
          value={metrics.totalCustomers || 0} 
          color="text-blue-400" 
          theme={theme}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="ACTIVE" 
          value={metrics.activeCustomers || 0} 
          color="text-green-400" 
          theme={theme}
          trend={`${(((metrics.activeCustomers || 0) / (metrics.totalCustomers || 1)) * 100).toFixed(1)}%`}
          trendUp={true}
        />
        <StatCard 
          title="EXPIRED" 
          value={metrics.expiredToday || 0} 
          color="text-yellow-400" 
          theme={theme}
        />
        <StatCard 
          title="SUSPENDED" 
          value={metrics.suspendedCount || 0} 
          color="text-red-500" 
          theme={theme}
        />
        <StatCard 
          title="RENEWAL DUE" 
          value={metrics.renewalDueCount || 0} 
          color="text-orange-400" 
          theme={theme}
        />
      </div>

      {/* Enhanced Statistics Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsPanel 
          title="Customers" 
          theme={theme} 
          items={stats.customers}
          onExport={() => exportChart('customer-metrics', 'pdf')}
        />
        <StatisticsPanel 
          title="Expiry Alerts" 
          theme={theme} 
          items={stats.expiry}
          onExport={() => exportChart('expiry-metrics', 'pdf')}
        />
        <StatisticsPanel 
          title="Finance" 
          theme={theme} 
          items={stats.finance}
          onExport={() => exportChart('finance-metrics', 'pdf')}
        />
        <StatisticsPanel 
          title="Complaints" 
          theme={theme} 
          items={stats.complaints}
          onExport={() => exportChart('complaints-metrics', 'pdf')}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartPanel 
            title="Revenue Analytics" 
            theme={theme}
            exportOptions={[
              { label: 'Export CSV', onClick: () => exportChart('revenue', 'csv') },
              { label: 'Export PDF', onClick: () => exportChart('revenue', 'pdf') },
              { label: 'Export Image', onClick: () => exportChart('revenue', 'image') }
            ]}
          >
            <div ref={setChartRef('revenue')}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AREA_COLOR_1} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={AREA_COLOR_1} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={AREA_COLOR_1} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>
        </div>
        
        <ChartPanel 
          title="Payment Modes" 
          theme={theme}
          exportOptions={[
            { label: 'Export CSV', onClick: () => exportChart('payment-modes', 'csv') },
            { label: 'Export PDF', onClick: () => exportChart('payment-modes', 'pdf') }
          ]}
        >
          <div ref={setChartRef('payment-modes')}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentModeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="amount"
                  stroke="none"
                >
                  {paymentModeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartPanel 
          title="Customer Growth" 
          theme={theme}
          exportOptions={[
            { label: 'Export CSV', onClick: () => exportChart('customer-growth', 'csv') },
            { label: 'Export PDF', onClick: () => exportChart('customer-growth', 'pdf') }
          ]}
        >
          <div ref={setChartRef('customer-growth')}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
                <Line type="monotone" dataKey="newCustomers" stroke={LINE_COLOR_1} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="activeCustomers" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel 
          title="Plan Distribution" 
          theme={theme}
          exportOptions={[
            { label: 'Export CSV', onClick: () => exportChart('plan-distribution', 'csv') },
            { label: 'Export PDF', onClick: () => exportChart('plan-distribution', 'pdf') }
          ]}
        >
          <div ref={setChartRef('plan-distribution')}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={planDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                <XAxis dataKey="plan" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="customerCount" fill={BAR_COLOR_1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel 
          title="Complaints Overview" 
          theme={theme}
          exportOptions={[
            { label: 'Export CSV', onClick: () => exportChart('complaints', 'csv') },
            { label: 'Export PDF', onClick: () => exportChart('complaints', 'pdf') }
          ]}
        >
          <div ref={setChartRef('complaints')}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={complaintsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                <XAxis dataKey="category" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="count" fill={BAR_COLOR_3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>
    </motion.div>
  );
}

// Helper function for date filters
function getDateFilter(type: string): any {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  switch (type) {
    case 'today':
      return { startDate: today, endDate: now, label: 'Today' };
    case 'thisWeek':
      return { startDate: thisWeek, endDate: now, label: 'This Week' };
    case 'thisMonth':
      return { startDate: thisMonth, endDate: now, label: 'This Month' };
    case 'thisYear':
      return { startDate: thisYear, endDate: now, label: 'This Year' };
    default:
      return { startDate: thisMonth, endDate: now, label: 'This Month' };
  }
}