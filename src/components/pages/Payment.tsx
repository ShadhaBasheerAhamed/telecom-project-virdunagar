import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, Upload, Loader2 } from 'lucide-react';
import type { DataSource, UserRole, Payment } from '../../types';
import { ViewPaymentModal } from '../modals/ViewPaymentModal';
import { PaymentModal } from '../modals/PaymentModal';
import { PaymentService } from '../../services/paymentService';
import { WhatsAppService } from '../../services/whatsappService';
import { CustomerService } from '../../services/customerService';
import { toast } from 'sonner';
import { useSearch } from '../../contexts/SearchContext';

interface PaymentProps {
  dataSource: DataSource; // 'All', 'BSNL', or 'RMAX'
  theme: 'light' | 'dark';
  userRole: UserRole;
}

export function Payment({ dataSource, theme, userRole }: PaymentProps) {
  const isDark = theme === 'dark';
  
  // --- States ---
  const [payments, setPayments] = useState<Payment[]>([]); // Stores all fetched payments
  const { searchQuery, setSearchQuery } = useSearch(); // Global search context
  const [filterStatus, setFilterStatus] = useState('All'); // Filter by 'Paid'/'Unpaid'
  
  // Modal States
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null); // For View Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false); // For Add Payment Modal
  const [paymentModalMode, setPaymentModalMode] = useState<'add' | 'edit'>('add'); // ✅ Track Mode

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // For hidden file input (CSV upload)


  // ---------------------------------------------------------
  // 1. Fetch Payments
  // ---------------------------------------------------------
  // Loads payments from Firebase based on the selected Data Source.
  // Triggered when the component mounts or when 'dataSource' changes.
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = dataSource === 'All' 
        ? await PaymentService.getPayments() 
        : await PaymentService.getPaymentsBySource(dataSource);
      setPayments(data as Payment[]);
    } catch (error) {
      toast.error("Failed to load payments");
      setPayments([]); 
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [dataSource]);

  // ---------------------------------------------------------
  // 2. Filter Logic
  // ---------------------------------------------------------
  // Filters the displayed payments based on:
  // - Status (Paid/Unpaid)
  // - Data Source (if not 'All')
  // - Search Query (Name, Landline, Mobile, Email)
  const filteredPayments = payments.filter(payment => {
    // Basic Filters
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesSource = dataSource === 'All' || payment.source === dataSource;
    
    if (!searchQuery) return matchesStatus && matchesSource;
    
    // Search Logic (Case-insensitive)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      payment.customerName.toLowerCase().includes(searchLower) ||
      payment.landlineNo.includes(searchLower) ||
      (payment.mobileNo && payment.mobileNo.includes(searchLower)) ||
      (payment.email && payment.email.toLowerCase().includes(searchLower)); // ✅ Added Email Search
      
    return matchesSearch && matchesStatus && matchesSource;
  });

  // ---------------------------------------------------------
  // 3. Status Toggle (Paid <-> Unpaid)
  // ---------------------------------------------------------
  // Updates payment status AND customer status (Active/Inactive) in DB.
  // Sends WhatsApp acknowledgment if marked as 'Paid'.
  const handleStatusToggle = async (payment: Payment, newStatus: 'Paid' | 'Unpaid') => {
    // If user clicks "Unpaid" (wants to pay), open Modal instead of direct toggle
    if (payment.status === 'Unpaid' && newStatus === 'Paid') {
        setSelectedPayment(payment);
        setPaymentModalMode('edit'); // Set mode to Edit
        setPaymentModalOpen(true);
        return; 
    }

    // Direct toggle only for Paid -> Unpaid (Reverse)
    try {
      if (confirm("Are you sure you want to revert this to UNPAID?")) {
          await PaymentService.updatePayment(payment.id, { status: newStatus });
          const customer = await CustomerService.findCustomerByLandline(payment.landlineNo);
          if (customer) await CustomerService.updateCustomer(customer.id, { status: 'Inactive' });
          
          setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: newStatus } : p));
          toast.success('Status reverted to Unpaid');
      }
    } catch (error) { toast.error('Failed to update status'); }
  };

  // ---------------------------------------------------------
  // 4. Save Payment (From Modal)
  // ---------------------------------------------------------
  // Called when submitting the "Add Payment" form.
  // Handles duplicate checks, DB saving, wallet updates, and WhatsApp.
  const handleSavePayment = async (paymentData: any, customerId: string) => {
    try {
      if (paymentModalMode === 'add') {
          // Check duplicate
          const exists = await PaymentService.checkDuplicatePayment(paymentData.landlineNo, paymentData.paidDate);
          if (exists) { toast.error('Duplicate payment!'); return; }
          await PaymentService.addPayment(paymentData, customerId);
          toast.success('Payment Added');
      } else {
          // Edit Mode Logic (Paying an existing unpaid bill)
          await PaymentService.updatePayment(paymentData.id, paymentData);
          
          // Manually handle Wallet/Pending update for Edit Mode if needed
          if(customerId && paymentData.finalPendingAmount !== undefined) {
                 await CustomerService.updateCustomer(customerId, { 
                     pendingAmount: paymentData.finalPendingAmount,
                     walletBalance: paymentData.finalWalletBalance,
                     status: 'Active', 
                     renewalDate: paymentData.renewalDate 
                 });
          }
          toast.success('Bill Paid & Updated');
      }
      fetchPayments();
    } catch (error) { toast.error('Save failed'); }
    setPaymentModalOpen(false);
  };

  // ---------------------------------------------------------
  // 5. Bulk Upload (CSV)
  // ---------------------------------------------------------
  // Parses a CSV file and adds multiple payment records at once.
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim()); 
      const validPayments: Omit<Payment, 'id'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 5) {
            const billAmt = parseFloat(cols[2]) || 0;
            const paidDateStr = cols[4]?.trim() || new Date().toISOString().split('T')[0];
            const pDate = new Date(paidDateStr);
            if (isNaN(pDate.getTime())) continue;
            pDate.setMonth(pDate.getMonth() + 1); 
            
            // ✅ FIX: Added pendingAmount: 0
            validPayments.push({
                landlineNo: cols[0]?.trim(),
                customerName: cols[1]?.trim(),
                mobileNo: cols[6]?.trim() || '',
                email: cols[7]?.trim() || '',
                billAmount: billAmt,
                modeOfPayment: cols[3]?.trim() || 'CASH',
                status: 'Paid', 
                paidDate: paidDateStr,
                renewalDate: pDate.toISOString().split('T')[0],
                rechargePlan: cols[5]?.trim() || 'Bulk Import',
                duration: '30',
                commission: billAmt * 0.30, 
                source: dataSource === 'All' ? 'BSNL' : dataSource,
                walletBalance: 0, 
                pendingAmount: 0 // ✅ New Required Field
            });
        }
      }
      
      if (validPayments.length > 0) {
          try { 
              await PaymentService.addBulkPayments(validPayments); 
              fetchPayments(); 
              toast.success(`Imported ${validPayments.length} records!`); 
          } catch (error) { toast.error("Import failed."); }
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#4a5568' : '#cbd5e1'}; border-radius: 4px; }`}</style>
      
      <div className="mb-6">
        <h1 className={`text-3xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Management {dataSource !== 'All' && `(${dataSource})`}</h1>
        <div className={`flex flex-col md:flex-row gap-4 justify-between p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
            
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input type="text" className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-300'}`} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            <div className="flex gap-3">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`px-4 py-2 rounded-md ${isDark ? 'bg-gray-800 text-white' : 'bg-white border'}`}><option value="All">All Status</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></select>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"><Upload className="h-4 w-4" /> <span className="hidden md:inline">Bulk Upload</span></button>
                <button onClick={() => { setPaymentModalMode('add'); setPaymentModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"><Plus className="h-4 w-4" /> <span className="hidden md:inline">Add Payment</span></button>
            </div>
        </div>
      </div>

      <div className={`rounded-lg border shadow-xl overflow-hidden flex flex-col ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`} style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
                
                <thead className={`uppercase font-bold sticky top-0 z-40 ${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
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
                        <th className={`px-6 py-4 min-w-[120px] border-b border-inherit sticky right-[100px] z-40 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-100'}`}>Status</th>
                        <th className={`px-6 py-4 min-w-[100px] text-center border-b border-inherit sticky right-0 z-40 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-100'}`}>Action</th>
                    </tr>
                </thead>
                
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {loading ? (<tr><td colSpan={11} className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /><p>Loading...</p></td></tr>) : filteredPayments.length === 0 ? (<tr><td colSpan={11} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>) : (
                        filteredPayments.map((p) => (
                        <tr key={p.id} className={`group hover:bg-opacity-50 transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                            <td className="px-6 py-4 text-gray-300 border-b border-inherit">{p.landlineNo}</td>
                            <td className="px-6 py-4 text-gray-400 border-b border-inherit">{p.mobileNo || '-'}</td>
                            <td className="px-6 py-4 text-gray-400 border-b border-inherit">{p.email || '-'}</td>
                            <td className="px-6 py-4 font-bold border-b border-inherit">{p.customerName}</td>
                            <td className="px-6 py-4 border-b border-inherit">{p.rechargePlan}</td>
                            <td className="px-6 py-4 text-green-400 font-bold border-b border-inherit">₹{p.billAmount}</td>
                            {userRole === 'Super Admin' && <td className="px-6 py-4 text-purple-400 font-medium border-b border-inherit">₹{p.commission.toFixed(2)}</td>}
                            <td className="px-6 py-4 border-b border-inherit">{p.paidDate}</td>
                            <td className="px-6 py-4 border-b border-inherit">{p.renewalDate}</td>
                            
                            <td className={`px-6 py-4 border-b border-inherit sticky right-[100px] z-20 ${isDark ? 'bg-[#242a38] group-hover:bg-gray-800' : 'bg-white group-hover:bg-gray-50'}`}>
                                <button onClick={() => handleStatusToggle(p, p.status === 'Paid' ? 'Unpaid' : 'Paid')} className={`px-3 py-1 rounded-full text-xs font-bold border ${p.status === 'Paid' ? 'bg-green-500 text-white border-green-600' : 'bg-red-500 text-white border-red-600'}`}>{p.status}</button>
                            </td>
                            
                            <td className={`px-6 py-4 text-center border-b border-inherit sticky right-0 z-20 ${isDark ? 'bg-[#242a38] group-hover:bg-gray-800' : 'bg-white group-hover:bg-gray-50'}`}>
                                <button onClick={() => { setSelectedPayment(p); setViewModalOpen(true); }} className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-blue-900/20"><Eye className="w-4 h-4" /></button>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
      </div>
      
      {paymentModalOpen && <PaymentModal mode={paymentModalMode} data={selectedPayment} theme={theme} dataSource={dataSource} onClose={() => setPaymentModalOpen(false)} onSave={handleSavePayment} />}
      {viewModalOpen && selectedPayment && <ViewPaymentModal payment={selectedPayment} theme={theme} onClose={() => setViewModalOpen(false)} />}
    </div>
  );
}