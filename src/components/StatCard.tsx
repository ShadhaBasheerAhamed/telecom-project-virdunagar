import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  theme: 'light' | 'dark';
  details?: Array<{ label: string; value: string | number }>;
}

// HELPER: Returns direct CSS values to FORCE the color to appear.
const getBoxColors = (colorClass: string, isDark: boolean) => {
  // Extract the base color intent
  if (colorClass.includes('blue')) {
    return {
      bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', // Dark: Glassy Blue, Light: Blue-50
      border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#dbeafe',
      text: isDark ? '#93c5fd' : '#1e40af'
    };
  }
  if (colorClass.includes('cyan')) {
    return {
      bg: isDark ? 'rgba(6, 182, 212, 0.2)' : '#ecfeff',
      border: isDark ? 'rgba(6, 182, 212, 0.3)' : '#cffafe',
      text: isDark ? '#67e8f9' : '#155e75'
    };
  }
  if (colorClass.includes('green')) {
    return {
      bg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#f0fdf4',
      border: isDark ? 'rgba(34, 197, 94, 0.3)' : '#dcfce7',
      text: isDark ? '#86efac' : '#166534'
    };
  }
  if (colorClass.includes('yellow')) {
    return {
      bg: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
      border: isDark ? 'rgba(234, 179, 8, 0.3)' : '#fef9c3',
      text: isDark ? '#fde047' : '#854d0e'
    };
  }
  if (colorClass.includes('red')) {
    return {
      bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
      border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fee2e2',
      text: isDark ? '#fca5a5' : '#991b1b'
    };
  }
  // Default Slate
  return {
    bg: isDark ? 'rgba(148, 163, 184, 0.2)' : '#f8fafc',
    border: isDark ? 'rgba(148, 163, 184, 0.3)' : '#e2e8f0',
    text: isDark ? '#cbd5e1' : '#334155'
  };
};

export function StatCard({ title, value, color, theme, details }: StatCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDark = theme === 'dark';
  
  const isOnline = title === 'ONLINE';
  const displayDetails = isOnline ? details : (details && details.length > 0 ? [details[0]] : []);
  
  const styles = getBoxColors(color, isDark);
  const glowClass = color.replace('text-', 'bg-');

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03, y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => details && setShowDetails(true)}
        className={`relative p-6 flex flex-col justify-between min-h-[160px] border transition-all duration-300 cursor-pointer shadow-sm rounded-[1.5rem] overflow-hidden group ${
          isDark
            ? 'bg-[#1e293b] border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40'
            : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60'
        }`}
      >
        {/* Top Section */}
        <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-5xl font-bold mb-2 tracking-tighter ${color}`}
            >
              {value}
            </motion.div>
            
            <div className={`text-[11px] font-black tracking-[0.25em] uppercase opacity-70 ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {title}
            </div>
        </div>

        {/* The Small Box with FORCED Background Color */}
        {displayDetails && displayDetails.length > 0 && (
          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            {displayDetails.map((detail, index) => (
              <div 
                key={index}
                // Inline styles force the color to render
                style={{ 
                  backgroundColor: styles.bg, 
                  borderColor: styles.border,
                  color: styles.text
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm backdrop-blur-sm"
              >
                <span className="opacity-80">
                  {detail.label}:
                </span>
                <span className="text-sm font-extrabold">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Background Glow */}
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 ${glowClass}`} />
      </motion.div>

      {/* Popup Dialog */}
      {details && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={`sm:max-w-[400px] p-0 border-0 rounded-3xl overflow-hidden ${
            isDark ? 'bg-[#1e293b] text-slate-100' : 'bg-white text-gray-900'
          }`}>
             <div className="p-6" style={{ backgroundColor: styles.bg }}>
                <DialogTitle className="text-3xl font-bold tracking-tight" style={{ color: styles.text }}>{value}</DialogTitle>
                <DialogDescription className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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
                  <span className="text-lg font-bold" style={{ color: styles.text }}>
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