import React, { useState, useEffect } from 'react';
import {
  FileText, Download,
  Loader2, CheckCircle, AlertCircle,
  Users, DollarSign, TrendingUp, MessageSquare,
  Package, UserCheck, LucideIcon, BarChart
} from 'lucide-react';
import { ReportService } from '../../services/reportService';
import { toast } from 'sonner';

// Firebase Imports
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { DataSource, UserRole } from '../../types';

interface ReportsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
  userRole: UserRole; // ✅ Role Prop
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  theme: 'light' | 'dark';
  loading?: boolean;
}

interface ReportCardProps {
  title: string;
  description: string;
  action: () => void;
  loading: boolean;
  icon: LucideIcon;
  accentColor: string;
  theme: 'light' | 'dark';
}

export function Reports({ dataSource, theme, userRole }: ReportsProps) {
  const isDark = theme === 'dark';
  
  // Stats State
  const [stats, setStats] = useState({ cust: 0, leads: 0, comp: 0, pay: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  // --- FETCH REAL-TIME STATS ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        // 1. Total Customers
        const custRef = collection(db, 'customers');
        const custQ = dataSource === 'All' ? query(custRef) : query(custRef, where('source', '==', dataSource));
        const custSnap = await getDocs(custQ);

        // 2. Active Leads
        const leadsRef = collection(db, 'leads');
        let leadsQ = query(leadsRef, where('status', 'in', ['New', 'Pending', 'Follow-up']));
        if (dataSource !== 'All') leadsQ = query(leadsRef, where('source', '==', dataSource), where('status', 'in', ['New', 'Pending', 'Follow-up']));
        const leadsSnap = await getDocs(leadsQ);

        // 3. Open Complaints
        const compRef = collection(db, 'complaints');
        let compQ = query(compRef, where('status', 'in', ['Open', 'Pending', 'Not Resolved']));
        if (dataSource !== 'All') compQ = query(compRef, where('source', '==', dataSource), where('status', 'in', ['Open', 'Pending', 'Not Resolved']));
        const compSnap = await getDocs(compQ);

        // 4. Pending Payment
        const payRef = collection(db, 'payments');
        let payQ = query(payRef, where('status', '==', 'Unpaid'));
        if (dataSource !== 'All') payQ = query(payRef, where('source', '==', dataSource), where('status', '==', 'Unpaid'));
        const paySnap = await getDocs(payQ);

        setStats({
          cust: custSnap.size,
          leads: leadsSnap.size,
          comp: compSnap.size,
          pay: paySnap.size
        });
      } catch (e) { console.error(e); } finally { setStatsLoading(false); }
    };
    fetchStats();
  }, [dataSource]);

  const handleGenerate = async (id: string, name: string, fn: () => Promise<any>) => {
    setLoadingReport(id);
    const res = await fn();
    setLoadingReport(null);
    if (res.success) toast.success(`${name} Downloaded`);
    else toast.error(res.message || "Failed");
  };

  const canAccess = (roles: UserRole[]) => roles.includes(userRole);

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      <div className="mb-8">
        <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Reports Center ({dataSource})
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Role: <span className="font-bold text-blue-500 uppercase">{userRole}</span> • Real-time insights.
        </p>
      </div>

      {/* QUICK STATS - Dynamic based on Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Customers" value={stats.cust} icon={Users} color="bg-blue-500 text-blue-500" theme={theme} loading={statsLoading} />
        
        {canAccess(['Super Admin', 'Maintenance']) && (
            <StatCard label="Open Complaints" value={stats.comp} icon={AlertCircle} color="bg-red-500 text-red-500" theme={theme} loading={statsLoading} />
        )}
        
        {canAccess(['Super Admin', 'Sales']) && (
            <StatCard label="Active Leads" value={stats.leads} icon={TrendingUp} color="bg-green-500 text-green-500" theme={theme} loading={statsLoading} />
        )}

        {canAccess(['Super Admin', 'Sales']) && (
            <StatCard label="Unpaid Invoices" value={stats.pay} icon={DollarSign} color="bg-yellow-500 text-yellow-500" theme={theme} loading={statsLoading} />
        )}
      </div>

      {/* REPORTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 1. CUSTOMER LIST (Everyone) */}
        <ReportCard 
            title={`${dataSource} Customer List`} 
            description="Active customer list with contact details."
            icon={Users} accentColor="bg-blue-500" theme={theme} loading={loadingReport === 'cust'}
            action={() => handleGenerate('cust', 'Customer List', () => ReportService.generateCustomerReport(dataSource))}
        />

        {/* 2. OPEN COMPLAINTS (Admin & Maintenance) */}
        {canAccess(['Super Admin', 'Maintenance']) && (
            <ReportCard 
                title="Open Complaints List" 
                description={`Pending issues list for ${dataSource}.`}
                icon={MessageSquare} accentColor="bg-orange-500" theme={theme} loading={loadingReport === 'comp'}
                action={() => handleGenerate('comp', 'Complaints Report', () => ReportService.generateComplaintsReport(dataSource))}
            />
        )}

        {/* 3. DAILY COLLECTION (Admin Only) */}
        {canAccess(['Super Admin']) && (
            <ReportCard 
                title="Daily Collection Report" 
                description={`Today's payments received for ${dataSource}.`}
                icon={DollarSign} accentColor="bg-green-500" theme={theme} loading={loadingReport === 'daily'}
                action={() => handleGenerate('daily', 'Daily Collection', () => ReportService.generateDailyCollection(dataSource))}
            />
        )}

        {/* 4. UNPAID INVOICES (Admin & Sales) */}
        {canAccess(['Super Admin', 'Sales']) && (
            <ReportCard 
                title="Unpaid Invoices" 
                description="Customers with pending payments."
                icon={AlertCircle} accentColor="bg-red-500" theme={theme} loading={loadingReport === 'unpaid'}
                action={() => handleGenerate('unpaid', 'Unpaid Report', () => ReportService.generateUnpaidReport(dataSource))}
            />
        )}

        {/* 5. PLAN ANALYSIS (Admin & Sales) */}
        {canAccess(['Super Admin', 'Sales']) && (
            <ReportCard 
                title="Plan Popularity" 
                description="Most sold internet plans analysis."
                icon={BarChart} accentColor="bg-purple-500" theme={theme} loading={loadingReport === 'plan'}
                action={() => handleGenerate('plan', 'Plan Analysis', () => ReportService.generatePlanReport(dataSource))}
            />
        )}

        {/* 6. LEADS ANALYSIS (Admin & Sales) */}
        {canAccess(['Super Admin', 'Sales']) && (
            <ReportCard 
                title="Leads Conversion Report" 
                description="Track lead status (New, Converted, Lost)."
                icon={TrendingUp} accentColor="bg-teal-500" theme={theme} loading={loadingReport === 'leads'}
                action={() => handleGenerate('leads', 'Leads Report', () => ReportService.generateLeadsReport(dataSource))}
            />
        )}

        {/* 7. EMPLOYEE PERFORMANCE (Admin & Maintenance) - GLOBAL */}
        {canAccess(['Super Admin', 'Maintenance']) && dataSource === 'All' && (
            <ReportCard 
                title="Employee Performance" 
                description="Complaints resolved by technicians."
                icon={UserCheck} accentColor="bg-indigo-500" theme={theme} loading={loadingReport === 'emp'}
                action={() => handleGenerate('emp', 'Employee Report', () => ReportService.generateEmployeeReport())}
            />
        )}

        {/* 8. LOW STOCK (Admin & Maintenance) - GLOBAL */}
        {canAccess(['Super Admin', 'Maintenance']) && dataSource === 'All' && (
            <ReportCard 
                title="Low Stock Alert" 
                description="Inventory items below 10 qty."
                icon={Package} accentColor="bg-rose-500" theme={theme} loading={loadingReport === 'stock'}
                action={() => handleGenerate('stock', 'Stock Alert', () => ReportService.generateLowStockReport())}
            />
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, theme, loading }) => {
    const isDark = theme === 'dark';
    return (
      <div className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm ${
        isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-3 rounded-lg bg-opacity-20 ${color}`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : value}
          </p>
        </div>
      </div>
    );
};

const ReportCard: React.FC<ReportCardProps> = ({ title, description, action, loading, icon: Icon, accentColor, theme }) => {
    const isDark = theme === 'dark';
    return (
      <div className={`relative overflow-hidden rounded-xl border p-6 flex flex-col h-full transition-all hover:shadow-lg ${
        isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${accentColor}`} />
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#1a1f2c] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <Icon className={`h-6 w-6 ${accentColor.replace('bg-', 'text-')}`} />
            </div>
        </div>
        <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm mb-6 flex-grow ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
        
        <button onClick={action} disabled={loading} className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            loading ? 'bg-gray-500 cursor-not-allowed text-white' : `bg-gradient-to-r from-blue-600 to-blue-500 hover:to-blue-400 text-white shadow-md`
        }`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    );
};