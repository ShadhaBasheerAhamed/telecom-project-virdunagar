import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Eye, Edit, Trash2, Plus, 
  Users, Briefcase, UserCheck, Building2, 
  Router, HardDrive, FileText, Network, Server 
} from 'lucide-react';
import { MasterRecordModal } from '../modals/MasterRecordModal';
import type { DataSource } from '../../App';

interface MasterRecordsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export const MasterRecords = ({ dataSource, theme }: MasterRecordsProps) => {
  const [activeTab, setActiveTab] = useState('routerMake');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Modal handlers
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsAddModalOpen(true);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleSaveRecord = (recordData: any) => {
    console.log('Saving record:', recordData);
    setIsAddModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedRecord(null);
  };

  // Theme-based styling
  const isDark = theme === 'dark';

  // --- MOCK DATA GENERATORS (Updated from Screenshots) ---

  // 1. Router Make Data (Ref: image_4b16a0.jpg)
  const routerMakeData = [
    { id: '1', name: 'TP-LINK C24', status: 'Active' },
    { id: '2', name: 'D-Link DIR-615', status: 'Active' },
    { id: '3', name: 'Netgear R6120', status: 'Inactive' },
    { id: '4', name: 'Tenda N301', status: 'Active' },
    { id: '5', name: 'Mercusys MW301R', status: 'Active' },
    { id: '6', name: 'Cisco RV160', status: 'Active' },
    { id: '7', name: 'Mi Router 4C', status: 'Inactive' },
    { id: '8', name: 'Huawei WS318n', status: 'Active' },
  ];

  // 2. ONT Make Data (Ref: image_4b19c1.jpg)
  const ontMakeData = [
    { id: '3', name: 'GENEXIS', status: 'Active' },
    { id: '6', name: 'NFTLINK', status: 'Active' },
    { id: '7', name: 'OPTILINK', status: 'Inactive' },
    { id: '8', name: 'BINTECH', status: 'Active' },
    { id: '9', name: 'REVU', status: 'Active' },
    { id: '10', name: 'SYROTECH', status: 'Active' },
    { id: '11', name: 'TP-LINK', status: 'Active' },
    { id: '12', name: 'ALPHINE', status: 'Inactive' },
    { id: '13', name: 'DBC', status: 'Active' },
    { id: '14', name: 'DIGISOL', status: 'Active' },
  ];

  // 3. ONT Type Data (Ref: image_4b1aa0.jpg)
  const ontTypeData = [
    { id: '1', name: 'RGW SINGLE BAND', status: 'Active' },
    { id: '2', name: 'DAC DUAL BAND 4GE PORT', status: 'Active' },
    { id: '3', name: 'SINGLE BAND 1GE + 1VOIP + 2.4G', status: 'Inactive' },
    { id: '4', name: 'DUAL BAND 2GE PORT WITHOUT VOIP', status: 'Active' },
    { id: '7', name: 'ONU WITHOUT VOICE', status: 'Active' },
    { id: '8', name: 'ONU WITH VOICE', status: 'Active' },
    { id: '10', name: 'DAC 2GE PORT + WITH VOICE', status: 'Active' },
  ];

  // 4. Plan Data (Ref: image_54f8a4.jpg)
  const planData = [
    { id: '33', name: '100GB CUL - BHARAT FIBER', price: 499, gst: 18, total: 588, status: 'Active' },
    { id: '34', name: '200MBPS 1500GB C555-BHARAT FIBER', price: 1999, gst: 18, total: 2359, status: 'Active' },
    { id: '35', name: '100 MBPS 300 GB CS139 FIBRO-BHARAT FIBER', price: 699, gst: 18, total: 825, status: 'Active' },
    { id: '36', name: 'BHARAT FIBER SAFE CUSTODY', price: 100, gst: 18, total: 118, status: 'Active' },
    { id: '37', name: '100MBPS FIBER_BB_SHIKSHA_899 SCHOOL PLAN', price: 899, gst: 18, total: 1061, status: 'Active' },
    { id: '38', name: '300MBPS 1000 FIBER SILVER BSNL', price: 1099, gst: 18, total: 1296, status: 'Active' },
    { id: '39', name: '100 MBPS 799 FIBER VALUE', price: 799, gst: 18, total: 943, status: 'Active' },
    { id: '40', name: 'BSNL 299 10MBPS 20GBUNLIMITED VOICE', price: 299, gst: 18, total: 353, status: 'Active' },
  ];

  // 5. OLT IP Data (Ref: image_54f8a6.jpg)
  const oltIpData = [
    { id: '3', name: 'NETLINK TOWN OLT 10.215.168.86', status: 'Active' },
    { id: '6', name: 'NETLINK NGO 10.215.168.64', status: 'Active' },
    { id: '7', name: 'NETLINK EPON SULAKARAI 10.215.168.237', status: 'Inactive' },
    { id: '8', name: 'SYROTECH OLT 192.168.1.100', status: 'Active' },
  ];

