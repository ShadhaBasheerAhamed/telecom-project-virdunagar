import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import type { DataSource } from '../../App';
import { ComplaintModal } from '../modals/ComplaintModal';
import { ViewComplaintModal } from '../modals/ViewComplaintModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

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
  { 
    id: '646', 
    customerName: 'A RAJESH KUMAR', 
    landlineNo: '04562-266002', 
    address: 'NO5,GANDHI NAGAR,TIRUNELVELI,627001', 
    complaints: 'Network Issue', 
    employee: 'S.MANIKANDAN', 
    bookingDate: '2025-10-28', 
    resolveDate: '2025-10-29', 
    status: 'Resolved', 
    source: 'BSNL' 
  },
  { 
    id: '647', 
    customerName: 'S PRIYA', 
    landlineNo: '04562-266003', 
    address: 'NO12,SOUTH STREET,THOOTHUKUDI,628001', 
    complaints: 'Slow Internet', 
    employee: 'K.VENKATESH', 
    bookingDate: '2025-10-29', 
    resolveDate: '', 
    status: 'Not Resolved', 
    source: 'Private' 
  },
  { 
    id: '648', 
    customerName: 'V SARATH KUMAR', 
    landlineNo: '04562-266004', 
    address: 'NO7,EAST MASI STREET,MADURAI,625001', 
    complaints: 'Bill Problem', 
    employee: 'P.RAJESH', 
    bookingDate: '2025-10-30', 
    resolveDate: '2025-10-30', 
    status: 'Resolved', 
    source: 'BSNL' 
  },
  { 
    id: '649', 
    customerName: 'K VANATHI', 
    landlineNo: '04562-266005', 
    address: 'NO15,ANNA NAGAR,COIMBATORE,641002', 
    complaints: 'Phone Not Working', 
    employee: 'M.SUBRAMANI', 
    bookingDate: '2025-11-01', 
    resolveDate: '', 
    status: 'Not Resolved', 
    source: 'Private' 
  },
  { 
    id: '650', 
    customerName: 'D NAVEEN KUMAR', 
    landlineNo: '04562-266006', 
    address: 'NO8,THIRUVALLUVAR SALAI,CHENNAI,600001', 
    complaints: 'Internet Disconnection', 
    employee: 'A.KUMAR', 
    bookingDate: '2025-11-02', 
    resolveDate: '2025-11-03', 
    status: 'Resolved', 
    source: 'BSNL' 
  }
];

export function Complaints({ dataSource, theme }: ComplaintsProps) {
  const isDark = theme === 'dark';
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

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
      id: String(complaints.length + 645),
    };
    setComplaints([...complaints, newComplaint]);
    setModalMode(null);
  };

  const handleEditComplaint = (complaint: Complaint) => {
    setComplaints(complaints.map(c => c.id === complaint.id ? complaint : c));
    setModalMode(null);
    setSelectedComplaint(null);
  };

  const handleDeleteComplaint = () => {
    if (selectedComplaint) {
      setComplaints(complaints.filter(c => c.id !== selectedComplaint.id));
      setDeleteModalOpen(false);
      setSelectedComplaint(null);
    }
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header Section with Filters */}
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
              <option value="ID">Complaint ID</option>
              <option value="Complaint">Complaint</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[140px] ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              <option value="Resolved">Resolved</option>
              <option value="Not Resolved">Not Resolved</option>
            </select>

            {/* Add Button */}
            <button
              onClick={() => setModalMode('add')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Complaint</span>
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
                <th className={`px-6 py-4 min-w-[100px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>ID</th>
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Customer Name</th>
                <th className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Landline No</th>
                <th className={`px-6 py-4 min-w-[300px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Address</th>
                <th className={`px-6 py-4 min-w-[200px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Complaints</th>
                <th className={`px-6 py-4 min-w-[150px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Employee</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Booking Date</th>
                <th className={`px-6 py-4 min-w-[140px] border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Resolve Date</th>

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
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                  {/* Scrollable Data */}
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{complaint.id}</td>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{complaint.customerName}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.landlineNo}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.address}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.complaints}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.employee}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.bookingDate}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.resolveDate || '-'}</td>

                  {/* STICKY COLUMNS (Body) */}
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)] hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        complaint.status === 'Resolved'
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-red-900/30 text-red-400 border-red-800'
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setSelectedComplaint(complaint); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-900/20" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedComplaint(complaint); setModalMode('edit'); }} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1 rounded hover:bg-yellow-900/20" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedComplaint(complaint); setDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900/20" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredComplaints.length === 0 && (
             <div className={`p-10 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No complaints found matching your search.
             </div>
          )}
        </div>

        {/* Footer / Results Summary */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-gray-700 bg-[#1f2533] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <div className="text-sm">
                Showing <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>1</span> to <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredComplaints.length}</span> of <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{complaints.length}</span> results
            </div>
            <div className="flex gap-2">
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Previous</button>
                <button className={`px-3 py-1 border rounded text-sm transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Next</button>
            </div>
        </div>
      </div>

      {/* MODALS */}
      {modalMode && (
        <ComplaintModal
          mode={modalMode}
          complaint={selectedComplaint}
          theme={theme}
          onClose={() => {
            setModalMode(null);
            setSelectedComplaint(null);
          }}
          onSave={modalMode === 'add' ? handleAddComplaint : handleEditComplaint}
        />
      )}

      {viewModalOpen && selectedComplaint && (
        <ViewComplaintModal
          complaint={selectedComplaint}
          theme={theme}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedComplaint(null);
          }}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          title="Delete Complaint"
          message={`Are you sure you want to delete complaint ${selectedComplaint?.id}? This action cannot be undone.`}
          theme={theme}
          onConfirm={handleDeleteComplaint}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedComplaint(null);
          }}
        />
      )}
    </div>
  );
}
