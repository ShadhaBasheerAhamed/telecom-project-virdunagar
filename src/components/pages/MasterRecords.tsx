import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit, Trash2, Plus, 
  Users, Briefcase, UserCheck, Building2, 
  Router, HardDrive, FileText, Network, Server, Loader2, Cpu,Tv
} from 'lucide-react';
import { MasterRecordModal } from '@/components/modals/MasterRecordModal';
import { MasterRecordService } from '@/services/masterRecordService';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import type { DataSource } from '../../types';
import { toast } from 'sonner';

// ✅ 1. Import Search Context
import { useSearch } from '../../contexts/SearchContext';

interface MasterRecordsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export const MasterRecords = ({ dataSource, theme }: MasterRecordsProps) => {
  const isDark = theme === 'dark';
  
  // ✅ 2. Use Global Search
  const { searchQuery, setSearchQuery } = useSearch();

  const [activeTab, setActiveTab] = useState('routerMake');
  // ❌ REMOVED: const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordsData, setRecordsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from Firebase when tab or filters change
  useEffect(() => {
    loadRecordsData();
  }, [activeTab, statusFilter, dataSource]); 

  const loadRecordsData = async () => {
    setLoading(true);
    try {
      let records: any[];
      
      if (statusFilter === 'All') {
        records = await MasterRecordService.getRecords(activeTab);
      } else {
        records = await MasterRecordService.getRecordsByStatus(activeTab, statusFilter);
      }
      
      setRecordsData(records);
    } catch (error) {
      console.error(`Error loading ${activeTab} data:`, error);
      toast.error(`Failed to load ${activeTab} records.`);
      setRecordsData([]); 
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsAddModalOpen(true);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleSaveRecord = async () => {
    await loadRecordsData(); // Reload data after save
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedRecord(null);
  };

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    try {
      await MasterRecordService.deleteRecord(activeTab, selectedRecord.id);
      toast.success("Record deleted successfully");
      // Optimistic update
      setRecordsData(prev => prev.filter(r => r.id !== selectedRecord.id));
      setIsDeleteModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error(`Error deleting record:`, error);
      toast.error(`Failed to delete record.`);
    }
  };

  // --- TABS CONFIGURATION ---
  const tabs = [
    { id: 'routerMake', label: 'Router Make', icon: Router },
    { id: 'routerMac', label: 'Router Mac', icon: Cpu }, 
    { id: 'ontMake', label: 'ONT Make', icon: HardDrive },
    { id: 'ontType', label: 'ONT Type', icon: Server },
    { id: 'ontMac', label: 'ONT Mac', icon: Cpu },
    { id: 'plan', label: 'Plan', icon: FileText },
    { id: 'ott', label: 'OTT Subscription', icon: Tv }, // ✅ Added OTT
    { id: 'oltIp', label: 'OLT IP', icon: Network },
    { id: 'employee', label: 'Employee', icon: Users },
    { id: 'department', label: 'Department', icon: Building2 },
    { id: 'designation', label: 'Designation', icon: Briefcase },
    { id: 'user', label: 'User', icon: UserCheck },
  ];

  // ✅ 3. Local Filtering using Global Search Query
  const currentData = useMemo(() => {
    if (!searchQuery) return recordsData;
    return recordsData.filter(record => {
      // Generic search across all values in the record
      return Object.values(record).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [recordsData, searchQuery]);

  // --- COLUMN DEFINITIONS ---
  const getColumns = () => {
    switch (activeTab) {
      case 'routerMake':
      case 'routerMac':
      case 'ontMake':
      case 'ontType':
      case 'ontMac':
      case 'oltIp':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Name / Value', accessor: 'name', render: (row: any) => <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.name}</span> },
        ];
      
      case 'plan':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Plan Name', accessor: 'name', render: (row: any) => <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.name}</span> },
          { header: 'Price', accessor: 'price', render: (row: any) => `₹${row.price}` },
          { header: 'GST', accessor: 'gst', render: (row: any) => `${row.gst}%` },
          { header: 'Total', accessor: 'total', render: (row: any) => <span className="text-green-500 font-bold">₹{row.total}</span> },
        ];

        // ✅ ADDED OTT COLUMNS
      case 'ott':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Platform / Plan', accessor: 'name', render: (row: any) => <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.name}</span> },
          { header: 'Price', accessor: 'price', render: (row: any) => `₹${row.price || 0}` },
          { header: 'Validity', accessor: 'validity', render: (row: any) => row.validity ? `${row.validity} Days` : '-' },
        ];

      case 'employee':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Name', accessor: 'name', render: (row: any) => <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.name}</span> },
          { header: 'Role', accessor: 'role', render: (row: any) => <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold">{row.role || 'Staff'}</span> }, // ✅ Added Role
          { header: 'Basic Salary', accessor: 'salary', render: (row: any) => <span className="font-mono">₹{row.salary || 0}</span> }, // ✅ Added Salary
          { header: 'Phone', accessor: 'mobile' },
          { header: 'Address', accessor: 'address', render: (row: any) => <span className="truncate max-w-[150px] block">{row.address}</span> },
          { header: 'Aadhaar', accessor: 'aadhaar' },
        ];
      
      case 'department':
        return [
          { header: 'ID', accessor: 'id' },
          { header: 'Department', accessor: 'name' },
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
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Master Records</h1>

      {/* TABS NAVIGATION */}
      <div className="mb-6 w-full overflow-x-auto pb-2 custom-scrollbar">
        <div className={`p-1 rounded-lg inline-flex border min-w-max ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} // ✅ Clear global search on tab switch
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
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

      {/* CONTROLS */}
      <div className={`mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
        
        {/* ✅ 4. Updated Search Input (Binds to Global Context) */}
        <div className="relative w-full md:w-96">
          <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label}...`}
            value={searchQuery} // ✅ Uses Global State
            onChange={(e) => setSearchQuery(e.target.value)} // ✅ Updates Global State
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`appearance-none py-2.5 px-4 pr-8 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium min-w-[140px] border ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Filter className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <button 
            onClick={handleAddRecord}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Add {tabs.find(t => t.id === activeTab)?.label}</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className={`w-full overflow-hidden rounded-lg border shadow-xl ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto w-full">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className={`font-bold uppercase tracking-wider ${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              <tr>
                {getColumns().map((col, idx) => (
                  <th key={idx} className="px-6 py-4 border-b border-inherit">{col.header}</th>
                ))}
                <th className={`px-6 py-4 border-b border-inherit sticky right-[110px] z-20 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-100'}`}>Status</th>
                <th className={`px-6 py-4 border-b border-inherit text-center sticky right-0 z-20 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-100'}`}>Options</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                 <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading records...</p>
                    </div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-gray-500">
                    {searchQuery 
                        ? `No records found matching "${searchQuery}"`
                        : "No records found. Add a new record to get started."}
                  </td>
                </tr>
              ) : (
                currentData.map((row, index) => (
                  <tr key={index} className={`transition-colors group ${isDark ? 'hover:bg-[#2d3546]' : 'hover:bg-gray-50'}`}>
                    {getColumns().map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                    <td className={`px-6 py-4 sticky right-[110px] z-10 ${isDark ? 'bg-[#242a38] group-hover:bg-[#2d3546]' : 'bg-white group-hover:bg-gray-50'}`}>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        row.status === 'Active' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-center sticky right-0 z-10 ${isDark ? 'bg-[#242a38] group-hover:bg-[#2d3546]' : 'bg-white group-hover:bg-gray-50'}`}>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleViewRecord(row)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleEditRecord(row)} className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => { setSelectedRecord(row); setIsDeleteModalOpen(true); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && <MasterRecordModal mode="add" recordType={activeTab} data={null} theme={theme} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveRecord} />}
      {isViewModalOpen && selectedRecord && <MasterRecordModal mode="view" recordType={activeTab} data={selectedRecord} theme={theme} onClose={() => setIsViewModalOpen(false)} onSave={handleSaveRecord} />}
      {isEditModalOpen && selectedRecord && <MasterRecordModal mode="edit" recordType={activeTab} data={selectedRecord} theme={theme} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveRecord} />}
      {isDeleteModalOpen && <DeleteConfirmModal title={`Delete ${tabs.find(t => t.id === activeTab)?.label}`} message="Are you sure?" theme={theme} onConfirm={handleDeleteRecord} onCancel={() => setIsDeleteModalOpen(false)} />}
    </div>
  );
};