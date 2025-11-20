import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Download } from 'lucide-react';
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
  landline: string;
  name: string;
  mobileNo: string;
  altMobileNo: string;
  vlanId: string;
  bbId: string;
  voipPassword: string;
  ontMake: string;
  ontType: string;
  ontMacAddress: string;
  ontBillNo: string;
  ont: string;
  offerPrize: string;
  routerMake: string;
  routerMacId: string;
  oltIp: string;
  installationDate: string;
  status: string;
  source: string;
  email?: string;
  plan?: string;
}

// Mock Data with expanded content to ensure scrolling
const mockCustomers: Customer[] = [
  { id: '104562-290940-CUSTOMER-RECORD', landline: '044-12345678', name: 'JUSTIN JEBARAJ SAMUEL RAJESH KUMAR ENTERPRISE CUSTOMER MANAGEMENT SYSTEM', mobileNo: '9486825940', altMobileNo: '0987654321', vlanId: '100', bbId: '129sj4562290940_sid_broadband_connection_system', voipPassword: 'VOIP_SECURE_PASSWORD_123', ontMake: 'HUAWEI_ONT_FIBER_OPTICAL_NETWORK_TERMINAL', ontType: 'HG8145V5_ADVANCED_GATEWAY_DEVICE', ontMacAddress: 'B0:7D:47:1A:2C:3D:FF:EE', ontBillNo: 'BILL_2024_001_CUSTOMER_RECORD', ont: 'Paid ONT_WITH_EXTENDED_WARRANTY', offerPrize: '750', routerMake: 'NETLINK_ADVANCED_ROUTING_EQUIPMENT', routerMacId: 'AA:BB:CC:DD:EE:FF:GG:HH', oltIp: '10.215.168.64', installationDate: '2019-09-23', status: 'Inactive', source: 'BSNL', email: 'justin.jebaraj.samuel@enterprise.com', plan: 'Enterprise Premium' },
  { id: '104562-290165-CUSTOMER-RECORD', landline: '044-23456789', name: 'JABEZ SAM DURAI CHENNAI CUSTOMER SUPPORT SYSTEM', mobileNo: '9445587165', altMobileNo: '9876543210', vlanId: '200', bbId: '130sj4562290165_sid_fiber_to_home', voipPassword: 'VOIP_SECURE_456_ENTERPRISE', ontMake: 'NOKIA_OPTICAL_NETWORK_TERMINAL', ontType: 'G-010G-P_GATEWAY_PROFESSIONAL', ontMacAddress: '00:1A:79:3A:8B:2C:DD:EE', ontBillNo: 'BILL_2024_002_SERVICE_RECORD', ont: 'Rented ONT_PREMIUM_SUPPORT', offerPrize: '500', routerMake: 'TPLINK_ADVANCED_NETWORKING', routerMacId: 'BB:CC:DD:EE:FF:AA:BB:CC', oltIp: '10.215.168.64', installationDate: '2019-09-24', status: 'Active', source: 'BSNL', email: 'jabez.sam.durai@chennai.com', plan: 'Business Standard' },
  { id: '104562-290628-CUSTOMER-RECORD', landline: '044-34567890', name: 'RAJESH KUMAR PAULS D TAMILNADU BROADBAND SERVICES', mobileNo: '9944412628', altMobileNo: '8765432109', vlanId: '300', bbId: '133dr4562290628_sid_high_speed_internet', voipPassword: 'VOIP_SECURE_789_PROFESSIONAL', ontMake: 'ZTE_OPTICAL_NETWORK_DEVICE', ontType: 'F670L_FIBER_GATEWAY_LITE', ontMacAddress: 'CC:DD:EE:FF:AA:BB:CC:DD', ontBillNo: 'BILL_2024_003_INSTALLATION', ont: 'Paid ONT_STANDARD_PACKAGE', offerPrize: '300', routerMake: 'NETLINK_ROUTING_SOLUTION', routerMacId: 'CC:11:22:33:44:55:66:77', oltIp: '10.215.168.65', installationDate: '2019-09-27', status: 'Inactive', source: 'Private', email: 'rajesh.kumar.pauls@tamilnadu.com', plan: 'Basic Home' },
  { id: '104562-290096-CUSTOMER-RECORD', landline: '044-45678901', name: 'JONES JOSEPH JEBARAJ D CHENNAI IT SOLUTIONS', mobileNo: '8344283096', altMobileNo: '7654321098', vlanId: '400', bbId: '134dj4562290096_sid_corporate_connection', voipPassword: 'VOIP_SECURE_321_CORPORATE', ontMake: 'HUAWEI_ONT_ENTERPRISE_GRADE', ontType: 'HG8145V5_CORPORATE_GATEWAY', ontMacAddress: 'DD:EE:FF:AA:BB:CC:DD:EE', ontBillNo: 'BILL_2024_004_CORPORATE', ont: 'Paid ONT_ENTERPRISE_SUPPORT', offerPrize: '1000', routerMake: 'NETLINK_CORPORATE_ROUTER', routerMacId: 'DD:22:33:44:55:66:77:88', oltIp: '10.215.168.64', installationDate: '2019-09-28', status: 'Active', source: 'BSNL', email: 'jones.joseph.jebaraj@chennai.com', plan: 'Corporate Premium' },
  { id: '104562-290657-CUSTOMER-RECORD', landline: '044-56789012', name: 'M/S. HI TECH AGRO LAB SCIENTIFIC RESEARCH FACILITY', mobileNo: '9486104296', altMobileNo: '6543210987', vlanId: '500', bbId: '135hi4562290657_sid_scientific_internet', voipPassword: 'VOIP_SECURE_654_SCIENTIFIC', ontMake: 'NOKIA_ONT_SCIENTIFIC_GRADE', ontType: 'G-010G-P_RESEARCH_GATEWAY', ontMacAddress: 'EE:FF:AA:BB:CC:DD:EE:FF', ontBillNo: 'BILL_2024_005_RESEARCH', ont: 'Rented ONT_SCIENTIFIC_PACKAGE', offerPrize: '600', routerMake: 'TPLINK_SCIENTIFIC_NETWORK', routerMacId: 'EE:33:44:55:66:77:88:99', oltIp: '10.215.168.64', installationDate: '2019-09-28', status: 'Active', source: 'BSNL', email: 'contact@hitechagrolab.scientific', plan: 'Research Institution' },
  { id: '104562-290024-CUSTOMER-RECORD', landline: '044-67890123', name: 'PERIAPERUMAL C CHENNAI EDUCATIONAL INSTITUTE', mobileNo: '9443133565', altMobileNo: '5432109876', vlanId: '600', bbId: '136cp4562290024_sid_educational_network', voipPassword: 'VOIP_SECURE_987_EDUCATION', ontMake: 'ZTE_ONT_EDUCATIONAL_SYSTEM', ontType: 'F670L_CAMPUS_GATEWAY', ontMacAddress: 'FF:AA:BB:CC:DD:EE:FF:AA', ontBillNo: 'BILL_2024_006_EDUCATION', ont: 'Paid ONT_INSTITUTIONAL_SUPPORT', offerPrize: '800', routerMake: 'HUAWEI_CAMPUS_ROUTER', routerMacId: 'FF:44:55:66:77:88:99:AA', oltIp: '10.215.168.66', installationDate: '2022-03-26', status: 'Active', source: 'Private', email: 'admin@periaperumal.educational', plan: 'Educational Premium' }
];

