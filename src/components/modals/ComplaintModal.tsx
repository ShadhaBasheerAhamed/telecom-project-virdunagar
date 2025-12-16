import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Complaint } from '../pages/Complaints';
import { toast } from 'sonner';

interface ComplaintModalProps {
  mode: 'add' | 'edit';
  complaint: Complaint | null;
  theme: 'light' | 'dark';
  dataSource: string;
  onClose: () => void;
  onSave: (complaint: any) => void;
}

export function ComplaintModal({ mode, complaint, theme, dataSource, onClose, onSave }: ComplaintModalProps) {
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    customerName: '',
    landlineNo: '',
    mobileNo: '', // Added mobile no for searching
    address: '',
    complaints: '',
    employee: '',
    bookingDate: new Date().toISOString().split('T')[0],
    resolveDate: '',
    status: 'Open' as 'Open' | 'Resolved' | 'Pending' | 'Not Resolved',
    source: dataSource === 'All' ? 'BSNL' : dataSource, // Default to active network provider
  });

  useEffect(() => {
    if (mode === 'edit' && complaint) {
      setFormData({
        customerName: complaint.customerName,
        landlineNo: complaint.landlineNo,
        mobileNo: '', 
        address: complaint.address,
        complaints: complaint.complaints,
        employee: complaint.employee,
        bookingDate: complaint.bookingDate,
        resolveDate: complaint.resolveDate,
        status: complaint.status,
        source: complaint.source,
      });
    }
  }, [mode, complaint]);

  // --- AUTO-FETCH LOGIC ---
  const handleSearchCustomer = (value: string, type: 'landline' | 'mobile') => {
    // 1. Update the field user is typing
    setFormData(prev => ({ 
        ...prev, 
        [type === 'landline' ? 'landlineNo' : 'mobileNo']: value 
    }));

    // 2. Search in LocalStorage (Customer Data)
    try {
        const storedCustomers = localStorage.getItem('customers-data');
        if (storedCustomers) {
            const customers = JSON.parse(storedCustomers);
            
            // Find match
            const found = customers.find((c: any) => 
                (type === 'landline' && c.landline === value) || 
                (type === 'mobile' && c.mobileNo === value)
            );

            if (found) {
                setFormData(prev => ({
                    ...prev,
                    customerName: found.name,
                    source: found.source,
                    address: found.address || '', // If address exists in customer object
                    landlineNo: found.landline || prev.landlineNo,
                    mobileNo: found.mobileNo || prev.mobileNo
                }));
                toast.success("Customer details fetched!");
            }
        }
    } catch (err) {
        console.error("Error fetching customer", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'edit' && complaint) {
      onSave({ ...complaint, ...formData });
    } else {
      onSave(formData);
    }
  };

  const inputClasses = `w-full px-4 py-2 rounded-lg border ${
    isDark
      ? 'bg-[#0F172A] border-[#334155] text-white'
      : 'bg-white border-gray-300 text-gray-900'
  } focus:outline-none focus:ring-2 focus:ring-cyan-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-3xl rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/95 border-[#334155]'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit sticky top-0 bg-inherit z-10">
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
            
            {/* Landline No (Auto-Fetch) */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Landline No * (Type to fetch)
              </label>
              <input
                type="text"
                required
                value={formData.landlineNo}
                onChange={(e) => handleSearchCustomer(e.target.value, 'landline')}
                className={inputClasses}
                placeholder="04562-xxxxxx"
              />
            </div>

             {/* Mobile No (Auto-Fetch) */}
             <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Mobile No (Type to fetch)
              </label>
              <input
                type="text"
                value={formData.mobileNo}
                onChange={(e) => handleSearchCustomer(e.target.value, 'mobile')}
                className={inputClasses}
                placeholder="Search by Mobile"
              />
            </div>

            {/* Customer Name (Auto-Filled) */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={inputClasses}
                placeholder="Auto-filled from Landline/Mobile"
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
                className={inputClasses}
                placeholder="Enter full address"
              />
            </div>

            {/* Complaints */}
            <div className="md:col-span-2">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Complaints *
              </label>
              <input
                type="text"
                required
                value={formData.complaints}
                onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                className={inputClasses}
                placeholder="Type of complaint (e.g., LOS, Network Issue)"
              />
            </div>

            {/* Employee */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Assigned Employee *
              </label>
              <input
                type="text"
                required
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                className={inputClasses}
                placeholder="Employee name"
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Open' | 'Resolved' | 'Pending' | 'Not Resolved' })}
                className={inputClasses}
              >
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Not Resolved">Not Resolved</option>
              </select>
            </div>

            {/* Booking Date */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Booking Date *
              </label>
              <input
                type="date"
                required
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                className={inputClasses}
              />
            </div>

            {/* Resolve Date */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Resolve Date
              </label>
              <input
                type="date"
                value={formData.resolveDate}
                onChange={(e) => setFormData({ ...formData, resolveDate: e.target.value })}
                className={inputClasses}
              />
            </div>

            {/* Source */}
            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Source *
              </label>
              <select
                required
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className={inputClasses}
              >
                <option value="BSNL">BSNL</option>
                <option value="Private">Private</option>
                <option value="RMAX">RMAX</option>
              </select>
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
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/20"
            >
              {mode === 'add' ? 'Create Complaint' : 'Update Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}