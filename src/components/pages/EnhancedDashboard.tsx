import { useState, useEffect } from 'react';
import { StatCard } from '../StatCard';
import { ChartPanel } from '../ChartPanel';
import { StatisticsPanel, StatItem } from '../StatisticsPanel';
import { motion } from 'framer-motion';
import { DashboardService } from '../../services/dashboardService';
import type { DataSource } from '../../types';
// Import Header, WalletCard and Icons
import { WalletCard } from '../WalletCard';
import { Calendar, RefreshCw } from 'lucide-react';
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

// Color Palette
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']; 
const LINE_COLOR_1 = '#818cf8'; 
const AREA_COLOR_1 = '#818cf8';
const BAR_COLOR_1 = '#60a5fa'; 
const BAR_COLOR_2 = '#34d399'; 
const BAR_COLOR_3 = '#fbbf24'; 

export function EnhancedDashboard({ dataSource, theme }: DashboardProps) {
  const isDark = theme === 'dark';
  
  // --- 1. LOCAL STATE (No Context required) ---
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Chart Filter State
  const [timeRange, setTimeRange] = useState<string>('week');

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [panelStats, setPanelStats] = useState<any>({ customers: [], expiry: [], finance: [], complaints: [] });
  const [pieData, setPieData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]); // Mapped to RenewalData for now or specific endpoint
  const [areaData, setAreaData] = useState<any[]>([]); // Registrations
  const [expiredChartData, setExpiredChartData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [renewalData, setRenewalData] = useState<any[]>([]);

  // --- 2. DATA FETCHING FUNCTION ---
  const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch data from Service using selectedDate, timeRange, and dataSource
        const data = await DashboardService.generateChartData(selectedDate, timeRange, dataSource);
        
        // Update Stats
        setStats(data.customerStats);

        // Update Panels
        setPanelStats({
            customers: [
                { label: 'Total Customers', value: data.customerStats.total },
                { label: 'Active Now', value: data.customerStats.active },
                { label: 'New (Selected Day)', value: data.registrationsData[0]?.value || 0 }, // Simplified for daily view
                { label: 'Expiring Soon', value: data.customerStats.expired, textColor: 'text-orange-500' },
            ],
            expiry: [
                { label: 'Total Expired', value: data.customerStats.expired },
                { label: 'Suspended', value: data.customerStats.suspended },
                { label: 'Renewal Pending', value: data.financeData.pendingInvoices },
                { label: 'Disabled', value: data.customerStats.disabled, textColor: 'text-red-400' },
            ],
            finance: [
                { label: "Today's Collection", value: `₹${data.financeData.todayCollected}` },
                { label: 'Pending Invoices', value: data.financeData.pendingInvoices },
                { label: 'Monthly Revenue', value: `₹${(data.financeData.monthlyRevenue / 1000).toFixed(1)}k`, isHighlight: true },
                { label: 'Est. Pending Value', value: `₹${(data.financeData.totalPendingValue / 1000).toFixed(1)}k`, textColor: 'text-red-500' },
            ],
            complaints: [
                { label: 'Open Issues', value: data.complaintsData.find((c: any) => c.name === 'Open')?.value || 0, textColor: 'text-red-500' },
                { label: 'Resolved', value: data.complaintsData.find((c: any) => c.name === 'Resolved')?.value || 0, textColor: 'text-green-500' },
                { label: 'Pending', value: data.complaintsData.find((c: any) => c.name === 'Pending')?.value || 0, textColor: 'text-yellow-500' },
                { label: 'Efficiency', value: '98%' },
            ]
        });

        // Update Charts
        setPieData(data.complaintsData);
        setAreaData(data.registrationsData.map((item: any) => ({ name: item.name, uv: item.value, pv: 0, amt: 0 })));
        setExpiredChartData(data.expiredData.map((item: any) => ({ name: item.name, value: item.value })));
        setInvoiceData(data.invoicePaymentsData);
        setRenewalData(data.renewalsData.map((item: any) => ({ name: item.name, uv: item.value, pv: 0, amt: 0 })));

      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
  };

  // --- 3. EFFECTS ---
  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, timeRange, dataSource]); // Re-fetch on any change

  // --- 4. HANDLERS ---
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const handleMenuClick = () => {}; 
  const handleSearch = (q: string) => console.log(q);
  const handleThemeToggle = () => {}; 

  // --- 5. RENDER ---
  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-t-cyan-500 border-slate-700 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const strokeColor = isDark ? '#334155' : '#e2e8f0';
  const isComplaintsEmpty = !pieData || pieData.every(item => item.value === 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-10"
    >
     

      {/* CUSTOM TOP SECTION (DATE PICKER + WALLET) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 -mt-4 px-1">
        
        {/* LEFT: Overview & Standard Date Input */}
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Overview
                </span>
            </div>

            {/* DATE PICKER (Standard Clickable Input - No Overlay Tricks) */}
            <div className={`flex items-center px-4 py-2 rounded-xl border transition-all ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
                <Calendar className={`w-4 h-4 mr-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value))}
                    className={`bg-transparent border-none text-sm font-bold outline-none cursor-pointer ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                />
            </div>
        </div>

        {/* RIGHT: Wallet Card */}
        <div className="w-full md:w-auto min-w-[250px]">
             <WalletCard theme={theme} />
        </div>
      </div>


      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="TOTAL CUSTOMERS" value={stats.total} color="text-blue-400" theme={theme} details={[{ label: 'New', value: '+' + panelStats.customers[2].value }]} />
        <StatCard title="ACTIVE" value={stats.active} color="text-cyan-400" theme={theme} details={[{ label: 'Rate', value: stats.total > 0 ? ((stats.active/stats.total)*100).toFixed(0)+'%' : '0%' }]} />
        <StatCard title="EXPIRED" value={stats.expired} color="text-yellow-400" theme={theme} details={[{ label: 'Pending', value: stats.expired }]} />
        <StatCard title="SUSPENDED" value={stats.suspended} color="text-red-500" theme={theme} />
        <StatCard title="DISABLED" value={stats.disabled} color="text-slate-500" theme={theme} />
      </div>

      {/* PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <StatisticsPanel title="Customers" theme={theme} items={panelStats.customers} />
        <StatisticsPanel title="Expiry Alerts" theme={theme} items={panelStats.expiry} />
        <StatisticsPanel title="Finance" theme={theme} items={panelStats.finance} />
        <StatisticsPanel title="Complaints" theme={theme} items={panelStats.complaints} />
      </div>

      {/* CHARTS (Filtered) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ChartPanel title="Payment Modes" theme={theme} timeRange={timeRange} onTimeRangeChange={setTimeRange}>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={invoiceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="online" name="Online" fill={BAR_COLOR_1} stackId="a" barSize={30} />
                    <Bar dataKey="offline" name="Offline" fill={BAR_COLOR_2} stackId="a" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartPanel>
        </div>
        
        <ChartPanel title="Complaints" theme={theme} timeRange={timeRange} onTimeRangeChange={setTimeRange}>
          {isComplaintsEmpty ? (
             <div className="flex flex-col items-center justify-center h-[250px] text-gray-400">
                <p className="text-sm">No complaints data</p>
             </div>
          ) : (
             <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
             </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartPanel title="Renewals Trend" theme={theme} timeRange={timeRange} onTimeRangeChange={setTimeRange}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={renewalData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
              <Line type="monotone" dataKey="uv" stroke={LINE_COLOR_1} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Registrations" theme={theme} timeRange={timeRange} onTimeRangeChange={setTimeRange}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AREA_COLOR_1} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={AREA_COLOR_1} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
              <Area type="monotone" dataKey="uv" stroke={AREA_COLOR_1} fillOpacity={1} fill="url(#colorUv)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Expired Overview" theme={theme} timeRange={timeRange} onTimeRangeChange={setTimeRange}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={expiredChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
              <Bar dataKey="value" name="Expired" fill={BAR_COLOR_3} radius={[4, 4, 0, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </motion.div>
  );
}