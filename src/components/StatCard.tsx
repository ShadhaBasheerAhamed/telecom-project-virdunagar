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

// HELPER: High-Contrast Box Styles
// Light Mode: Solid Light Color (Level 100/200) with Dark Text
// Dark Mode: Strong Glassy Tint (30-40% Opacity) with White Text
const getBoxStyle = (colorClass: string, isDark: boolean) => {
  switch (colorClass) {
    case 'text-blue-400':
      return {
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#dbeafe', // Stronger Blue Tint
        borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : '#93c5fd',
        color: isDark ? '#ffffff' : '#1e40af' 
      };
    case 'text-cyan-400':
      return {
        backgroundColor: isDark ? 'rgba(34, 211, 238, 0.35)' : '#cffafe', // Stronger Cyan Tint
        borderColor: isDark ? 'rgba(34, 211, 238, 0.5)' : '#67e8f9',
        color: isDark ? '#ffffff' : '#155e75'
      };
    case 'text-green-400':
      return {
        backgroundColor: isDark ? 'rgba(74, 222, 128, 0.35)' : '#dcfce7', // Stronger Green Tint
        borderColor: isDark ? 'rgba(74, 222, 128, 0.5)' : '#86efac',
        color: isDark ? '#ffffff' : '#166534'
      };
    case 'text-yellow-400':
      return {
        backgroundColor: isDark ? 'rgba(250, 204, 21, 0.35)' : '#fef9c3', // Stronger Yellow Tint
        borderColor: isDark ? 'rgba(250, 204, 21, 0.5)' : '#fde047',
        color: isDark ? '#ffffff' : '#854d0e'
      };
    case 'text-red-500':
      return {
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fee2e2', // Stronger Red Tint
        borderColor: isDark ? 'rgba(239, 68, 68, 0.5)' : '#fca5a5',
        color: isDark ? '#ffffff' : '#991b1b'
      };
    default: // Slate
      return {
        backgroundColor: isDark ? 'rgba(148, 163, 184, 0.35)' : '#e2e8f0',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.5)' : '#cbd5e1',
        color: isDark ? '#ffffff' : '#1e293b'
      };
  }
};

export function StatCard({ title, value, color, theme, details }: StatCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDark = theme === 'dark';
  
  const isOnline = title === 'ONLINE';
  const displayDetails = isOnline ? details : (details && details.length > 0 ? [details[0]] : []);
  
  // Get the forced high-visibility styles
  const boxStyle = getBoxStyle(color, isDark);
  
  // Generate glow class (fallback)
  const bgClass = color.replace('text-', 'bg-');

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

        {/* High Contrast Small Box */}
        {displayDetails && displayDetails.length > 0 && (
          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            {displayDetails.map((detail, index) => (
              <div 
                key={index}
                // Explicitly setting styles ensures visibility
                style={{ 
                  backgroundColor: boxStyle.backgroundColor,
                  borderColor: boxStyle.borderColor,
                  color: boxStyle.color
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm backdrop-blur-md"
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
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 ${bgClass}`} />
      </motion.div>

      {/* Popup Dialog */}
      {details && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={`sm:max-w-[400px] p-0 border-0 rounded-3xl overflow-hidden ${
            isDark ? 'bg-[#1e293b] text-slate-100' : 'bg-white text-gray-900'
          }`}>
             <div 
                className={`p-6 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}
                style={{ backgroundColor: boxStyle.backgroundColor }}
             >
                <DialogTitle className="text-3xl font-bold tracking-tight" style={{ color: boxStyle.color }}>
                  {value}
                </DialogTitle>
                <DialogDescription className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
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
                  <span className="text-lg font-bold" style={{ color: isDark ? color.replace('text-', '#') : boxStyle.color }}>
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