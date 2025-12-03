import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface StatItem {
  label: string;
  value: string | number;
  textColor?: string; 
  isHighlight?: boolean;
}

interface StatisticsPanelProps {
  title: string;
  items: StatItem[];
  showRefresh?: boolean;
  theme: 'light' | 'dark';
  className?: string; // Added className prop
  onExport?: () => Promise<void>;
}

export function StatisticsPanel({ title, items, showRefresh = false, theme, className = '', onExport }: StatisticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDark = theme === 'dark';

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info(`Refreshing ${title}...`);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(`${title} updated!`);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // Changed h-full to h-fit to avoid empty blanks
      className={`flex flex-col h-fit border rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-gray-100 shadow-gray-200'
      } ${className}`}
    >
      {/* Header Section with subtle gradient */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isDark
          ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700'
          : 'bg-gradient-to-r from-white to-gray-50 border-gray-100'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${
          isDark ? 'text-slate-200' : 'text-gray-600'
        }`}>
          {title}
        </h3>
        
        <div className="flex items-center gap-1">
          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-1 rounded transition-colors ${
                isDark 
                ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700' 
                : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'
              }`}
            >
              <motion.div 
                animate={{ rotate: isRefreshing ? 360 : 0 }} 
                transition={{ duration: 0.5, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded transition-colors ${
              isDark 
              ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      {/* List Items - Compact Padding */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-3 space-y-1">
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors cursor-default group ${
                      item.isHighlight 
                        ? (isDark ? 'bg-cyan-950/40 border border-cyan-900/50' : 'bg-cyan-50 border border-cyan-100')
                        : (isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50')
                    }`}
                  >
                    <span className={`text-[11px] md:text-xs font-medium truncate pr-2 ${
                      isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-gray-500 group-hover:text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                    
                    <span className={`text-xs md:text-sm font-bold whitespace-nowrap ${
                      item.textColor 
                        ? item.textColor 
                        : (isDark ? 'text-slate-200' : 'text-slate-700')
                    }`}>
                      {item.value}
                    </span>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}