import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X, UserCheck } from 'lucide-react';
import type { DataSource } from '../../App';
import { LeadModal } from '../modals/LeadModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { Customer } from '../../types'; // Importing shared Customer type
import { toast } from 'sonner'; // Assuming you have sonner for alerts, otherwise use alert()

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
  status: 'Success' | 'Rejected' | 'Sale'; // Added Sale status
  source: string;
}

// LocalStorage utility functions
const STORAGE_KEY = 'leads-data';
const CUSTOMER_STORAGE_KEY = 'customers-data'; // Key to push data to Customers page

const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}-${random}`;
};

// Helper to generate Customer ID format: 104562-XXXXXX-CUSTOMER-RECORD
const generateCustomerId = (): string => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `104562-${random}-CUSTOMER-RECORD`;
};

const saveLeadsToStorage = (leads: Lead[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch (error) {
    console.error('Failed to save leads to localStorage:', error);
  }
};

const loadLeadsFromStorage = (): Lead[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Failed to load leads from localStorage:', error);
  }
  return [];
};

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
    remarks: '22.05.24 CALL SEITHA POTHU SATURDAY SOLVATHAGA SONNAR...', 
    followupDate: '0024-05-29', 
    status: 'Rejected', 
    source: 'Private' 
  },
];

export function Leads({ dataSource, theme }: LeadsProps) {
  const isDark = theme === 'dark';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    const storedLeads = loadLeadsFromStorage();
    if (storedLeads.length > 0) {
      setLeads(storedLeads);
    } else {
      setLeads(mockLeads);
      saveLeadsToStorage(mockLeads);
    }
  }, []);

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
    const newLead = { ...lead, id: generateUniqueId() };
    const updatedLeads = [...leads, newLead];
    setLeads(updatedLeads);
    saveLeadsToStorage(updatedLeads);
    setModalMode(null);
  };

  const handleEditLead = (lead: Lead) => {
    const updatedLeads = leads.map(l => l.id === lead.id ? lead : l);
    setLeads(updatedLeads);
    saveLeadsToStorage(updatedLeads);
    setModalMode(null);
    setSelectedLead(null);
  };

  const handleDeleteLead = () => {
    if (selectedLead) {
      const updatedLeads = leads.filter(l => l.id !== selectedLead.id);
      setLeads(updatedLeads);
      saveLeadsToStorage(updatedLeads);
      setDeleteModalOpen(false);
      setSelectedLead(null);
    }
  };

  // --- NEW: Logic to Handle Status Change & Sale Conversion ---
  const handleStatusChange = (id: string, newStatus: 'Success' | 'Rejected' | 'Sale') => {
    // 1. Find the lead
    const leadToUpdate = leads.find(l => l.id === id);
    if (!leadToUpdate) return;

    // 2. Confirmation Logic
    if (!window.confirm(`Are you sure you want to change status from ${leadToUpdate.status} to ${newStatus}?`)) {
        return;
    }

    // 3. If Status is SALE -> Add to Customers
    if (newStatus === 'Sale') {
        // Create new Customer Object
        const newCustomer: Customer = {
            id: generateCustomerId(),
            landline: '', // To be filled in Customer page
            name: leadToUpdate.customerName,
            mobileNo: leadToUpdate.phoneNo,
            altMobileNo: '',
            vlanId: '',
            bbId: '',
            voipPassword: '',
            ontMake: '',
            ontType: '',
            ontMacAddress: '',
            ontBillNo: '',
            ont: 'Paid ONT', // Default
            offerPrize: '0',
            routerMake: '',
            routerMacId: '',
            oltIp: '',
            installationDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            source: leadToUpdate.source,
            plan: '',
            email: ''
        };

        // Get existing customers and add new one
        try {
            const existingCustomersStr = localStorage.getItem(CUSTOMER_STORAGE_KEY);
            const existingCustomers = existingCustomersStr ? JSON.parse(existingCustomersStr) : [];
            const updatedCustomers = [newCustomer, ...existingCustomers]; // Add to top
            localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updatedCustomers));
            toast.success(`${leadToUpdate.customerName} moved to Customers list!`);
        } catch (err) {
            console.error("Error moving to customer", err);
            toast.error("Failed to move to customer list");
        }
    }

    // 4. Update Lead Status locally
    const updatedLeads = leads.map(l => l.id === id ? { ...l, status: newStatus } : l);
    setLeads(updatedLeads);
    saveLeadsToStorage(updatedLeads);
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Leads Management</h1>
        
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
          
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

          <div className="flex gap-3 w-full md:w-auto">
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

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Success">Success</option>
              <option value="Rejected">Rejected</option>
              <option value="Sale">Sale</option>
            </select>

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

      <div className={`w-full rounded-lg border shadow-xl ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className={`${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'} font-semibold uppercase tracking-wider`}>
              <tr>
                <th className={`px-6 py-4 min-w-[80px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ID</th>
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Customer Name</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Phone No</th>
                <th className={`px-6 py-4 min-w-[300px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Address</th>
                <th className={`px-6 py-4 min-w-[400px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Remarks</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Followup Date</th>

                <th className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                  Status Action
                </th>
                <th className={`px-6 py-4 min-w-[110px] text-center border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-0 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20`}>
                  Options
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.id}</td>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.customerName}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.phoneNo}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.address}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.remarks}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{lead.followupDate}</td>

                  {/* Dynamic Status Selector */}
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                      className={`text-xs font-bold px-2 py-1 rounded border-0 cursor-pointer outline-none ${
                        lead.status === 'Success'
                          ? 'bg-green-900/30 text-green-400'
                          : lead.status === 'Rejected'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-yellow-900/30 text-yellow-400' // SALE Color
                      }`}
                    >
                        <option value="Success" className="text-green-500 bg-gray-800">Success</option>
                        <option value="Rejected" className="text-red-500 bg-gray-800">Rejected</option>
                        <option value="Sale" className="text-yellow-500 bg-gray-800">Sale (Convert)</option>
                    </select>
                  </td>

                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedLead(lead); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedLead(lead); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedLead(lead); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-gray-700 bg-[#1f2533] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <div className="text-sm">
                Showing {filteredLeads.length} results
            </div>
        </div>
      </div>

      {/* Modals... (Kept same logic) */}
      {modalMode && (
        <LeadModal
          mode={modalMode}
          lead={selectedLead}
          theme={theme}
          onClose={() => { setModalMode(null); setSelectedLead(null); }}
          onSave={modalMode === 'add' ? handleAddLead : handleEditLead}
        />
      )}

      {viewModalOpen && selectedLead && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-2xl rounded-xl p-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">Lead Details</h2>
                    <button onClick={() => setViewModalOpen(false)}><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Name:</strong> {selectedLead.customerName}</p>
                    <p><strong>Phone:</strong> {selectedLead.phoneNo}</p>
                    <p><strong>Status:</strong> {selectedLead.status}</p>
                    <p className="col-span-2"><strong>Address:</strong> {selectedLead.address}</p>
                    <p className="col-span-2"><strong>Remarks:</strong> {selectedLead.remarks}</p>
                </div>
            </div>
         </div>
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          title="Delete Lead"
          message={`Are you sure you want to delete lead ${selectedLead?.id}?`}
          theme={theme}
          onConfirm={handleDeleteLead}
          onCancel={() => { setDeleteModalOpen(false); setSelectedLead(null); }}
        />
      )}
    </div>
  );
}