export function Customers({ dataSource, theme }: CustomersProps) {
  const isDark = theme === 'dark';
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

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
    setCustomers([...customers, { ...customer, id: `${Date.now()}` }]);
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
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header Section with Filters */}
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
            {/* Search Field Select */}
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

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Add Button */}
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

      {/* TABLE CONTAINER - Table-specific horizontal scroll at bottom */}
      <div className={`w-full rounded-lg border shadow-xl ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className={`${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'} font-semibold uppercase tracking-wider`}>
              <tr>
                {/* Scrollable Columns */}
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
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  {/* Scrollable Data */}
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

                  {/* STICKY COLUMNS (Body) */}
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)] hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
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
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedCustomer(customer); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-900/20" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedCustomer(customer); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1 rounded hover:bg-yellow-900/20" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedCustomer(customer); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900/20" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && (
             <div className={`p-10 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No records found matching your search.
             </div>
          )}
        </div>

        {/* Footer / Results Summary */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-gray-700 bg-[#1f2533] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <div className="text-sm">
                Showing <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>1</span> to <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredCustomers.length}</span> of <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customers.length}</span> results
            </div>
            <div className="flex gap-2">
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Previous</button>
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Next</button>
            </div>
        </div>
      </div>

      {/* MODALS */}
      {modalMode && <CustomerModal mode={modalMode} customer={selectedCustomer} theme={theme} onClose={() => setModalMode(null)} onSave={modalMode === 'add' ? handleAddCustomer : handleEditCustomer} />}
      {viewModalOpen && selectedCustomer && <ViewCustomerModal customer={selectedCustomer} theme={theme} onClose={() => setViewModalOpen(false)} />}
      {deleteModalOpen && <DeleteConfirmModal title="Delete Customer" message={`Delete ${selectedCustomer?.name}?`} theme={theme} onConfirm={handleDeleteCustomer} onCancel={() => setDeleteModalOpen(false)} />}
    </div>
  );
}