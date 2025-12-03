import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface NetworkProviderModalProps {
  mode: 'add' | 'edit';
  provider: any;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (provider: any) => void;
}

export function NetworkProviderModal({ mode, provider, theme, onClose, onSave }: NetworkProviderModalProps) {
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    status: 'Active'
  });

  useEffect(() => {
    if (mode === 'edit' && provider) {
      setFormData({ ...provider });
    } else {
      setFormData({
        id: '',
        name: '',
        status: 'Active'
      });
    }
  }, [mode, provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      onSave(formData);
    } catch (error) {
      console.error("Failed to save network provider");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border max-h-[90vh] flex flex-col ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'add' ? 'Add Network Provider' : 'Edit Network Provider'}
          </h2>
          <button onClick={onClose}>
            <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="networkProviderForm" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={labelClasses}>Provider Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={inputClasses}
                placeholder="Enter provider name"
              />
            </div>

            <div>
              <label className={labelClasses}>Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className={inputClasses}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'} rounded-b-2xl`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border hover:bg-gray-50 text-gray-700'}`}
          >
            Cancel
          </button>
          <button
            form="networkProviderForm"
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'add' ? 'Add Provider' : 'Update Provider'}
          </button>
        </div>
      </div>
    </div>
  );
}
