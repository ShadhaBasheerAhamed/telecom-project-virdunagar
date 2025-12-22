import { useState, useEffect } from 'react';
import { StatCard } from '../StatCard';
import { ChartPanel } from '../ChartPanel';
import { StatisticsPanel } from '../StatisticsPanel';
import { motion } from 'framer-motion';
import { DashboardService } from '../../services/dashboardService';
import { CustomerService } from '../../services/customerService'; 
import type { DataSource, Customer } from '../../types';
import { WalletCard } from '../WalletCard';
import { Calendar, Loader2, Search, Phone, Activity, MapPin, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useSearch } from '../../contexts/SearchContext';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
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
  
  // --- Global Search Context ---
  const { searchQuery } = useSearch();
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- Dashboard State ---
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<string>('week'); 

  // --- Data State ---
  const [stats, setStats] = useState<any>(null);
  const [panelStats, setPanelStats] = useState<any>({ customers: [], expiry: [], finance: [], complaints: [] });
  
  // [Command] State for Live Finance Metrics (Collection, Commission, Pending)
  const [financeRealtime, setFinanceRealtime] = useState({ collected: 0, commission: 0, pending: 0 });

  // Charts Data
  const [pieData, setPieData] = useState<any[]>([]);
  const [areaData, setAreaData] = useState<any[]>([]); 
  const [expiredChartData, setExpiredChartData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [renewalData, setRenewalData] = useState<any[]>([]);

  // --- Drill Down State ---
  const [detailView, setDetailView] = useState<{ title: string, items: Customer[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ---------------------------------------------------------
  // 1. FETCH DASHBOARD DATA
  // ---------------------------------------------------------
  const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // [Command] Fetch General Chart Data
        const data = await DashboardService.generateChartData(selectedDate, timeRange, dataSource);
        
        // [Command] Fetch LIVE Finance Stats (New Logic integration)
        const financeData = await DashboardService.getFinanceStats(dataSource, selectedDate);
        
        // [Command] Update Local State with Live Finance Data
        setFinanceRealtime({
            collected: financeData.todayCollected,
            commission: financeData.todayCommission,
            pending: financeData.pendingInvoices
        });

        setStats(data.customerStats);
        
        // [Command] Map data to UI Panels
        setPanelStats({
            customers: [
                { label: 'Total Customers', value: data.customerStats.total, type: 'total' },
                { label: 'Active Now', value: data.customerStats.active, type: 'active' },
                { label: 'New (Selected Day)', value: data.registrationsData[0]?.value || 0, type: 'new' }, 
                { label: 'Expiring Soon', value: data.customerStats.expired, textColor: 'text-orange-500', type: 'expiring' },
            ],
            expiry: [
                { label: 'Total Expired', value: data.customerStats.expired, type: 'expired_total' },
                { label: 'Suspended', value: data.customerStats.suspended, type: 'suspended' },
                // [Command] Use Live Pending Invoices here
                { label: 'Renewal Pending', value: financeData.pendingInvoices, type: 'pending_renewal' },
                { label: 'Disabled', value: data.customerStats.disabled, textColor: 'text-red-400', type: 'disabled' },
            ],
            finance: [
                // [Command] Use Live Collected Value
                { label: "Today's Collection", value: `₹${financeData.todayCollected.toLocaleString()}`, type: 'collection_today', isHighlight: true },
                // [Command] Use Live Commission Value
                { label: "Today's Commission", value: `₹${financeData.todayCommission.toLocaleString()}`, type: 'commission_today', textColor: 'text-green-500' },
                // [Command] Use Live Pending Invoices
                { label: 'Pending Invoices', value: financeData.pendingInvoices, type: 'pending_invoices', textColor: 'text-red-500' },
                { label: 'Monthly Revenue', value: `₹${(data.financeData.monthlyRevenue / 1000).toFixed(1)}k`, type: 'revenue_month' },
            ],
            complaints: [
                { label: 'Open Issues', value: data.complaintsData.find((c: any) => c.name === 'Open')?.value || 0, textColor: 'text-red-500', type: 'complaint_open' },
                { label: 'Resolved', value: data.complaintsData.find((c: any) => c.name === 'Resolved')?.value || 0, textColor: 'text-green-500', type: 'complaint_resolved' },
                { label: 'Pending', value: data.complaintsData.find((c: any) => c.name === 'Pending')?.value || 0, textColor: 'text-yellow-500', type: 'complaint_pending' },
                { label: 'Efficiency', value: '98%', type: 'efficiency' },
            ]
        });

        // Set Chart Data
        setPieData(data.complaintsData);
        setAreaData(data.registrationsData.map((item: any) => ({ name: item.name, uv: item.value })));
        setExpiredChartData(data.expiredData.map((item: any) => ({ name: item.name, value: item.value })));
        setInvoiceData(data.invoicePaymentsData);
        setRenewalData(data.renewalsData.map((item: any) => ({ name: item.name, uv: item.value })));

      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, timeRange, dataSource]);

  // ---------------------------------------------------------
  // 2. GLOBAL SEARCH LOGIC
  // ---------------------------------------------------------
  useEffect(() => {
    const performSearch = async () => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const allCustomers = await CustomerService.getCustomers();
            const query = searchQuery.toLowerCase();
            
            const results = allCustomers.filter(c => 
                c.name.toLowerCase().includes(query) || 
                c.mobileNo.includes(query) ||
                (c.landline && c.landline.includes(query)) ||
                (c.id && c.id.toLowerCase().includes(query))
            );
            
            const filteredBySource = dataSource === 'All' 
                ? results 
                : results.filter(c => c.source === dataSource);

            setSearchResults(filteredBySource);
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsSearching(false);
        }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, dataSource]);

  // ---------------------------------------------------------
  // 3. HANDLE STAT CLICK
  // ---------------------------------------------------------
  const handleStatClick = async (type: string | undefined, label: string) => {
      if (!type) return;
      
      setDetailLoading(true);
      setDetailView({ title: label, items: [] });
      
      try {
          const allCustomers = await CustomerService.getCustomers();
          let filtered = allCustomers;

          if (dataSource !== 'All') {
              filtered = filtered.filter(c => c.source === dataSource);
          }

          const today = new Date().toISOString().split('T')[0];

          switch(type) {
              case 'total': break; 
              case 'active': filtered = filtered.filter(c => c.status === 'Active'); break;
              case 'expiring': 
                  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
                  filtered = filtered.filter(c => c.renewalDate && c.renewalDate >= today && c.renewalDate <= nextWeek.toISOString().split('T')[0]);
                  break;
              case 'expired_total': filtered = filtered.filter(c => c.status === 'Expired'); break;
              case 'suspended': filtered = filtered.filter(c => c.status === 'Suspended'); break;
              case 'disabled': filtered = filtered.filter(c => c.status === 'Inactive'); break;
              case 'pending_renewal': filtered = filtered.filter(c => c.renewalDate && c.renewalDate < today); break;
              case 'new': 
                   filtered = filtered.filter(c => c.createdAt && c.createdAt.startsWith(today)); 
                   break;
              default: 
                  toast.info("Detailed view not available for this metric yet.");
                  setDetailView(null);
                  setDetailLoading(false);
                  return; 
          }
          
          setDetailView({ title: label, items: filtered });
      } catch (error) {
          console.error(error);
          toast.error("Failed to load details");
      } finally {
          setDetailLoading(false);
      }
  };

  // --- RENDER ---
  if (searchQuery) {
      // (Keep existing Search View Render)
      return (
        <div className="p-4 min-h-screen">
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Search className="w-5 h-5 text-blue-500" />
                Search Results for "{searchQuery}"
            </h2>
            
            {isSearching ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : searchResults.length === 0 ? (
                <div className={`text-center py-10 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-gray-200 bg-white text-gray-500'}`}>
                    No customers found matching "{searchQuery}" in {dataSource}.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((customer) => (
                        <div key={customer.id} className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-800'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{customer.name}</h3>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {customer.status}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm opacity-80">
                                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {customer.mobileNo}</div>
                                <div className="flex items-center gap-2"><Activity className="w-3 h-3" /> {customer.plan}</div>
                                <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {customer.oltIp || 'N/A'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      );
  }

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
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 -mt-4 px-1">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Overview
                </span>
            </div>
            
            {/* Date Picker (Controls data fetched) */}
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
            
            {/* Refresh Button */}
            <button 
                onClick={fetchDashboardData}
                className={`p-2 rounded-full hover:bg-opacity-20 transition-all ${isDark ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
                title="Refresh Data"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
        
        {/* [Command] Wallet Card showing LIVE Collection from 'financeRealtime' state */}
        <div className="w-full md:w-auto min-w-[250px]">
             <WalletCard theme={theme} amount={financeRealtime.collected} />
        </div>
      </div>

      {/* STAT CARDS (Keep existing StatCard rendering) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="TOTAL CUSTOMERS" value={stats.total} color="text-blue-400" theme={theme} details={[{ label: 'New', value: '+' + panelStats.customers[2].value }]} onClick={() => handleStatClick('total', 'Total Customers')} />
        <StatCard title="ACTIVE" value={stats.active} color="text-cyan-400" theme={theme} details={[{ label: 'Rate', value: stats.total > 0 ? ((stats.active/stats.total)*100).toFixed(0)+'%' : '0%' }]} onClick={() => handleStatClick('active', 'Active Customers')} />
        <StatCard title="EXPIRED" value={stats.expired} color="text-yellow-400" theme={theme} details={[{ label: 'Pending', value: stats.expired }]} onClick={() => handleStatClick('expired_total', 'Expired Customers')} />
        <StatCard title="SUSPENDED" value={stats.suspended} color="text-red-500" theme={theme} onClick={() => handleStatClick('suspended', 'Suspended Customers')} />
        <StatCard title="DISABLED" value={stats.disabled} color="text-slate-500" theme={theme} onClick={() => handleStatClick('disabled', 'Disabled Customers')} />
      </div>

      {/* PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <StatisticsPanel title="Customers" theme={theme} items={panelStats.customers} onItemClick={(item) => handleStatClick(item.type, item.label)} />
        <StatisticsPanel title="Expiry Alerts" theme={theme} items={panelStats.expiry} onItemClick={(item) => handleStatClick(item.type, item.label)} />
        
        {/* [Command] Updated Finance Panel with Real-time Data */}
        <StatisticsPanel title="Finance" theme={theme} items={panelStats.finance} onItemClick={(item) => handleStatClick(item.type, item.label)} />
        
        <StatisticsPanel title="Complaints" theme={theme} items={panelStats.complaints} onItemClick={(item) => handleStatClick(item.type, item.label)} />
      </div>

      {/* CHARTS GRID (Keep existing charts) */}
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

      {/* DETAIL VIEW MODAL (Same as before) */}
      {detailView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className={`w-full max-w-6xl h-[85vh] rounded-2xl border flex flex-col shadow-2xl ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'}`}>
                  
                  <div className="flex items-center justify-between p-6 border-b border-inherit">
                      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{detailView.title} List</h2>
                      <button onClick={() => setDetailView(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6" /></button>
                  </div>

                  <div className="flex-1 overflow-auto p-0">
                      {detailLoading ? (
                          <div className="flex justify-center items-center h-full"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
                      ) : detailView.items.length === 0 ? (
                          <div className="flex justify-center items-center h-full text-gray-500">No records found for this category.</div>
                      ) : (
                          <table className="w-full text-left text-sm">
                              <thead className={`sticky top-0 z-10 uppercase font-bold text-xs ${isDark ? 'bg-[#0f172a] text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
                                  <tr>
                                      <th className="px-6 py-4">Name</th>
                                      <th className="px-6 py-4">Landline</th>
                                      <th className="px-6 py-4">Mobile</th>
                                      <th className="px-6 py-4">Plan</th>
                                      <th className="px-6 py-4">Renewal Date</th>
                                      <th className="px-6 py-4">Status</th>
                                  </tr>
                              </thead>
                              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                                  {detailView.items.map((c) => (
                                      <tr key={c.id} className={`hover:bg-black/5 transition-colors ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                          <td className="px-6 py-4 font-medium">{c.name}</td>
                                          <td className="px-6 py-4">{c.landline}</td>
                                          <td className="px-6 py-4">{c.mobileNo}</td>
                                          <td className="px-6 py-4">{c.plan}</td>
                                          <td className="px-6 py-4">{c.renewalDate}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                  c.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                                  c.status === 'Expired' ? 'bg-yellow-100 text-yellow-700' : 
                                                  'bg-red-100 text-red-700'
                                              }`}>
                                                  {c.status}
                                              </span>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}
                  </div>
              </div>
          </div>
      )}

    </motion.div>
  );
}