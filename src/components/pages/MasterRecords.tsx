import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit, Trash2, Plus, 
  Users, Briefcase, UserCheck, Building2, 
  Router, HardDrive, FileText, Network, Server, Loader2, Cpu, Tv, ChevronDown 
} from 'lucide-react';
import { MasterRecordModal } from '@/components/modals/MasterRecordModal';
import { MasterRecordService } from '@/services/masterRecordService';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import type { DataSource } from '../../types';
import { toast } from 'sonner';
import { useSearch } from '../../contexts/SearchContext';

interface MasterRecordsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export const MasterRecords = ({ dataSource, theme }: MasterRecordsProps) => {
  const isDark = theme === 'dark';
  const { searchQuery, setSearchQuery } = useSearch();

  const [activeTab, setActiveTab] = useState('routerMake');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordsData, setRecordsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsAddModalOpen(true);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleSaveRecord = async () => {
    await loadRecordsData();
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
      setRecordsData(prev => prev.filter(r => r.id !== selectedRecord.id));
      setIsDeleteModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error(`Error deleting record:`, error);
      toast.error(`Failed to delete record.`);
    }
  };

  const tabs = [
    { id: 'routerMake', label: 'Router Make', icon: Router },
    { id: 'routerMac', label: 'Router Mac', icon: Cpu }, 
    { id: 'ontMake', label: 'ONT Make', icon: HardDrive },
    { id: 'ontType', label: 'ONT Type', icon: Server },
    { id: 'ontMac', label: 'ONT Mac', icon: Cpu },
    { id: 'plan', label: 'Plan', icon: FileText },
    { id: 'ott', label: 'OTT Subscription', icon: Tv }, 
    { id: 'oltIp', label: 'OLT IP', icon: Network },
    { id: 'employee', label: 'Employee', icon: Users },
    { id: 'department', label: 'Department', icon: Building2 },
    { id: 'designation', label: 'Designation', icon: Briefcase },
    { id: 'user', label: 'User', icon: UserCheck },
  ];

  const currentData = useMemo(() => {
    if (!searchQuery) return recordsData;
    return recordsData.filter(record => {
      return Object.values(record).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [recordsData, searchQuery]);

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
          { header: 'Role', accessor: 'role', render: (row: any) => <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20">{row.role || 'Staff'}</span> },
          { header: 'Basic Salary', accessor: 'salary', render: (row: any) => <span className="font-mono text-green-500">₹{row.salary || 0}</span> },
          { header: 'Phone', accessor: 'mobile' },
          { header: 'Address', accessor: 'address', render: (row: any) => <span className="truncate max-w-[150px] block" title={row.address}>{row.address}</span> },
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
      
      {/* SCROLLBAR STYLES - Matches Payment Page Exactly (8px) */}
      <style>{`
        /* Horizontal Scrollbar (Tabs) */
        .custom-scrollbar-x::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar-x::-webkit-scrollbar-track { background: ${isDark ? '#1a1f2c' : '#f1f5f9'}; border-radius: 4px; }
        .custom-scrollbar-x::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
        .custom-scrollbar-x::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#475569' : '#94a3b8'}; }

        /* Vertical Scrollbar (Table) */
        .custom-scrollbar-y::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar-y::-webkit-scrollbar-track { background: ${isDark ? '#1a1f2c' : '#f1f5f9'}; border-radius: 4px; }
        .custom-scrollbar-y::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
        .custom-scrollbar-y::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#475569' : '#94a3b8'}; }
      `}</style>

      <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Master Records</h1>

      {/* TABS NAVIGATION - SCROLLABLE */}
      <div className="mb-6 w-full overflow-x-auto pb-2 custom-scrollbar-x">
        <div className={`p-1 rounded-xl inline-flex border min-w-max ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-slate-700/50'
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
      <div className={`mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                isDark 
                  ? 'bg-[#0f172a] border-slate-700 text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-gray-200 text-gray-900'
            }`}
            placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter & Add Button */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full md:w-auto appearance-none px-4 py-2.5 pr-10 rounded-md border outline-none text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-[#0f172a] border-slate-700 text-slate-200' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </div>

          <button 
            onClick={handleAddRecord}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg transition-all w-full md:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add {tabs.find(t => t.id === activeTab)?.label}</span>
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER - Fixed Height */}
      <div 
        className={`rounded-xl border shadow-lg overflow-hidden flex flex-col ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <div className="flex-1 overflow-auto custom-scrollbar-y relative">
          <table className="w-full text-sm text-left border-separate border-spacing-0 whitespace-nowrap">
            <thead className={`uppercase font-bold sticky top-0 z-30 ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
              <tr>
                {getColumns().map((col, idx) => (
                  <th key={idx} className="px-6 py-4 border-b border-inherit bg-inherit">{col.header}</th>
                ))}
                <th className={`px-6 py-4 text-center min-w-[120px] sticky right-[110px] z-30 border-b border-inherit shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>Status</th>
                <th className={`px-6 py-4 text-center min-w-[110px] sticky right-0 z-30 border-b border-inherit ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>Options</th>
              </tr>
            </thead>
            
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
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
                  <td colSpan={10} className="py-12 text-center">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchQuery ? `No records found matching "${searchQuery}"` : "No records found. Add a new record to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                currentData.map((row, index) => (
                  <tr key={index} className={`transition-colors group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                    {getColumns().map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                    
                    {/* Sticky Status Column Body */}
                    <td className={`px-6 py-4 text-center sticky right-[110px] z-20 border-b border-inherit shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        row.status === 'Active' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {row.status}
                      </span>
                    </td>

                    {/* Sticky Options Column Body */}
                    <td className={`px-6 py-4 text-center sticky right-0 z-20 border-b border-inherit ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleViewRecord(row)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleEditRecord(row)} className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => { setSelectedRecord(row); setIsDeleteModalOpen(true); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
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