  // 6. Employee Data (Updated fields from image_54f82a.jpg)
  const employeeData = [
    { id: '1', name: 'SARAVANAN P', mobile: '8300131417', address: '120/30 ayyan complex, opp to bsnl office, virudhunagar', aadhaar: '217226859055', status: 'Active' },
    { id: '2', name: 'R.ULAGANATHAN', mobile: '8300131437', address: 'SDVNMN', aadhaar: '258987456123', status: 'Active' },
    { id: '3', name: 'KUMAR S', mobile: '9876543210', address: '45, Anna Nagar, Chennai', aadhaar: '895623147852', status: 'Inactive' },
    { id: '4', name: 'RAJESH K', mobile: '9944112233', address: '12, Main Road, Madurai', aadhaar: '456123789654', status: 'Active' },
  ];

  // 7. Old Data (Department, Designation, User) kept for completeness
  const departmentData = [
    { id: '101', name: 'Engineering', head: 'Ravi Kumar', location: 'Chennai', status: 'Active' },
    { id: '102', name: 'Sales', head: 'Priya S', location: 'Madurai', status: 'Active' },
  ];

  const designationData = [
    { id: '201', name: 'Senior Engineer', department: 'Engineering', status: 'Active' },
    { id: '202', name: 'Sales Executive', department: 'Sales', status: 'Active' },
  ];

  const userData = [
    { id: 'USR-001', name: 'admin_user_1', role: 'Super Admin', lastLogin: '2024-11-20', status: 'Active' },
    { id: 'USR-002', name: 'viewer_user_1', role: 'Viewer', lastLogin: '2024-11-19', status: 'Inactive' },
  ];

  // --- TABS CONFIGURATION ---
  const tabs = [
    { id: 'routerMake', label: 'Router Make', icon: Router },
    { id: 'ontMake', label: 'ONT Make', icon: HardDrive },
    { id: 'ontType', label: 'ONT Type', icon: Server },
    { id: 'plan', label: 'Plan', icon: FileText },
    { id: 'oltIp', label: 'OLT IP', icon: Network },
    { id: 'employee', label: 'Employee', icon: Users },
    { id: 'department', label: 'Department', icon: Building2 },
    { id: 'designation', label: 'Designation', icon: Briefcase },
    { id: 'user', label: 'User', icon: UserCheck },
  ];

  // --- HELPER: Get Current Data ---
  const currentData = useMemo(() => {
    let data = [];
    switch (activeTab) {
      case 'routerMake': data = routerMakeData; break;
      case 'ontMake': data = ontMakeData; break;
      case 'ontType': data = ontTypeData; break;
      case 'plan': data = planData; break;
      case 'oltIp': data = oltIpData; break;
      case 'employee': data = employeeData; break;
      case 'department': data = departmentData; break;
      case 'designation': data = designationData; break;
      case 'user': data = userData; break;
      default: data = [];
    }

    return data.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeTab, searchTerm, statusFilter]);

