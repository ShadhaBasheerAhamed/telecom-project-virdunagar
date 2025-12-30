import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Lead } from '../pages/Leads';

interface LeadModalProps {
  mode: 'add' | 'edit';
  lead: Lead | null;
  theme: 'light' | 'dark';
  dataSource: string;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id'> | Lead) => void;
}

export function LeadModal({ mode, lead, theme, dataSource, onClose, onSave }: LeadModalProps) {
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNo: '',
    address: '',
    remarks: '',
    followupDate: '',
    status: 'Pending' as 'Success' | 'Rejected' | 'Sale' | 'Pending',
    source: dataSource === 'All' ? 'BSNL' : dataSource, // Default to active network provider
  });

  useEffect(() => {
    if (mode === 'edit' && lead) {
      setFormData({
        customerName: lead.customerName,
        phoneNo: lead.phoneNo,
        address: lead.address,
        remarks: lead.remarks,
        followupDate: lead.followupDate,
        status: lead.status,
        source: lead.source,
      });
    }
  }, [mode, lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'edit' && lead) {
      onSave({ ...lead, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">

      {/* ✅ 1. DYNAMIC SCROLLBAR STYLES ADDED HERE */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? '#1e293b' : '#f1f5f9'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#475569' : '#cbd5e1'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#64748b' : '#94a3b8'};
        }
      `}</style>

      {/* ✅ 2. ADDED 'custom-scrollbar' CLASS TO CONTAINER */}
      <div className={`w-full max-w-2xl rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/95 border-[#334155]'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit sticky top-0 bg-inherit">
          <h2 className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'add' ? 'Create New Lead' : 'Edit Lead'}
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
            {/* Customer Name */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="Enter customer name"
              />
            </div>

            {/* Phone No */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Phone No *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNo}
                onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="Enter address"
              />
            </div>

            {/* Followup Date */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Followup Date *
              </label>
              <input
                type="date"
                required
                value={formData.followupDate}
                onChange={(e) => setFormData({ ...formData, followupDate: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
            </div>

            {/* Status */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Success' | 'Rejected' | 'Sale' | 'Pending' })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              >
                <option value="Pending">Pending</option>
                <option value="Sale">Sale</option>
                <option value="Success">Success</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Source */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Source *
              </label>
              <select
                required
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Remarks
              </label>
              <textarea
                rows={4}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="Additional remarks about the lead..."
              />
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
              {mode === 'add' ? 'Create Lead' : 'Update Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
