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
        // Trigger date calculation for default
        calculateRenewalDate(new Date().toISOString().split('T')[0], 'BSNL');
    }
  }, [mode, data]);

  // --- 1. AUTO-CALCULATE DATES (BSNL vs RMAX) ---
  const calculateRenewalDate = (dateStr: string, source: string) => {
      if (!dateStr) return;
      const date = new Date(dateStr);
      
      if (source === 'BSNL') {
          // BSNL = 1 Month exactly
          date.setMonth(date.getMonth() + 1);
      } else {
          // RMAX = 30 Days strictly
          date.setDate(date.getDate() + 30);
      }
      setFormData(prev => ({ ...prev, renewalDate: date.toISOString().split('T')[0] }));
  };

  // Watch changes
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

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${
    isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-gray-300 text-gray-900'
  } focus:outline-none focus:ring-1 focus:ring-cyan-500`;

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

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Landline No (Auto-Fetch)</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={formData.landlineNo} 
                            onChange={(e) => handleSearchCustomer(e.target.value)} 
                            className={`${inputClasses} pl-10`}
                            placeholder="Enter Landline to search"
                            required 
                        />
                        <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
                    <input 
                        type="text" 
                        value={formData.customerName} 
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                        className={inputClasses}
                        required 
                    />
                </div>
                
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Source</label>
                    <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className={inputClasses}>
                        <option value="BSNL">BSNL (Monthly)</option>
                        <option value="RMAX">RMAX (30 Days)</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className={inputClasses}>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Bill Amount (₹)</label>
                    <input type="number" value={formData.billAmount} onChange={e => setFormData({...formData, billAmount: e.target.value})} className={inputClasses} required />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Commission (₹)</label>
                    <input type="number" value={formData.commission} readOnly className={`${inputClasses} opacity-70`} />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Paid Date</label>
                    <input type="date" value={formData.paidDate} onChange={e => setFormData({...formData, paidDate: e.target.value})} className={inputClasses} required />
                </div>

                <div>
                    <label className="text-xs font-bold text-green-500 uppercase">Renewal Date (Auto)</label>
                    <input type="date" value={formData.renewalDate} readOnly className={`${inputClasses} border-green-500/50 bg-green-500/10 text-green-500`} />
                </div>

                 <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Recharge Plan</label>
                    <input type="text" value={formData.rechargePlan} onChange={e => setFormData({...formData, rechargePlan: e.target.value})} className={inputClasses} required />
                </div>
                
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Payment Mode</label>
                     <select value={formData.modeOfPayment} onChange={e => setFormData({...formData, modeOfPayment: e.target.value})} className={inputClasses}>
                        <option value="CASH">CASH</option>
                        <option value="UPI">UPI</option>
                        <option value="ONLINE">ONLINE</option>
                        <option value="BSNL PAYMENT">BSNL PAYMENT</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-700 text-white mr-2">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg">Save Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}