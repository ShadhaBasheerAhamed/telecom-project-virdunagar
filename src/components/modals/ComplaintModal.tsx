import { useState, useEffect } from 'react';
import { X, Loader2, Search, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { DataSource } from '../../types';
import type { Complaint } from '../pages/Complaints';

// ✅ Firebase Imports
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { WhatsAppService } from '../../services/whatsappService';

interface ComplaintModalProps {
  mode: 'add' | 'edit';
  complaint: Complaint | null;
  theme: 'light' | 'dark';
  dataSource: DataSource;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function ComplaintModal({ mode, complaint, theme, dataSource, onClose, onSave }: ComplaintModalProps) {
  const isDark = theme === 'dark';
  
  // --- States ---
  const [employees, setEmployees] = useState<string[]>([]); // ✅ State for Employee Dropdown
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState<Partial<Complaint>>({
    customerName: '',
    landlineNo: '',
    mobileNo: '',
    address: '',
    complaints: '',
    employee: '',
    bookingDate: new Date().toISOString().split('T')[0],
    resolveDate: '',
    status: 'Open',
    source: dataSource === 'All' ? 'BSNL' : dataSource,
  });

  // --- 1. Load Data on Edit ---
  useEffect(() => {
    if (mode === 'edit' && complaint) {
      setFormData(complaint);
    }
  }, [mode, complaint]);

  // --- 2. FETCH EMPLOYEES (For Dropdown) ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Fetch from 'employees' collection
        const q = query(collection(db, 'employees'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const empList = querySnapshot.docs.map(doc => doc.data().name);
        setEmployees(empList);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  // --- 3. SMART SEARCH (Landline -> Customer -> Payment -> Complaint) ---
  const handleLandlineBlur = async () => {
    const landline = formData.landlineNo?.trim();
    if (!landline || landline.length < 5 || mode === 'edit') return;

    setIsSearching(true);
    try {
      let found = false;

      // A. Search in CUSTOMERS
      const custQuery = query(collection(db, 'customers'), where('landline', '==', landline), limit(1));
      const custSnap = await getDocs(custQuery);

      if (!custSnap.empty) {
        const data = custSnap.docs[0].data();
        setFormData(prev => ({
          ...prev,
          customerName: data.name || prev.customerName,
          mobileNo: data.mobileNo || prev.mobileNo,
          address: data.address || prev.address,
          source: data.source || prev.source
        }));
        toast.success("Details found in Customer Records!");
        found = true;
      } 

      // B. Search in PAYMENTS
      if (!found) {
        const payQuery = query(collection(db, 'payments'), where('landlineNo', '==', landline), orderBy('paidDate', 'desc'), limit(1));
        const paySnap = await getDocs(payQuery);
        
        if (!paySnap.empty) {
          const data = paySnap.docs[0].data();
          setFormData(prev => ({
            ...prev,
            customerName: data.customerName || prev.customerName,
            mobileNo: data.mobileNo || prev.mobileNo,
          }));
          toast.success("Details found in Payment History!");
          found = true;
        }
      }

      // C. Search in OLD COMPLAINTS
      if (!found) {
        const compQuery = query(collection(db, 'complaints'), where('landlineNo', '==', landline), limit(1));
        const compSnap = await getDocs(compQuery);

        if (!compSnap.empty) {
          const data = compSnap.docs[0].data();
          setFormData(prev => ({
            ...prev,
            customerName: data.customerName || prev.customerName,
            mobileNo: data.mobileNo || prev.mobileNo,
            address: data.address || prev.address,
          }));
          toast.success("Details found in Previous Complaints!");
          found = true;
        }
      }

      if (!found) {
        toast.info("New number. Please enter details manually.");
      }

    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      onSave(formData);
      
      // Optional: Trigger WhatsApp on Add
      if (mode === 'add' && formData.mobileNo) {
         // @ts-ignore
         if (WhatsAppService.sendComplaintReceived) {
             // @ts-ignore
             WhatsAppService.sendComplaintReceived(
                 formData.customerName, 
                 formData.mobileNo, 
                 'CMP-' + Math.floor(Math.random() * 1000), 
                 formData.complaints
             );
         }
      }

      setIsSubmitting(false);
    }, 500);
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
    isDark 
      ? 'bg-[#0f172a] border-slate-700 text-white placeholder-slate-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-slate-400' : 'text-gray-500'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${
        isDark ? 'bg-[#1e293b] border border-slate-700' : 'bg-white'
      }`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'add' ? 'Register New Complaint' : 'Edit Complaint'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-opacity-10 transition-colors ${isDark ? 'hover:bg-white text-slate-400' : 'hover:bg-black text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="complaintForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Landline - With Search Trigger */}
              <div className="relative">
                <label className={labelClass}>Landline Number <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.landlineNo}
                      onChange={(e) => setFormData({ ...formData, landlineNo: e.target.value })}
                      onBlur={handleLandlineBlur} // 🔥 Trigger search on blur
                      placeholder="Enter number..."
                      className={`${inputClass} pr-10`}
                    />
                    <div className="absolute right-3 top-2.5">
                        {isSearching ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-blue-500 mt-1 ml-1">Type & click outside to search</p>
              </div>

              <div>
                <label className={labelClass}>Customer Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobileNo}
                  onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Network Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className={inputClass}
                >
                  <option value="BSNL">BSNL</option>
                  <option value="RMAX">RMAX</option>
                  <option value="RAILNET">RAILNET</option>
                  <option value="AIRTEL">AIRTEL</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Complaint Description <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={3}
                placeholder="Describe the issue (e.g., No Internet, Slow Speed)..."
                value={formData.complaints}
                onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ✅ CHANGED TO DROPDOWN */}
              <div>
                <label className={labelClass}>Assign Employee</label>
                <select
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  className={inputClass}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp, index) => (
                    <option key={index} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Booking Date</label>
                <input
                  type="date"
                  required
                  value={formData.bookingDate}
                  onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-slate-700 bg-[#1e293b]' : 'border-gray-100 bg-gray-50'} rounded-b-2xl`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="complaintForm"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              mode === 'add' ? 'Register Complaint' : 'Update Complaint'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}