import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  theme: 'light' | 'dark';
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ title, message, theme, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/95 border-[#334155]'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit">
          <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-all ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-inherit">
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg transition-all ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