  // --- RENDER HELPER ---
  const RenderTable = ({ columns, rows }) => (
    <div className={`w-full overflow-hidden rounded-lg border ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-300 bg-white'} shadow-xl`}>
      <div className="overflow-x-auto w-full pb-2 custom-scrollbar">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className={`${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-100 text-gray-600'} font-semibold uppercase tracking-wider`}>
            <tr>
              {/* Dynamic Columns */}
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  {col.header}
                </th>
              ))}

              {/* STICKY COLUMNS (Header) - Fixed to Right */}
              <th className={`px-6 py-4 min-w-[120px] border-b ${isDark ? 'border-gray-700 sticky right-[110px] bg-[#1f2533] shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]' : 'border-gray-300 sticky right-[110px] bg-gray-100 shadow-[-5px_0px_10px_rgba(0,0,0,0.1)]'} z-20`}>
                Status
              </th>
              <th className={`px-6 py-4 min-w-[160px] text-center border-b ${isDark ? 'border-gray-700 sticky right-0 bg-[#1f2533]' : 'border-gray-300 sticky right-0 bg-gray-100'} z-20`}>
                Options
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {rows.map((row, index) => (
              <tr key={index} className={`${isDark ? 'hover:bg-[#2d3546]' : 'hover:bg-gray-50'} transition-colors group`}>
                {/* Dynamic Data Cells */}
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}

                {/* STICKY COLUMNS (Body) - Fixed to Right */}
                <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 sticky right-[110px] bg-[#242a38] shadow-[-5px_0px_10px_rgba(0,0,0,0.2)] group-hover:bg-[#2d3546]' : 'border-gray-200 sticky right-[110px] bg-white shadow-[-5px_0px_10px_rgba(0,0,0,0.1)] group-hover:bg-gray-50'} z-10`}>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      row.status === 'Active'
                        ? isDark 
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-green-100 text-green-700 border-green-300'
                        : isDark
                          ? 'bg-red-900/30 text-red-400 border-red-800'
                          : 'bg-red-100 text-red-700 border-red-300'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className={`px-6 py-4 border-b text-center ${isDark ? 'border-gray-700 sticky right-0 bg-[#242a38] group-hover:bg-[#2d3546]' : 'border-gray-200 sticky right-0 bg-white group-hover:bg-gray-50'} z-10`}>
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleViewRecord(row)} 
                      className={`${isDark ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' : 'text-blue-600 hover:text-blue-500 hover:bg-blue-50'} transition-colors p-1 rounded`} 
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className={`${isDark ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20' : 'text-yellow-600 hover:text-yellow-500 hover:bg-yellow-50'} transition-colors p-1 rounded`} title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className={`${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-500 hover:bg-red-50'} transition-colors p-1 rounded`} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className={`p-10 text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            No records found in {tabs.find(t => t.id === activeTab)?.label}.
          </div>
        )}
      </div>
    </div>
  );

  // --- COLUMN DEFINITIONS ---
  const getColumns = () => {
    switch (activeTab) {
      case 'routerMake':
      case 'ontMake':
      case 'ontType':
      case 'oltIp':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Name', accessor: 'name', render: (row) => <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{row.name}</span> },
        ];
      
      case 'plan':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Plan Name', accessor: 'name', render: (row) => <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{row.name}</span> },
          { header: 'Plan Price', accessor: 'price', render: (row) => `₹${row.price}` },
          { header: 'GST (%)', accessor: 'gst' },
          { header: 'Total Amount', accessor: 'total', render: (row) => <span className={`${isDark ? 'text-green-400' : 'text-green-600'} font-medium`}>₹{row.total}</span> },
        ];

      case 'employee':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Name', accessor: 'name', render: (row) => <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{row.name}</span> },
          { header: 'Phone Number', accessor: 'mobile' },
          { header: 'Address', accessor: 'address', render: (row) => <span className="truncate max-w-[200px] block" title={row.address}>{row.address}</span> },
          { header: 'Aadhaar Number', accessor: 'aadhaar', render: (row) => <span className={`font-mono tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{row.aadhaar}</span> },
        ];
      
      case 'department':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Department Name', accessor: 'name' },
          { header: 'Head', accessor: 'head' },
          { header: 'Location', accessor: 'location' },
        ];

      case 'designation':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Title', accessor: 'name' },
          { header: 'Department', accessor: 'department' },
        ];

      case 'user':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Username', accessor: 'name' },
          { header: 'Role', accessor: 'role' },
          { header: 'Last Login', accessor: 'lastLogin' },
        ];

      default:
        return [];
    }
  };

  return (
    <div className={`w-full ${isDark ? 'bg-[#1a1f2c]' : 'bg-gray-50'} p-6 min-h-screen ${isDark ? 'text-gray-200' : 'text-gray-900'} font-sans`}>
      
      <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Master Records</h1>

      {/* TABS NAVIGATION - Scrollable horizontal list */}
      <div className="mb-6 w-full overflow-x-auto pb-2 custom-scrollbar">
        <div className={`${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-300'} p-1 rounded-lg inline-flex border min-w-max`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0ea5e9] text-white shadow-lg'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTROLS (Search + Filter + Add) */}
      <div className={`mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-300'} p-4 rounded-lg border`}>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-2.5 border rounded-md leading-5 ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300 placeholder-gray-500 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm`}
            placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Side Controls */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`appearance-none ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'} py-2.5 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px]`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <Filter className="h-4 w-4" />
            </div>
          </div>

          <button 
            onClick={handleAddRecord}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg shadow-blue-900/20 capitalize whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add {tabs.find(t => t.id === activeTab)?.label}</span>
          </button>
        </div>
      </div>

      {/* RENDER TABLE */}
      <RenderTable columns={getColumns()} rows={currentData} />

      {/* Modals */}
      {isAddModalOpen && (
        <MasterRecordModal
          mode="add"
          recordType={activeTab}
          data={null}
          theme={theme}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveRecord}
        />
      )}

      {isViewModalOpen && selectedRecord && (
        <MasterRecordModal
          mode="view"
          recordType={activeTab}
          data={selectedRecord}
          theme={theme}
          onClose={() => setIsViewModalOpen(false)}
          onSave={handleSaveRecord}
        />
      )}

    </div>
  );
};
