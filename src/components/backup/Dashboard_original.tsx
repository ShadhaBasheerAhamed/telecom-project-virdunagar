import { TrendingUp, Users, DollarSign, UserPlus, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DataSource } from '../../App';

interface DashboardProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

const revenueData = [
  { month: 'Jan', BSNL: 45000, RMAX: 38000 },
  { month: 'Feb', BSNL: 52000, RMAX: 42000 },
  { month: 'Mar', BSNL: 48000, RMAX: 45000 },
  { month: 'Apr', BSNL: 61000, RMAX: 50000 },
  { month: 'May', BSNL: 55000, RMAX: 48000 },
  { month: 'Jun', BSNL: 67000, RMAX: 55000 },
];

const recentSubscribers = [
  { id: 1, name: 'John Doe', plan: 'Premium', date: '2024-11-10', status: 'Active', source: 'BSNL' },
  { id: 2, name: 'Jane Smith', plan: 'Basic', date: '2024-11-09', status: 'Active', source: 'RMAX' },
  { id: 3, name: 'Mike Johnson', plan: 'Premium', date: '2024-11-09', status: 'Pending', source: 'BSNL' },
  { id: 4, name: 'Sarah Williams', plan: 'Standard', date: '2024-11-08', status: 'Active', source: 'RMAX' },
  { id: 5, name: 'David Brown', plan: 'Premium', date: '2024-11-08', status: 'Active', source: 'BSNL' },
];

const activityItems = [
  { id: 1, text: 'New customer registered', time: '5 mins ago' },
  { id: 2, text: 'Payment received ₹5,000', time: '15 mins ago' },
  { id: 3, text: 'Complaint resolved', time: '1 hour ago' },
  { id: 4, text: 'New lead added', time: '2 hours ago' },
];

export function Dashboard({ dataSource, theme }: DashboardProps) {
  const isDark = theme === 'dark';

  const kpiCards = [
    { title: 'Total Revenue', value: '₹8.5L', change: '+12.5%', icon: DollarSign, color: 'blue' },
    { title: 'Total Transactions', value: '1,234', change: '+8.2%', icon: TrendingUp, color: 'purple' },
    { title: 'Total Users', value: '5,678', change: '+15.3%', icon: Users, color: 'cyan' },
    { title: 'New Users', value: '234', change: '+23.1%', icon: UserPlus, color: 'green' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`p-6 rounded-xl border ${
                isDark
                  ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
                  : 'bg-white/80 border-gray-200 backdrop-blur-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  card.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  card.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  card.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {card.value}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {card.title}
                </span>
                <span className="text-green-400 text-sm">{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Chart - 2/3 width */}
        <div className="lg:col-span-2">
          <div className={`p-6 rounded-xl border ${
            isDark
              ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
              : 'bg-white/80 border-gray-200 backdrop-blur-xl'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Revenue Statistics
              </h2>
              <button className={`p-2 rounded-lg ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
              }`}>
                <Download className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#6b7280'} />
                <YAxis stroke={isDark ? '#94a3b8' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDark ? '#ffffff' : '#000000',
                  }}
                />
                <Legend />
                <Bar dataKey="BSNL" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="RMAX" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Subscribers Table */}
          <div className={`mt-6 p-6 rounded-xl border ${
            isDark
              ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
              : 'bg-white/80 border-gray-200 backdrop-blur-xl'
          }`}>
            <h2 className={`text-xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Recent Subscribers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>User</th>
                    <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plan</th>
                    <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date</th>
                    <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                    <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Source</th>
                    <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubscribers.map((sub) => (
                    <tr key={sub.id} className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                      <td className={`py-4 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {sub.name}
                      </td>
                      <td className={`py-4 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {sub.plan}
                      </td>
                      <td className={`py-4 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {sub.date}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          sub.status === 'Active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          sub.source === 'BSNL'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {sub.source}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button className={`px-4 py-2 rounded-lg text-sm ${
                          isDark
                            ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                            : 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'
                        }`}>
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Balance Card */}
          <div className={`p-6 rounded-xl border ${
            isDark
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30 backdrop-blur-xl'
              : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 backdrop-blur-xl'
          }`}>
            <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Balance
            </h3>
            <div className={`text-3xl mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ₹12.5L
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>75%</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`p-6 rounded-xl border ${
            isDark
              ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
              : 'bg-white/80 border-gray-200 backdrop-blur-xl'
          }`}>
            <h3 className={`text-xl mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h3>
            <div className="space-y-4">
              {activityItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    isDark ? 'bg-cyan-400' : 'bg-cyan-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.text}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
