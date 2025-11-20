import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Customer } from '../pages/Customers';

interface CustomerModalProps {
  mode: 'add' | 'edit';
  customer: Customer | null;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (customer: any) => void;
}

export function CustomerModal({ mode, customer, theme, onClose, onSave }: CustomerModalProps) {
  const isDark = theme === 'dark';
  
  // Initial State with all fields
  const [formData, setFormData] = useState({
    id: '',
    landline: '0',
    name: '',
    mobileNo: '',
    altMobileNo: '0',
    vlanId: '0',
    bbId: '',
    voipPassword: 'NILL',
    ontMake: 'N/A',
    ontType: 'NA',
    ontMacAddress: 'NA',
    ontBillNo: '0',
    ont: 'Paid ONT',
    offerPrize: '0',
    routerMake: 'N/A',
    routerMacId: 'NA',
    oltIp: '10.215.168.64',
    installationDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    source: 'BSNL',
  });

  useEffect(() => {
    if (mode === 'edit' && customer) {
      setFormData({
        id: customer.id,
        landline: customer.landline,
        name: customer.name,
        mobileNo: customer.mobileNo,
        altMobileNo: customer.altMobileNo,
        vlanId: customer.vlanId,
        bbId: customer.bbId,
        voipPassword: customer.voipPassword,
        ontMake: customer.ontMake,
        ontType: customer.ontType,
        ontMacAddress: customer.ontMacAddress,
        ontBillNo: customer.ontBillNo,
        ont: customer.ont,
        offerPrize: customer.offerPrize,
        routerMake: customer.routerMake,
        routerMacId: customer.routerMacId,
        oltIp: customer.oltIp,
        installationDate: customer.installationDate,
        status: customer.status,
        source: customer.source,
      });
    }
  }, [mode, customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'edit' && customer) {
      onSave({ ...customer, ...formData });
    } else {
      onSave(formData);
    }
  };

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${
    isDark
      ? 'bg-[#0F172A] border-[#334155] text-white focus:border-cyan-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
  } focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors`;

  const labelClasses = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  const sectionTitleClasses = `text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${
    isDark ? 'text-cyan-400 border-cyan-500/20' : 'text-cyan-700 border-cyan-200'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-6xl rounded-2xl border max-h-[90vh] flex flex-col ${
        isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'
      } shadow-2xl`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'add' ? 'New Customer Registration' : 'Edit Customer Details'}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-white/10 transition-colors`}>
            <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="customerForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Information */}
            <div>
              <h3 className={sectionTitleClasses}>Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className={labelClasses}>Customer ID</label><input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Full Name</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Mobile No</label><input type="tel" required value={formData.mobileNo} onChange={e => setFormData({...formData, mobileNo: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Alt. Mobile</label><input type="tel" value={formData.altMobileNo} onChange={e => setFormData({...formData, altMobileNo: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Landline</label><input type="text" value={formData.landline} onChange={e => setFormData({...formData, landline: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Install Date</label><input type="date" value={formData.installationDate} onChange={e => setFormData({...formData, installationDate: e.target.value})} className={inputClasses} /></div>
              </div>
            </div>

            {/* Technical Details */}
            <div>
              <h3 className={`text-sm font-black tracking-widest uppercase mb-4 pb-2 border-b ${isDark ? 'text-purple-400 border-purple-500/20' : 'text-purple-700 border-purple-200'}`}>Technical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className={labelClasses}>BB ID / User ID</label><input type="text" required value={formData.bbId} onChange={e => setFormData({...formData, bbId: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>VLAN ID</label><input type="text" value={formData.vlanId} onChange={e => setFormData({...formData, vlanId: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>VoIP Password</label><input type="text" value={formData.voipPassword} onChange={e => setFormData({...formData, voipPassword: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>OLT IP</label><input type="text" value={formData.oltIp} onChange={e => setFormData({...formData, oltIp: e.target.value})} className={inputClasses} /></div>
                <div>
                  <label className={labelClasses}>Source</label>
                  <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className={inputClasses}>
                    <option value="BSNL">BSNL</option>
                    <option value="RMAX">RMAX</option>
                  </select>
                </div>
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
                <div><label className={labelClasses}>ONT Make</label><input type="text" value={formData.ontMake} onChange={e => setFormData({...formData, ontMake: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>ONT Type</label><input type="text" value={formData.ontType} onChange={e => setFormData({...formData, ontType: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>ONT Mac</label><input type="text" value={formData.ontMacAddress} onChange={e => setFormData({...formData, ontMacAddress: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Bill No</label><input type="text" value={formData.ontBillNo} onChange={e => setFormData({...formData, ontBillNo: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>ONT Status</label><input type="text" value={formData.ont} onChange={e => setFormData({...formData, ont: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Offer Prize</label><input type="text" value={formData.offerPrize} onChange={e => setFormData({...formData, offerPrize: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Router Make</label><input type="text" value={formData.routerMake} onChange={e => setFormData({...formData, routerMake: e.target.value})} className={inputClasses} /></div>
                <div><label className={labelClasses}>Router Mac</label><input type="text" value={formData.routerMacId} onChange={e => setFormData({...formData, routerMacId: e.target.value})} className={inputClasses} /></div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'} rounded-b-2xl`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border hover:bg-gray-50 text-gray-700'}`}>
            Cancel
          </button>
          <button form="customerForm" type="submit" className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg transition-all">
            Save Details
          </button>
        </div>

      </div>
    </div>
  );
}