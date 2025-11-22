import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Download } from 'lucide-react';
import type { DataSource } from '../../App';
import { CustomerModal } from '../modals/CustomerModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { ViewCustomerModal } from '../modals/ViewCustomerModal';
import { Customer } from '../../types'; // Use shared type

interface CustomersProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

// Key must match the one used in Leads.tsx
const CUSTOMER_STORAGE_KEY = 'customers-data';

// Keep mocks as fallback if storage is empty
const mockCustomers: Customer[] = [
  { id: '104562-290940-CUSTOMER-RECORD', landline: '044-12345678', name: 'JUSTIN JEBARAJ...', mobileNo: '9486825940', altMobileNo: '0987654321', vlanId: '100', bbId: '129sj4562290940...', voipPassword: 'VOIP_SECURE_PASSWORD_123', ontMake: 'HUAWEI_ONT', ontType: 'HG8145V5', ontMacAddress: 'B0:7D:47:1A:2C:3D:FF:EE', ontBillNo: 'BILL_2024_001', ont: 'Paid ONT', offerPrize: '750', routerMake: 'NETLINK', routerMacId: 'AA:BB:CC', oltIp: '10.215.168.64', installationDate: '2019-09-23', status: 'Inactive', source: 'BSNL', email: 'justin@example.com', plan: 'Enterprise Premium' },
  { id: '104562-290165-CUSTOMER-RECORD', landline: '044-23456789', name: 'JABEZ SAM DURAI...', mobileNo: '9445587165', altMobileNo: '9876543210', vlanId: '200', bbId: '130sj4562290165...', voipPassword: 'VOIP_SECURE_456', ontMake: 'NOKIA_ONT', ontType: 'G-010G-P', ontMacAddress: '00:1A:79:3A:8B:2C:DD:EE', ontBillNo: 'BILL_2024_002', ont: 'Rented ONT', offerPrize: '500', routerMake: 'TPLINK', routerMacId: 'BB:CC:DD', oltIp: '10.215.168.64', installationDate: '2019-09-24', status: 'Active', source: 'BSNL', email: 'jabez@example.com', plan: 'Business Standard' }
];

export function Customers({ dataSource, theme }: CustomersProps) {
  const isDark = theme === 'dark';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // --- NEW: Load Customers from LocalStorage (Bridging with Leads Page) ---
  useEffect(() => {
    const stored = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Optional: Merge mocks if you want mocks to always be there
      if (parsed.length === 0) {
         setCustomers(mockCustomers);
         localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(mockCustomers));
      } else {
         setCustomers(parsed);
      }
    } else {
      setCustomers(mockCustomers);
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(mockCustomers));
    }
  }, []);

  // Save changes to storage whenever customers list changes
  const updateStorage = (updatedList: Customer[]) => {
     setCustomers(updatedList);
     localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updatedList));
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
        matchesSearch = 
          customer.name.toLowerCase().includes(searchLower) ||
          customer.id.includes(searchLower) ||
          customer.mobileNo.includes(searchLower) ||
          customer.bbId.toLowerCase().includes(searchLower);
    } else if (searchField === 'Name') {
        matchesSearch = customer.name.toLowerCase().includes(searchLower);
    } else if (searchField === 'ID') {
        matchesSearch = customer.id.includes(searchLower);
    } else if (searchField === 'Mobile') {
        matchesSearch = customer.mobileNo.includes(searchLower);
    }

    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    const matchesSource = dataSource === 'All' || customer.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleAddCustomer = (customer: any) => {
    // Using custom ID format to match requirements
    const newId = `104562-${Math.floor(100000 + Math.random() * 900000)}-CUSTOMER-RECORD`;
    const newCustomer = { ...customer, id: newId };
    updateStorage([newCustomer, ...customers]);
    setModalMode(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    const updatedList = customers.map(c => c.id === customer.id ? customer : c);
    updateStorage(updatedList);
    setModalMode(null);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer) {
      const updatedList = customers.filter(c => c.id !== selectedCustomer.id);
      updateStorage(updatedList);
      setDeleteModalOpen(false);
      setSelectedCustomer(null);
    }
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header Section */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Management</h1>
        
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
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">Search All</option>
              <option value="Name">Name</option>
              <option value="ID">Customer ID</option>
              <option value="Mobile">Mobile No</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={() => setModalMode('add')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
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
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ID</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Landline</th>
                <th className={`px-6 py-4 min-w-[250px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Name</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Mobile No</th>
                <th className={`px-6 py-4 min-w-[160px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Alt Mobile No</th>
                <th className={`px-6 py-4 min-w-[100px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Vlan Id</th>
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>BB Id</th>
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Voip Password</th>
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ONT Make</th>
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ONT Type</th>
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ONT Mac</th>
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ONT Bill No</th>
                <th className={`px-6 py-4 min-w-[100px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ONT</th>
                <th className={`px-6 py-4 min-w-[120px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Offer Prize</th>
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Router Make</th>
                <th className={`px-6 py-4 min-w-[180px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Router Mac Id</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>OLT IP</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Install Date</th>

                <th className={`px-6 py-4 min-w-[120px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                  Status
                </th>
                <th className={`px-6 py-4 min-w-[110px] text-center border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-0 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20`}>
                  Options
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.id}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.landline}</td>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.mobileNo}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.altMobileNo}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.vlanId}</td>
                  <td className={`px-6 py-4 text-blue-400 hover:underline cursor-pointer`}>{customer.bbId}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.voipPassword}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.ontMake}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.ontType}</td>
                  <td className={`px-6 py-4 font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.ontMacAddress}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.ontBillNo}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.ont}</td>
                  <td className={`px-6 py-4 text-green-400 font-medium`}>₹{customer.offerPrize}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.routerMake}</td>
                  <td className={`px-6 py-4 font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.routerMacId}</td>
                  <td className={`px-6 py-4 font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.oltIp}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.installationDate}</td>

                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
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
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedCustomer(customer); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors p-1" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedCustomer(customer); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedCustomer(customer); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete">
                        <Trash2 className="h-4 w-4" />
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
      {modalMode && <CustomerModal mode={modalMode} customer={selectedCustomer} theme={theme} onClose={() => setModalMode(null)} onSave={modalMode === 'add' ? handleAddCustomer : handleEditCustomer} />}
      {viewModalOpen && selectedCustomer && <ViewCustomerModal customer={selectedCustomer} theme={theme} onClose={() => setViewModalOpen(false)} />}
      {deleteModalOpen && <DeleteConfirmModal title="Delete Customer" message={`Delete ${selectedCustomer?.name}?`} theme={theme} onConfirm={handleDeleteCustomer} onCancel={() => setDeleteModalOpen(false)} />}
    </div>
  );
}