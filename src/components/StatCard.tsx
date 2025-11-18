import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  theme: 'light' | 'dark'; // Add theme prop
  details?: Array<{ label: string; value: string | number }>;
}

export function StatCard({ title, value, color, theme, details }: StatCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDark = theme === 'dark';

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => details && setShowDetails(true)}
        className={`rounded-lg p-6 border transition-all cursor-pointer shadow-lg hover:shadow-xl ${
          isDark
            ? 'bg-[#1e293b] border-slate-700 hover:border-cyan-500/50'
            : 'bg-white border-gray-200 hover:border-cyan-500/50'
        } ${
          details ? (isDark ? 'hover:shadow-cyan-500/20' : 'hover:shadow-cyan-500/10') : ''
        }`}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className={`text-4xl mb-2 ${color}`}
        >
          {value}
        </motion.div>
        <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{title}</div>
      </motion.div>

      {details && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-900'}>
            <DialogHeader>
              <DialogTitle className={color}>{title} Details</DialogTitle>
              <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                Detailed breakdown of {title.toLowerCase()} statistics
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {details.map((detail, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}
                >
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{detail.label}</span>
                  <span className={`text-lg ${color}`}>{detail.value}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
