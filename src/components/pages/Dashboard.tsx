import { useState, useEffect } from 'react';
import { StatCard } from '../StatCard';
import { ChartPanel } from '../ChartPanel';
import { StatisticsPanel } from '../StatisticsPanel';
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
interface ChartData {
  name: string;
  value: number;
}

interface TimeSeriesData {
  name: string;
  uv: number;
  pv: number;
  amt: number;
}

interface DashboardStats {
  total: number;
  active: number;
  online: number;
  expired: number;
  suspended: number;
  disabled: number;
}

interface DashboardProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

// Chart Colors
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const LINE_COLOR_1 = '#8884d8';
const LINE_COLOR_2 = '#82ca9d';
const AREA_COLOR_1 = '#8884d8';
const BAR_COLOR_1 = '#8884d8';
const BAR_COLOR_2 = '#82ca9d';

export function Dashboard({ dataSource, theme }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pieData, setPieData] = useState<ChartData[]>([]);
  const [lineData, setLineData] = useState<TimeSeriesData[]>([]);
  const [areaData, setAreaData] = useState<TimeSeriesData[]>([]);
  const [barData, setBarData] = useState<TimeSeriesData[]>([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await DashboardDataService.generateChartData();
        
        const exactStats = {
          total: 179,
          active: 112,
          online: 104,
          expired: 67,
          suspended: 0,
          disabled: 0
        };
        
        setStats(exactStats);
        setPieData(data.complaintsData);
        
        const lineData = data.renewalsData.map(item => ({
          name: item.day,
          uv: item.value,
          pv: Math.floor(Math.random() * 10) + 1,
          amt: Math.floor(Math.random() * 20) + 1
        }));
        
        const areaData = data.registrationsData.map(item => ({
          name: item.day,
          uv: item.value,
          pv: Math.floor(Math.random() * 10) + 1,
          amt: Math.floor(Math.random() * 20) + 1
        }));
        
        const barData = data.expiredData.map(item => ({
          name: item.day,
          uv: item.value,
          pv: Math.floor(Math.random() * 10) + 1,
          amt: Math.floor(Math.random() * 20) + 1
        }));
        
        setLineData(lineData);
        setAreaData(areaData);
        setBarData(barData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setStats({ total: 179, active: 112, online: 104, expired: 67, suspended: 0, disabled: 0 });
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataSource]);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className={`w-12 h-12 border-4 border-t-cyan-500 border-gray-200 rounded-full animate-spin ${isDark ? 'border-gray-700' : 'border-gray-200'} `}></div>
      </div>
    );
  }
  
  const tickFill = isDark ? '#94a3b8' : '#334155';
  const strokeColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <SubHeader theme={theme} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="TOTAL"
          value={stats.total}
          color="text-blue-400"
          theme={theme}
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
          theme={theme}
          details={[
            { label: 'Today', value: 2 },
            { label: 'This Week', value: 15 },
            { label: 'This Month', value: 62 },
          ]}
        />
        <StatCard
          title="ONLINE"
          value={stats.online}
          color="text-green-400"
          theme={theme}
          details={[
            { label: 'BSNL', value: 60 },
            { label: 'RMAX', value: 44 },
          ]}
        />
        <StatCard
          title="EXPIRED"
          value={stats.expired}
          color="text-yellow-400"
          theme={theme}
          details={[
            { label: 'Today', value: 1 },
            { label: 'This Week', value: 8 },
            { label: 'This Month', value: 27 },
          ]}
        />
        <StatCard title="SUSPENDED" value={stats.suspended} color="text-red-500" theme={theme} />
        <StatCard title="DISABLED" value={stats.disabled} color="text-slate-500" theme={theme} />
      </div>

      {/* Statistics Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticsPanel
          title="Customer Statistics"
          theme={theme}
          items={[
            { label: 'New Customers', value: '7' },
            { label: 'FDP Crossed Users', value: '1' },
            { label: 'Registered Today', value: '0' },
            { label: 'Registered Yesterday', value: '4' },
            { label: 'Registered This Month', value: '5' },
            { label: 'Registered Last Month', value: '6' },
          ]}
        />
        <StatisticsPanel
          title="Customer Statistics (Expiry)"
          showRefresh={true}
          theme={theme}
          items={[
            { label: 'Tomorrow Expired', value: '0' },
            { label: 'Expiring in next 7 days', value: '54' },
            { label: 'Expiring prev 7 days', value: '0' },
            { label: 'Net Verified Customers', value: '1' },
          ]}
        />
        <StatisticsPanel
          title="Finance Statistics"
          theme={theme}
          items={[
            { label: 'Pending Invoices', value: '96' },
            { label: 'Today\'s Collected', value: '542' },
            { label: 'Yesterday Collected', value: '1,500' },
            { label: 'Renewed Today', value: '5' },
            { label: 'Renewed Yesterday', value: '1,203' },
            { label: 'Renewed This Month', value: '50,000' },
          ]}
        />
        <StatisticsPanel
          title="Complaint Statistics"
          theme={theme}
          items={[
            { label: 'Open', value: '0' },
            { label: 'Reopened', value: '0' },
            { label: 'Progress', value: '0' },
            { label: 'Resolved', value: '0' },
            { label: 'Closed', value: '0' },
            { label: 'Mine', value: '0' },
          ]}
        />
      </div>

      {/* Charts Grid - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartPanel title="Registrations" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="name" tick={{ fill: tickFill }} />
              <YAxis tick={{ fill: tickFill }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="uv" stackId="1" stroke={AREA_COLOR_1} fill={AREA_COLOR_1} opacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Renewals" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="name" tick={{ fill: tickFill }} />
              <YAxis tick={{ fill: tickFill }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="pv" stroke={LINE_COLOR_1} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="uv" stroke={LINE_COLOR_2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Expired" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="name" tick={{ fill: tickFill }} />
              <YAxis tick={{ fill: tickFill }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
              <Bar dataKey="pv" stackId="a" fill={BAR_COLOR_1} />
              <Bar dataKey="uv" stackId="a" fill={BAR_COLOR_2} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Charts Grid - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartPanel title="Complaints" theme={theme}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Online Users" className="lg:col-span-2" theme={theme}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="name" tick={{ fill: tickFill }} />
              <YAxis tick={{ fill: tickFill }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="uv" stroke={AREA_COLOR_1} fill={AREA_COLOR_1} opacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Charts Grid - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartPanel title="Invoice Payments" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="name" tick={{ fill: tickFill }} />
              <YAxis tick={{ fill: tickFill }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
              <Bar dataKey="pv" stackId="a" fill={BAR_COLOR_1} />
              <Bar dataKey="uv" stackId="a" fill={BAR_COLOR_2} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Online Payments" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="name" tick={{ fill: tickFill }} />
              <YAxis tick={{ fill: tickFill }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="pv" stroke={LINE_COLOR_1} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="uv" stroke={LINE_COLOR_2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </motion.div>
  );
}