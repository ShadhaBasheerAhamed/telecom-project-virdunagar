import { useState, useEffect } from 'react';
import { StatCard } from '../StatCard';
import { ChartPanel } from '../ChartPanel';
import { StatisticsPanel } from '../StatisticsPanel';
import { motion } from 'framer-motion';
import { DashboardDataService } from '../../services/dashboardDataService';

// Chart imports
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  dataSource: string;
  theme: 'light' | 'dark';
}

interface CustomerStats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  disabled: number;
}

interface FinanceData {
  pendingInvoices: number;
  todayCollected: number;
  yesterdayCollected: number;
  renewedToday: number;
  renewedYesterday: number | string;
  renewedThisMonth: number | string;
}

interface ChartData {
  day?: string;
  hour?: string;
  month?: string;
  value?: number;
  amount?: number;
  users?: number;
  online?: number;
  offline?: number;
  name?: string;
}

interface DashboardState {
  customerStats: CustomerStats | null;
  registrationsData: ChartData[];
  renewalsData: ChartData[];
  expiredData: ChartData[];
  complaintsData: ChartData[];
  onlineUsersData: ChartData[];
  invoicePaymentsData: ChartData[];
  onlinePaymentsData: ChartData[];
  financeData: FinanceData | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Dashboard({ dataSource, theme }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardState>({
    customerStats: {
      total: 179,
      active: 112,
      expired: 67,
      suspended: 0,
      disabled: 0
    },
    registrationsData: [],
    renewalsData: [],
    expiredData: [],
    complaintsData: [],
    onlineUsersData: [],
    invoicePaymentsData: [],
    onlinePaymentsData: [],
    financeData: {
      pendingInvoices: 96,
      todayCollected: 542,
      yesterdayCollected: 1500,
      renewedToday: 5,
      renewedYesterday: 1203,
      renewedThisMonth: 50000
    }
  });

  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    loadDashboardData();
  }, [dataSource]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await DashboardDataService.generateChartData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use dashboardData.customerStats or fallback values
  const stats = dashboardData.customerStats || {
    total: 179,
    active: 112,
    expired: 67,
    suspended: 0,
    disabled: 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="TOTAL"
          value={stats.total}
          color="text-blue-400"
          details={[
            { label: 'Today', value: 5 },
            { label: 'This Week', value: 23 },
            { label: 'This Month', value: 89 },
          ]}
        />
        <StatCard
          title="ACTIVE"
          value={stats.active}
          color="text-cyan-400"
          details={[
            { label: 'Premium', value: 67 },
            { label: 'Standard', value: 45 },
          ]}
        />
        <StatCard
          title="ONLINE"
          value="104"
          color="text-green-400"
          details={[
            { label: 'Peak Hours', value: 120 },
            { label: 'Off-Peak', value: 50 },
          ]}
        />
        <StatCard
          title="EXPIRED"
          value={stats.expired}
          color="text-yellow-400"
          details={[
            { label: 'Last 7 Days', value: 12 },
            { label: 'Last 30 Days', value: stats.expired },
          ]}
        />
        <StatCard title="SUSPENDED" value={stats.suspended} color="text-red-500" />
        <StatCard title="DISABLED" value={stats.disabled} color="text-slate-500" />
      </div>

      {/* Statistics Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticsPanel
          title="Customer Statistics"
          items={[
            { label: 'New Customers', value: 7 },
            { label: 'FDP Crossed Users', value: 1 },
            { label: 'Registered Today', value: 0 },
            { label: 'Registered Yesterday', value: 4 },
            { label: 'Registered This Month', value: 5 },
            { label: 'Registered Last Month', value: 6 },
          ]}
        />
        
        <StatisticsPanel
          title="Customer Statistics"
          showRefresh={true}
          items={[
            { label: 'Tomorrow Expired', value: 0 },
            { label: 'Expiring in next 7 days', value: 54 },
            { label: 'Expiring prev 7 days', value: 0 },
            { label: 'Net Verified Customers', value: 1 },
          ]}
        />
        
        <StatisticsPanel
          title="Finance Statistics"
          items={[
            { label: 'Pending Invoices', value: dashboardData.financeData?.pendingInvoices || 96 },
            { label: "Today's Collected", value: dashboardData.financeData?.todayCollected || '542' },
            { label: 'Yesterday Collected', value: dashboardData.financeData?.yesterdayCollected || '1,500' },
            { label: 'Renewed Today', value: dashboardData.financeData?.renewedToday || 5 },
            { label: 'Renewed Yesterday', value: dashboardData.financeData?.renewedYesterday || '1,203' },
            { label: 'Renewed This Month', value: dashboardData.financeData?.renewedThisMonth || '50,000' },
          ]}
        />
        
        <StatisticsPanel
          title="Complaint Statistics"
          items={[
            { label: 'Open', value: dashboardData.complaintsData[0]?.value || 0 },
            { label: 'Reopened', value: dashboardData.complaintsData[1]?.value || 0 },
            { label: 'Progress', value: dashboardData.complaintsData[2]?.value || 0 },
            { label: 'Resolved', value: dashboardData.complaintsData[3]?.value || 0 },
            { label: 'Closed', value: dashboardData.complaintsData[4]?.value || 0 },
            { label: 'Mine', value: 0 },
          ]}
        />
      </div>

      {/* Charts Grid - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Registrations - Line Chart */}
        <ChartPanel title="Registrations">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dashboardData.registrationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e5e7eb"} />
              <XAxis dataKey="day" stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <YAxis stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#000000'
                }} 
              />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        
        {/* Renewals - Bar Chart */}
        <ChartPanel title="Renewals">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardData.renewalsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e5e7eb"} />
              <XAxis dataKey="day" stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <YAxis stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#000000'
                }} 
              />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        
        {/* Expired - Bar Chart */}
        <ChartPanel title="Expired">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardData.expiredData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e5e7eb"} />
              <XAxis dataKey="day" stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <YAxis stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#000000'
                }} 
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Charts Grid - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Complaints - Doughnut Chart */}
        <ChartPanel title="Complaints">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dashboardData.complaintsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {dashboardData.complaintsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#000000'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {dashboardData.complaintsData.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{item.name}</span>
              </div>
            ))}
          </div>
        </ChartPanel>
        
        {/* Online Users - Area Chart (spanning 2 columns) */}
        <ChartPanel title="Online Users" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dashboardData.onlineUsersData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e5e7eb"} />
              <XAxis dataKey="hour" stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <YAxis stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#000000'
                }} 
              />
              <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Charts Grid - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invoice Payments - Bar Chart */}
        <ChartPanel title="Invoice Payments">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.invoicePaymentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e5e7eb"} />
              <XAxis dataKey="month" stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <YAxis stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#000000'
                }} 
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        
        {/* Online Payments - Stacked Bar Chart */}
        <ChartPanel title="Online Payments">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.onlinePaymentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e5e7eb"} />
              <XAxis dataKey="month" stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <YAxis stroke={isDark ? "#94a3b8" : "#6b7280"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#000000'
                }} 
              />
              <Legend 
                wrapperStyle={{ color: isDark ? '#cbd5e1' : '#000000' }}
                iconType="rect"
              />
              <Bar dataKey="online" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
              <Bar dataKey="offline" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </motion.div>
  );
}
