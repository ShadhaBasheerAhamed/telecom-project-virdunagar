import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';
import type { DataSource } from '../../App';
import { LeadModal } from '../modals/LeadModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

interface LeadsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export interface Lead {
  id: string;
  customerName: string;
  phoneNo: string;
  address: string;
  remarks: string;
  followupDate: string;
  status: 'Success' | 'Rejected';
  source: string;
}

const mockLeads: Lead[] = [
  { 
    id: '6', 
    customerName: 'SARAVANAN P...', 
    phoneNo: '8300131417', 
    address: '120/30 AYYAN COMPLEX, OPP TO BSNL OFFICE, VIRUDHUNAGAR', 
    remarks: 'SEORFKWOEPRK', 
    followupDate: '2025-10-28', 
    status: 'Success', 
    source: 'BSNL' 
  },
  { 
    id: '5', 
    customerName: 'THALUKA OFFICE BACK SIDE', 
    phoneNo: '9884268841', 
    address: 'THALUKA OFFICE BACK SIDE', 
    remarks: '22.05.24 CALL SEITHA POTHU SATURDAY SOLVATHAGA SONNAR, SATUR DAY KEATKUM POTHU MONDAY,TUSDAY VANTHGU KUPIDUVATHAGA KURINAR, 29.05.24 CALL SEITHA POTHU AIRTEL DISH IRUPATHAL AVARKAL MULAMAGA CONECTION POTTATHAGA KURI ULLAR', 
    followupDate: '0024-05-29', 
    status: 'Rejected', 
    source: 'Private' 
  },
  { 
    id: '3', 
    customerName: 'PONRAJ', 
    phoneNo: '9940996784', 
    address: 'PETHANATCHI NAGAR', 
    remarks: 'ASK TODAY EVENING (BSNL)', 
    followupDate: '2024-05-29', 
    status: 'Success', 
    source: 'BSNL' 
  },
  { 
    id: '2', 
    customerName: 'SARAVANAN P...', 
    phoneNo: '8300131417', 
    address: '120/30 AYYAN COMPLEX, OPP TO BSNL OFFICE, VIRUDHUNAGAR', 
    remarks: 'AFWEFGE', 
    followupDate: '2023-10-18', 
    status: 'Rejected', 
    source: 'BSNL' 
  },
  { 
    id: '7', 
    customerName: 'SIVAKUMAR R', 
    phoneNo: '8754123698', 
    address: 'NO 45, GANDHI STREET, SALEM, 636001', 
    remarks: 'CALL BACK REQUESTED FOR BROADBAND CONNECTION', 
    followupDate: '2025-11-15', 
    status: 'Success', 
    source: 'Private' 
  },
  { 
    id: '8', 
    customerName: 'MEENA K', 
    phoneNo: '9876543210', 
    address: '23/12, RADHA NAGAR, ERODE, 638001', 
    remarks: 'INTERESTED IN FIBER TO HOME PLAN', 
    followupDate: '2025-11-20', 
    status: 'Rejected', 
    source: 'BSNL' 
  }
];

export function Leads({ dataSource, theme }: LeadsProps) {
  const isDark = theme === 'dark';
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
        matchesSearch = 
          lead.customerName.toLowerCase().includes(searchLower) ||
          lead.id.includes(searchLower) ||
          lead.phoneNo.includes(searchLower) ||
          lead.remarks.toLowerCase().includes(searchLower);
    } else if (searchField === 'Name') {
        matchesSearch = lead.customerName.toLowerCase().includes(searchLower);
    } else if (searchField === 'ID') {
        matchesSearch = lead.id.includes(searchLower);
    } else if (searchField === 'Phone') {
        matchesSearch = lead.phoneNo.includes(searchLower);
    }

    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    const matchesSource = dataSource === 'All' || lead.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleAddLead = (lead: Omit<Lead, 'id'>) => {
    const newLead = {
      ...lead,
      id: String(leads.length + 1),
    };
    setLeads([...leads, newLead]);
    setModalMode(null);
  };

  const handleEditLead = (lead: Lead) => {
    setLeads(leads.map(l => l.id === lead.id ? lead : l));
    setModalMode(null);
    setSelectedLead(null);
  };

  const handleDeleteLead = () => {
    if (selectedLead) {
      setLeads(leads.filter(l => l.id !== selectedLead.id));
      setDeleteModalOpen(false);
      setSelectedLead(null);
    }
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header Section with Filters */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Leads Management</h1>
        
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
              <option value="ID">Lead ID</option>
              <option value="Phone">Phone No</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Success">Success</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Add Button */}
            <button
              onClick={() => setModalMode('add')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lead</span>
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
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Customer Name</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Phone No</th>
                <th className={`px-6 py-4 min-w-[300px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Address</th>
                <th className={`px-6 py-4 min-w-[400px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Remarks</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Followup Date</th>

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
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  {/* Scrollable Data */}
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.id}</td>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.customerName}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.phoneNo}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.address}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.remarks}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.followupDate}</td>

                  {/* STICKY COLUMNS (Body) */}
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)] hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        lead.status === 'Success'
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-red-900/30 text-red-400 border-red-800'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedLead(lead); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-900/20" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedLead(lead); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1 rounded hover:bg-yellow-900/20" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedLead(lead); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900/20" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLeads.length === 0 && (
             <div className={`p-10 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No leads found matching your search.
             </div>
          )}
        </div>

        {/* Footer / Results Summary */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-gray-700 bg-[#1f2533] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <div className="text-sm">
                Showing <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>1</span> to <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredLeads.length}</span> of <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{leads.length}</span> results
            </div>
            <div className="flex gap-2">
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Previous</button>
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Next</button>
            </div>
        </div>
      </div>

      {/* MODALS */}
      {modalMode && (
        <LeadModal
          mode={modalMode}
          lead={selectedLead}
          theme={theme}
          onClose={() => {
            setModalMode(null);
            setSelectedLead(null);
          }}
          onSave={modalMode === 'add' ? handleAddLead : handleEditLead}
        />
      )}

      {viewModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-3xl rounded-xl border ${
            isDark
              ? 'bg-[#1e293b]/95 border-[#334155]'
              : 'bg-white/95 border-gray-200'
          } backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-inherit">
              <h2 className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Lead Details
              </h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className={`p-2 rounded-lg transition-all ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>ID:</strong> {selectedLead.id}</div>
                <div><strong>Customer Name:</strong> {selectedLead.customerName}</div>
                <div><strong>Phone No:</strong> {selectedLead.phoneNo}</div>
                <div><strong>Followup Date:</strong> {selectedLead.followupDate}</div>
                <div><strong>Address:</strong> {selectedLead.address}</div>
                <div><strong>Status:</strong> {selectedLead.status}</div>
                <div className="col-span-2"><strong>Remarks:</strong> {selectedLead.remarks}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          title="Delete Lead"
          message={`Are you sure you want to delete lead ${selectedLead?.id}? This action cannot be undone.`}
          theme={theme}
          onConfirm={handleDeleteLead}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
}
