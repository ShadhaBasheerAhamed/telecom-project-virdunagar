import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import type { DataSource } from '../../App';
import { CustomerModal } from '../modals/CustomerModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { ViewCustomerModal } from '../modals/ViewCustomerModal';

interface CustomersProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: 'Active' | 'Suspended' | 'Expired';
  source: 'BSNL' | 'RMAX';
  joinDate: string;
}

const mockCustomers: Customer[] = [
  { id: 'C001', name: 'John Doe', email: 'john@example.com', phone: '+91 98765 43210', plan: 'Premium', status: 'Active', source: 'BSNL', joinDate: '2024-01-15' },
  { id: 'C002', name: 'Jane Smith', email: 'jane@example.com', phone: '+91 98765 43211', plan: 'Basic', status: 'Active', source: 'RMAX', joinDate: '2024-02-20' },
  { id: 'C003', name: 'Mike Johnson', email: 'mike@example.com', phone: '+91 98765 43212', plan: 'Premium', status: 'Suspended', source: 'BSNL', joinDate: '2024-03-10' },
  { id: 'C004', name: 'Sarah Williams', email: 'sarah@example.com', phone: '+91 98765 43213', plan: 'Standard', status: 'Active', source: 'RMAX', joinDate: '2024-03-25' },
  { id: 'C005', name: 'David Brown', email: 'david@example.com', phone: '+91 98765 43214', plan: 'Premium', status: 'Expired', source: 'BSNL', joinDate: '2024-04-05' },
];

export function Customers({ dataSource, theme }: CustomersProps) {
  const isDark = theme === 'dark';
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'All' || customer.plan === filterPlan;
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    const matchesSource = dataSource === 'All' || customer.source === dataSource;
    return matchesSearch && matchesPlan && matchesStatus && matchesSource;
  });

  const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer = {
      ...customer,
      id: `C${String(customers.length + 1).padStart(3, '0')}`,
    };
    setCustomers([...customers, newCustomer]);
    setModalMode(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomers(customers.map(c => c.id === customer.id ? customer : c));
    setModalMode(null);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer) {
      setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
      setDeleteModalOpen(false);
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Customers
        </h1>
        <button
          onClick={() => setModalMode('add')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
            isDark
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
          }`}
        >
          <Plus className="w-5 h-5" />
          Add New Customer
        </button>
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#0F172A] border-[#334155] text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#0F172A] border-[#334155] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          >
            <option value="All">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>

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
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'}`}>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>ID</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Name</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plan</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Source</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {customer.id}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {customer.name}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {customer.email}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {customer.phone}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {customer.plan}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      customer.status === 'Active'
                        ? 'bg-green-500/20 text-green-400'
                        : customer.status === 'Suspended'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      customer.source === 'BSNL'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {customer.source}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
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
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setModalMode('edit');
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/10 text-blue-400'
                            : 'hover:bg-gray-100 text-blue-600'
                        }`}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setDeleteModalOpen(true);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/10 text-red-400'
                            : 'hover:bg-gray-100 text-red-600'
                        }`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modalMode && (
        <CustomerModal
          mode={modalMode}
          customer={selectedCustomer}
          theme={theme}
          onClose={() => {
            setModalMode(null);
            setSelectedCustomer(null);
          }}
          onSave={modalMode === 'add' ? handleAddCustomer : handleEditCustomer}
        />
      )}

      {viewModalOpen && selectedCustomer && (
        <ViewCustomerModal
          customer={selectedCustomer}
          theme={theme}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          title="Delete Customer"
          message={`Are you sure you want to delete ${selectedCustomer?.name}? This action cannot be undone.`}
          theme={theme}
          onConfirm={handleDeleteCustomer}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}
