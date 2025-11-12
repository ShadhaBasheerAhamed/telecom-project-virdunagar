import { FileText, Download, Calendar, Play } from 'lucide-react';
import type { DataSource } from '../../App';

interface ReportsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

const scheduledReports = [
  { id: 1, name: 'Monthly Revenue Report', type: 'Revenue', lastRun: '2024-11-01', nextRun: '2024-12-01' },
  { id: 2, name: 'User Growth Analysis', type: 'Users', lastRun: '2024-11-05', nextRun: '2024-12-05' },
  { id: 3, name: 'Complaint Resolution Report', type: 'Complaints', lastRun: '2024-11-07', nextRun: '2024-12-07' },
];

export function Reports({ dataSource, theme }: ReportsProps) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Reports
      </h1>

      {/* Generate Reports Section */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <h2 className={`text-xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Generate New Report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Report Type */}
          <div>
            <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Report Type
            </label>
            <select
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#0F172A] border-[#334155] text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            >
              <option>Revenue Report</option>
              <option>User Growth Report</option>
              <option>Complaint Resolution Report</option>
              <option>Payment Transaction Report</option>
              <option>Lead Conversion Report</option>
            </select>
          </div>

          {/* Source */}
          <div>
            <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Source
            </label>
            <select
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#0F172A] border-[#334155] text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            >
              <option>All</option>
              <option>BSNL</option>
              <option>RMAX</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Date Range
            </label>
            <select
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#0F172A] border-[#334155] text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>Custom Range</option>
            </select>
          </div>
        </div>

        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            isDark
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          Generate Report
        </button>
      </div>

      {/* Scheduled Reports Section */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <h2 className={`text-xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Scheduled Reports
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Report Name
                </th>
                <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Type
                </th>
                <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Last Run
                </th>
                <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Next Run
                </th>
                <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {scheduledReports.map((report) => (
                <tr key={report.id} className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                  <td className={`py-4 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {report.name}
                  </td>
                  <td className={`py-4 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {report.type}
                  </td>
                  <td className={`py-4 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {report.lastRun}
                    </div>
                  </td>
                  <td className={`py-4 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {report.nextRun}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/10 text-cyan-400'
                            : 'hover:bg-gray-100 text-cyan-600'
                        }`}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/10 text-green-400'
                            : 'hover:bg-gray-100 text-green-600'
                        }`}
                        title="Run Now"
                      >
                        <Play className="w-4 h-4" />
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
  );
}
