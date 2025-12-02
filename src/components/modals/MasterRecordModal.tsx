import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { MasterRecordService } from '../../services/masterRecordService';
import { toast } from 'sonner';

interface MasterRecordModalProps {
  mode: 'add' | 'edit' | 'view';
  recordType: string;
  data: any;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (data?: any) => void; 
}

interface FormErrors {
  [key: string]: string;
}

export function MasterRecordModal({ mode, recordType, data, theme, onClose, onSave }: MasterRecordModalProps) {
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState(data || {});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${
    isDark
      ? 'bg-[#0F172A] border-[#334155] text-white focus:border-cyan-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
  } focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors`;

  const labelClasses = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  // Auto-calculate plan total when price or GST changes
  useEffect(() => {
    if (recordType === 'plan' && formData.price && formData.gst) {
      const price = parseFloat(formData.price) || 0;
      const gst = parseFloat(formData.gst) || 0;
      const total = MasterRecordService.calculatePlanTotal(price, gst);
      setFormData(prev => ({ ...prev, total }));
    }
  }, [formData.price, formData.gst, recordType]);

  const validateForm = (): boolean => {
    const validation = MasterRecordService.validateRecord(recordType, formData);
    
    if (!validation.isValid) {
      const formErrors: FormErrors = {};
      validation.errors.forEach(error => {
        if (error.toLowerCase().includes('name')) {
          formErrors.name = error;
        } else {
          formErrors.general = error;
        }
      });
      setErrors(formErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const recordData = { ...formData };
      
      if (recordType === 'plan') {
        recordData.price = parseFloat(formData.price) || 0;
        recordData.gst = parseFloat(formData.gst) || 0;
        recordData.total = parseFloat(formData.total) || 0;
      }

      if (mode === 'add') {
        await MasterRecordService.addRecord(recordType, recordData);
        toast.success(`${recordType} record added successfully!`);
      } else if (mode === 'edit' && data?.id) {
        await MasterRecordService.updateRecord(recordType, data.id, recordData);
        toast.success(`${recordType} record updated successfully!`);
      }

      onSave(); 
      onClose();

    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} ${recordType} record:`, error);
      setErrors({ 
        submit: `Failed to ${mode === 'add' ? 'add' : 'update'} record. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const getTitle = () => {
    // This map helps show user-friendly titles
    const typeMap: { [key: string]: string } = {
      'routerMake': 'Router Make',
      'routerMac': 'Router Mac', // ✅ Added
      'ontMake': 'ONT Make',
      'ontType': 'ONT Type',
      'ontMac': 'ONT Mac',       // ✅ Added
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
        { key: 'id', label: 'ID', type: 'text', required: false }, // ID not required for add
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      // ✅ Added Router Mac
      routerMac: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Router Mac Address', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      ontMake: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      // ✅ Added ONT Mac
      ontMac: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'ONT Mac Address', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      ontType: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      plan: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Plan Name', type: 'text', required: true },
        { key: 'price', label: 'Plan Price (₹)', type: 'number', required: true },
        { key: 'gst', label: 'GST (%)', type: 'number', required: true },
        { key: 'total', label: 'Total Amount (₹)', type: 'number', required: true }, // Auto-calc, hidden or read-only handled in loop
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      oltIp: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Name / IP Address', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      employee: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'mobile', label: 'Phone Number', type: 'tel', required: true },
        { key: 'address', label: 'Address', type: 'textarea', required: true },
        { key: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      department: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Department Name', type: 'text', required: true },
        { key: 'head', label: 'Head', type: 'text', required: true },
        { key: 'location', label: 'Location', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      designation: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Title', type: 'text', required: true },
        { key: 'department', label: 'Department', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      user: [
        { key: 'id', label: 'ID', type: 'text', required: false },
        { key: 'name', label: 'Username', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'text', required: true },
        { key: 'lastLogin', label: 'Last Login', type: 'text', required: false },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ]
    };

    const fields = fieldConfigs[recordType] || [];
    
    return (
      <div className="space-y-6">
        {errors.general && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => {
             // Skip showing ID field in Add Mode (as it is auto-generated)
             if (field.key === 'id' && mode === 'add') return null;

             return (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className={labelClasses}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className={`${inputClasses} ${errors[field.key] ? 'border-red-500' : ''}`}
                      disabled={mode === 'view'}
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.key === 'total' ? (
                    <input
                      type="number"
                      value={formData[field.key] || ''}
                      readOnly
                      className={`${inputClasses} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
                      placeholder="Auto-calculated"
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className={inputClasses}
                      disabled={mode === 'view'}
                      required={field.required}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                      className={inputClasses}
                      disabled={mode === 'view'}
                      required={field.required}
                    />
                  )}
                </div>
             );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-2xl border max-h-[90vh] flex flex-col ${
        isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'
      } shadow-2xl`}>
        
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {getTitle()}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="masterRecordForm" onSubmit={handleSubmit}>
            {renderFields()}
          </form>
        </div>

        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-[#334155] bg-[#1e293b]' : 'border-gray-200 bg-gray-50'} rounded-b-2xl`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-xl font-bold ${isDark ? 'bg-white/5 text-white' : 'bg-white border text-gray-700'}`}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {mode !== 'view' && (
            <button 
              form="masterRecordForm" 
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : (mode === 'add' ? 'Add Record' : 'Save Changes')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}