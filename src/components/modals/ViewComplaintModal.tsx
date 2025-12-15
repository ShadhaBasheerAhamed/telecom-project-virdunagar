import { useState } from 'react';
import { X, Send } from 'lucide-react';
import type { Complaint } from '../pages/Complaints';

interface ViewComplaintModalProps {
  complaint: Complaint;
  theme: 'light' | 'dark';
  onClose: () => void;
}

interface Note {
  id: number;
  author: string;
  message: string;
  timestamp: string;
}

export function ViewComplaintModal({ complaint, theme, onClose }: ViewComplaintModalProps) {
  const isDark = theme === 'dark';
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, author: 'Admin', message: 'Complaint received and under review.', timestamp: '2024-11-10 10:30 AM' },
    { id: 2, author: 'Tech Support', message: 'Assigned to technical team.', timestamp: '2024-11-10 11:00 AM' },
  ]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, {
        id: notes.length + 1,
        author: 'Admin User',
        message: newNote,
        timestamp: new Date().toLocaleString(),
      }]);
      setNewNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-5xl rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/95 border-[#334155]'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit">
          <div>
            <h2 className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Complaint Details
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Complaint ID: {complaint.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content - Split Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Side - Details */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-inherit">
            <div className="space-y-4">
              {/* Customer Info */}
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Customer Information
                </h3>
                <p className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {complaint.customerName}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Landline: {complaint.landlineNo}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Address: {complaint.address}
                </p>
              </div>

              {/* Complaint Details */}
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Complaint
                </h3>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {complaint.complaints}
                </p>
              </div>

              {/* Employee Assignment */}
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Assigned Employee
                </h3>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {complaint.employee}
                </p>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Booking Date
                  </h3>
                  <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {complaint.bookingDate}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Resolve Date
                  </h3>
                  <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {complaint.resolveDate || 'Not resolved yet'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Source
                  </h3>
                  <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {complaint.source}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    complaint.status === 'Open'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : complaint.status === 'Resolved'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Notes/Chat */}
          <div className="w-96 flex flex-col">
            {/* Notes Header */}
            <div className="p-4 border-b border-inherit">
              <h3 className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                Notes & Updates
              </h3>
            </div>

            {/* Notes List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg ${
                    isDark ? 'bg-[#0F172A]' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      {note.author}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {note.timestamp}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {note.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Add Note */}
            <div className="p-4 border-t border-inherit">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a note..."
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-[#0F172A] border-[#334155] text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <button
                  onClick={handleAddNote}
                  className="p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
