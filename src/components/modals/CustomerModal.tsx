import { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import type { Customer } from '../../types';
import { MasterRecordService } from '../../services/masterRecordService';
import { MasterRecordModal } from './MasterRecordModal'; // ✅ Import for Quick Add
import { toast } from 'sonner';

interface CustomerModalProps {
  mode: 'add' | 'edit';
  customer: Customer | null;
  theme: 'light' | 'dark';
  defaultSource?: string; 
  onClose: () => void;
  onSave: (customer: any) => void;
}

export function CustomerModal({ mode, customer, theme, defaultSource, onClose, onSave }: CustomerModalProps) {
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  
  // ✅ Controls which Master Modal is open (routerMac or ontMac)
  const [activeMasterType, setActiveMasterType] = useState<string | null>(null);

  // Dynamic Data States
  const [plans, setPlans] = useState<any[]>([]);
  const [oltIps, setOltIps] = useState<any[]>([]);
  const [routerMakes, setRouterMakes] = useState<any[]>([]);
  const [ontMakes, setOntMakes] = useState<any[]>([]);
  const [ontTypes, setOntTypes] = useState<any[]>([]);
  const [routerMacs, setRouterMacs] = useState<any[]>([]);
  const [ontMacs, setOntMacs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    id: '', landline: '', name: '', mobileNo: '', altMobileNo: '', vlanId: '', bbId: '', voipPassword: '',
    ontMake: '', ontType: '', ontMacAddress: '', ontBillNo: '', ont: 'Paid ONT', offerPrize: '0',
    routerMake: '', routerMacId: '', oltIp: '', installationDate: new Date().toISOString().split('T')[0],
    status: 'Active', source: defaultSource && defaultSource !== 'All' ? defaultSource : 'BSNL',
    plan: '', ottSubscription: '', email: ''
  });

  // 1. Fetch Master Records (Re-usable function)
  const loadMasterData = async () => {
    try {
      const [p, i, rMake, rMac, oMake, oType, oMac] = await Promise.all([
          MasterRecordService.getRecords('plan'),
          MasterRecordService.getRecords('oltIp'),
          MasterRecordService.getRecords('routerMake'),
          MasterRecordService.getRecords('routerMac'), // ✅ Router Mac
          MasterRecordService.getRecords('ontMake'),
          MasterRecordService.getRecords('ontType'),
          MasterRecordService.getRecords('ontMac')     // ✅ ONT Mac
      ]);
      setPlans(p.filter((x: any) => x.status === 'Active'));
      setOltIps(i.filter((x: any) => x.status === 'Active'));
      setRouterMakes(rMake.filter((x: any) => x.status === 'Active'));
      setRouterMacs(rMac.filter((x: any) => x.status === 'Active'));
      setOntMakes(oMake.filter((x: any) => x.status === 'Active'));
      setOntTypes(oType.filter((x: any) => x.status === 'Active'));
      setOntMacs(oMac.filter((x: any) => x.status === 'Active'));
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  // Initial Load
  useEffect(() => {
    loadMasterData();
  }, []);

  // 2. Populate Form on Edit
  useEffect(() => {
    if (mode === 'edit' && customer) {
      setFormData({ ...customer } as any);
    }
  }, [mode, customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        onSave(formData);
    } catch (error) {
        toast.error("Failed to save customer");
    } finally {
        setLoading(false);
    }
  };

  // ✅ Callback when new record is added
  const handleMasterSave = async () => {
    await loadMasterData(); // Refresh Dropdowns
    setActiveMasterType(null); // Close Modal
    toast.success("New record added successfully!");
  };

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className={`w-full max-w-6xl rounded-2xl border max-h-[90vh] flex flex-col ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{mode === 'add' ? 'New Customer Registration' : 'Edit Customer Details'}</h2>
            <button onClick={onClose}><X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /></button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form id="customerForm" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Personal Information */}
              <div>
                <h3 className={`text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${isDark ? 'text-cyan-400 border-cyan-500/20' : 'text-cyan-700 border-cyan-200'}`}>Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className={labelClasses}>Customer Name *</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClasses} /></div>
                  <div><label className={labelClasses}>Mobile No *</label><input type="tel" required value={formData.mobileNo} onChange={e => setFormData({...formData, mobileNo: e.target.value})} className={inputClasses} /></div>
                  <div><label className={labelClasses}>Alt. Mobile</label><input type="tel" value={formData.altMobileNo} onChange={e => setFormData({...formData, altMobileNo: e.target.value})} className={inputClasses} /></div>
                  <div><label className={labelClasses}>Landline (Unique ID) *</label><input type="text" required value={formData.landline} onChange={e => setFormData({...formData, landline: e.target.value})} className={inputClasses} placeholder="04562-xxxxxx" /></div>
                  <div><label className={labelClasses}>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClasses} /></div>
                  <div><label className={labelClasses}>Install Date</label><input type="date" value={formData.installationDate} onChange={e => setFormData({...formData, installationDate: e.target.value})} className={inputClasses} /></div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className={`text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${isDark ? 'text-purple-400 border-purple-500/20' : 'text-purple-700 border-purple-200'}`}>Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div>
                    <label className={labelClasses}>Source</label>
                    <select 
                      value={formData.source} 
                      onChange={e => setFormData({...formData, source: e.target.value})} 
                      className={inputClasses}
                      disabled={!!defaultSource && defaultSource !== 'All'}
                    >
                      <option value="BSNL">BSNL</option>
                      <option value="RMAX">RMAX</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Plan</label>
                    <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} className={inputClasses} required>
                      <option value="">Select Plan</option>
                      {plans.length > 0 ? plans.map((p) => <option key={p.id} value={p.name}>{p.name} - ₹{p.total}</option>) : <option disabled>Loading...</option>}
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>OLT IP</label>
                    <select value={formData.oltIp} onChange={e => setFormData({...formData, oltIp: e.target.value})} className={inputClasses}>
                      <option value="">Select OLT IP</option>
                      {oltIps.map((ip) => <option key={ip.id} value={ip.name}>{ip.name}</option>)}
                    </select>
                  </div>

                  <div><label className={labelClasses}>BB ID / User ID</label><input type="text" value={formData.bbId} onChange={e => setFormData({...formData, bbId: e.target.value})} className={inputClasses} /></div>
                  <div><label className={labelClasses}>VLAN ID</label><input type="text" value={formData.vlanId} onChange={e => setFormData({...formData, vlanId: e.target.value})} className={inputClasses} /></div>
                  <div><label className={labelClasses}>OTT Subscription</label><input type="text" value={formData.ottSubscription} onChange={e => setFormData({...formData, ottSubscription: e.target.value})} className={inputClasses} /></div>
                  
                  <div>
                    <label className={labelClasses}>Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={inputClasses}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Device Information */}
              <div>
                <h3 className={`text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${isDark ? 'text-green-400 border-green-500/20' : 'text-green-700 border-green-200'}`}>Device Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  <div>
                      <label className={labelClasses}>ONT Make</label>
                      <select value={formData.ontMake} onChange={e => setFormData({...formData, ontMake: e.target.value})} className={inputClasses}>
                          <option value="">Select Make</option>
                          {ontMakes.map((o: any) => <option key={o.id} value={o.name}>{o.name}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className={labelClasses}>ONT Type</label>
                      <select value={formData.ontType} onChange={e => setFormData({...formData, ontType: e.target.value})} className={inputClasses}>
                          <option value="">Select Type</option>
                          {ontTypes.map((o: any) => <option key={o.id} value={o.name}>{o.name}</option>)}
                      </select>
                  </div>

                  {/* ✅ ONT MAC with ADD Button */}
                  <div>
                      <label className={labelClasses}>ONT Mac</label>
                      <div className="flex gap-2">
                        <select value={formData.ontMacAddress} onChange={e => setFormData({...formData, ontMacAddress: e.target.value})} className={inputClasses}>
                            <option value="">Select MAC</option>
                            {ontMacs.map((o: any) => <option key={o.id} value={o.name}>{o.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setActiveMasterType('ontMac')} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors" title="Add New ONT Mac">
                            <Plus className="w-4 h-4" />
                        </button>
                      </div>
                  </div>

                  <div><label className={labelClasses}>Bill No</label><input type="text" value={formData.ontBillNo} onChange={e => setFormData({...formData, ontBillNo: e.target.value})} className={inputClasses} /></div>
                  
                  <div>
                      <label className={labelClasses}>ONT Status</label>
                      <select value={formData.ont} onChange={e => setFormData({...formData, ont: e.target.value})} className={inputClasses}>
                          <option value="Paid ONT">Paid ONT</option>
                          <option value="Free ONT">Free ONT</option>
                          <option value="Offer Price">Offer Price</option>
                          <option value="Rented ONT">Rented ONT</option>
                      </select>
                  </div>
                  {formData.ont === 'Offer Price' && (
                       <div><label className={labelClasses}>Offer Price (₹)</label><input type="number" value={formData.offerPrize} onChange={e => setFormData({...formData, offerPrize: e.target.value})} className={inputClasses} /></div>
                  )}

                  <div>
                      <label className={labelClasses}>Router Make</label>
                      <select value={formData.routerMake} onChange={e => setFormData({...formData, routerMake: e.target.value})} className={inputClasses}>
                          <option value="">Select Router</option>
                          {routerMakes.map((r: any) => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                  </div>
                  
                  {/* ✅ ROUTER MAC with ADD Button */}
                  <div>
                      <label className={labelClasses}>Router Mac</label>
                      <div className="flex gap-2">
                        <select value={formData.routerMacId} onChange={e => setFormData({...formData, routerMacId: e.target.value})} className={inputClasses}>
                            <option value="">Select MAC</option>
                            {routerMacs.map((r: any) => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setActiveMasterType('routerMac')} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors" title="Add New Router Mac">
                            <Plus className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'} rounded-b-2xl`}>
            <button onClick={onClose} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border hover:bg-gray-50 text-gray-700'}`}>Cancel</button>
            <button form="customerForm" type="submit" disabled={loading} className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save Details
            </button>
          </div>
        </div>
      </div>

      {/* ✅ MASTER RECORD MODAL for Quick Add */}
      {activeMasterType && (
        <MasterRecordModal
          mode="add"
          recordType={activeMasterType}
          data={null}
          theme={theme}
          onClose={() => setActiveMasterType(null)}
          onSave={handleMasterSave}
        />
      )}
    </>
  );
}