import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import type { DataSource } from '../../App';
import { LeadModal } from '../modals/LeadModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

interface LeadsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  funnel: 'New' | 'Contacted' | 'Qualified' | 'Negotiating';
  status: 'Hot' | 'Warm' | 'Cold';
  source: 'BSNL' | 'RMAX';
  notes: string;
}

const mockLeads: Lead[] = [
  { id: 'L001', name: 'Alice Johnson', company: 'Tech Corp', email: 'alice@techcorp.com', phone: '+91 98765 11111', funnel: 'Qualified', status: 'Hot', source: 'BSNL', notes: 'Interested in premium plans' },
  { id: 'L002', name: 'Bob Williams', company: 'Startup Inc', email: 'bob@startup.com', phone: '+91 98765 22222', funnel: 'Contacted', status: 'Warm', source: 'RMAX', notes: 'Looking for bulk deals' },
  { id: 'L003', name: 'Carol Davis', company: 'Enterprise Ltd', email: 'carol@enterprise.com', phone: '+91 98765 33333', funnel: 'New', status: 'Cold', source: 'BSNL', notes: 'Requested quote' },
  { id: 'L004', name: 'David Miller', company: 'Solutions Co', email: 'david@solutions.com', phone: '+91 98765 44444', funnel: 'Negotiating', status: 'Hot', source: 'RMAX', notes: 'In final discussion' },
];

export function Leads({ dataSource, theme }: LeadsProps) {
  const isDark = theme === 'dark';
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunnel, setFilterFunnel] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFunnel = filterFunnel === 'All' || lead.funnel === filterFunnel;
    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    const matchesSource = dataSource === 'All' || lead.source === dataSource;
    return matchesSearch && matchesFunnel && matchesStatus && matchesSource;
  });

  const handleAddLead = (lead: Omit<Lead, 'id'>) => {
    const newLead = {
      ...lead,
      id: `L${String(leads.length + 1).padStart(3, '0')}`,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Leads Management
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
          Create Lead
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
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#0F172A] border-[#334155] text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Funnel Filter */}
          <select
            value={filterFunnel}
            onChange={(e) => setFilterFunnel(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#0F172A] border-[#334155] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          >
            <option value="All">All Funnels</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Negotiating">Negotiating</option>
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
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'}`}>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Lead Name</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Company</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Funnel</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Source</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                  <td className={`py-4 px-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                      }`}>
                        {lead.name.charAt(0)}
                      </div>
                      {lead.name}
                    </div>
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {lead.company}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {lead.email}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {lead.phone}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      lead.funnel === 'Negotiating'
                        ? 'bg-purple-500/20 text-purple-400'
                        : lead.funnel === 'Qualified'
                        ? 'bg-blue-500/20 text-blue-400'
                        : lead.funnel === 'Contacted'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {lead.funnel}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      lead.status === 'Hot'
                        ? 'bg-red-500/20 text-red-400'
                        : lead.status === 'Warm'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      lead.source === 'BSNL'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
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
                          setSelectedLead(lead);
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

      {deleteModalOpen && (
        <DeleteConfirmModal
          title="Delete Lead"
          message={`Are you sure you want to delete ${selectedLead?.name}? This action cannot be undone.`}
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
