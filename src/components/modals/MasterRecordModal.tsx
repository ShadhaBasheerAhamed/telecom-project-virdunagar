import { useState } from 'react';
import { X } from 'lucide-react';

interface MasterRecordModalProps {
  mode: 'add' | 'edit' | 'view';
  recordType: string;
  data: any;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (data: any) => void;
}

export function MasterRecordModal({ mode, recordType, data, theme, onClose, onSave }: MasterRecordModalProps) {
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState(data || {});

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${
    isDark
      ? 'bg-[#0F172A] border-[#334155] text-white focus:border-cyan-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
  } focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors`;

  const labelClasses = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getTitle = () => {
    const typeMap: { [key: string]: string } = {
      'routerMake': 'Router Make',
      'ontMake': 'ONT Make',
      'ontType': 'ONT Type',
      'plan': 'Plan',
      'oltIp': 'OLT IP',
      'employee': 'Employee',
      'department': 'Department',
      'designation': 'Designation',
      'user': 'User'
    };

    if (mode === 'add') return `Add New ${typeMap[recordType] || recordType}`;
    if (mode === 'edit') return `Edit ${typeMap[recordType] || recordType}`;
    return `View ${typeMap[recordType] || recordType} Details`;
  };

  const renderFields = () => {
    const fieldConfigs: { [key: string]: any[] } = {
      routerMake: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      ontMake: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      ontType: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      plan: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Plan Name', type: 'text', required: true },
        { key: 'price', label: 'Plan Price', type: 'number', required: true },
        { key: 'gst', label: 'GST (%)', type: 'number', required: true },
        { key: 'total', label: 'Total Amount', type: 'number', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      oltIp: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      employee: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'mobile', label: 'Phone Number', type: 'tel', required: true },
        { key: 'address', label: 'Address', type: 'textarea', required: true },
        { key: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      department: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Department Name', type: 'text', required: true },
        { key: 'head', label: 'Head', type: 'text', required: true },
        { key: 'location', label: 'Location', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      designation: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Title', type: 'text', required: true },
        { key: 'department', label: 'Department', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      user: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Username', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'text', required: true },
        { key: 'lastLogin', label: 'Last Login', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ]
    };

    const fields = fieldConfigs[recordType] || [];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.key}>
            <label className={labelClasses}>{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                className={inputClasses}
                disabled={mode === 'view'}
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                className={inputClasses}
                disabled={mode === 'view'}
                required={field.required}
                rows={3}
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                className={inputClasses}
                disabled={mode === 'view'}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-2xl border max-h-[90vh] flex flex-col ${
        isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'
      } shadow-2xl`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {getTitle()}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-white/10 transition-colors`}>
            <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="masterRecordForm" onSubmit={handleSubmit} className="space-y-6">
            {renderFields()}
          </form>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'} rounded-b-2xl`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border hover:bg-gray-50 text-gray-700'
          }`}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {mode !== 'view' && (
            <button form="masterRecordForm" type="submit" className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg transition-all">
              {mode === 'add' ? 'Add Record' : 'Save Changes'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}