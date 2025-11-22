import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Upload } from 'lucide-react';
import type { DataSource } from '../../App';
import { ComplaintModal } from '../modals/ComplaintModal';
import { ViewComplaintModal } from '../modals/ViewComplaintModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { toast } from 'sonner';

interface ComplaintsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export interface Complaint {
  id: string;
  customerName: string;
  landlineNo: string;
  address: string;
  complaints: string;
  employee: string;
  bookingDate: string;
  resolveDate: string;
  status: 'Resolved' | 'Not Resolved';
  source: string;
}

// Key for persisting data
const COMPLAINT_STORAGE_KEY = 'complaints-data';

// Keep mock data for fallback
const mockComplaints: Complaint[] = [
  { 
    id: '645', 
    customerName: 'M PANDIAN', 
    landlineNo: '04562-266001', 
    address: 'NO4,MANINAGARAM STREET,VIRUDHUNAGAR,,626001', 
    complaints: 'LOS', 
    employee: 'R.ULAGANATHAN', 
    bookingDate: '2025-10-27', 
    resolveDate: '2025-10-27', 
    status: 'Not Resolved', 
    source: 'BSNL' 
  },
  // ... (other mocks kept for initialization)
];

export function Complaints({ dataSource, theme }: ComplaintsProps) {
  const isDark = theme === 'dark';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  // File Input Ref for Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  useEffect(() => {
    const stored = localStorage.getItem(COMPLAINT_STORAGE_KEY);
    if (stored) {
        setComplaints(JSON.parse(stored));
    } else {
        setComplaints(mockComplaints);
        localStorage.setItem(COMPLAINT_STORAGE_KEY, JSON.stringify(mockComplaints));
    }
  }, []);

  // Save Data Helper
  const updateComplaints = (newData: Complaint[]) => {
      setComplaints(newData);
      localStorage.setItem(COMPLAINT_STORAGE_KEY, JSON.stringify(newData));
  };

  const filteredComplaints = complaints.filter(complaint => {
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
        matchesSearch = 
          complaint.customerName.toLowerCase().includes(searchLower) ||
          complaint.id.includes(searchLower) ||
          complaint.landlineNo.includes(searchLower) ||
          complaint.complaints.toLowerCase().includes(searchLower);
    } else if (searchField === 'Name') {
        matchesSearch = complaint.customerName.toLowerCase().includes(searchLower);
    } else if (searchField === 'ID') {
        matchesSearch = complaint.id.includes(searchLower);
    } else if (searchField === 'Complaint') {
        matchesSearch = complaint.complaints.toLowerCase().includes(searchLower);
    }

    const matchesStatus = filterStatus === 'All' || complaint.status === filterStatus;
    const matchesSource = dataSource === 'All' || complaint.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleAddComplaint = (complaint: Omit<Complaint, 'id'>) => {
    const newComplaint = {
      ...complaint,
      id: String(Date.now()).slice(-6), // Generate simple unique ID
    };
    updateComplaints([newComplaint, ...complaints]);
    setModalMode(null);
    toast.success("Complaint added successfully");
  };

  const handleEditComplaint = (complaint: Complaint) => {
    const updated = complaints.map(c => c.id === complaint.id ? complaint : c);
    updateComplaints(updated);
    setModalMode(null);
    setSelectedComplaint(null);
    toast.success("Complaint updated");
  };

  const handleDeleteComplaint = () => {
    if (selectedComplaint) {
      const updated = complaints.filter(c => c.id !== selectedComplaint.id);
      updateComplaints(updated);
      setDeleteModalOpen(false);
      setSelectedComplaint(null);
      toast.success("Complaint deleted");
    }
  };

  // --- DYNAMIC STATUS CHANGE ---
  const handleStatusChange = (id: string, newStatus: 'Resolved' | 'Not Resolved') => {
      const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
      updateComplaints(updated);
      toast.success(`Status updated to ${newStatus}`);
  };

  // --- BULK UPLOAD HANDLER ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Simple CSV parser (Assumes Header: Name,Landline,Address,Complaint,Source)
      const lines = text.split('\n');
      const newComplaints: Complaint[] = [];
      
      // Skip header row (i=1)
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 4) {
            newComplaints.push({
                id: String(Date.now() + i),
                customerName: cols[0]?.trim() || 'Unknown',
                landlineNo: cols[1]?.trim() || '',
                address: cols[2]?.trim() || '',
                complaints: cols[3]?.trim() || 'Bulk Uploaded',
                source: cols[4]?.trim() || 'BSNL',
                status: 'Not Resolved',
                employee: 'Unassigned',
                bookingDate: new Date().toISOString().split('T')[0],
                resolveDate: ''
            });
        }
      }

      if (newComplaints.length > 0) {
          updateComplaints([...newComplaints, ...complaints]);
          toast.success(`Uploaded ${newComplaints.length} complaints successfully!`);
      } else {
          toast.error("No valid data found in CSV");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Complaints Management</h1>
        
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
              <option value="Resolved">Resolved</option>
              <option value="Not Resolved">Not Resolved</option>
            </select>

            {/* Bulk Upload */}
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

      <div className={`w-full rounded-lg border shadow-xl ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className={`${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'} font-semibold uppercase tracking-wider`}>
              <tr>
                <th className={`px-6 py-4 min-w-[100px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ID</th>
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Customer Name</th>
                <th className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Landline No</th>
                <th className={`px-6 py-4 min-w-[300px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Address</th>
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Complaints</th>
                <th className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Employee</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Booking Date</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Resolve Date</th>

                <th className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                  Status
                </th>
                <th className={`px-6 py-4 min-w-[110px] text-center border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-0 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20`}>
                  Options
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{complaint.id}</td>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{complaint.customerName}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.landlineNo}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.address}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.complaints}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.employee}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.bookingDate}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.resolveDate || '-'}</td>

                  {/* Dynamic Status Dropdown */}
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value as any)}
                      className={`text-xs font-bold px-2 py-1 rounded border-0 cursor-pointer outline-none ${
                        complaint.status === 'Resolved'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      <option value="Resolved" className="bg-gray-800 text-green-500">Resolved</option>
                      <option value="Not Resolved" className="bg-gray-800 text-red-500">Not Resolved</option>
                    </select>
                  </td>

                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedComplaint(complaint); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors p-1" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedComplaint(complaint); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedComplaint(complaint); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete">
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
                Showing {filteredComplaints.length} results
            </div>
        </div>
      </div>

      {/* Modals */}
      {modalMode && (
        <ComplaintModal
          mode={modalMode}
          complaint={selectedComplaint}
          theme={theme}
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