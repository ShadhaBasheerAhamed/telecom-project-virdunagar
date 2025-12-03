import React, { useState } from 'react';
import {
  FileText, Download, Play, Calendar as CalendarIcon,
  Search, Loader2, CheckCircle, AlertCircle,
  Users, DollarSign, TrendingUp, MessageSquare,
  BarChart3, PieChart, Activity, Clock,
  LucideIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DataSource } from '../../types';

// --- Types & Interfaces ---

interface ReportsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

interface ReportMessage {
  type: 'success' | 'error';
  text: string;
}

type LoadingState = Record<string, boolean>;
type MessageState = Record<string, ReportMessage | null>;

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  theme: 'light' | 'dark';
}

interface ReportCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  action: () => void;
  reportId: string;
  icon: LucideIcon;
  accentColor: string;
  theme: 'light' | 'dark';
}

interface ScheduledReport {
  name: string;
  freq: string;
  status: 'Active' | 'Paused';
  last: string;
  next: string;
}

export function Reports({ dataSource, theme }: ReportsProps) {
  const isDark = theme === 'dark';
  
  // State for inputs
  const [bsnlLandline, setBsnlLandline] = useState<string>('');
  const [rmaxCustomerId, setRmaxCustomerId] = useState<string>('');
  const [leadStatus, setLeadStatus] = useState<string>('Success');
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  
  // State for loading/success messages per report card
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  const [messageState, setMessageState] = useState<MessageState>({});

  // Helper to handle report generation simulation
  const generateReport = (reportId: string, reportName: string, requiredInput: string | null = null) => {
    if (requiredInput !== null && !requiredInput) {
      setMessageState((prev) => ({ ...prev, [reportId]: { type: 'error', text: 'Input required!' } }));
      return;
    }

    setMessageState((prev) => ({ ...prev, [reportId]: null }));
    setLoadingState((prev) => ({ ...prev, [reportId]: true }));

    setTimeout(() => {
      setLoadingState((prev) => ({ ...prev, [reportId]: false }));
      setMessageState((prev) => ({ 
        ...prev, 
        [reportId]: { type: 'success', text: 'Generated!' } 
      }));

      setTimeout(() => {
        setMessageState((prev) => ({ ...prev, [reportId]: null }));
      }, 3000);
    }, 1500);
  };

  // --- COMPONENT: STAT CARD ---
  const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, theme }) => {
    const isDark = theme === 'dark';
    return (
      <div className={`p-3 sm:p-4 rounded-xl border flex items-center gap-3 sm:gap-4 shadow-lg transition-all duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-[#242a38] to-[#1f2533] border-gray-700/50 hover:border-gray-600'
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300'
      }`}>
        <div className={`p-2 sm:p-3 rounded-lg bg-opacity-20 flex-shrink-0 ${color}`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {label}
          </p>
          <p className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
      </div>
    );
  };

  // --- COMPONENT: REPORT CARD ---
  const ReportCard: React.FC<ReportCardProps> = ({
    title,
    description,
    children,
    action,
    reportId,
    icon: Icon,
    accentColor,
    theme
  }) => {
    const isDark = theme === 'dark';
    return (
      <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-2xl sm:hover:-translate-y-1 flex flex-col h-full ${
        isDark
          ? 'bg-[#242a38] border-gray-700/50 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        {/* Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-1 ${accentColor}`} />
        
        <div className="p-4 sm:p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`p-2 rounded-lg border group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ${
              isDark
                ? 'bg-[#1a1f2c] border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${accentColor.replace('bg-', 'text-')}`} />
            </div>
            {loadingState[reportId] && <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />}
          </div>

          <h3 className={`text-base sm:text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          <p className={`text-xs sm:text-sm mb-4 sm:mb-6 flex-grow leading-relaxed ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {description}
          </p>
          
          {/* Input Area */}
          <div className="mb-3 sm:mb-4">
            {children}
          </div>

          {/* Footer / Action */}
          <div className={`mt-auto pt-3 sm:pt-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            {messageState[reportId] ? (
               <div className={`flex items-center justify-center gap-2 text-xs sm:text-sm font-medium py-2 rounded-md animate-in fade-in slide-in-from-bottom-2 ${
                 messageState[reportId]?.type === 'error'
                   ? isDark ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-100'
                   : isDark ? 'text-green-400 bg-green-900/20' : 'text-green-600 bg-green-100'
               }`}>
                 {messageState[reportId]?.type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                 {messageState[reportId]?.text}
               </div>
            ) : (
              <button
                onClick={action}
                disabled={loadingState[reportId]}
                className={`w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  loadingState[reportId]
                    ? isDark ? 'bg-gray-600 cursor-wait text-gray-300' : 'bg-gray-300 cursor-wait text-gray-500'
                    : isDark
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 text-white'
                }`}
              >
                {loadingState[reportId] ? 'Generating...' : 'Generate Report'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Data for Scheduled Reports Table ---
  const scheduledReports: ScheduledReport[] = [
    { name: 'Monthly Revenue Report', freq: 'Monthly', status: 'Active', last: '2024-11-01', next: '2024-12-01' },
    { name: 'User Growth Analysis', freq: 'Weekly', status: 'Active', last: '2024-11-05', next: '2024-11-12' },
    { name: 'Complaint Resolution', freq: 'Daily', status: 'Paused', last: '2024-11-07', next: '—' },
  ];

  return (
    <div className={`w-full p-3 sm:p-4 md:p-6 min-h-screen font-sans ${
      isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3 md:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Reports Center
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Generate insights, track revenue, and monitor system health.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto whitespace-nowrap",
              isDark
                ? 'bg-[#242a38] hover:bg-[#2d3546] text-gray-300 border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
              !dateRange && "text-muted-foreground"
            )}>
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {dateRange ? format(dateRange, "PPP") : "Pick a date"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-10">
        <StatCard label="Total Reports" value="1,284" icon={FileText} color="bg-blue-500 text-blue-500" theme={theme} />
        <StatCard label="Generated Today" value="12" icon={Activity} color="bg-green-500 text-green-500" theme={theme} />
        <StatCard label="Scheduled Jobs" value="8" icon={Clock} color="bg-purple-500 text-purple-500" theme={theme} />
        <StatCard label="Pending Issues" value="3" icon={AlertCircle} color="bg-red-500 text-red-500" theme={theme} />
      </div>

      {/* SECTION 1: Customer Intelligence */}
      <div className="mb-6 md:mb-10">
        <h2 className={`text-base sm:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 ${
          isDark ? 'text-gray-300' : 'text-gray-800'
        }`}>
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" /> Customer Intelligence
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ReportCard 
            title="BSNL Customer Details" 
            description="Retrieve detailed service history and billing info for BSNL landline subscribers."
            reportId="bsnl_cust"
            icon={FileText}
            accentColor="bg-blue-500"
            theme={theme}
            action={() => generateReport('bsnl_cust', 'BSNL Report', bsnlLandline)}
          >
            <input 
              type="text" 
              value={bsnlLandline}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBsnlLandline(e.target.value)}
              placeholder="Enter Landline Number..."
              className={`w-full border text-sm rounded-lg p-2.5 focus:ring-1 focus:outline-none transition-all ${
                isDark 
                  ? 'bg-[#1a1f2c] border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          </ReportCard>

          <ReportCard 
            title="Rmax Customer Details" 
            description="Access profile, usage logs, and plan details for Rmax fiber customers."
            reportId="rmax_cust"
            icon={FileText}
            accentColor="bg-purple-500"
            theme={theme}
            action={() => generateReport('rmax_cust', 'Rmax Report', rmaxCustomerId)}
          >
            <input 
              type="text" 
              value={rmaxCustomerId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRmaxCustomerId(e.target.value)}
              placeholder="Enter Customer ID..."
              className={`w-full border text-sm rounded-lg p-2.5 focus:ring-1 focus:outline-none transition-all ${
                isDark 
                  ? 'bg-[#1a1f2c] border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500'
              }`}
            />
          </ReportCard>
        </div>
      </div>

      {/* SECTION 2: Sales & Leads */}
      <div className="mb-6 md:mb-10">
        <h2 className={`text-base sm:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 ${
          isDark ? 'text-gray-300' : 'text-gray-800'
        }`}>
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" /> Sales & Growth
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ReportCard 
            title="Leads Analysis" 
            description="Analyze lead conversion rates filtered by their current pipeline status."
            reportId="leads"
            icon={PieChart}
            accentColor="bg-green-500"
            theme={theme}
            action={() => generateReport('leads', 'Leads Report')}
          >
            <select 
              value={leadStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLeadStatus(e.target.value)}
              className={`w-full border text-sm rounded-lg p-2.5 focus:ring-1 focus:outline-none appearance-none ${
                isDark 
                  ? 'bg-[#1a1f2c] border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500'
              }`}
            >
              <option value="Success">Success (Converted)</option>
              <option value="Pending">Pending Action</option>
              <option value="Failed">Lost / Failed</option>
              <option value="All">All Leads</option>
            </select>
          </ReportCard>

          <ReportCard 
            title="Today's Acquisitions" 
            description="Instant snapshot of all new customer acquisitions and leads generated today."
            reportId="today_leads"
            icon={BarChart3}
            accentColor="bg-teal-500"
            theme={theme}
            action={() => generateReport('today_leads', 'Today\'s Leads')}
          >
             <div className={`text-xs italic pt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
               Auto-generates for current date: {new Date().toLocaleDateString()}
             </div>
          </ReportCard>
        </div>
      </div>

      {/* SECTION 3: Revenue Recovery */}
      <div className="mb-6 md:mb-10">
        <h2 className={`text-base sm:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 ${
          isDark ? 'text-gray-300' : 'text-gray-800'
        }`}>
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" /> Revenue Recovery
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ReportCard 
            title="Unpaid BSNL Accounts" 
            description="List all BSNL customers with overdue invoices exceeding 30 days."
            reportId="unpaid_bsnl"
            icon={AlertCircle}
            accentColor="bg-red-500"
            theme={theme}
            action={() => generateReport('unpaid_bsnl', 'Unpaid BSNL Report')}
          >
            <div className={`w-full border rounded-md p-2 text-xs ${
              isDark 
                ? 'bg-red-900/10 border-red-900/30 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              Priority: High - Collections Team
            </div>
          </ReportCard>

          <ReportCard 
            title="Unpaid Rmax Accounts" 
            description="List all Rmax customers with payment defaults or failed auto-debits."
            reportId="unpaid_rmax"
            icon={AlertCircle}
            accentColor="bg-orange-500"
            theme={theme}
            action={() => generateReport('unpaid_rmax', 'Unpaid Rmax Report')}
          >
            <div className={`w-full border rounded-md p-2 text-xs ${
              isDark 
                ? 'bg-orange-900/10 border-orange-900/30 text-orange-400' 
                : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              Priority: Medium - Billing Team
            </div>
          </ReportCard>
        </div>
      </div>

      {/* SECTION 4: Support & Complaints */}
      <div className="mb-6 md:mb-10">
        <h2 className={`text-base sm:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 ${
          isDark ? 'text-gray-300' : 'text-gray-800'
        }`}>
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" /> Support Operations
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ReportCard 
            title="BSNL Open Complaints" 
            description="Daily digest of unchecked and pending technical complaints for BSNL."
            reportId="complaints_bsnl"
            icon={MessageSquare}
            accentColor="bg-yellow-500"
            theme={theme}
            action={() => generateReport('complaints_bsnl', 'BSNL Complaints')}
          />

          <ReportCard 
            title="Rmax Open Complaints" 
            description="Daily digest of unchecked and pending technical complaints for Rmax."
            reportId="complaints_rmax"
            icon={MessageSquare}
            accentColor="bg-yellow-500"
            theme={theme}
            action={() => generateReport('complaints_rmax', 'Rmax Complaints')}
          />
        </div>
      </div>

      {/* SCHEDULED REPORTS TABLE */}
      <div className="mt-8 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" /> Scheduled Automations
          </h2>
          <button className="text-xs sm:text-sm text-blue-400 hover:text-blue-300">View All Schedule</button>
        </div>
        
        <div className={`w-full overflow-hidden rounded-xl border shadow-xl ${
          isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'
        }`}>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className={`font-semibold uppercase tracking-wider text-xs ${
                isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-100 text-gray-700'
              }`}>
                <tr>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 border-b whitespace-nowrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    Report Name
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 border-b whitespace-nowrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    Frequency
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 border-b whitespace-nowrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    Status
                  </th>
                  <th className={`hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 border-b whitespace-nowrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    Last Run
                  </th>
                  <th className={`hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 border-b whitespace-nowrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    Next Run
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 border-b text-right whitespace-nowrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {scheduledReports.map((row, idx) => (
                  <tr key={idx} className={`transition-colors group ${
                    isDark ? 'hover:bg-[#2d3546]' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-colors ${
                          isDark ? 'text-gray-500 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'
                        }`} />
                        <span className="truncate max-w-[150px] sm:max-w-none">{row.name}</span>
                      </div>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {row.freq}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                        row.status === 'Active'
                          ? isDark
                            ? 'bg-green-900/20 text-green-400 border-green-900/50'
                            : 'bg-green-100 text-green-700 border-green-200'
                          : isDark
                            ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className={`hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {row.last}
                    </td>
                    <td className={`hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {row.next}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button className={`p-1 sm:p-1.5 rounded-md transition-colors ${
                          isDark
                            ? 'hover:bg-blue-900/30 text-blue-400'
                            : 'hover:bg-blue-100 text-blue-600'
                        }`} title="Download">
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button className={`p-1 sm:p-1.5 rounded-md transition-colors ${
                          isDark
                            ? 'hover:bg-green-900/30 text-green-400'
                            : 'hover:bg-green-100 text-green-600'
                        }`} title="Run Now">
                          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
