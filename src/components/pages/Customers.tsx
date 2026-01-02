import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Loader2, ChevronDown } from 'lucide-react';
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
  
  // Status updating loading state
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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
      
      {/* FIXED SCROLLBAR STYLES: Matches Master Template (8px) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? '#1a1f2c' : '#f1f5f9'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#334155' : '#cbd5e1'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#475569' : '#94a3b8'};
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? '#334155 #1a1f2c' : '#cbd5e1 #f1f5f9'};
        }
      `}</style>

      {/* Header & Controls - Mobile Responsive */}
      <div className={`mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
        
        {/* LEFT SIDE: Search Input */}
        <div className="relative w-full md:w-96">
            <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                isDark 
                  ? 'bg-[#0f172a] border-slate-700 text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
              placeholder={`Search in ${searchField}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* RIGHT SIDE: Filters & Add Button */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          
           {/* Search Field Selection */}
           <div className="relative flex-1 md:flex-none">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className={`w-full md:w-auto appearance-none px-4 py-2.5 pr-10 rounded-md border outline-none text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-[#0f172a] border-slate-700 text-slate-200' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="All">All Fields</option>
              <option value="Name">Name</option>
              <option value="Landline">Landline</option>
              <option value="OLT">OLT IP</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full md:w-auto appearance-none px-4 py-2.5 pr-10 rounded-md border outline-none text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-[#0f172a] border-slate-700 text-slate-200' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </div>

          <button
            onClick={() => setModalMode('add')}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg transition-all w-full md:w-auto"
          >
            <Plus className="h-4 w-4" /> 
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER - Fixed Height */}
      <div className={`rounded-xl border shadow-lg overflow-hidden flex flex-col ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`} style={{ height: 'calc(100vh - 220px)' }}>
        
        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {/* UPDATED: Added whitespace-nowrap to match Leads page width/row height */}
          <table className="w-full text-sm text-left border-separate border-spacing-0 whitespace-nowrap">
            <thead className={`uppercase font-bold sticky top-0 z-40 ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
              <tr>
                <th className="px-6 py-4 min-w-[180px] border-b border-inherit bg-inherit">ID</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Landline</th>
                <th className="px-6 py-4 min-w-[250px] border-b border-inherit bg-inherit">Name</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Mobile</th>
                <th className="px-6 py-4 min-w-[180px] border-b border-inherit bg-inherit">Plan</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">OLT IP</th>
                <th className="px-6 py-4 min-w-[120px] border-b border-inherit bg-inherit">OTT</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Install Date</th>
                
                {/* Fixed Status Column Header - Updated to right-[120px] to match Options width */}
                <th className={`px-6 py-4 text-center min-w-[120px] sticky right-[120px] z-40 border-b border-inherit shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  Status
                </th>
                
                {/* Fixed Options Column Header - Updated to min-w-[120px] to match Leads */}
                <th className={`px-6 py-4 text-center min-w-[120px] sticky right-0 z-40 border-b border-inherit ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  Options
                </th>
              </tr>
            </thead>
            
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading customers...</p>
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
                <tr key={customer.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 font-medium border-b border-inherit ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.id}</td>
                  <td className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-white-300' : 'text-black-900'}`}>{customer.landline}</td>
                  <td className={`px-6 py-4 font-medium border-b border-inherit ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</td>
                  <td className="px-6 py-4 border-b border-inherit">{customer.mobileNo}</td>
                  <td className={`px-6 py-4 font-medium border-b border-inherit ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{customer.plan}</td>
                  <td className="px-6 py-4 font-mono text-xs border-b border-inherit">{customer.oltIp}</td>
                  <td className={`px-6 py-4 text-xs font-bold border-b border-inherit ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{customer.ottSubscription || '-'}</td>
                  <td className="px-6 py-4 border-b border-inherit">{customer.installationDate}</td>

                  {/* Sticky Status Column Body - Position updated to right-[120px] */}
                  <td className={`px-6 py-4 text-center sticky right-[120px] z-20 border-b border-inherit shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                    <button
                      onClick={() => handleStatusToggle(customer.id, customer.status)}
                      disabled={updatingStatus === customer.id}
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                        customer.status === 'Active'
                          ? 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20'
                          : 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                      } ${updatingStatus === customer.id ? 'opacity-70 cursor-wait' : 'hover:scale-105'}`}
                      title="Click to toggle status"
                    >
                      {updatingStatus === customer.id ? (
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </div>
                      ) : (
                        customer.status
                      )}
                    </button>
                  </td>

                  {/* Sticky Options Column Body */}
                  <td className={`px-6 py-4 text-center sticky right-0 z-20 border-b border-inherit ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setSelectedCustomer(customer); setViewModalOpen(true); }} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedCustomer(customer); setModalMode('edit'); }} className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedCustomer(customer); setDeleteModalOpen(true); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-900 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <div className="text-sm">
                Total Customers: {filteredCustomers.length}
            </div>
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