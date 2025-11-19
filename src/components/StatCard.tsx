import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  theme: 'light' | 'dark';
  details?: Array<{ label: string; value: string | number }>;
}

export function StatCard({ title, value, color, theme, details }: StatCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDark = theme === 'dark';

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03, y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => details && setShowDetails(true)}
        // VISUAL FIX: rounded-3xl for distinct curved look (Total Box)
        className={`relative p-7 flex flex-col justify-between min-h-[160px] border transition-all duration-300 cursor-pointer shadow-sm rounded-3xl overflow-hidden group ${
          isDark
            ? 'bg-[#1e293b] border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40'
            : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60'
        }`}
      >
        <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              // VISUAL FIX: text-5xl + tracking-tighter to make number POP
              className={`text-5xl font-bold mb-3 tracking-tighter ${color}`}
            >
              {value}
            </motion.div>
            
            <div className={`text-[11px] font-black tracking-[0.25em] uppercase opacity-80 ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {title}
            </div>
        </div>
        
        {/* Background Glow Effect based on color prop */}
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-500 ${color.replace('text-', 'bg-')}`} />
      </motion.div>

      {details && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={`sm:max-w-[400px] p-0 border-0 rounded-3xl overflow-hidden ${
            isDark ? 'bg-[#1e293b] text-slate-100' : 'bg-white text-gray-900'
          }`}>
             <div className={`p-6 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <DialogTitle className={`text-3xl font-bold tracking-tight ${color}`}>{value}</DialogTitle>
                <DialogDescription className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {title} Breakdown
                </DialogDescription>
            </div>
            <div className="p-6 space-y-3">
              {details.map((detail, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    isDark ? 'bg-slate-900/30 hover:bg-slate-900/50' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {detail.label}
                  </span>
                  <span className={`text-lg font-bold ${color}`}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}