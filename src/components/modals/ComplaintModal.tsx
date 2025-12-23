import { useState, useEffect } from 'react';
import { X, Save, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { WhatsAppService } from '../../services/whatsappService';

interface ComplaintModalProps {
  mode: 'add' | 'edit';
  complaint?: any;
  theme: 'light' | 'dark';
  dataSource: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function ComplaintModal({ mode, complaint, theme, dataSource, onClose, onSave }: ComplaintModalProps) {
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: '',
    landlineNo: '',
    mobileNo: '', 
    address: '',
    complaints: '',
    employee: '',
    bookingDate: new Date().toISOString().split('T')[0], // Default Today
    resolveDate: '',
    status: 'Open',
    source: dataSource === 'All' ? 'BSNL' : dataSource
  });

  // Load Data on Edit
  useEffect(() => {
    if (mode === 'edit' && complaint) {
      setFormData({
        customerName: complaint.customerName || '',
        landlineNo: complaint.landlineNo || '',
        mobileNo: complaint.mobileNo || '',
        address: complaint.address || '',
        complaints: complaint.complaints || '',
        employee: complaint.employee || '',
        bookingDate: complaint.bookingDate || '',
        resolveDate: complaint.resolveDate || '',
        status: complaint.status || 'Open',
        source: complaint.source || 'BSNL'
      });
    }
  }, [mode, complaint]);

  // --- 1. FETCH EMPLOYEES FROM MASTER RECORDS ---
  useEffect(() => {
      const fetchEmployees = async () => {
          try {
              const q = query(collection(db, 'employees'), orderBy('name', 'asc'));
              const snap = await getDocs(q);
              const empList = snap.docs.map(doc => doc.data().name);
              setEmployees(empList);
          } catch (e) {
              console.error("Error fetching employees", e);
          }
      };
      fetchEmployees();
  }, []);

  // --- 2. SMART SEARCH (Landline -> Customer -> Payment Fallback) ---
  const handleSearch = async () => {
      if (!formData.landlineNo) { toast.error("Enter Landline Number"); return; }
      setLoading(true);
      try {
          // A. Search in Customers
          const custQ = query(collection(db, 'customers'), where('landline', '==', formData.landlineNo));
          const custSnap = await getDocs(custQ);

          if (!custSnap.empty) {
              const data = custSnap.docs[0].data();
              setFormData(prev => ({
                  ...prev,
                  customerName: data.name,
                  mobileNo: data.mobileNo,
                  address: data.address,
                  source: data.source || prev.source
              }));
              toast.success("Customer found in Database!");
          } else {
              // B. Fallback: Search in Payments
              const payQ = query(collection(db, 'payments'), where('landlineNo', '==', formData.landlineNo), limit(1));
              const paySnap = await getDocs(payQ);
              
              if (!paySnap.empty) {
                  const data = paySnap.docs[0].data();
                  setFormData(prev => ({
                      ...prev,
                      customerName: data.customerName,
                      mobileNo: data.mobileNo || '',
                      address: '', 
                      source: data.source || prev.source
                  }));
                  toast.success("Found in Payment History");
              } else {
                  toast.error("Number not found. Please fill details manually.");
              }
          }
      } catch (error) {
          console.error(error);
          toast.error("Search failed");
      } finally {
          setLoading(false);
      }
  };

  // --- 3. SUBMIT HANDLER ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.complaints) {
        toast.error("Name and Complaint details are required");
        return;
    }

    const complaintData = {
        ...formData,
        id: mode === 'edit' ? complaint.id : Date.now().toString()
    };

    onSave(complaintData);

    // Trigger WhatsApp Message (Only for New Complaints)
    if (mode === 'add' && formData.mobileNo) {
        setTimeout(() => {
            WhatsAppService.sendComplaintReceived(
                formData.customerName, 
                formData.mobileNo, 
                complaintData.id, 
                formData.complaints
            );
        }, 500); 
    }
  };

  const inputClass = `w-full p-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
        <div className="p-6 border-b border-inherit flex justify-between items-center">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'add' ? 'Register New Complaint' : 'Edit Complaint'}
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Row 1: Landline & Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Landline No</label>
                  <div className="relative">
                      <input 
                          type="text" 
                          value={formData.landlineNo} 
                          onChange={e => setFormData({...formData, landlineNo: e.target.value})} 
                          className={`${inputClass} pr-10`}
                          placeholder="Search Landline..."
                      />
                      <button 
                          type="button" 
                          onClick={handleSearch}
                          className="absolute right-2 top-2 text-gray-400 hover:text-blue-500"
                          disabled={loading}
                      >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5"/>}
                      </button>
                  </div>
              </div>
              
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Mobile No (WhatsApp)</label>
                  <input type="text" value={formData.mobileNo} onChange={e => setFormData({...formData, mobileNo: e.target.value})} className={inputClass} placeholder="For updates" />
              </div>
          </div>

          {/* Row 2: Name & Employee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Customer Name</label>
                  <input type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className={inputClass} required />
              </div>
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Assigned Employee</label>
                  <select 
                      value={formData.employee} 
                      onChange={e => setFormData({...formData, employee: e.target.value})} 
                      className={inputClass}
                  >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                          <option key={emp} value={emp}>{emp}</option>
                      ))}
                  </select>
              </div>
          </div>

          {/* Row 3: Address */}
          <div>
              <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Address</label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={inputClass} rows={2}></textarea>
          </div>

          {/* Row 4: Complaint */}
          <div>
              <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Issue Description</label>
              <textarea value={formData.complaints} onChange={e => setFormData({...formData, complaints: e.target.value})} className={inputClass} rows={3} placeholder="Describe the issue..." required></textarea>
          </div>

          {/* Row 5: Dates & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Booking Date</label>
                  <input type="date" value={formData.bookingDate} onChange={e => setFormData({...formData, bookingDate: e.target.value})} className={inputClass} />
              </div>
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Resolve Date</label>
                  <input type="date" value={formData.resolveDate} onChange={e => setFormData({...formData, resolveDate: e.target.value})} className={inputClass} />
              </div>
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={inputClass}>
                      <option value="Open">Open</option>
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Not Resolved">Not Resolved</option>
                  </select>
              </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Complaint
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}