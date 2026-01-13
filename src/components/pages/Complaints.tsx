import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Upload, ChevronDown, Loader2 } from 'lucide-react';
import type { DataSource } from '../../types';
import { ComplaintModal } from '../modals/ComplaintModal';
import { ViewComplaintModal } from '../modals/ViewComplaintModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { toast } from 'sonner';
import { ComplaintsService } from '../../services/complaintsService';
import { useSearch } from '../../contexts/SearchContext';
import { WhatsAppService } from '../../services/whatsappService';

interface ComplaintsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export interface Complaint {
  id: string;
  customerName: string;
  landlineNo: string;
  mobileNo?: string;
  address?: string;
  plan?: string;
  complaints: string;
  employee: string;
  bookingDate: string;
  resolveDate: string;
  status: 'Open' | 'Resolved' | 'Pending' | 'Not Resolved';
  source: string;
  createdAt?: string;
}

export function Complaints({ dataSource, theme }: ComplaintsProps) {
  const isDark = theme === 'dark';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const { searchQuery, setSearchQuery } = useSearch();

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data with polling
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await ComplaintsService.getComplaints();
        setComplaints(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching complaints:', error);
        setLoading(false);
        toast.error('Failed to load complaints');
      }
    };

    fetchComplaints();
    const interval = setInterval(fetchComplaints, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [dataSource]);

  // Filtering Logic
  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = filterStatus === 'All' || complaint.status === filterStatus;
    const matchesSource = dataSource === 'All' || complaint.source === dataSource;

    if (!searchQuery) return matchesStatus && matchesSource;

    const searchLower = searchQuery.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
      matchesSearch =
        complaint.customerName.toLowerCase().includes(searchLower) ||
        complaint.id.toLowerCase().includes(searchLower) ||
        complaint.landlineNo.includes(searchLower) ||
        complaint.complaints.toLowerCase().includes(searchLower);
    } else if (searchField === 'Name') {
      matchesSearch = complaint.customerName.toLowerCase().includes(searchLower);
    } else if (searchField === 'ID') {
      matchesSearch = complaint.id.toLowerCase().includes(searchLower);
    } else if (searchField === 'Complaint') {
      matchesSearch = complaint.complaints.toLowerCase().includes(searchLower);
    }

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleAddComplaint = async (complaint: Omit<Complaint, 'id'>) => {
    try {
      await ComplaintsService.addComplaint(complaint);
      setModalMode(null);
      toast.success("Complaint added successfully");
    } catch (error) {
      console.error('Error adding complaint:', error);
      toast.error('Failed to add complaint');
    }
  };

  const handleEditComplaint = async (complaint: Complaint) => {
    try {
      await ComplaintsService.updateComplaint(complaint.id, complaint);
      setModalMode(null);
      setSelectedComplaint(null);
      toast.success("Complaint updated successfully");
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint');
    }
  };

  const handleDeleteComplaint = async () => {
    if (selectedComplaint) {
      try {
        await ComplaintsService.deleteComplaint(selectedComplaint.id);
        setDeleteModalOpen(false);
        setSelectedComplaint(null);
        toast.success("Complaint deleted successfully");
      } catch (error) {
        console.error('Error deleting complaint:', error);
        toast.error('Failed to delete complaint');
      }
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string, complaintData: Complaint) => {
    if (updatingStatus === id) return;
    setUpdatingStatus(id);

    let newStatus: any;

    if (currentStatus === 'Not Resolved' || currentStatus === 'Open') {
      newStatus = 'Pending';
    } else if (currentStatus === 'Pending') {
      newStatus = 'Resolved';
    } else {
      newStatus = 'Open';
    }

    try {
      await ComplaintsService.updateComplaint(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);

      if (newStatus === 'Resolved' && complaintData.mobileNo) {
        WhatsAppService.sendComplaintResolved(
          complaintData.customerName,
          complaintData.mobileNo,
          complaintData.id
        );
        toast.success("WhatsApp resolution message sent!");
      }

    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update complaint status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newComplaints: Omit<Complaint, 'id'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 4) {
          newComplaints.push({
            customerName: cols[0]?.trim() || 'Unknown',
            landlineNo: cols[1]?.trim() || '',
            address: cols[2]?.trim() || '',
            complaints: cols[3]?.trim() || 'Bulk Uploaded',
            source: cols[4]?.trim() || 'BSNL',
            status: 'Open',
            employee: 'Unassigned',
            bookingDate: new Date().toISOString().split('T')[0],
            resolveDate: ''
          });
        }
      }

      if (newComplaints.length > 0) {
        try {
          for (const complaint of newComplaints) {
            await ComplaintsService.addComplaint(complaint);
          }
          toast.success(`Uploaded ${newComplaints.length} complaints successfully!`);
        } catch (error) {
          console.error('Error uploading complaints:', error);
          toast.error('Failed to upload some complaints');
        }
      } else {
        toast.error("No valid data found in CSV");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>

      {/* FIXED SCROLLBAR STYLES: Matches Master Template (8px) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${isDark ? '#1a1f2c' : '#f1f5f9'}; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#475569' : '#94a3b8'}; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: ${isDark ? '#334155 #1a1f2c' : '#cbd5e1 #f1f5f9'}; }
      `}</style>

      {/* Header & Controls - Mobile Responsive */}
      <div className={`mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>

        {/* LEFT SIDE: Search Input */}
        <div className="relative w-full md:w-96">
          <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${isDark
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
              className={`w-full md:w-auto appearance-none px-4 py-2.5 pr-10 rounded-md border outline-none text-sm font-medium transition-colors ${isDark
                  ? 'bg-[#0f172a] border-slate-700 text-slate-200'
                  : 'bg-white border-gray-200 text-gray-900'
                }`}
            >
              <option value="All">All Fields</option>
              <option value="Name">Name</option>
              <option value="ID">ID</option>
              <option value="Complaint">Complaint</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full md:w-auto appearance-none px-4 py-2.5 pr-10 rounded-md border outline-none text-sm font-medium transition-colors ${isDark
                  ? 'bg-[#0f172a] border-slate-700 text-slate-200'
                  : 'bg-white border-gray-200 text-gray-900'
                }`}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Pending">Pending</option>
              <option value="Not Resolved">Not Resolved</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </div>

          <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />

          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-lg transition-all w-full md:w-auto">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button onClick={() => setModalMode('add')} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg transition-all w-full md:w-auto">
            <Plus className="h-4 w-4" />
            <span>Add Complaint</span>
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER - Fixed Height */}
      <div className={`rounded-xl border shadow-lg overflow-hidden flex flex-col ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`} style={{ height: 'calc(100vh - 220px)' }}>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-sm text-left border-separate border-spacing-0 whitespace-nowrap">
            <thead className={`uppercase font-bold sticky top-0 z-40 ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
              <tr>
                <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">ID</th>
                <th className="px-6 py-4 min-w-[200px] border-b border-inherit bg-inherit">Customer Name</th>
                <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">Landline No</th>
                <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">Mobile</th>
                <th className="px-6 py-4 min-w-[300px] border-b border-inherit bg-inherit">Address</th>
                <th className="px-6 py-4 min-w-[200px] border-b border-inherit bg-inherit">Complaints</th>
                <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">Employee</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Booking Date</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Resolve Date</th>

                {/* Fixed Status Column Header */}
                <th className={`px-6 py-4 text-center min-w-[150px] sticky right-[110px] z-40 border-b border-inherit shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  Status
                </th>

                {/* Fixed Options Column Header */}
                <th className={`px-6 py-4 text-center min-w-[110px] sticky right-0 z-40 border-b border-inherit ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  Options
                </th>
              </tr>
            </thead>

            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading complaints...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {dataSource === 'All' ? 'No complaints found.' : `No ${dataSource} complaints found.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-medium border-b border-inherit ${isDark ? 'text-white' : 'text-gray-900'}`}>{complaint.id}</td>
                    <td className={`px-6 py-4 font-medium border-b border-inherit ${isDark ? 'text-white' : 'text-gray-900'}`}>{complaint.customerName}</td>

                    {/* Landline Color Toggle */}
                    <td className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{complaint.landlineNo}</td>

                    {/* Mobile Color Toggle */}
                    <td className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{complaint.mobileNo || '-'}</td>

                    <td className="px-6 py-4 border-b border-inherit">{complaint.address || '-'}</td>
                    <td className={`px-6 py-4 font-medium border-b border-inherit ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{complaint.complaints}</td>
                    <td className="px-6 py-4 border-b border-inherit">{complaint.employee}</td>
                    <td className="px-6 py-4 border-b border-inherit">{complaint.bookingDate}</td>
                    <td className="px-6 py-4 border-b border-inherit">{complaint.resolveDate || '-'}</td>

                    {/* Sticky Status Column Body */}
                    <td className={`px-6 py-4 text-center sticky right-[110px] z-20 border-b border-inherit shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                      <button
                        onClick={() => handleStatusChange(complaint.id, complaint.status, complaint)}
                        disabled={updatingStatus === complaint.id}
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold transition-all border ${complaint.status === 'Resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' :
                            complaint.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' :
                              complaint.status === 'Open' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                          } ${updatingStatus === complaint.id ? 'opacity-70 cursor-wait' : 'hover:scale-105'}`}
                      >
                        {updatingStatus === complaint.id ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                          </div>
                        ) : (
                          complaint.status
                        )}
                      </button>
                    </td>

                    {/* Sticky Options Column Body */}
                    <td className={`px-6 py-4 text-center sticky right-0 z-20 border-b border-inherit ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setSelectedComplaint(complaint); setViewModalOpen(true); }} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedComplaint(complaint); setModalMode('edit'); }} className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedComplaint(complaint); setDeleteModalOpen(true); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
            Total Complaints: {filteredComplaints.length}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalMode && (
        <ComplaintModal
          mode={modalMode}
          complaint={selectedComplaint}
          theme={theme}
          dataSource={dataSource}
          onClose={() => { setModalMode(null); setSelectedComplaint(null); }}
          onSave={modalMode === 'add' ? handleAddComplaint : handleEditComplaint}
        />
      )}

      {viewModalOpen && selectedComplaint && (
        <ViewComplaintModal
          complaint={selectedComplaint}
          theme={theme}
          onClose={() => { setViewModalOpen(false); setSelectedComplaint(null); }}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          title="Delete Complaint"
          message={`Are you sure you want to delete complaint ${selectedComplaint?.id}?`}
          theme={theme}
          onConfirm={handleDeleteComplaint}
          onCancel={() => { setDeleteModalOpen(false); setSelectedComplaint(null); }}
        />
      )}
    </div>
  );
}