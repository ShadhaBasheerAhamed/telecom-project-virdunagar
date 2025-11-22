import { useState, useEffect } from 'react';
import { X, Calendar, Search } from 'lucide-react';
import type { Payment } from '../../types';
import { toast } from 'sonner';

interface PaymentModalProps {
  mode: 'add' | 'edit';
  data?: Payment | null;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

export function PaymentModal({ mode, data, theme, onClose, onSave }: PaymentModalProps) {
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    landlineNo: '',
    customerName: '',
    rechargePlan: '',
    duration: '30',
    billAmount: '',
    commission: '',
    status: 'Unpaid' as 'Paid' | 'Unpaid',
    paidDate: new Date().toISOString().split('T')[0],
    modeOfPayment: 'CASH',
    renewalDate: '',
    source: 'BSNL'
  });

  // Load Data on Edit
  useEffect(() => {
    if (mode === 'edit' && data) {
      setFormData({
        landlineNo: data.landlineNo,
        customerName: data.customerName,
        rechargePlan: data.rechargePlan,
        duration: data.duration,
        billAmount: data.billAmount.toString(),
        commission: data.commission.toString(),
        status: data.status,
        paidDate: data.paidDate,
        modeOfPayment: data.modeOfPayment,
        renewalDate: data.renewalDate,
        source: data.source
      });
    } else if (mode === 'add') {
        // Trigger date calculation for default values
        calculateRenewalDate(new Date().toISOString().split('T')[0], 'BSNL');
    }
  }, [mode, data]);

  // --- 1. AUTO-CALCULATE DATES (BSNL vs RMAX) ---
  const calculateRenewalDate = (date: string, source: string) => {
      if (!date) return;
      const current = new Date(date);
      
      if (source === 'BSNL') {
          // BSNL = Monthly Cycle (Same date next month)
          current.setMonth(current.getMonth() + 1);
      } else {
          // RMAX = 30 Days Cycle
          current.setDate(current.getDate() + 30);
      }
      setFormData(prev => ({ ...prev, renewalDate: current.toISOString().split('T')[0] }));
  };

  // Watch for Date or Source changes to update Renewal Date
  useEffect(() => {
      calculateRenewalDate(formData.paidDate, formData.source);
  }, [formData.paidDate, formData.source]);


  // --- 2. AUTO-FETCH CUSTOMER ---
  const handleSearchCustomer = (landline: string) => {
    setFormData(prev => ({ ...prev, landlineNo: landline }));
    
    try {
        const stored = localStorage.getItem('customers-data');
        if (stored) {
            const customers = JSON.parse(stored);
            const found = customers.find((c: any) => c.landline === landline);
            
            if (found) {
                setFormData(prev => ({
                    ...prev,
                    customerName: found.name,
                    rechargePlan: found.plan || prev.rechargePlan,
                    source: found.source || prev.source
                }));
                toast.success("Customer found!");
            }
        }
    } catch (err) {
        console.error(err);
    }
  };

  // --- 3. COMMISSION CALCULATION ---
  useEffect(() => {
    if (formData.billAmount) {
      const amount = parseFloat(formData.billAmount);
      if (!isNaN(amount)) {
        // Example Logic: 30% Commission
        const comm = (amount * 0.30).toFixed(2);
        setFormData(prev => ({ ...prev, commission: comm }));
      }
    }
  }, [formData.billAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentData: Payment = {
        id: mode === 'edit' && data ? data.id : Date.now().toString(),
        landlineNo: formData.landlineNo,
        customerName: formData.customerName,
        rechargePlan: formData.rechargePlan,
        duration: formData.duration,
        billAmount: parseFloat(formData.billAmount),
        commission: parseFloat(formData.commission),
        status: formData.status,
        paidDate: formData.paidDate,
        modeOfPayment: formData.modeOfPayment,
        renewalDate: formData.renewalDate,
        source: formData.source
    };
    onSave(paymentData);
  };

  const inputClasses = `w-full px-4 py-2 rounded-lg border ${
    isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-gray-300 text-gray-900'
  } focus:outline-none focus:ring-2 focus:ring-cyan-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-2xl border max-h-[90vh] flex flex-col ${
        isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'
      } shadow-2xl`}>
        
        <div className="flex items-center justify-between p-6 border-b border-inherit">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'add' ? 'Add New Payment' : 'Edit Payment'}
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Landline No (Auto-Fetch)</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={formData.landlineNo} 
                            onChange={(e) => handleSearchCustomer(e.target.value)} 
                            className={inputClasses}
                            placeholder="Enter Landline to search"
                            required 
                        />
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Customer Name</label>
                    <input 
                        type="text" 
                        value={formData.customerName} 
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                        className={inputClasses}
                        required 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Source</label>
                    <select 
                        value={formData.source} 
                        onChange={(e) => setFormData({...formData, source: e.target.value})} 
                        className={inputClasses}
                    >
                        <option value="BSNL">BSNL (Monthly)</option>
                        <option value="RMAX">RMAX (30 Days)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Status</label>
                    <select 
                        value={formData.status} 
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})} 
                        className={inputClasses}
                    >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                    </select>
                </div>
            </div>

            {/* Plan Info */}
            <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-800/20">
                <h3 className="text-sm font-bold text-cyan-500 mb-4 uppercase">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Recharge Plan</label>
                        <input 
                            type="text" 
                            value={formData.rechargePlan} 
                            onChange={(e) => setFormData({...formData, rechargePlan: e.target.value})} 
                            className={inputClasses}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Bill Amount (₹)</label>
                        <input 
                            type="number" 
                            value={formData.billAmount} 
                            onChange={(e) => setFormData({...formData, billAmount: e.target.value})} 
                            className={inputClasses}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Commission (₹)</label>
                        <input 
                            type="number" 
                            value={formData.commission} 
                            onChange={(e) => setFormData({...formData, commission: e.target.value})} 
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Mode</label>
                        <select 
                            value={formData.modeOfPayment} 
                            onChange={(e) => setFormData({...formData, modeOfPayment: e.target.value})} 
                            className={inputClasses}
                        >
                            <option value="CASH">CASH</option>
                            <option value="UPI">UPI</option>
                            <option value="ONLINE">ONLINE</option>
                            <option value="BSNL PAYMENT">BSNL PAYMENT</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Date Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Paid Date</label>
                    <input 
                        type="date" 
                        value={formData.paidDate} 
                        onChange={(e) => setFormData({...formData, paidDate: e.target.value})} 
                        className={inputClasses}
                        required 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Renewal Date (Auto)</label>
                    <input 
                        type="date" 
                        value={formData.renewalDate} 
                        readOnly
                        className={`${inputClasses} opacity-70 cursor-not-allowed`}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-700 text-white">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-500">Save Record</button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}