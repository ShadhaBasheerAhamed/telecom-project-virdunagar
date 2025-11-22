import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { MasterRecordService } from '../../services/masterRecordService';

interface MasterRecordModalProps {
  mode: 'add' | 'edit' | 'view';
  recordType: string;
  data: any;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (data?: any) => void; // Changed to accept optional data for refresh callback
}

interface FormErrors {
  [key: string]: string;
}

export function MasterRecordModal({ mode, recordType, data, theme, onClose, onSave }: MasterRecordModalProps) {
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState(data || {});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      // Convert validation errors to form errors format
      const formErrors: FormErrors = {};
      validation.errors.forEach(error => {
        // Parse error messages to identify which field has the error
        if (error.toLowerCase().includes('name')) {
          formErrors.name = error;
        } else if (error.toLowerCase().includes('price')) {
          formErrors.price = error;
        } else if (error.toLowerCase().includes('gst')) {
          formErrors.gst = error;
        } else if (error.toLowerCase().includes('mobile')) {
          formErrors.mobile = error;
        } else if (error.toLowerCase().includes('aadhaar')) {
          formErrors.aadhaar = error;
        } else if (error.toLowerCase().includes('address')) {
          formErrors.address = error;
        } else if (error.toLowerCase().includes('department')) {
          formErrors.department = error;
        } else if (error.toLowerCase().includes('role')) {
          formErrors.role = error;
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
    
    // Clear previous success message
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare the data with proper types
      const recordData = { ...formData };
      
      // Convert numeric fields
      if (recordType === 'plan') {
        recordData.price = parseFloat(formData.price) || 0;
        recordData.gst = parseFloat(formData.gst) || 0;
        recordData.total = parseFloat(formData.total) || 0;
      }

      if (mode === 'add') {
        await MasterRecordService.addRecord(recordType, recordData);
        setSuccessMessage(`${recordType} record added successfully!`);
      } else if (mode === 'edit' && data?.id) {
        await MasterRecordService.updateRecord(recordType, data.id, recordData);
        setSuccessMessage(`${recordType} record updated successfully!`);
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onSave(); // Call without data to trigger refresh
        onClose();
      }, 1500);

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
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
        { key: 'price', label: 'Plan Price (₹)', type: 'number', required: true },
        { key: 'gst', label: 'GST (%)', type: 'number', required: true },
        { key: 'total', label: 'Total Amount (₹)', type: 'number', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
      ],
      oltIp: [
        { key: 'id', label: 'ID', type: 'text', required: true },
        { key: 'name', label: 'Name / IP Address', type: 'text', required: true },
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
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className={labelClasses}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className={`${inputClasses} ${errors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
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
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className={`${inputClasses} ${errors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={mode === 'view'}
                  required={field.required}
                  rows={3}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : field.key === 'total' ? (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, parseFloat(e.target.value) || 0)}
                  className={`${inputClasses} ${errors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={true} // Auto-calculated, not editable
                  required={field.required}
                  placeholder="Auto-calculated"
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, 
                    field.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value
                  )}
                  className={`${inputClasses} ${errors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={mode === 'view'}
                  required={field.required}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  min={field.type === 'number' ? '0' : undefined}
                  step={field.type === 'number' ? '0.01' : undefined}
                />
              )}
              {errors[field.key] && (
                <p className="mt-1 text-sm text-red-500">{errors[field.key]}</p>
              )}
              {/* Help text for specific fields */}
              {field.key === 'gst' && recordType === 'plan' && (
                <p className="mt-1 text-xs text-gray-500">GST percentage (0-100%)</p>
              )}
              {field.key === 'total' && recordType === 'plan' && (
                <p className="mt-1 text-xs text-gray-500">Auto-calculated as Price + GST</p>
              )}
              {field.key === 'aadhaar' && recordType === 'employee' && (
                <p className="mt-1 text-xs text-gray-500">Must be exactly 12 digits</p>
              )}
              {field.key === 'mobile' && recordType === 'employee' && (
                <p className="mt-1 text-xs text-gray-500">Must be exactly 10 digits</p>
              )}
            </div>
          ))}
        </div>
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
          <button 
            onClick={onClose} 
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border hover:bg-gray-50 text-gray-700'
            }`}
            disabled={isSubmitting}
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {mode !== 'view' && (
            <button 
              form="masterRecordForm" 
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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