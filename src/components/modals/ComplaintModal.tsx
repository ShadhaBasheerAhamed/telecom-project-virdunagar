import { useState, useEffect } from 'react';
import { X, Paperclip } from 'lucide-react';
import type { Complaint } from '../pages/Complaints';
import { isValidComplaintPriority, isValidComplaintStatus, isValidComplaintSource } from '../../utils/typeGuards';

interface ComplaintModalProps {
  mode: 'add' | 'edit';
  complaint: Complaint | null;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (complaint: any) => void;
}

export function ComplaintModal({ mode, complaint, theme, onClose, onSave }: ComplaintModalProps) {
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    subject: '',
    department: 'Technical',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    status: 'Pending' as 'Pending' | 'In Progress' | 'Solved' | 'Closed',
    description: '',
    source: 'BSNL' as 'BSNL' | 'RMAX',
    dateSubmitted: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (mode === 'edit' && complaint) {
      setFormData({
        userId: complaint.userId,
        userName: complaint.userName,
        subject: complaint.subject,
        department: complaint.department,
        priority: complaint.priority,
        status: complaint.status,
        description: complaint.description,
        source: complaint.source,
        dateSubmitted: complaint.dateSubmitted,
      });
    }
  }, [mode, complaint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'edit' && complaint) {
      onSave({ ...complaint, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-3xl rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/95 border-[#334155]'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit sticky top-0 bg-inherit">
          <h2 className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'add' ? 'Create New Complaint' : 'Edit Complaint'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Name */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                User Name *
              </label>
              <input
                type="text"
                required
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="Enter user name"
              />
            </div>

            {/* User ID */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                User ID *
              </label>
              <input
                type="text"
                required
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="C001"
              />
            </div>

            {/* Subject */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="Brief subject of complaint"
              />
            </div>

            {/* Department */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Department *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              >
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Priority *
              </label>
              <select
                required
                value={formData.priority}
onChange={(e) => isValidComplaintPriority(e.target.value) && setFormData({ ...formData, priority: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Status *
              </label>
              <select
                required
                value={formData.status}
onChange={(e) => isValidComplaintStatus(e.target.value) && setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Solved">Solved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Source */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Source *
              </label>
              <select
                required
                value={formData.source}
onChange={(e) => isValidComplaintSource(e.target.value) && setFormData({ ...formData, source: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              >
                <option value="BSNL">BSNL</option>
                <option value="RMAX">RMAX</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="Detailed description of the complaint..."
              />
            </div>

            {/* File Attachment */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Attach File (Optional)
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isDark ? 'border-[#334155]' : 'border-gray-300'
              }`}>
                <Paperclip className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click to upload or drag and drop
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-inherit">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 rounded-lg transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all"
            >
              {mode === 'add' ? 'Create Complaint' : 'Update Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
