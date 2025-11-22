import { X, Download, CreditCard, Calendar, User, Hash } from 'lucide-react';
import type { Payment } from '../../types';

interface ViewPaymentModalProps {
  payment: Payment;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export function ViewPaymentModal({ payment, theme, onClose }: ViewPaymentModalProps) {
  const isDark = theme === 'dark';

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
              Payment Details
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Payment ID: {payment.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg transition-all ${
                isDark
                  ? 'hover:bg-white/10 text-cyan-400'
                  : 'hover:bg-gray-100 text-cyan-600'
              }`}
              title="Download Invoice"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invoice To */}
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Invoice To
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <User className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <div>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {payment.customerName}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Landline: {payment.landlineNo}
                </p>
              </div>
            </div>
          </div>

          {/* Payment From */}
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Payment From
            </h3>
            <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              SPT Global Telecom Services
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ONE RADIUS
            </p>
          </div>

          {/* Transaction Details */}
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transaction Details
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transaction ID
                  </span>
                </div>
                <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {payment.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Date
                  </span>
                </div>
                <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {payment.paidDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Payment Method
                  </span>
                </div>
                <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {payment.modeOfPayment}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Source
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  payment.source === 'BSNL'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {payment.source}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Status
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  payment.status === 'Paid'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {payment.status}
                </span>
              </div>

              <div className={`flex items-center justify-between pt-3 border-t ${
                isDark ? 'border-[#334155]' : 'border-gray-200'
              }`}>
                <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Total Amount
                </span>
                <span className={`text-2xl ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  ₹{payment.billAmount.toLocaleString()}
                </span>
              </div>
            </div>
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
