import { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronDown, Check } from 'lucide-react';
import type { Customer } from '../../types';
import { MasterRecordService } from '../../services/masterRecordService';
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

  // Dynamic Data States
  const [plans, setPlans] = useState<any[]>([]);
  const [oltIps, setOltIps] = useState<any[]>([]);
  const [routerMakes, setRouterMakes] = useState<any[]>([]);
  const [ontMakes, setOntMakes] = useState<any[]>([]);
  const [ontTypes, setOntTypes] = useState<any[]>([]);
  const [routerMacs, setRouterMacs] = useState<any[]>([]);
  const [ontMacs, setOntMacs] = useState<any[]>([]);
  const [otts, setOtts] = useState<any[]>([]); 

  const [formData, setFormData] = useState({
    id: '', landline: '', name: '', mobileNo: '', altMobileNo: '', vlanId: '', bbId: '', voipPassword: '',
    ontMake: '', ontType: '', ontMacAddress: '', ontBillNo: '', ont: 'Paid ONT', offerPrize: '0',
    routerMake: '', routerMacId: '', oltIp: '', installationDate: new Date().toISOString().split('T')[0],
    status: 'Active', source: defaultSource && defaultSource !== 'All' ? defaultSource : 'BSNL',
    plan: '', ottSubscription: '', email: ''
  });

  // 1. Fetch Master Records
  const loadMasterData = async () => {
    try {
      const [p, i, rMake, rMac, oMake, oType, oMac, ottData] = await Promise.all([
          MasterRecordService.getRecords('plan'),
          MasterRecordService.getRecords('oltIp'),
          MasterRecordService.getRecords('routerMake'),
          MasterRecordService.getRecords('routerMac'), 
          MasterRecordService.getRecords('ontMake'),
          MasterRecordService.getRecords('ontType'),
          MasterRecordService.getRecords('ontMac'),
          MasterRecordService.getRecords('ott') 
      ]);
      setPlans(p.filter((x: any) => x.status === 'Active'));
      setOltIps(i.filter((x: any) => x.status === 'Active'));
      setRouterMakes(rMake.filter((x: any) => x.status === 'Active'));
      setRouterMacs(rMac.filter((x: any) => x.status === 'Active'));
      setOntMakes(oMake.filter((x: any) => x.status === 'Active'));
      setOntTypes(oType.filter((x: any) => x.status === 'Active'));
      setOntMacs(oMac.filter((x: any) => x.status === 'Active'));
      setOtts(ottData.filter((x: any) => x.status === 'Active'));
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  useEffect(() => { loadMasterData(); }, []);

  useEffect(() => {
    if (mode === 'edit' && customer) {
      setFormData({ ...customer } as any);
    }
  }, [mode, customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { onSave(formData); } catch (error) { toast.error("Failed to save customer"); } finally { setLoading(false); }
  };

  // --- CUSTOM SELECT COMPONENT ---
  const CustomSelect = ({ label, value, onChange, options, placeholder = "Select...", disabled = false, required = false }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((opt: any) => (opt.name || opt) === value);
    const displayValue = selectedOption 
      ? (selectedOption.name ? `${selectedOption.name} ${selectedOption.total ? `(₹${selectedOption.total})` : ''}` : selectedOption)
      : placeholder;

    return (
      <div className="relative" ref={dropdownRef}>
        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-between cursor-pointer transition-all ${
            isDark 
              ? 'bg-[#0F172A] border-[#334155] text-white hover:border-cyan-500' 
              : 'bg-white border-gray-300 text-gray-900 hover:border-cyan-500'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="truncate pr-2">{displayValue}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>

        {isOpen && (
          <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 ${
            isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'
          }`}>
            {options.length > 0 ? (
              options.map((opt: any, idx: number) => {
                const optValue = opt.name || opt;
                const isSelected = value === optValue;
                const optLabel = opt.name ? `${opt.name} ${opt.total ? `(₹${opt.total})` : ''}` : opt;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected 
                        ? (isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-700')
                        : (isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className={`px-4 py-3 text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No options available
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const textInputClass = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
    isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelClasses = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#475569' : '#94a3b8'}; }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className={`w-full max-w-6xl rounded-2xl border max-h-[90vh] flex flex-col ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}>
          
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{mode === 'add' ? 'New Customer Registration' : 'Edit Customer Details'}</h2>
            <button onClick={onClose}><X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /></button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form id="customerForm" onSubmit={handleSubmit} className="space-y-8">
              
              {/* 1. Personal Information */}
              <div>
                <h3 className={`text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${isDark ? 'text-cyan-400 border-cyan-500/20' : 'text-cyan-700 border-cyan-200'}`}>Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className={labelClasses}>Customer Name *</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={textInputClass} /></div>
                  <div><label className={labelClasses}>Mobile No *</label><input type="tel" required value={formData.mobileNo} onChange={e => setFormData({...formData, mobileNo: e.target.value})} className={textInputClass} /></div>
                  <div><label className={labelClasses}>Alt. Mobile</label><input type="tel" value={formData.altMobileNo} onChange={e => setFormData({...formData, altMobileNo: e.target.value})} className={textInputClass} /></div>
                  <div><label className={labelClasses}>Landline (Unique ID) *</label><input type="text" required value={formData.landline} onChange={e => setFormData({...formData, landline: e.target.value})} className={textInputClass} placeholder="04562-xxxxxx" /></div>
                  <div><label className={labelClasses}>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={textInputClass} /></div>
                  <div><label className={labelClasses}>Install Date</label><input type="date" value={formData.installationDate} onChange={e => setFormData({...formData, installationDate: e.target.value})} className={textInputClass} /></div>
                </div>
              </div>

              {/* 2. Service Details */}
              <div>
                <h3 className={`text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${isDark ? 'text-purple-400 border-purple-500/20' : 'text-purple-700 border-purple-200'}`}>Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <CustomSelect label="Source" value={formData.source} onChange={(val: any) => setFormData({...formData, source: val})} options={['BSNL', 'RMAX', 'Private']} disabled={!!defaultSource && defaultSource !== 'All'} />
                  <CustomSelect label="Plan" value={formData.plan} onChange={(val: any) => setFormData({...formData, plan: val})} options={plans} required={true} placeholder="Select Plan" />
                  <CustomSelect label="OLT IP" value={formData.oltIp} onChange={(val: any) => setFormData({...formData, oltIp: val})} options={oltIps} placeholder="Select OLT IP" />
                  
                  <div><label className={labelClasses}>BB ID / User ID</label><input type="text" value={formData.bbId} onChange={e => setFormData({...formData, bbId: e.target.value})} className={textInputClass} /></div>
                  <div><label className={labelClasses}>VLAN ID</label><input type="text" value={formData.vlanId} onChange={e => setFormData({...formData, vlanId: e.target.value})} className={textInputClass} /></div>
                  
                  <CustomSelect label="OTT Subscription" value={formData.ottSubscription} onChange={(val: any) => setFormData({...formData, ottSubscription: val})} options={otts} placeholder="Select OTT" />
                  <CustomSelect label="Status" value={formData.status} onChange={(val: any) => setFormData({...formData, status: val})} options={['Active', 'Inactive', 'Suspended', 'Expired']} />
                </div>
              </div>
              
              {/* 3. Device Information */}
              <div>
                <h3 className={`text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${isDark ? 'text-green-400 border-green-500/20' : 'text-green-700 border-green-200'}`}>Device Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <CustomSelect label="ONT Make" value={formData.ontMake} onChange={(val: any) => setFormData({...formData, ontMake: val})} options={ontMakes} placeholder="Select Make" />
                  <CustomSelect label="ONT Type" value={formData.ontType} onChange={(val: any) => setFormData({...formData, ontType: val})} options={ontTypes} placeholder="Select Type" />
                  <CustomSelect label="ONT Mac" value={formData.ontMacAddress} onChange={(val: any) => setFormData({...formData, ontMacAddress: val})} options={ontMacs} placeholder="Select MAC" />
                  
                  <div><label className={labelClasses}>Bill No</label><input type="text" value={formData.ontBillNo} onChange={e => setFormData({...formData, ontBillNo: e.target.value})} className={textInputClass} /></div>
                  
                  <CustomSelect label="ONT Status" value={formData.ont} onChange={(val: any) => setFormData({...formData, ont: val})} options={['Paid ONT', 'Free ONT', 'Offer Price', 'Rented ONT']} />
                  
                  {formData.ont === 'Offer Price' && (
                       <div><label className={labelClasses}>Offer Price (₹)</label><input type="number" value={formData.offerPrize} onChange={e => setFormData({...formData, offerPrize: e.target.value})} className={textInputClass} /></div>
                  )}

                  <CustomSelect label="Router Make" value={formData.routerMake} onChange={(val: any) => setFormData({...formData, routerMake: val})} options={routerMakes} placeholder="Select Router" />
                  <CustomSelect label="Router Mac" value={formData.routerMacId} onChange={(val: any) => setFormData({...formData, routerMacId: val})} options={routerMacs} placeholder="Select MAC" />
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
    </>
  );
}