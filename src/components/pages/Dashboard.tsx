import { useState, useEffect } from 'react';
import { StatCard } from '../StatCard';
import { ChartPanel } from '../ChartPanel';
import { StatisticsPanel, StatItem } from '../StatisticsPanel';
import { motion } from 'framer-motion';
import { DashboardDataService } from '../../services/dashboardDataService';
import type { DataSource } from '../../App';
import { SubHeader } from '../SubHeader'; 

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Interfaces
interface ChartData { name: string; value: number; }
interface PaymentChartData { name: string; online: number; offline: number; direct: number; }
interface TimeSeriesData { name: string; uv: number; pv: number; amt: number; }
interface DashboardStats { total: number; active: number; expired: number; suspended: number; disabled: number; }
interface DashboardProps { dataSource: DataSource; theme: 'light' | 'dark'; }

// Interface for the 4 Panels Data
interface PanelStats {
  customers: StatItem[];
  expiry: StatItem[];
  finance: StatItem[];
  complaints: StatItem[];
}

// Refined Colors for Dark Mode Pop
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; 
const LINE_COLOR_1 = '#818cf8'; 
const AREA_COLOR_1 = '#818cf8';
const BAR_COLOR_1 = '#60a5fa'; // Online
const BAR_COLOR_2 = '#34d399'; // Offline
const BAR_COLOR_3 = '#fbbf24'; // Direct

