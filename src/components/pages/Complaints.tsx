import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Upload } from 'lucide-react';
import type { DataSource } from '../../types';
import { ComplaintModal } from '../modals/ComplaintModal';
import { ViewComplaintModal } from '../modals/ViewComplaintModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { toast } from 'sonner';
import { ComplaintsService } from '../../services/complaintsService';
import { collection, onSnapshot, query, orderBy, db } from '../../firebase/config';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  useEffect(() => {
    setLoading(true);
    const complaintsQuery = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(complaintsQuery,
      (snapshot) => {
        const complaintsData: Complaint[] = [];
        snapshot.forEach((doc) => {
          complaintsData.push({ id: doc.id, ...doc.data() } as Complaint);
        });
        setComplaints(complaintsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to complaints:', error);
        setLoading(false);
        toast.error('Failed to sync with Firebase');
      }
    );

    return () => unsubscribe();
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

  if (loading) {
    return (
      <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Loading complaints from Firebase...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${isDark ? '#2d3748' : '#f1f5f9'}; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#4a5568' : '#cbd5e1'}; border-radius: 4px; border: 2px solid ${isDark ? '#2d3748' : '#f1f5f9'}; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#718096' : '#94a3b8'}; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: ${isDark ? '#4a5568 #2d3748' : '#cbd5e1 #f1f5f9'}; }
      `}</style>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Complaints Management</h1>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800'}`}>
              🔥 Firebase Live Data
            </div>
          </div>
        </div>
        
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300 placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              placeholder={`Search in ${searchField}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
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
              <option value="ID">Complaint ID</option>
              <option value="Complaint">Complaint</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Pending">Pending</option>
              <option value="Not Resolved">Not Resolved</option>
            </select>

            <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg shadow-green-900/20"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <button
              onClick={() => setModalMode('add')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`w-full rounded-lg border shadow-xl overflow-hidden flex flex-col ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`} style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full whitespace-nowrap text-left text-sm border-separate border-spacing-0">
            <thead className={`font-semibold uppercase tracking-wider sticky top-0 z-30 ${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              <tr>
                <th className="px-6 py-4 min-w-[100px] border-b border-inherit bg-inherit">ID</th>
                <th className="px-6 py-4 min-w-[200px] border-b border-inherit bg-inherit">Customer Name</th>
                <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">Landline No</th>
                <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">Mobile</th>
                <th className="px-6 py-4 min-w-[300px] border-b border-inherit bg-inherit">Address</th>
                <th className="px-6 py-4 min-w-[200px] border-b border-inherit bg-inherit">Complaints</th>
                <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">Employee</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Booking Date</th>
                <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Resolve Date</th>
                <th className={`px-6 py-4 min-w-[150px] border-b border-inherit sticky right-[110px] z-30 shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'}`}>Status</th>
                <th className={`px-6 py-4 min-w-[110px] text-center border-b border-inherit sticky right-0 z-30 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'}`}>Options</th>
              </tr>
            </thead>
            
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredComplaints.length === 0 ? (
                 <tr>
                  <td colSpan={11} className="px-6 py-8 text-center opacity-50">
                    No complaints found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className={`group hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 font-medium border-b border-inherit">{complaint.id}</td>
                  <td className="px-6 py-4 font-medium border-b border-inherit">{complaint.customerName}</td>
                  <td className="px-6 py-4 border-b border-inherit">{complaint.landlineNo}</td>
                  <td className="px-6 py-4 border-b border-inherit">{complaint.mobileNo || '-'}</td>
                  <td className="px-6 py-4 border-b border-inherit">{complaint.address || '-'}</td>
                  <td className="px-6 py-4 border-b border-inherit">{complaint.complaints}</td>
                  <td className="px-6 py-4 border-b border-inherit">{complaint.employee}</td>
                  <td className="px-6 py-4 border-b border-inherit">{complaint.bookingDate}</td>
                  <td className="px-6 py-4 border-b border-inherit">{complaint.resolveDate || '-'}</td>

                  <td className={`px-6 py-4 border-b border-inherit sticky right-[110px] z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-[#242a38] group-hover:bg-[#2d3546]' : 'bg-white group-hover:bg-gray-50'}`}>
                    <button
                      onClick={() => handleStatusChange(complaint.id, complaint.status, complaint)} 
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                        complaint.status === 'Open' ? 'bg-yellow-500 text-white border-yellow-600 shadow-md shadow-yellow-500/20' :
                        complaint.status === 'Resolved' ? 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20' :
                        'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                      }`}
                    >
                      {complaint.status}
                    </button>
                  </td>

                  <td className={`px-6 py-4 border-b border-inherit text-center sticky right-0 z-20 ${isDark ? 'bg-[#242a38] group-hover:bg-[#2d3546]' : 'bg-white group-hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedComplaint(complaint); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors p-1" title="View"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => { setSelectedComplaint(complaint); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1" title="Edit"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => { setSelectedComplaint(complaint); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-gray-700 bg-[#1f2533] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <div className="text-sm">Showing {filteredComplaints.length} of {complaints.length} results (Firebase Live Data)</div>
            <div className="text-xs opacity-70">🔥 Real-time sync enabled</div>
        </div>
      </div>

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