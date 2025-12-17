import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';
import type { DataSource } from '../../types';
import { LeadModal } from '@/components/modals/LeadModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { ConvertLeadModal } from '@/components/modals/ConvertLeadModal';
import { WhatsAppService } from '@/services/whatsappService';
import { LeadService } from '@/services/leadService'; // ✅ Import LeadService
import { CustomerService } from '@/services/customerService'; // ✅ Import CustomerService
import { Customer } from '../../types';
import { toast } from 'sonner';

import { useSearch } from '../../contexts/SearchContext';

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
  status: 'Success' | 'Rejected' | 'Sale' | 'Pending';
  source: string;
}

// Helper to generate Customer ID format
const generateCustomerId = (): string => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `104562-${random}-CUSTOMER-RECORD`;
};

export function Leads({ dataSource, theme }: LeadsProps) {
  const isDark = theme === 'dark';
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [filterStatus, setFilterStatus] = useState('All');

  const [searchField, setSearchField] = useState('All');
  const { searchQuery } = useSearch();
  




  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // 1. Load Data from Firebase
  const fetchLeads = async () => {
    try {
      const data = await LeadService.getLeads();
      setLeads(data);
    } catch (error) {
      toast.error("Failed to load leads");
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [dataSource]);

  // 2. Add Lead Logic
  const handleAddLead = async (leadData: Omit<Lead, 'id'>) => {
    try {
      await LeadService.addLead(leadData as any); // Type casting if needed
      toast.success("Lead Added Successfully!");
      fetchLeads();
      setModalMode(null);
    } catch (e) {
      toast.error("Failed to add lead");
    }
  };

  // 3. Edit Lead Logic
  const handleEditLead = async (leadData: Lead) => {
    try {
      const { id, ...updates } = leadData;
      await LeadService.updateLead(id, updates);
      toast.success("Lead Updated!");
      fetchLeads();
      setModalMode(null);
      setSelectedLead(null);
    } catch (e) {
      toast.error("Failed to update lead");
    }
  };

  // 4. Delete Lead Logic
  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    try {
      await LeadService.deleteLead(selectedLead.id);
      toast.success("Lead Deleted");
      fetchLeads();
      setDeleteModalOpen(false);
      setSelectedLead(null);
    } catch (e) {
      toast.error("Failed to delete lead");
    }
  };

  // --- CORE LOGIC: Handle Status Change & Sale Conversion ---
  const handleStatusChange = async (id: string, newStatus: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    if (lead.status === newStatus) return;

    try {
      // Logic: Sale -> Open Convert Modal
      if (newStatus === 'Sale') {
        setLeadToConvert(lead);
        setConvertModalOpen(true);
        return; // Don't update status yet, wait for modal submission
      }

      // For other status changes, confirm and update
      if (!window.confirm(`Change status from ${lead.status} to ${newStatus}?`)) return;

      // Update Lead Status in Firebase
      await LeadService.updateLead(id, { status: newStatus as any });
      fetchLeads(); // Refresh UI

    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  // Handle Convert Lead to Customer
  const handleConvertLead = async (formData: { landline: string; plan: string; oltIp: string; ott: string }) => {
    if (!leadToConvert) return;

    setIsConverting(true);
    try {
      const newCustomer: Customer = {
        id: generateCustomerId(),
        landline: formData.landline,
        name: leadToConvert.customerName,
        mobileNo: leadToConvert.phoneNo,
        altMobileNo: '',
        vlanId: '',
        bbId: '',
        voipPassword: '',
        ontMake: '',
        ontType: '',
        ontMacAddress: '',
        ontBillNo: '',
        ont: 'Paid ONT',
        offerPrize: '0',
        routerMake: '',
        routerMacId: '',
        oltIp: formData.oltIp,
        installationDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        source: (leadToConvert.source === 'BSNL' || leadToConvert.source === 'RMAX') ? leadToConvert.source : 'BSNL',
        plan: formData.plan,
        email: '',
        ottSubscription: formData.ott,
        address: leadToConvert.address
      };

      // Save to Firebase Customers Collection
      await CustomerService.addCustomer(newCustomer);

      // Update Lead Status to Sale
      await LeadService.updateLead(leadToConvert.id, { status: 'Sale' as any });

      toast.success(`${leadToConvert.customerName} converted to Customer!`);

      // Send WhatsApp Welcome Message
      setTimeout(() => {
        WhatsAppService.sendWelcome(newCustomer);
      }, 1000);

      // Close modal and refresh
      setConvertModalOpen(false);
      setLeadToConvert(null);
      fetchLeads();

    } catch (error) {
      console.error(error);
      toast.error("Failed to convert lead to customer");
    } finally {
      setIsConverting(false);
    }
  };

  // Filtering Logic (Same as before)
// Filtering Logic
  const filteredLeads = leads.filter(lead => {
    // 1. Check Status & Source Filters (First check these)
    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    const matchesSource = dataSource === 'All' || lead.source === dataSource;

    // 2. If NO Search Query, return based on filters only
    if (!searchQuery) {
      return matchesStatus && matchesSource;
    }

    // 3. If Search Query EXISTS, check matching text
    const searchLower = searchQuery.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
      matchesSearch =
        lead.customerName.toLowerCase().includes(searchLower) ||
        (lead.id && lead.id.includes(searchLower)) ||
        lead.phoneNo.includes(searchLower) ||
        (lead.remarks && lead.remarks.toLowerCase().includes(searchLower)); // Added check for remarks existence
    } else if (searchField === 'Name') {
      matchesSearch = lead.customerName.toLowerCase().includes(searchLower);
    } else if (searchField === 'ID') {
      matchesSearch = lead.id && lead.id.includes(searchLower);
    } else if (searchField === 'Phone') {
      matchesSearch = lead.phoneNo.includes(searchLower);
    }

    // Return combination of ALL checks
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>

      {/* Header & Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border bg-inherit border-inherit shadow-sm">
        

        <div className="flex gap-3 w-full md:w-auto">
          {/* Search Field Dropdown */}
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className={`px-4 py-2.5 rounded-md border outline-none text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
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
            className={`px-4 py-2 rounded-md border outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
          >
            <option value="All">All Status</option>
            <option value="Success">Success</option>
            <option value="Rejected">Rejected</option>
            <option value="Sale">Sale</option>
          </select>

          <button onClick={() => setModalMode('add')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg transition-all">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl border shadow-lg overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`uppercase font-bold ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
              <tr>
                <th className="px-6 py-4 min-w-[100px]">ID</th>
                <th className="px-6 py-4 min-w-[200px]">Name</th>
                <th className="px-6 py-4 min-w-[140px]">Phone</th>
                <th className="px-6 py-4 min-w-[200px]">Address</th>
                <th className="px-6 py-4 min-w-[120px]">Followup</th>
                <th className="px-6 py-4 text-center min-w-[250px]">Status Action</th>
                <th className="px-6 py-4 text-center min-w-[120px]">Options</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 font-medium">{lead.id}</td>
                  <td className="px-6 py-4 font-medium">{lead.customerName}</td>
                  <td className="px-6 py-4">{lead.phoneNo}</td>
                  <td className="px-6 py-4 max-w-[200px] truncate" title={lead.address}>{lead.address}</td>
                  <td className="px-6 py-4">{lead.followupDate}</td>

                  {/* DYNAMIC STATUS BUTTONS */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Success Button */}
                      <button
                        onClick={() => handleStatusChange(lead.id, 'Success')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${lead.status === 'Success'
                            ? 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20'
                            : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
                          }`}
                      >
                        Selected
                      </button>

                      {/* Rejected Button */}
                      <button
                        onClick={() => handleStatusChange(lead.id, 'Rejected')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${lead.status === 'Rejected'
                            ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                            : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                          }`}
                      >
                        Rejected
                      </button>

                      {/* Sale Button */}
                      <button
                        onClick={() => handleStatusChange(lead.id, 'Sale')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${lead.status === 'Sale'
                            ? 'bg-yellow-500 text-black border-yellow-600 shadow-md shadow-yellow-500/20'
                            : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400'
                          }`}
                      >
                        Sale
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setSelectedLead(lead); setViewModalOpen(true); }} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedLead(lead); setModalMode('edit'); }} className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedLead(lead); setDeleteModalOpen(true); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-900 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
          <div className="text-sm">
            Showing {filteredLeads.length} results
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modalMode && <LeadModal mode={modalMode} lead={selectedLead} theme={theme} dataSource={dataSource} onClose={() => setModalMode(null)} onSave={(l) => {
        if (modalMode === 'add') {
          handleAddLead(l as Omit<Lead, 'id'>);
        } else {
          handleEditLead(l as Lead);
        }
      }} />}

      {deleteModalOpen && <DeleteConfirmModal title="Delete Lead" message="Are you sure?" theme={theme} onConfirm={handleDeleteLead} onCancel={() => setDeleteModalOpen(false)} />}

      {viewModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-xl p-6 border shadow-2xl ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Lead Details</h2>
              <button onClick={() => setViewModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded bg-inherit border border-inherit">
                <span className="text-xs font-bold uppercase opacity-70">Name</span>
                <p className="font-medium">{selectedLead.customerName}</p>
              </div>
              <div className="p-3 rounded bg-inherit border border-inherit">
                <span className="text-xs font-bold uppercase opacity-70">Phone</span>
                <p className="font-medium">{selectedLead.phoneNo}</p>
              </div>
              <div className="p-3 rounded bg-inherit border border-inherit">
                <span className="text-xs font-bold uppercase opacity-70">Status</span>
                <p className={`font-bold ${selectedLead.status === 'Success' ? 'text-green-500' :
                    selectedLead.status === 'Sale' ? 'text-yellow-500' :
                      'text-red-500'
                  }`}>{selectedLead.status}</p>
              </div>
              <div className="p-3 rounded bg-inherit border border-inherit">
                <span className="text-xs font-bold uppercase opacity-70">Source</span>
                <p className="font-medium">{selectedLead.source}</p>
              </div>
              <div className="p-3 rounded bg-inherit border border-inherit">
                <span className="text-xs font-bold uppercase opacity-70">Remarks</span>
                <p className="font-medium">{selectedLead.remarks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {convertModalOpen && (
        <ConvertLeadModal
          isOpen={convertModalOpen}
          onClose={() => {
            setConvertModalOpen(false);
            setLeadToConvert(null);
          }}
          onSubmit={handleConvertLead}
          isLoading={isConverting}
          theme={theme}
        />
      )}
    </div>
  );
}