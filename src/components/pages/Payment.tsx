import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import type { DataSource } from '../../App';
import { ViewPaymentModal } from '../modals/ViewPaymentModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

interface PaymentProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export interface Payment {
  id: string;
  landlineNo: string;
  customerName: string;
  rechargePlan: string;
  duration: string;
  billAmount: number;
  commission: number;
  status: 'Paid' | 'Unpaid';
  paidDate: string;
  modeOfPayment: string;
  renewalDate: string;
  source: string;
}

const mockPayments: Payment[] = [
  { 
    id: '792', 
    landlineNo: '04562-206784', 
    customerName: 'PONRAJ C..', 
    rechargePlan: '40MBPS 499 FIBER BASIC BSNL', 
    duration: '30', 
    billAmount: 589, 
    commission: 217.065, 
    status: 'Paid', 
    paidDate: '2025-10-27', 
    modeOfPayment: 'BSNL PAYMENT', 
    renewalDate: '2025-12-13',
    source: 'BSNL'
  },
  { 
    id: '791', 
    landlineNo: '04562-229561', 
    customerName: 'SHYAM RAJ A..', 
    rechargePlan: '300MBPS 1799 FIBER ULTRA BSNL OTT', 
    duration: '30', 
    billAmount: 2123, 
    commission: 1016.435, 
    status: 'Unpaid', 
    paidDate: '2024-05-17', 
    modeOfPayment: 'SPT CASH', 
    renewalDate: '2024-07-13',
    source: 'BSNL'
  },
  { 
    id: '790', 
    landlineNo: '04562-223190', 
    customerName: 'SUREY DEPARTMNET, TALUK OFFICE', 
    rechargePlan: '150MBPS 999 SUPER STAR PREMIUM PLUS BSNL OTT PLAN', 
    duration: '30', 
    billAmount: 1179, 
    commission: 564.435, 
    status: 'Unpaid', 
    paidDate: '2024-05-03', 
    modeOfPayment: 'SPT CASH', 
    renewalDate: '2024-06-13',
    source: 'BSNL'
  },
  { 
    id: '789', 
    landlineNo: '04562-201234', 
    customerName: 'RAJESH KUMAR M', 
    rechargePlan: '100MBPS 699 FIBER STANDARD BSNL', 
    duration: '30', 
    billAmount: 799, 
    commission: 383.52, 
    status: 'Paid', 
    paidDate: '2025-11-01', 
    modeOfPayment: 'ONLINE PAYMENT', 
    renewalDate: '2025-12-01',
    source: 'BSNL'
  },
  { 
    id: '788', 
    landlineNo: '04562-201567', 
    customerName: 'PRIYA SHARMA', 
    rechargePlan: '200MBPS 1299 FIBER PREMIUM BSNL OTT', 
    duration: '30', 
    billAmount: 1499, 
    commission: 719.52, 
    status: 'Paid', 
    paidDate: '2025-10-15', 
    modeOfPayment: 'UPI PAYMENT', 
    renewalDate: '2025-11-15',
    source: 'Private'
  },
  { 
    id: '787', 
    landlineNo: '04562-202345', 
    customerName: 'VENKATESHWARAN T', 
    rechargePlan: '50MBPS 599 FIBER BASIC PLUS', 
    duration: '30', 
    billAmount: 649, 
    commission: 311.52, 
    status: 'Unpaid', 
    paidDate: '2024-04-20', 
    modeOfPayment: 'CASH', 
    renewalDate: '2024-05-20',
    source: 'Private'
  }
];

