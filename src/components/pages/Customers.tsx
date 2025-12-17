import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import type { DataSource } from '../../types';
import { CustomerModal } from '@/components/modals/CustomerModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { ViewCustomerModal } from '@/components/modals/ViewCustomerModal';
import { CustomerService } from '@/services/customerService'; 
import { Customer } from '../../types'; 
import { toast } from 'sonner';
import { useSearch } from '../../contexts/SearchContext';

interface CustomersProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export function Customers({ dataSource, theme }: CustomersProps) {
  const isDark = theme === 'dark';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { searchQuery, setSearchQuery } = useSearch();

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // 1. Load Customers from Firebase
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

  useEffect(() => {
    fetchCustomers();
  }, [dataSource]);

  // 2. Add Customer
  const handleAddCustomer = async (customerData: any) => {
    try {
        const random = Math.floor(100000 + Math.random() * 900000);
        const newId = `104562-${random}-CUSTOMER-RECORD`;
        await CustomerService.addCustomer({ ...customerData, id: newId });
        toast.success("Customer added successfully!");
        fetchCustomers();
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
        fetchCustomers();
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
        fetchCustomers();
        setDeleteModalOpen(false);
        setSelectedCustomer(null);
    } catch (e) {
        toast.error("Failed to delete customer");
    }
  };

  // 5. Toggle Customer Status
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  const handleStatusToggle = async (customerId: string, currentStatus: string) => {
    if (updatingStatus === customerId) return;
    
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setUpdatingStatus(customerId);
    
    try {
      await CustomerService.updateCustomer(customerId, { status: newStatus });
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? { ...customer, status: newStatus } : customer
      ));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filter Logic
  const filteredCustomers = customers.filter(customer => {
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    const matchesSource = dataSource === 'All' || customer.source === dataSource;

    if (!searchQuery) {
        return matchesStatus && matchesSource;
    }

    const searchLower = searchQuery.toLowerCase();
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

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Dynamic Scrollbar Styles based on Theme */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? '#2d3748' : '#f1f5f9'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4a5568' : '#cbd5e1'};
          border-radius: 4px;
          border: 2px solid ${isDark ? '#2d3748' : '#f1f5f9'};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#718096' : '#94a3b8'};
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? '#4a5568 #2d3748' : '#cbd5e1 #f1f5f9'};
        }
      `}</style>

      {/* Header Section */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Customer Management {dataSource !== 'All' && `(${dataSource})`}
        </h1>
        
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
          
          <div className="relative w-full md:w-96">
            <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
              placeholder={`Search in ${searchField}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* TABLE CONTAINER - Fixed Height for Vertical Scroll */}
      <div className={`w-full rounded-lg border shadow-xl overflow-hidden flex flex-col ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`} style={{ height: 'calc(100vh - 220px)' }}>
        
        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full whitespace-nowrap text-left text-sm border-separate border-spacing-0">
            <thead className={`font-semibold uppercase tracking-wider sticky top-0 z-40 ${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              <tr>
                <th className="px-6 py-4 min-w-[180px] border-b border-gray-200 dark:border-gray-700 bg-inherit">ID</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-gray-200 dark:border-gray-700 bg-inherit">Landline</th>
                <th className="px-6 py-4 min-w-[250px] border-b border-gray-200 dark:border-gray-700 bg-inherit">Name</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-gray-200 dark:border-gray-700 bg-inherit">Mobile</th>
                <th className="px-6 py-4 min-w-[180px] border-b border-gray-200 dark:border-gray-700 bg-inherit">Plan</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-gray-200 dark:border-gray-700 bg-inherit">OLT IP</th>
                <th className="px-6 py-4 min-w-[120px] border-b border-gray-200 dark:border-gray-700 bg-inherit">OTT</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-gray-200 dark:border-gray-700 bg-inherit">Install Date</th>
                
                {/* Fixed Status Column Header */}
                <th className={`px-6 py-4 min-w-[120px] sticky right-[110px] z-40 border-b border-gray-200 dark:border-gray-700 shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'}`}>
                  Status
                </th>
                
                {/* Fixed Options Column Header */}
                <th className={`px-6 py-4 min-w-[110px] text-center sticky right-0 z-40 border-b border-gray-200 dark:border-gray-700 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'}`}>
                  Options
                </th>
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
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {dataSource === 'All' ? 'No customers found.' : `No ${dataSource} customers found.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                <tr key={customer.id} className={`group hover:${isDark ? 'bg-[#2d3546]' : 'bg-blue-50'} transition-colors`}>
                  <td className={`px-6 py-4 font-medium border-b border-gray-100 dark:border-gray-800 ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.id}</td>
                  <td className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.landline}</td>
                  <td className={`px-6 py-4 font-medium border-b border-gray-100 dark:border-gray-800 ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</td>
                  <td className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">{customer.mobileNo}</td>
                  <td className={`px-6 py-4 font-medium border-b border-gray-100 dark:border-gray-800 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{customer.plan}</td>
                  <td className="px-6 py-4 font-mono text-xs border-b border-gray-100 dark:border-gray-800">{customer.oltIp}</td>
                  <td className={`px-6 py-4 text-xs font-bold border-b border-gray-100 dark:border-gray-800 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{customer.ottSubscription || '-'}</td>
                  <td className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">{customer.installationDate}</td>

                  {/* Sticky Status Column Body */}
                  <td className={`px-6 py-4 sticky right-[110px] z-20 border-b border-gray-100 dark:border-gray-800 shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-[#242a38] group-hover:bg-[#2d3546]' : 'bg-white group-hover:bg-blue-50'}`}>
                    <button
                      onClick={() => handleStatusToggle(customer.id, customer.status)}
                      disabled={updatingStatus === customer.id}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-md ${
                        customer.status === 'Active'
                          ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-800/50'
                          : 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-800/50'
                      } ${updatingStatus === customer.id ? 'cursor-wait' : 'cursor-pointer'}`}
                      title={`Click to change status to ${customer.status === 'Active' ? 'Inactive' : 'Active'}`}
                    >
                      {updatingStatus === customer.id ? (
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        customer.status
                      )}
                    </button>
                  </td>

                  {/* Sticky Options Column Body */}
                  <td className={`px-6 py-4 text-center sticky right-0 z-20 border-b border-gray-100 dark:border-gray-800 ${isDark ? 'bg-[#242a38] group-hover:bg-[#2d3546]' : 'bg-white group-hover:bg-blue-50'}`}>
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
        
        {/* Footer */}
        <div className={`px-6 py-3 border-t text-xs font-medium uppercase tracking-wide ${isDark ? 'border-gray-700 bg-[#1f2533] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
            Total Customers: {filteredCustomers.length}
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