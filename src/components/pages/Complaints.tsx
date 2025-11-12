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
  userId: string;
  userName: string;
  subject: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Solved' | 'Closed';
  dateSubmitted: string;
  description: string;
  source: 'BSNL' | 'RMAX';
}

const mockComplaints: Complaint[] = [
  { id: 'T001', userId: 'C001', userName: 'John Doe', subject: 'Internet Connectivity Issue', department: 'Technical', priority: 'High', status: 'In Progress', dateSubmitted: '2024-11-10', description: 'No internet connection for 2 days', source: 'BSNL' },
  { id: 'T002', userId: 'C002', userName: 'Jane Smith', subject: 'Billing Discrepancy', department: 'Billing', priority: 'Medium', status: 'Pending', dateSubmitted: '2024-11-09', description: 'Overcharged in last invoice', source: 'RMAX' },
  { id: 'T003', userId: 'C003', userName: 'Mike Johnson', subject: 'Slow Speed', department: 'Technical', priority: 'Low', status: 'Solved', dateSubmitted: '2024-11-08', description: 'Internet speed is very slow', source: 'BSNL' },
  { id: 'T004', userId: 'C004', userName: 'Sarah Williams', subject: 'Router Not Working', department: 'Technical', priority: 'Urgent', status: 'In Progress', dateSubmitted: '2024-11-07', description: 'Router stopped working suddenly', source: 'RMAX' },
];

export function Complaints({ dataSource, theme }: ComplaintsProps) {
  const isDark = theme === 'dark';
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || complaint.status === filterStatus;
    const matchesSource = dataSource === 'All' || complaint.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleAddComplaint = (complaint: Omit<Complaint, 'id'>) => {
    const newComplaint = {
      ...complaint,
      id: `T${String(complaints.length + 1).padStart(3, '0')}`,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Complaints Management
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
          Create Complaint
        </button>
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#0F172A] border-[#334155] text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

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
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Solved">Solved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'}`}>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ticket ID</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>User</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Subject</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Department</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Priority</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date</th>
                <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className={`border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {complaint.id}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {complaint.userName}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {complaint.subject}
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {complaint.department}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      complaint.priority === 'Urgent'
                        ? 'bg-red-500/20 text-red-400'
                        : complaint.priority === 'High'
                        ? 'bg-orange-500/20 text-orange-400'
                        : complaint.priority === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      complaint.status === 'Solved'
                        ? 'bg-green-500/20 text-green-400'
                        : complaint.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : complaint.status === 'Pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {complaint.dateSubmitted}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setViewModalOpen(true);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/10 text-cyan-400'
                            : 'hover:bg-gray-100 text-cyan-600'
                        }`}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
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
                          setSelectedComplaint(complaint);
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
