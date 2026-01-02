import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, Upload, Loader2, ChevronDown, Percent, Save, Check } from 'lucide-react'; 
import type { DataSource, UserRole, Payment, Customer } from '../../types';
import { ViewPaymentModal } from '../modals/ViewPaymentModal';
import { PaymentModal } from '../modals/PaymentModal';
import { PaymentService } from '../../services/paymentService';
import { CustomerService } from '../../services/customerService';
import { toast } from 'sonner';
import { useSearch } from '../../contexts/SearchContext';

interface PaymentProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
  userRole: UserRole;
}

export function Payment({ dataSource, theme, userRole }: PaymentProps) {
  const isDark = theme === 'dark';
  
  // --- States ---
  const [payments, setPayments] = useState<Payment[]>([]);
  const { searchQuery, setSearchQuery } = useSearch();
  const [filterStatus, setFilterStatus] = useState('All');
  
  // ✅ Commission Logic State
  const [commissionPercent, setCommissionPercent] = useState<string>('');
  const [isSavingComm, setIsSavingComm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- Modal States ---
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalMode, setPaymentModalMode] = useState<'add' | 'edit'>('add');
  const [modalKey, setModalKey] = useState(0); 

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // --- Fetch Payments & Commission Rate ---
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = dataSource === 'All' 
        ? await PaymentService.getPayments() 
        : await PaymentService.getPaymentsBySource(dataSource);
      setPayments(data as Payment[]);

      // ✅ Fetch Saved Rate from DB if specific source is selected
      if (dataSource !== 'All') {
          const rate = await PaymentService.getCommissionRate(dataSource);
          setCommissionPercent(rate.toString());
      } else {
          setCommissionPercent(''); // Clear if viewing All
      }

    } catch (error) {
      toast.error("Failed to load payments");
      setPayments([]); 
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [dataSource]);

  // ✅ Save Commission Rate Handler (Super Admin Only)
  const handleSaveCommission = async () => {
      if (dataSource === 'All' || !commissionPercent) return;
      
      setIsSavingComm(true);
      try {
          await PaymentService.saveCommissionRate(dataSource, parseFloat(commissionPercent));
          
          // Success Animation
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000); 
          
          toast.success(`${dataSource} Commission set to ${commissionPercent}%`);
      } catch (error) {
          toast.error("Failed to save rate");
      } finally {
          setIsSavingComm(false);
      }
  };

  // --- Filter Logic ---
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesSource = dataSource === 'All' || payment.source === dataSource;
    if (!searchQuery) return matchesStatus && matchesSource;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      payment.customerName.toLowerCase().includes(searchLower) ||
      payment.landlineNo.includes(searchLower) ||
      (payment.mobileNo && payment.mobileNo.includes(searchLower)) ||
      (payment.email && payment.email.toLowerCase().includes(searchLower)); 
      
    return matchesSearch && matchesStatus && matchesSource;
  });

  // --- Status Toggle ---
  const handleStatusToggle = async (payment: Payment, newStatus: 'Paid' | 'Unpaid') => {
    if (updatingStatus === payment.id) return;

    if (payment.status === 'Unpaid' && newStatus === 'Paid') {
        setSelectedPayment(payment);
        setPaymentModalMode('edit');
        setModalKey(prev => prev + 1);
        setPaymentModalOpen(true);
        return; 
    }

    try {
      if (confirm("Are you sure you want to revert this to UNPAID?")) {
          setUpdatingStatus(payment.id);
          await PaymentService.updatePayment(payment.id, { status: newStatus });
          const customer = await CustomerService.findCustomerByLandline(payment.landlineNo);
          if (customer) await CustomerService.updateCustomer(customer.id, { status: 'Inactive' });
          
          setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: newStatus } : p));
          toast.success('Status reverted to Unpaid');
      }
    } catch (error) { toast.error('Failed to update status'); }
    finally { setUpdatingStatus(null); }
  };

  // --- 🔴 CRITICAL FIX: Save Logic (Add/Edit Payment) ---
  const handleSavePayment = async (paymentData: any, customerId: string) => {
    try {
      let finalCustomerId = customerId;
      
      // 1. Get Correct Commission Rate
      let rateToUse = 30; // Fallback default

      if (dataSource !== 'All') {
          // If we are on a specific tab (e.g. BSNL), FORCE that source rate
          rateToUse = await PaymentService.getCommissionRate(dataSource);
      } else {
          // If on 'All', check the form data for source rate
          if(paymentData.source) {
             rateToUse = await PaymentService.getCommissionRate(paymentData.source);
          }
      }

      // ✅ 2. FIX NaN ERROR: Force Numbers
      // If parsing fails, default to 0. This prevents Firebase rejection.
      const safeBillAmount = parseFloat(paymentData.billAmount) || 0;
      const safeRate = isNaN(parseFloat(rateToUse.toString())) ? 30 : parseFloat(rateToUse.toString());
      const calculatedCommission = (safeBillAmount * safeRate) / 100;
      
      // ✅ 3. FIX MISSING SOURCE: Force Source String
      // If source is missing, use 'BSNL' or current dataSource
      const safeSource = paymentData.source || (dataSource === 'All' ? 'BSNL' : dataSource);

      // ✅ 4. Construct Final Safe Data
      const finalPaymentData = {
  ...paymentData,

  paidDate: new Date(paymentData.paidDate).toISOString(),
  renewalDate: new Date(paymentData.renewalDate).toISOString(),

  billAmount: safeBillAmount,
  source: safeSource,
  commission: isNaN(calculatedCommission) ? 0 : calculatedCommission,

  mobileNo: paymentData.mobileNo || "",
  email: paymentData.email || "",
  customerName: paymentData.customerName || "Unknown",
  rechargePlan: paymentData.rechargePlan || "Plan",
};


      console.log("🚀 Attempting to Save:", finalPaymentData); // Debug Log

      // Find Customer ID if missing
      if (!finalCustomerId && paymentData.landlineNo) {
          const foundCustomer = await CustomerService.findCustomerByLandline(paymentData.landlineNo);
          if (foundCustomer) finalCustomerId = foundCustomer.id;
      }

      if (paymentModalMode === 'add') {
          // Check Duplicate
          const exists = await PaymentService.checkDuplicatePayment(paymentData.landlineNo, paymentData.paidDate);
          if (exists) { 
              toast.error('Payment already exists for this month!'); 
              return; 
          }
          
          

          // ✅ 5. ADD TO FIREBASE
          const newDocId = await PaymentService.addPayment(finalPaymentData, finalCustomerId || null);

          
          // ✅ 6. UPDATE UI IMMEDIATELY
          const newRecord = { ...finalPaymentData, id: newDocId } as Payment;
          await fetchPayments();


          toast.success(`Payment Saved! (Comm: ${safeRate}%)`);
      } else {
          // Update Logic
          await PaymentService.updatePayment(paymentData.id, finalPaymentData);
          
          if(finalCustomerId && paymentData.finalPendingAmount !== undefined) {
               await CustomerService.updateCustomer(finalCustomerId, { 
                   pendingAmount: paymentData.finalPendingAmount,
                   walletBalance: paymentData.finalWalletBalance,
                   status: 'Active', 
                   renewalDate: paymentData.renewalDate 
               });
          }
          
          setPayments(prev => prev.map(p => p.id === paymentData.id ? { ...p, ...finalPaymentData } : p));
          toast.success('Payment Updated');
      }

      setPaymentModalOpen(false);
      setSelectedPayment(null);

    } catch (error) { 
        console.error("❌ Save Failed:", error);
        toast.error('Save failed. Open Console (F12) to see why.'); 
    }
  };

  // --- Bulk Upload ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let rate = 30;
    if (dataSource !== 'All') {
        rate = await PaymentService.getCommissionRate(dataSource);
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim()); 
      const validPayments: Omit<Payment, 'id'>[] = [];
      const customersToCreate: Omit<Customer, 'id'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 5) {
            const landlineNo = cols[0]?.trim();
            const customerName = cols[1]?.trim();
            const billAmt = parseFloat(cols[2]) || 0;
            const paymentMode = cols[3]?.trim() || 'CASH';
            const paidDateStr = cols[4]?.trim() || new Date().toISOString().split('T')[0];
            const planName = cols[5]?.trim() || 'Bulk Import';
            const mobileNo = cols[6]?.trim() || '';
            const email = cols[7]?.trim() || '';

            if (!landlineNo || !customerName) continue;

            const pDate = new Date(paidDateStr);
            if (isNaN(pDate.getTime())) continue;
            pDate.setMonth(pDate.getMonth() + 1); 
            const renewalDate = pDate.toISOString().split('T')[0];
            
            const calculatedComm = billAmt * (rate / 100);

            validPayments.push({
                landlineNo, customerName, mobileNo, email,
                billAmount: billAmt,
                modeOfPayment: paymentMode,
                status: 'Paid', 
                paidDate: paidDateStr,
                renewalDate: renewalDate,
                rechargePlan: planName,
                duration: '30',
                commission: calculatedComm, 
                source: dataSource === 'All' ? 'BSNL' : dataSource,
                walletBalance: 0, 
                pendingAmount: 0 
            });

            customersToCreate.push({
                landline: landlineNo,
                name: customerName,
                mobileNo: mobileNo,
                email: email,
                plan: planName,
                source: (dataSource === 'All' ? 'BSNL' : dataSource) as any,
                status: 'Active' as const, 
                walletBalance: 0,
                pendingAmount: 0,
                installationDate: paidDateStr,
                renewalDate: renewalDate,
                altMobileNo: '', vlanId: '', bbId: '', voipPassword: '',
                ontMake: '', ontType: '', ontMacAddress: '', ontBillNo: '',
                ont: 'Paid ONT' as const, 
                offerPrize: '0', routerMake: '', routerMacId: '',
                oltIp: '', address: ''
            });
        }
      }
      
      if (validPayments.length > 0) {
          try { 
              await PaymentService.addBulkPayments(validPayments); 
              
              let newCustCount = 0;
              for (const cust of customersToCreate) {
                  const exists = await CustomerService.findCustomerByLandline(cust.landline);
                  if (!exists) {
                      await CustomerService.addCustomer(cust);
                      newCustCount++;
                  } else {
                      await CustomerService.updateCustomer(exists.id, { 
                          renewalDate: cust.renewalDate,
                          status: 'Active'
                      });
                  }
              }

              fetchPayments(); 
              toast.success(`Imported ${validPayments.length} payments with ${rate}% Commission!`); 
          } catch (error) { 
              console.error(error);
              toast.error("Import failed partly."); 
          }
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const openAddModal = () => {
      setSelectedPayment(null);
      setPaymentModalMode('add');
      setModalKey(prev => prev + 1); 
      setPaymentModalOpen(true);
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${isDark ? '#1a1f2c' : '#f1f5f9'}; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#475569' : '#94a3b8'}; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: ${isDark ? '#334155 #1a1f2c' : '#cbd5e1 #f1f5f9'}; }
        
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      
      {/* Header & Controls */}
      <div className={`mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
           
           {/* LEFT SIDE: Search Input */}
           <div className="relative w-full md:w-96">
               <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
               <input
                 type="text"
                 className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                   isDark 
                     ? 'bg-[#0f172a] border-slate-700 text-slate-200 placeholder-slate-500' 
                     : 'bg-white border-gray-200 text-gray-900'
                 }`}
                 placeholder="Search payments..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
           </div>
           
           {/* RIGHT SIDE: Filters & Actions */}
           <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
               
               {/* ✅ NEAT & STATIC COMMISSION BOX */}
               {userRole === 'Super Admin' && dataSource !== 'All' && (
                 <div className={`flex items-center justify-between gap-3 pl-3 pr-2 py-1.5 rounded-lg border transition-all ${
                    isDark 
                        ? 'bg-slate-800/80 border-slate-600 shadow-inner' 
                        : 'bg-indigo-50/80 border-indigo-200 shadow-sm'
                 }`}>
                    {/* Label & Input Group */}
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-indigo-500'}`}>
                            {dataSource} COMM
                        </span>
                        
                        <div className="flex items-center bg-transparent relative">
                            <input 
                                type="number"
                                value={commissionPercent}
                                onChange={(e) => setCommissionPercent(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()} 
                                className={`w-12 bg-transparent text-lg font-bold outline-none p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    isDark ? 'text-blue-400 placeholder-slate-600' : 'text-indigo-600 placeholder-indigo-300'
                                }`}
                                placeholder="0"
                            />
                            <Percent className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-indigo-400'}`} />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className={`h-6 w-[1px] ${isDark ? 'bg-slate-700' : 'bg-indigo-200'}`}></div>
                    
                    <button 
                        onClick={handleSaveCommission}
                        disabled={isSavingComm}
                        className={`p-1.5 rounded-md transition-all ${
                            saveSuccess 
                                ? 'bg-green-500 text-white shadow-lg scale-105'
                                : isSavingComm 
                                    ? 'bg-gray-500/10 cursor-not-allowed'
                                    : isDark 
                                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                                        : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-white hover:text-indigo-700 hover:border-indigo-300'
                        }`}
                        title="Save Rate"
                    >
                        {saveSuccess ? <Check className="w-4 h-4" /> : isSavingComm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                 </div>
               )}

               <div className={`h-8 w-[1px] hidden md:block ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>

               {/* Status Filter */}
               <div className="relative flex-1 md:flex-none">
                 <select
                   value={filterStatus}
                   onChange={(e) => setFilterStatus(e.target.value)}
                   className={`w-full md:w-auto appearance-none px-4 py-2.5 pr-10 rounded-md border outline-none text-sm font-medium transition-colors ${
                     isDark 
                       ? 'bg-[#0f172a] border-slate-700 text-slate-200' 
                       : 'bg-white border-gray-200 text-gray-900'
                   }`}
                 >
                   <option value="All">All Status</option>
                   <option value="Paid">Paid</option>
                   <option value="Unpaid">Unpaid</option>
                 </select>
                 <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
               </div>

               <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
               
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-lg transition-all flex-1 md:flex-none">
                   <Upload className="h-4 w-4" /> 
                   <span className="hidden sm:inline">Bulk</span>
               </button>
               
               <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg transition-all flex-1 md:flex-none">
                   <Plus className="h-4 w-4" /> 
                   <span className="hidden sm:inline">Add</span>
               </button>
           </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className={`rounded-xl border shadow-lg overflow-hidden flex flex-col ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`} style={{ height: 'calc(100vh - 220px)' }}>
        
        <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="w-full text-sm text-left border-separate border-spacing-0 whitespace-nowrap">
                <thead className={`uppercase font-bold sticky top-0 z-40 ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
                    <tr>
                        <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Landline</th>
                        <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Mobile</th>
                        <th className="px-6 py-4 min-w-[180px] border-b border-inherit bg-inherit">Email</th>
                        <th className="px-6 py-4 min-w-[200px] border-b border-inherit bg-inherit">Name</th>
                        <th className="px-6 py-4 min-w-[180px] border-b border-inherit bg-inherit">Plan</th>
                        <th className="px-6 py-4 min-w-[120px] border-b border-inherit bg-inherit">Amount</th>
                        {userRole === 'Super Admin' && <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Commission</th>}
                        <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Paid Date</th>
                        <th className="px-6 py-4 min-w-[140px] border-b border-inherit bg-inherit">Renewal</th>
                        <th className={`px-6 py-4 min-w-[120px] sticky right-[100px] z-40 border-b border-inherit shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>Status</th>
                        <th className={`px-6 py-4 min-w-[100px] text-center sticky right-0 z-40 border-b border-inherit ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>Action</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                    {loading ? (
                        <tr>
                            <td colSpan={11} className="py-12 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading payments...</p>
                                </div>
                            </td>
                        </tr>
                    ) : filteredPayments.length === 0 ? (
                        <tr>
                            <td colSpan={11} className="py-12 text-center">
                                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No payment records found.</p>
                            </td>
                        </tr>
                    ) : (
                        filteredPayments.map((p) => (
                        <tr key={p.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                            <td className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{p.landlineNo}</td>
                            <td className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-white-400' : 'text-black-500'}`}>{p.mobileNo || '-'}</td>
                            <td className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-white-400' : 'text-black-500'}`}>{p.email || '-'}</td>
                            <td className={`px-6 py-4 font-medium border-b border-inherit ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.customerName}</td>
                            <td className={`px-6 py-4 border-b border-inherit ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{p.rechargePlan}</td>
                            <td className="px-6 py-4 text-green-500 font-bold border-b border-inherit">₹{p.billAmount}</td>
                            {userRole === 'Super Admin' && <td className="px-6 py-4 text-purple-500 font-medium border-b border-inherit">₹{p.commission ? p.commission.toFixed(2) : '0.00'}</td>}
                            <td className="px-6 py-4 border-b border-inherit">{p.paidDate}</td>
                            <td className="px-6 py-4 border-b border-inherit">{p.renewalDate}</td>
                            <td className={`px-6 py-4 border-b border-inherit sticky right-[100px] z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                                <button 
                                    onClick={() => handleStatusToggle(p, p.status === 'Paid' ? 'Unpaid' : 'Paid')} 
                                    disabled={updatingStatus === p.id}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                        p.status === 'Paid' 
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' 
                                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                                    } ${updatingStatus === p.id ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {updatingStatus === p.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : p.status}
                                </button>
                            </td>
                            <td className={`px-6 py-4 text-center border-b border-inherit sticky right-0 z-20 ${isDark ? 'bg-slate-800/90 group-hover:bg-slate-800' : 'bg-white group-hover:bg-gray-50'}`}>
                                <button onClick={() => { setSelectedPayment(p); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-blue-500/10 transition-colors"><Eye className="w-4 h-4" /></button>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
      </div>
      
      {paymentModalOpen && (
        <PaymentModal 
            key={modalKey}
            mode={paymentModalMode} 
            data={selectedPayment} 
            theme={theme} 
            dataSource={dataSource} 
            onClose={() => setPaymentModalOpen(false)} 
            onSave={handleSavePayment} 
        />
      )}
      
      {viewModalOpen && selectedPayment && <ViewPaymentModal payment={selectedPayment} theme={theme} onClose={() => setViewModalOpen(false)} />}
    </div>
  );
}