export function Dashboard({ dataSource, theme }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Dynamic State for the 4 Statistics Panels
  const [panelStats, setPanelStats] = useState<PanelStats>({
    customers: [],
    expiry: [],
    finance: [],
    complaints: []
  });

  // Chart Data States
  const [pieData, setPieData] = useState<ChartData[]>([]);
  const [renewalData, setRenewalData] = useState<TimeSeriesData[]>([]);
  const [areaData, setAreaData] = useState<TimeSeriesData[]>([]);
  const [expiredChartData, setExpiredChartData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<PaymentChartData[]>([]);
  
  // Filter State
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');
  
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await DashboardDataService.generateChartData();
        
        // 1. Fetch Main Stats
        const exactStats = {
          total: 179, active: 112, expired: 67, suspended: 0, disabled: 0
        };
        setStats(exactStats);

        // 2. Fetch Panel Data (Simulating Real-Time Data Fetch)
        // In a real app, these would come from your API response
        setPanelStats({
            customers: [
                { label: 'New (This Month)', value: '7' },
                { label: 'Registered Today', value: '0' },
                { label: 'Registered Yest.', value: '4' },
                { label: 'Expiring Soon', value: '45', textColor: 'text-orange-500' },
            ],
            expiry: [
                { label: 'Expires Tomorrow', value: '0' },
                { label: 'Expires in 7 days', value: '54' },
                { label: 'Expires prev 7 days', value: '0' },
                { label: 'Expires in this month', value: '12', textColor: 'text-red-400' },
            ],
            finance: [
                { label: "Today's Collected", value: '542' },
                { label: 'Online Payment', value: '776' },
                { label: 'Monthly Revenue', value: '5.4L', isHighlight: true },
                { label: 'Total Pending', value: '24k', textColor: 'text-red-500' },
            ],
            complaints: [
                { label: 'Open', value: '0', textColor: 'text-blue-500' },
                { label: 'Progress', value: '0', textColor: 'text-yellow-500' },
                { label: 'Resolved', value: '0', textColor: 'text-green-500' },
                { label: 'Closed', value: '0' },
            ]
        });

        setPieData(data.complaintsData);
        
        // 3. Chart Mock Data 
        const areaData = data.registrationsData.map(item => ({
          name: item.day, uv: item.value, pv: 0, amt: 0
        }));
        
        const expiredMock = [
          { name: 'Yesterday', value: 12 },
          { name: 'Today', value: 5 },
          { name: 'Tomorrow', value: 8 },
        ];

        const invoiceMock = data.renewalsData.map(item => ({
          name: item.day,
          online: Math.floor(Math.random() * 12) + 2,
          offline: Math.floor(Math.random() * 8) + 1,
          direct: Math.floor(Math.random() * 6),
        }));
        
        setAreaData(areaData);
        setExpiredChartData(expiredMock);
        setInvoiceData(invoiceMock);

      } catch (error) {
        console.error(error);
        setStats({ total: 0, active: 0, expired: 0, suspended: 0, disabled: 0 });
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dataSource]);

  // --- FILTERING LOGIC (Charts) ---
  useEffect(() => {
    let newData: TimeSeriesData[] = [];

    if (timeFilter === 'today') {
      // Hourly data
      newData = [
        { name: '8:00', uv: 2, pv: 0, amt: 0 },
        { name: '10:00', uv: 5, pv: 0, amt: 0 },
        { name: '12:00', uv: 12, pv: 0, amt: 0 },
        { name: '14:00', uv: 8, pv: 0, amt: 0 },
        { name: '16:00', uv: 15, pv: 0, amt: 0 },
        { name: '18:00', uv: 10, pv: 0, amt: 0 },
      ];
    } else if (timeFilter === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      newData = days.map(day => ({
        name: day, uv: Math.floor(Math.random() * 20) + 10, pv: 0, amt: 0
      }));
    } else if (timeFilter === 'month') {
      newData = [
        { name: '1st', uv: 40, pv: 0, amt: 0 },
        { name: '5th', uv: 65, pv: 0, amt: 0 },
        { name: '10th', uv: 45, pv: 0, amt: 0 },
        { name: '15th', uv: 80, pv: 0, amt: 0 },
        { name: '20th', uv: 55, pv: 0, amt: 0 },
        { name: '25th', uv: 90, pv: 0, amt: 0 },
        { name: '30th', uv: 70, pv: 0, amt: 0 },
      ];
    } else if (timeFilter === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      newData = months.map(month => ({
        name: month, uv: Math.floor(Math.random() * 500) + 100, pv: 0, amt: 0
      }));
    }
    setRenewalData(newData);
  }, [timeFilter]);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-t-cyan-500 border-slate-700 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const strokeColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-5 pb-10"
    >
      <SubHeader theme={theme} />

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="TOTAL" value={stats.total} color="text-blue-400" theme={theme} details={[{ label: 'This Week', value: 23 }]} />
        <StatCard title="ACTIVE" value={stats.active} color="text-cyan-400" theme={theme} details={[{ label: 'Online', value: 98 }]} />
        <StatCard title="EXPIRED" value={stats.expired} color="text-yellow-400" theme={theme} details={[{ label: 'Pending', value: 12 }]} />
        <StatCard title="SUSPENDED" value={stats.suspended} color="text-red-500" theme={theme} />
        <StatCard title="DISABLED" value={stats.disabled} color="text-slate-500" theme={theme} />
      </div>

      {/* 2. Text Stats - 4 Columns with REFRESH ENABLED */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        
        <StatisticsPanel
          title="Customers"
          theme={theme}
          showRefresh={true} // Enabled
          items={panelStats.customers} // Data from State
        />
        
        <StatisticsPanel
          title="Expiry Alerts"
          theme={theme}
          showRefresh={true} // Enabled
          items={panelStats.expiry} // Data from State
        />

        <StatisticsPanel
          title="Finance"
          theme={theme}
          showRefresh={true} // Enabled
          items={panelStats.finance} // Data from State
        />

        <StatisticsPanel
          title="Complaints"
          theme={theme}
          showRefresh={true} // Enabled
          items={panelStats.complaints} // Data from State
        />
      </div>

      {/* 3. Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
            <ChartPanel title="Payment Modes (Online vs Offline vs Direct)" theme={theme}>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={invoiceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="online" name="Online" fill={BAR_COLOR_1} stackId="a" barSize={30} />
                <Bar dataKey="offline" name="Offline" fill={BAR_COLOR_2} stackId="a" barSize={30} />
                <Bar dataKey="direct" name="Direct" fill={BAR_COLOR_3} stackId="a" radius={[4,4,0,0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
            </ChartPanel>
        </div>
        
        <ChartPanel title="Complaints Distribution" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* 4. Charts - Row 2 (Renewals Filter + Other Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Renewals Trend with ALL Filters */}
        <ChartPanel title="Renewals Trend" theme={theme}>
           <div className="flex justify-end gap-1 mb-2">
             {['today', 'week', 'month', 'year'].map((f) => (
               <button
                 key={f}
                 onClick={() => setTimeFilter(f as any)}
                 className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded transition-all ${
                    timeFilter === f 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-500 bg-slate-800/50 hover:bg-slate-700'
                 }`}
               >
                 {f}
               </button>
             ))}
           </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={renewalData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '8px', border: 'none' }} />
              <Line type="monotone" dataKey="uv" name="Recharges" stroke={LINE_COLOR_1} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Registration Area */}
        <ChartPanel title="Registrations" theme={theme}>
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

        {/* Expired Bar */}
        <ChartPanel title="Expired Overview" theme={theme}>
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