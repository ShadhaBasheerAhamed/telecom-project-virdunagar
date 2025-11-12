import { useState } from 'react';
import { DollarSign, TrendingUp, Search, Eye, Download } from 'lucide-react';
import type { DataSource } from '../../App';
import { ViewPaymentModal } from '../modals/ViewPaymentModal';

interface PaymentProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export interface Payment {
  id: string;
  invoiceId: string;
  userId: string;
  userName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  source: 'BSNL' | 'RMAX';
  method: string;
}

const mockPayments: Payment[] = [
  { id: 'P001', invoiceId: 'INV-001', userId: 'C001', userName: 'John Doe', amount: 5000, date: '2024-11-10', status: 'Paid', source: 'BSNL', method: 'UPI' },
  { id: 'P002', invoiceId: 'INV-002', userId: 'C002', userName: 'Jane Smith', amount: 3000, date: '2024-11-09', status: 'Paid', source: 'RMAX', method: 'Card' },
  { id: 'P003', invoiceId: 'INV-003', userId: 'C003', userName: 'Mike Johnson', amount: 7500, date: '2024-11-08', status: 'Pending', source: 'BSNL', method: 'Net Banking' },
  { id: 'P004', invoiceId: 'INV-004', userId: 'C004', userName: 'Sarah Williams', amount: 4200, date: '2024-11-07', status: 'Paid', source: 'RMAX', method: 'UPI' },
  { id: 'P005', invoiceId: 'INV-005', userId: 'C005', userName: 'David Brown', amount: 6800, date: '2024-11-06', status: 'Failed', source: 'BSNL', method: 'Card' },
];

export function Payment({ dataSource, theme }: PaymentProps) {
  const isDark = theme === 'dark';
  const [payments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesSource = dataSource === 'All' || payment.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const totalTransaction = payments.filter(p => 
    (dataSource === 'All' || p.source === dataSource)
  ).length;
  
  const totalProfit = payments
    .filter(p => p.status === 'Paid' && (dataSource === 'All' || p.source === dataSource))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Payment Management
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border ${
          isDark
            ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
            : 'bg-white/80 border-gray-200 backdrop-blur-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {totalTransaction}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Transactions
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDark
            ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
            : 'bg-white/80 border-gray-200 backdrop-blur-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ₹{totalProfit.toLocaleString()}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Profit
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#0F172A] border-[#334155] text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#0F172A] border-[#334155] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'}`}>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Invoice ID</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>User</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Source</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Amount</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Method</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                  <td className={`py-4 px-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {payment.invoiceId}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {payment.userName}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      payment.source === 'BSNL'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {payment.source}
                    </span>
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {payment.date}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {payment.method}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      payment.status === 'Paid'
                        ? 'bg-green-500/20 text-green-400'
                        : payment.status === 'Pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setViewModalOpen(true);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/10 text-cyan-400'
                            : 'hover:bg-gray-100 text-cyan-600'
                        }`}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/10 text-blue-400'
                            : 'hover:bg-gray-100 text-blue-600'
                        }`}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedPayment && (
        <ViewPaymentModal
          payment={selectedPayment}
          theme={theme}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}
