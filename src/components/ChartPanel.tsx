import { useState } from 'react';
import { motion } from 'framer-motion';
import { Expand, Filter } from 'lucide-react'; // Removed Download icon
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface ChartPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  theme: 'light' | 'dark';
  // New props for filtering
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

export function ChartPanel({ 
  title, 
  children, 
  className = '', 
  theme, 
  timeRange = 'week',
  onTimeRangeChange 
}: ChartPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isDark = theme === 'dark';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl overflow-hidden border transition-all shadow-sm hover:shadow-md flex flex-col ${
          isDark
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-100 shadow-gray-200'
        } ${className}`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-100'
        }`}>
          <h3 className={`text-sm font-bold uppercase tracking-wide ${
            isDark ? 'text-slate-100' : 'text-gray-800'
          }`}>
            {title}
          </h3>
          
          <div className="flex items-center gap-1">
            {/* Filter Toggle */}
            <ActionButton 
              icon={Filter} 
              onClick={() => setShowFilters(!showFilters)} 
              isDark={isDark} 
              colorClass="cyan" 
              active={showFilters}
            />
            {/* Expand Button */}
            <ActionButton 
              icon={Expand} 
              onClick={() => setIsFullscreen(true)} 
              isDark={isDark} 
              colorClass="blue" 
            />
          </div>
        </div>
        
        {/* Filter Section (Toggleable) */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-5 py-3 border-b ${
              isDark ? 'border-slate-700 bg-slate-900/30' : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Time Range:</span>
              <select 
                value={timeRange}
                onChange={(e) => onTimeRangeChange?.(e.target.value)}
                className={`px-2 py-1.5 text-xs rounded-md border outline-none cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-600 text-slate-200 focus:border-blue-500' 
                    : 'bg-white border-gray-200 text-gray-700 focus:border-blue-500'
                }`}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </motion.div>
        )}
        
        {/* Chart Container */}
        <div className="p-5 flex-1 w-full min-h-[200px]">
          {children}
        </div>
      </motion.div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className={`max-w-[90vw] w-full h-[85vh] flex flex-col z-[9999] ${
          isDark 
            ? 'bg-slate-800 border-slate-700 text-slate-100' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <DialogHeader className="shrink-0">
            <DialogTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-500'}>
              Expanded view
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full w-full p-4 min-h-0">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper component for header buttons
function ActionButton({ icon: Icon, onClick, isDark, colorClass, active }: any) {
  const colors: Record<string, string> = {
    blue: isDark ? 'hover:text-blue-400 hover:bg-blue-500/10' : 'hover:text-blue-600 hover:bg-blue-50',
    cyan: isDark ? 'hover:text-cyan-400 hover:bg-cyan-500/10' : 'hover:text-cyan-600 hover:bg-cyan-50',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        isDark ? 'text-slate-400' : 'text-gray-400'
      } ${colors[colorClass]} ${active ? 'bg-white/10 text-white' : ''}`}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
}