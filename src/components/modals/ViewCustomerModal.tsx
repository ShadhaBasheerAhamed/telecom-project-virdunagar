import { X, Mail, Phone, Calendar, Package, Activity, Tag } from 'lucide-react';
import type { Customer } from '../pages/Customers';

interface ViewCustomerModalProps {
  customer: Customer;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export function ViewCustomerModal({ customer, theme, onClose }: ViewCustomerModalProps) {
  const isDark = theme === 'dark';

  const detailItems = [
    { icon: Mail, label: 'Email', value: customer.email || 'N/A' },
    { icon: Phone, label: 'Mobile No', value: customer.mobileNo },
    { icon: Package, label: 'Plan', value: customer.plan || 'N/A' },
    { icon: Activity, label: 'Status', value: customer.status },
    { icon: Tag, label: 'Source', value: customer.source },
    { icon: Calendar, label: 'Installation Date', value: customer.installationDate },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/95 border-[#334155]'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit">
          <div>
            <h2 className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Customer Details
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ID: {customer.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Customer Name */}
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
            }`}>
              <span className="text-3xl">{customer.name.charAt(0).toUpperCase()}</span>
            </div>
            <h3 className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {customer.name}
            </h3>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detailItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? 'bg-[#0F172A] border-[#334155]'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <div className="flex-1">
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.label}
                      </p>
                      {item.label === 'Status' ? (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          customer.status === 'Active'
                            ? 'bg-green-500/20 text-green-400'
                            : customer.status === 'Suspended'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {item.value}
                        </span>
                      ) : item.label === 'Source' ? (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          customer.source === 'BSNL'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {item.value}
                        </span>
                      ) : (
                        <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-inherit">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