export function Payment({ dataSource, theme }: PaymentProps) {
  const isDark = theme === 'dark';
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
        matchesSearch = 
          payment.customerName.toLowerCase().includes(searchLower) ||
          payment.id.includes(searchLower) ||
          payment.landlineNo.includes(searchLower) ||
          payment.rechargePlan.toLowerCase().includes(searchLower);
    } else if (searchField === 'Name') {
        matchesSearch = payment.customerName.toLowerCase().includes(searchLower);
    } else if (searchField === 'ID') {
        matchesSearch = payment.id.includes(searchLower);
    } else if (searchField === 'Landline') {
        matchesSearch = payment.landlineNo.includes(searchLower);
    }

    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesSource = dataSource === 'All' || payment.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleDeletePayment = () => {
    if (selectedPayment) {
      setPayments(payments.filter(p => p.id !== selectedPayment.id));
      setDeleteModalOpen(false);
      setSelectedPayment(null);
    }
  };

  // Calculate dashboard metrics
  const totalTransaction = payments.filter(p => 
    (dataSource === 'All' || p.source === dataSource)
  ).length;
  
  const totalRevenue = payments
    .filter(p => (dataSource === 'All' || p.source === dataSource))
    .reduce((sum, p) => sum + p.billAmount, 0);

  const paidPayments = payments.filter(p => 
    p.status === 'Paid' && (dataSource === 'All' || p.source === dataSource)
  );

  const totalCommission = paidPayments.reduce((sum, p) => sum + p.commission, 0);

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header */}
      <h1 className={`text-3xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Payment Management
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Revenue
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDark
            ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
            : 'bg-white/80 border-gray-200 backdrop-blur-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ₹{totalCommission.toFixed(2)}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Commission
          </div>
        </div>
      </div>
      
      {/* Header Section with Filters */}
      <div className="mb-6">
        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Records</h2>
        
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300 placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              placeholder={`Search in ${searchField}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Right Side Controls */}
          <div className="flex gap-3 w-full md:w-auto">
            {/* Search Field Select */}
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">Search All</option>
              <option value="Name">Customer Name</option>
              <option value="ID">Payment ID</option>
              <option value="Landline">Landline No</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            {/* Add Button */}
            <button
              onClick={() => alert('Add Payment functionality would be implemented here')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER - Table-specific horizontal scroll at bottom */}
      <div className={`w-full rounded-lg border shadow-xl ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className={`${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'} font-semibold uppercase tracking-wider`}>
              <tr>
                {/* Scrollable Columns */}
                <th className={`px-6 py-4 min-w-[80px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ID</th>
                <th className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Landline No</th>
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Customer Name</th>
                <th className={`px-6 py-4 min-w-[300px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Recharge Plan</th>
                <th className={`px-6 py-4 min-w-[100px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Duration</th>
                <th className={`px-6 py-4 min-w-[120px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Bill Amount</th>
                <th className={`px-6 py-4 min-w-[120px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Commission</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Paid Date</th>
                <th className={`px-6 py-4 min-w-[160px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Mode of Payment</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Renewal Date</th>

                {/* STICKY COLUMNS (Header) */}
                <th className={`px-6 py-4 min-w-[120px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                  Status
                </th>
                <th className={`px-6 py-4 min-w-[110px] text-center border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-0 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20`}>
                  Options
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  {/* Scrollable Data */}
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{payment.id}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{payment.landlineNo}</td>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{payment.customerName}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{payment.rechargePlan}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{payment.duration} days</td>
                  <td className={`px-6 py-4 text-green-400 font-medium`}>₹{payment.billAmount}</td>
                  <td className={`px-6 py-4 text-purple-400 font-medium`}>₹{payment.commission.toFixed(3)}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{payment.paidDate}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{payment.modeOfPayment}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{payment.renewalDate}</td>

                  {/* STICKY COLUMNS (Body) */}
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)] hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        payment.status === 'Paid'
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-red-900/30 text-red-400 border-red-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedPayment(payment); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-900/20" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => alert('Edit Payment functionality would be implemented here')} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1 rounded hover:bg-yellow-900/20" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedPayment(payment); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900/20" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPayments.length === 0 && (
             <div className={`p-10 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No payments found matching your search.
             </div>
          )}
        </div>

        {/* Footer / Results Summary */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-gray-700 bg-[#1f2533] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <div className="text-sm">
                Showing <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>1</span> to <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredPayments.length}</span> of <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{payments.length}</span> results
            </div>
            <div className="flex gap-2">
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Previous</button>
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Next</button>
            </div>
        </div>
      </div>

      {/* MODALS */}
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

      {deleteModalOpen && (
        <DeleteConfirmModal
          title="Delete Payment"
          message={`Are you sure you want to delete payment record ${selectedPayment?.id}? This action cannot be undone.`}
          theme={theme}
          onConfirm={handleDeletePayment}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}
