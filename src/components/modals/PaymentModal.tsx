import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, ChevronDown, Check, Printer } from 'lucide-react';
import type { Payment, Customer } from '../../types';
import { toast } from 'sonner';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PDFService } from '../../services/pdfService'; // Import PDF Service
import { WhatsAppService } from '../../services/whatsappService'; // ✅ Import WhatsApp
import { EmailService } from '../../services/emailService';       // ✅ Import Email

interface PaymentModalProps {
  mode: 'add'| 'edit'; // ✅ Explicitly supports both
  data?: Payment | null;
  theme: 'light' | 'dark';
  dataSource: string;
  onClose: () => void;
  onSave: (payment: any, customerId: string) => void; // Updated signature
}

export function PaymentModal({ mode, data, theme, dataSource, onClose, onSave }: PaymentModalProps) {
  const isDark = theme === 'dark';
  
  // --- States ---
  const [plans, setPlans] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // --- Wallet States ---
  // --- Financial States ---
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [walletBalance, setWalletBalance] = useState(0); // Existing Advance
  const [pendingAmount, setPendingAmount] = useState(0); // Existing Pending (Kadan)
  
  const [useWallet, setUseWallet] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(''); // Amount user is paying NOW

  // --- Form Data ---
  const [formData, setFormData] = useState({
    landlineNo: data?.landlineNo || '',
    mobileNo: data?.mobileNo || '',
    email: data?.email || '',
    customerName: data?.customerName || '',
    rechargePlan: data?.rechargePlan || '',
    duration: data?.duration || '30',
    billAmount: data?.billAmount?.toString() || '',
    commission: data?.commission?.toString() || '0',
    status: 'Paid' as 'Paid' | 'Unpaid', // Default to Paid since we are adding payment
    paidDate: new Date().toISOString().split('T')[0],
    modeOfPayment: 'CASH',
    renewalDate: '',
    source: data?.source || (dataSource === 'All' ? 'BSNL' : dataSource) 
  });

  // Refs
  const planRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);

  // --- Click Outside ---
  // --- 1. Init: Fetch Customer if in Edit Mode ---
  useEffect(() => {
      // Explicit check to satisfy TypeScript if needed, though 'edit' is valid
      if (mode === 'edit' && data?.landlineNo) {
          handleSearchCustomer(data.landlineNo);
      }
  }, [mode, data]);

  // --- Load Plans ---
  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const q = query(collection(db, 'plans'), where('status', '==', 'Active'));
        const snapshot = await getDocs(q);
        const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetchedPlans.length > 0) setPlans(fetchedPlans);
      } catch (e) { console.error(e); } 
      finally { setPlansLoading(false); }
    };
    loadPlans();
  }, []);

  // --- Auto-Calculate Renewal ---
  useEffect(() => {
      if (!formData.paidDate) return;
      const date = new Date(formData.paidDate);
      if (formData.source === 'BSNL') date.setMonth(date.getMonth() + 1);
      else date.setDate(date.getDate() + 30);
      setFormData(prev => ({ ...prev, renewalDate: date.toISOString().split('T')[0] }));
  }, [formData.paidDate, formData.source]);

  // --- 4. Commission ---
  useEffect(() => {
    if (formData.billAmount) {
      const amount = parseFloat(formData.billAmount);
      if (!isNaN(amount)) setFormData(prev => ({ ...prev, commission: (amount * 0.30).toFixed(2) }));
    }
  }, [formData.billAmount]);

  // --- 5. 🔍 Search Logic (Auto Fetch) ---
  const handleSearchCustomer = async (overrideNumber?: string) => {
    const searchNumber = overrideNumber || formData.landlineNo.trim();
    if (!searchNumber) { 
        if(!overrideNumber) toast.error("Enter landline number"); 
        return; 
    }

    setIsSearching(true);
    try {
        const customerQuery = query(collection(db, 'customers'), where('landline', '==', searchNumber));
        const customerSnap = await getDocs(customerQuery);
        
        if (!customerSnap.empty) {
            const customer = { id: customerSnap.docs[0].id, ...customerSnap.docs[0].data() } as Customer;
            setCustomerData(customer);
            
            setWalletBalance(customer.walletBalance || 0);
            setPendingAmount(customer.pendingAmount || 0);

            // Only auto-fill form if NOT in edit mode (preserve existing payment data)
            if (mode === 'add') {
                setFormData(prev => ({
                    ...prev,
                    customerName: customer.name || '',
                    mobileNo: customer.mobileNo || '',
                    email: customer.email || '', 
                    rechargePlan: customer.plan || prev.rechargePlan,
                    source: customer.source || prev.source,
                    billAmount: customer.offerPrize || prev.billAmount
                }));
            }
            
            if(!overrideNumber) toast.success(`Data Fetched! Pending: ₹${customer.pendingAmount || 0}`);
        } else {
            if(!overrideNumber) toast.error("Customer not found.");
        }
    } catch (error) { console.error(error); } 
    finally { setIsSearching(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSearchCustomer(); }
  };

  // --- 💰 CALCULATION LOGIC ---
  const billAmount = parseFloat(formData.billAmount) || 0;
  const received = parseFloat(receivedAmount) || 0;
  
  // Logic: 
  // 1. If using wallet: Deduct from bill first.
  // 2. Remaining amount must be paid by 'Received'.
  // 3. If 'Received' > Remaining, excess goes to wallet.

  // 1. Total Amount to Pay = Current Bill + Old Pending
  const totalPayable = billAmount + pendingAmount;
  
  let netPayable = totalPayable;
  let usedWallet = 0;

  // 2. Apply Wallet if Checked
  if (useWallet && walletBalance > 0) {
      if (walletBalance >= totalPayable) {
          usedWallet = totalPayable;
          netPayable = 0;
      } else {
          usedWallet = walletBalance;
          netPayable = totalPayable - walletBalance;
      }
  }

  // 3. Compare with Received Amount
  let newExcess = 0;  // To Wallet
  let newPending = 0; // To Pending

  if (received >= netPayable) {
      newExcess = received - netPayable;
      newPending = 0; // Cleared all dues
  } else {
      newPending = netPayable - received; // Remaining to be paid next time
      newExcess = 0;
  }

  // Final States for DB Update
  // Note: These will be used by the Service to update the Customer record
  const finalWalletState = (walletBalance - usedWallet) + newExcess;
  const finalPendingState = newPending;

  // --- SUBMIT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData) { toast.error("Please search for a customer first."); return; }

    const paymentData = {
        ...formData,
        id: data?.id || Date.now().toString(), // Use existing ID if edit
        billAmount: billAmount,
        commission: parseFloat(formData.commission),
        
        // Save Financial Snapshot
        walletBalance: walletBalance,
        pendingAmount: pendingAmount,
        receivedAmount: received,
        
        // Transaction Specifics
        usedWalletAmount: usedWallet,
        addedToWallet: newExcess,
        addedToPending: newPending, // Record how much was left unpaid
        
        // Flags for Service to update Customer DB
        finalWalletBalance: finalWalletState,
        finalPendingAmount: finalPendingState
    };

    // 1. Save to Database
    onSave(paymentData, customerData.id);
    
    // 2. ✅ WhatsApp Trigger
    if (formData.status === 'Paid' && formData.mobileNo) {
        // Direct call without timeout often works better on click events, 
        // but since onSave is async, we try to trigger it.
        // Alert user if popup blocked.
        setTimeout(() => {
             WhatsAppService.sendPaymentAck(paymentData as Payment, formData.mobileNo);
        }, 500);
    }

    // 3. ✅ PDF & Email Trigger
    // We ask confirmation to ensure the user is ready
    if (confirm("Payment Saved! Download Invoice & Send Email?")) {
        // Generate PDF
        PDFService.generateInvoice(paymentData as Payment, { 
            ...customerData, 
            walletBalance: finalWalletState,
            pendingAmount: finalPendingState // Pass new pending for PDF
        });
        
        // Open Email Client
        if (formData.email) {
            EmailService.sendInvoiceEmail(paymentData as Payment, formData.email);
        } else {
            toast.warning("No email found. Only PDF downloaded.");
        }
    }
  };

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-1 focus:ring-cyan-500`;
  const dropdownItemClasses = `px-4 py-2 cursor-pointer text-sm hover:bg-cyan-50 dark:hover:bg-cyan-900/30 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-2xl border max-h-[90vh] flex flex-col ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}>
        
        <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 20px; }`}</style>

        <div className="flex items-center justify-between p-6 border-b border-inherit">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'edit' ? 'Clear Dues / Update Payment' : 'Add New Payment'}
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <form onSubmit={handleSubmit} className="space-y-6 pb-40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Search */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Landline No</label>
                    <div className="relative">
                        <input type="text" value={formData.landlineNo} onChange={(e) => setFormData({...formData, landlineNo: e.target.value})} onKeyDown={handleKeyDown} className={`${inputClasses} pl-4 pr-10`} placeholder="Enter Landline No" required />
                         <button type="button" onClick={() => handleSearchCustomer()} className="absolute right-3 top-2.5 text-gray-400 hover:text-cyan-500" disabled={isSearching}>
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Basic Info */}
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Customer Name</label><input type="text" value={formData.customerName} readOnly className={`${inputClasses} opacity-80`} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mobile</label><input type="text" value={formData.mobileNo} onChange={e => setFormData({...formData, mobileNo: e.target.value})} className={inputClasses} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email (For Invoice)</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClasses} /></div>

                {/* Status & Bill */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className={inputClasses}>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                    </select>
                </div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Bill Amount (₹)</label><input type="number" value={formData.billAmount} onChange={e => setFormData({...formData, billAmount: e.target.value})} className={inputClasses} required /></div>

                {/* 🟧 FINANCIAL SUMMARY (Wallet & Pending) */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-dashed border-gray-400/50 bg-gray-50/50 dark:bg-gray-800/50">
                    
                    {/* Left: Balances */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Current Bill:</span><span className="font-bold">₹{billAmount}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-red-500">Previous Pending:</span><span className="font-bold text-red-500">+ ₹{pendingAmount}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-cyan-600">Wallet Available:</span><span className="font-bold text-cyan-600">- ₹{walletBalance}</span></div>
                        <div className="h-px bg-gray-300 my-2"></div>
                        <div className="flex justify-between text-base font-bold"><span>Total Payable:</span><span>₹{totalPayable}</span></div>
                    </div>

                    {/* Right: Payment Input */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="useWallet" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="w-4 h-4 text-cyan-600 rounded" disabled={walletBalance <= 0} />
                            <label htmlFor="useWallet" className={`text-sm font-medium ${walletBalance <= 0 ? 'text-gray-400' : ''}`}>Use Wallet Balance?</label>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-green-600 uppercase block mb-1">Amount Received</label>
                            <input type="number" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} className={`${inputClasses} border-green-500 bg-green-50/10 focus:ring-green-500 text-lg font-bold`} placeholder="Enter amount..." />
                        </div>

                        {/* Calculation Feedback */}
                        {receivedAmount && (
                            <div className="text-xs text-right mt-1 font-bold">
                                {newPending > 0 && <span className="text-red-500 block">Remaining Pending: ₹{newPending}</span>}
                                {newExcess > 0 && <span className="text-green-500 block">Adding to Wallet: ₹{newExcess}</span>}
                                {newPending === 0 && newExcess === 0 && <span className="text-blue-500 block">Settled Perfectly!</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Plan & Mode */}
                 <div className="md:col-span-2 relative" ref={planRef}>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Recharge Plan</label>
                    <div className={`${inputClasses} flex justify-between items-center cursor-pointer`} onClick={() => setShowPlanDropdown(!showPlanDropdown)}>
                        <span>{formData.rechargePlan || "-- Select Plan --"}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    {showPlanDropdown && (
                        <div className={`absolute z-50 w-full mt-1 rounded-xl shadow-xl border overflow-hidden ${isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-white border-gray-200'}`}>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {plans.map((plan) => (
                                    <div key={plan.id} className={dropdownItemClasses} onClick={() => {
                                        setFormData({ ...formData, rechargePlan: plan.name, billAmount: plan.price ? plan.price.toString() : formData.billAmount });
                                        setShowPlanDropdown(false);
                                    }}>{plan.name} {plan.price && `(${plan.price})`}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="md:col-span-2 relative" ref={modeRef}>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Payment Mode</label>
                    <div className={`${inputClasses} flex justify-between items-center cursor-pointer`} onClick={() => setShowModeDropdown(!showModeDropdown)}>
                        <span>{formData.modeOfPayment}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    {showModeDropdown && (
                        <div className={`absolute z-50 w-full mt-1 rounded-xl shadow-2xl border overflow-hidden ${isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-white border-gray-200'}`}>
                             <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                {['CASH', 'UPI', 'ONLINE', 'BSNL PAYMENT', 'GPAY', 'PHONEPE', 'GOOGLE PAY', 'PAYTM'].map((mode) => (
                                    <div key={mode} className={dropdownItemClasses} onClick={() => { setFormData({...formData, modeOfPayment: mode}); setShowModeDropdown(false); }}>{mode}</div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-700 text-white mr-2">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <Check className="w-4 h-4" /> {mode === 'edit' ? 'Update & Pay' : 'Save Record'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}