import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Upload } from 'lucide-react';
import type { DataSource, UserRole } from '../../App';
import type { Payment } from '../../types';
import { ViewPaymentModal } from '../modals/ViewPaymentModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { PaymentModal } from '../modals/PaymentModal';
import { PaymentService } from '../../services/paymentService';
import { WhatsAppService } from '../../services/whatsappService'; // ✅ Import WhatsApp Service
import { toast } from 'sonner';

interface PaymentProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
  userRole: UserRole;
}

const PAYMENT_STORAGE_KEY = 'payments-data';
const CUSTOMER_STORAGE_KEY = 'customers-data';

// Mock data fallback
const mockPayments: Payment[] = [
  { 
    id: '792', landlineNo: '04562-206784', customerName: 'PONRAJ C..', 
    rechargePlan: '40MBPS 499 FIBER BASIC BSNL', duration: '30', 
    billAmount: 589, commission: 217.065, status: 'Paid', 
    paidDate: '2025-10-27', modeOfPayment: 'BSNL PAYMENT', 
    renewalDate: '2025-11-27', source: 'BSNL'
  }
];

export function Payment({ dataSource, theme, userRole }: PaymentProps) {
  const isDark = theme === 'dark';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchField, setSearchField] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalMode, setPaymentModalMode] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Payments from Firebase
  const fetchPayments = async () => {
    setLoading(true);
    try {
      let data;
      if (dataSource === 'All') {
        data = await PaymentService.getPayments();
      } else {
        data = await PaymentService.getPaymentsBySource(dataSource);
      }
      setPayments((data as Payment[]).length > 0 ? (data as Payment[]) : mockPayments);
    } catch (error) {
      toast.error("Failed to load payments");
      setPayments(mockPayments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [dataSource]);

  // Helper to get Mobile Number from Customer Data using Landline
  const getCustomerMobile = (landline: string) => {
    try {
        const stored = localStorage.getItem(CUSTOMER_STORAGE_KEY);
        if (stored) {
            const customers = JSON.parse(stored);
            const found = customers.find((c: any) => c.landline === landline);
            // Priority: Alt Mobile -> Main Mobile -> Landline
            return found ? (found.altMobileNo || found.mobileNo) : landline;
        }
    } catch (e) { return landline; }
    return landline;
  };

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = false;

    if (searchField === 'All') {
        matchesSearch = 
          payment.customerName.toLowerCase().includes(searchLower) ||
          payment.id.toLowerCase().includes(searchLower) ||
          payment.landlineNo.includes(searchLower);
    } else if (searchField === 'Name') {
        matchesSearch = payment.customerName.toLowerCase().includes(searchLower);
    } else if (searchField === 'Landline') {
        matchesSearch = payment.landlineNo.includes(searchLower);
    }

    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesSource = dataSource === 'All' || payment.source === dataSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  // --- SYNC CUSTOMER STATUS (Cloud Update) ---
  const syncCustomerStatus = (landline: string, status: 'Paid' | 'Unpaid') => {
      try {
          const storedCustomers = localStorage.getItem(CUSTOMER_STORAGE_KEY);
          if (storedCustomers) {
              const customers = JSON.parse(storedCustomers);
              let updated = false;
              const updatedCustomers = customers.map((c: any) => {
                  if (c.landline === landline) {
                      updated = true;
                      return { ...c, status: status === 'Paid' ? 'Active' : 'Inactive' };
                  }
                  return c;
              });
              
              if (updated) {
                  localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updatedCustomers));
                  toast.success(`Customer status updated to ${status === 'Paid' ? 'Active' : 'Inactive'}`);
              }
          }
      } catch (e) {
          console.error("Sync failed", e);
      }
  };

  // --- HANDLERS ---
  const handleStatusToggle = async (payment: Payment, newStatus: 'Paid' | 'Unpaid') => {
      try {
        // 1. Update in Firebase
        await PaymentService.updatePayment(payment.id, { status: newStatus });
        
        // 2. Update UI Locally
        const updated = payments.map(p => p.id === payment.id ? { ...p, status: newStatus } : p);
        setPayments(updated);
        
        // 3. Sync Customer Status
        syncCustomerStatus(payment.landlineNo, newStatus);

        // 4. ✅ Send WhatsApp Acknowledgement if Paid
        if (newStatus === 'Paid') {
             const mobileNo = getCustomerMobile(payment.landlineNo);
             // Use WhatsAppService to format & send
             const msg = WhatsAppService.sendPaymentAck(payment, mobileNo);
             // Note: WhatsAppService.sendPaymentAck handles opening the window itself if implemented correctly.
             // If it returns a string message, you can open it here manually:
             // WhatsAppService.openWhatsApp(mobileNo, msg);
        }
      } catch (error) {
        toast.error("Failed to update status");
      }
  };

  const handleSavePayment = async (paymentData: Payment) => {
      try {
        if (paymentModalMode === 'add') {
            const { id, ...dataWithoutId } = paymentData; 
            await PaymentService.addPayment(dataWithoutId);
            toast.success("Payment Added!");
            
            // ✅ Send WhatsApp if added as Paid immediately
            if (paymentData.status === 'Paid') {
                 const mobileNo = getCustomerMobile(paymentData.landlineNo);
                 WhatsAppService.sendPaymentAck(paymentData, mobileNo);
            }
        } else {
            await PaymentService.updatePayment(paymentData.id, paymentData);
            toast.success("Payment Updated!");
        }
        fetchPayments(); 
        syncCustomerStatus(paymentData.landlineNo, paymentData.status);
      } catch (error) {
        toast.error("Save failed");
      }
      setPaymentModalOpen(false);
  };

  const handleDeletePayment = async () => {
      if(selectedPayment) {
          try {
            await PaymentService.deletePayment(selectedPayment.id);
            const updated = payments.filter(p => p.id !== selectedPayment.id);
            setPayments(updated);
            setDeleteModalOpen(false);
            toast.success("Payment record deleted");
          } catch (error) {
            toast.error("Delete failed");
          }
      }
  };

  // --- BULK UPLOAD ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      let count = 0;
      
      // Skip header, loop rows
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 5) {
            const newPayment = {
                landlineNo: cols[0]?.trim() || '',
                customerName: cols[1]?.trim() || 'Unknown',
                billAmount: parseFloat(cols[2]) || 0,
                modeOfPayment: cols[3]?.trim() || 'CASH',
                status: (cols[4]?.trim() as any) || 'Unpaid',
                paidDate: new Date().toISOString().split('T')[0],
                renewalDate: '', 
                rechargePlan: 'Bulk Import',
                duration: '30',
                commission: 0,
                source: 'BSNL'
            };
            // Calculate basic commission for import (30%)
            newPayment.commission = (newPayment.billAmount * 0.30);
            
            await PaymentService.addPayment(newPayment);
            count++;
        }
      }
      if (count > 0) {
          fetchPayments();
          toast.success(`Imported ${count} records to Cloud`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mb-6">
        <h1 className={`text-3xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Management</h1>
        
        {/* Search & Filters */}
        <div className={`flex flex-col md:flex-row gap-4 justify-between p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-md ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex gap-3">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-md bg-gray-800 text-white">
                    <option value="All">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                </select>

                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md">
                    <Upload className="h-4 w-4" /> Upload
                </button>

                <button onClick={() => { setPaymentModalMode('add'); setPaymentModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md">
                    <Plus className="h-4 w-4" /> Add Payment
                </button>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg border shadow-xl overflow-hidden ${isDark ? 'border-gray-700 bg-[#242a38]' : 'bg-white'}`}>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className={`uppercase ${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <tr>
                        <th className="px-6 py-4">Landline</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Plan</th>
                        <th className="px-6 py-4">Amount</th>
                        {/* Show commission only for Super Admin */}
                        {userRole === 'Super Admin' && <th className="px-6 py-4">Commission</th>}
                        <th className="px-6 py-4">Paid Date</th>
                        <th className="px-6 py-4">Renewal</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Action</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {filteredPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-6 py-4 text-gray-300">{p.landlineNo}</td>
                            <td className="px-6 py-4 font-bold">{p.customerName}</td>
                            <td className="px-6 py-4">{p.rechargePlan}</td>
                            <td className="px-6 py-4 text-green-400 font-bold">₹{p.billAmount}</td>
                            
                            {/* HIDE COMMISSION DATA */}
                            {userRole === 'Super Admin' && (
                                <td className="px-6 py-4 text-purple-400 font-medium">₹{p.commission.toFixed(2)}</td>
                            )}

                            <td className="px-6 py-4">{p.paidDate}</td>
                            <td className="px-6 py-4">{p.renewalDate}</td>
                            <td className="px-6 py-4">
                                <select 
                                    value={p.status} 
                                    onChange={(e) => handleStatusToggle(p, e.target.value as any)}
                                    className={`px-2 py-1 rounded text-xs font-bold cursor-pointer outline-none ${p.status === 'Paid' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}
                                >
                                    <option value="Paid" className="bg-gray-800">Paid</option>
                                    <option value="Unpaid" className="bg-gray-800">Unpaid</option>
                                </select>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                                <button onClick={() => { setSelectedPayment(p); setViewModalOpen(true); }} className="text-blue-400"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedPayment(p); setPaymentModalMode('edit'); setPaymentModalOpen(true); }} className="text-yellow-400"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedPayment(p); setDeleteModalOpen(true); }} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modals */}
      {paymentModalOpen && (
        <PaymentModal 
            mode={paymentModalMode} 
            data={selectedPayment} 
            theme={theme} 
            onClose={() => setPaymentModalOpen(false)} 
            onSave={handleSavePayment} 
        />
      )}
      {viewModalOpen && selectedPayment && <ViewPaymentModal payment={selectedPayment} theme={theme} onClose={() => setViewModalOpen(false)} />}
      {deleteModalOpen && <DeleteConfirmModal title="Delete Payment" message="Are you sure?" theme={theme} onConfirm={handleDeletePayment} onCancel={() => setDeleteModalOpen(false)} />}
    </div>
  );
}