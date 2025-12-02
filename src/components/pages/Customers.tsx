import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import type { DataSource } from '../../App';
import { CustomerModal } from '@/components/modals/CustomerModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { ViewCustomerModal } from '@/components/modals/ViewCustomerModal';
import { CustomerService } from '@/services/customerService'; 
import { Customer } from '../../types'; 
import { toast } from 'sonner';

interface CustomersProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export function Customers({ dataSource, theme }: CustomersProps) {
  const isDark = theme === 'dark';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true); // Loading state added
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // 1. Load Customers from Firebase (Live)
  const fetchCustomers = async () => {
      setLoading(true);
      try {
          const data = await CustomerService.getCustomers();
          setCustomers(data);
      } catch (error) {
          toast.error("Failed to load customers");
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  // Initial Load
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 2. Add Customer
  const handleAddCustomer = async (customerData: any) => {
    try {
        // Generate ID: 104562-XXXXXX-CUSTOMER-RECORD
        const random = Math.floor(100000 + Math.random() * 900000);
        const newId = `104562-${random}-CUSTOMER-RECORD`;
        
        await CustomerService.addCustomer({ ...customerData, id: newId });
        
        toast.success("Customer added successfully!");
        fetchCustomers(); // Refresh list from server
        setModalMode(null);
    } catch (e) {
        toast.error("Failed to add customer");
    }
  };

  // 3. Edit Customer
  const handleEditCustomer = async (customer: Customer) => {
    try {
        const { id, ...updates } = customer;
        await CustomerService.updateCustomer(id, updates);
        
        toast.success("Customer details updated!");
        fetchCustomers(); // Refresh list from server
        setModalMode(null);
        setSelectedCustomer(null);
    } catch (e) {
        toast.error("Failed to update customer");
    }
  };

  // 4. Delete Customer
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
        await CustomerService.deleteCustomer(selectedCustomer.id);
        toast.success("Customer deleted");
        fetchCustomers(); // Refresh list from server
        setDeleteModalOpen(false);
        setSelectedCustomer(null);
    } catch (e) {
        toast.error("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
        matchesSearch = 
          customer.name.toLowerCase().includes(searchLower) ||
          (customer.id && customer.id.includes(searchLower)) ||
          customer.mobileNo.includes(searchLower) ||
          customer.landline.includes(searchLower) ||
          (customer.oltIp && customer.oltIp.toLowerCase().includes(searchLower));
    } else if (searchField === 'Name') {
        matchesSearch = customer.name.toLowerCase().includes(searchLower);
    } else if (searchField === 'Landline') {
        matchesSearch = customer.landline.includes(searchLower);
    } else if (searchField === 'OLT') {
        matchesSearch = customer.oltIp && customer.oltIp.toLowerCase().includes(searchLower);
    }

    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    const matchesSource = dataSource === 'All' || customer.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header Section */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Management</h1>
        
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
              placeholder={`Search in ${searchField}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className={`px-4 py-2.5 rounded-md border outline-none text-sm font-medium ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Fields</option>
              <option value="Name">Name</option>
              <option value="Landline">Landline</option>
              <option value="OLT">OLT IP</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md border outline-none text-sm font-medium ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>

            <button
              onClick={() => setModalMode('add')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className={`w-full rounded-lg border shadow-xl ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className={`${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'} font-semibold uppercase tracking-wider`}>
              <tr>
                <th className="px-6 py-4 min-w-[180px]">ID</th>
                <th className="px-6 py-4 min-w-[140px]">Landline</th>
                <th className="px-6 py-4 min-w-[250px]">Name</th>
                <th className="px-6 py-4 min-w-[140px]">Mobile</th>
                <th className="px-6 py-4 min-w-[180px]">Plan</th>
                <th className="px-6 py-4 min-w-[140px]">OLT IP</th>
                <th className="px-6 py-4 min-w-[120px]">OTT</th>
                <th className="px-6 py-4 min-w-[140px]">Install Date</th>
                <th className={`px-6 py-4 min-w-[120px] sticky right-[110px] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>Status</th>
                <th className={`px-6 py-4 min-w-[110px] text-center sticky right-0 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20`}>Options</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading customers from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                 <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No customers found. Add a new customer to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                <tr key={customer.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.id}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.landline}</td>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</td>
                  <td className="px-6 py-4">{customer.mobileNo}</td>
                  
                  {/* New Columns */}
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{customer.plan}</td>
                  <td className="px-6 py-4 font-mono text-xs">{customer.oltIp}</td>
                  <td className={`px-6 py-4 text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{customer.ottSubscription || '-'}</td>
                  
                  <td className="px-6 py-4">{customer.installationDate}</td>

                  {/* Sticky Status Column */}
                  <td className={`px-6 py-4 sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        customer.status === 'Active'
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-red-900/30 text-red-400 border-red-800'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  {/* Sticky Options Column */}
                  <td className={`px-6 py-4 text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedCustomer(customer); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 p-1"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => { setSelectedCustomer(customer); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 p-1"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => { setSelectedCustomer(customer); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              )))}
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
            defaultSource={dataSource} 
            onClose={() => setModalMode(null)} 
            onSave={modalMode === 'add' ? handleAddCustomer : handleEditCustomer} 
        />
      )}
      {viewModalOpen && selectedCustomer && <ViewCustomerModal customer={selectedCustomer} theme={theme} onClose={() => setViewModalOpen(false)} />}
      {deleteModalOpen && <DeleteConfirmModal title="Delete Customer" message={`Delete ${selectedCustomer?.name}?`} theme={theme} onConfirm={handleDeleteCustomer} onCancel={() => setDeleteModalOpen(false)} />}
    </div>
  );
}