import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react'; // ✅ Only Refresh Icon
import { toast } from 'sonner';

export interface StatItem {
  label: string;
  value: string | number;
  textColor?: string; 
  isHighlight?: boolean;
  type?: string; 
}

interface StatisticsPanelProps {
  title: string;
  items: StatItem[];
  theme: 'light' | 'dark';
  className?: string;
  onItemClick?: (item: StatItem) => void;
}

export function StatisticsPanel({ title, items, theme, className = '', onItemClick }: StatisticsPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDark = theme === 'dark';

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    // Simulate refresh delay (In real app, this might trigger a parent refetch)
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(`${title} data refreshed`);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col h-fit border rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-gray-100 shadow-gray-200'
      } ${className}`}
    >
      {/* Header Section */}
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
        
        {/* ✅ Only Refresh Button (No Dropdown) */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark 
            ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700' 
            : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'
          }`}
          title="Refresh Panel"
        >
          <motion.div 
            animate={{ rotate: isRefreshing ? 360 : 0 }} 
            transition={{ duration: 0.8, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </motion.div>
        </button>
      </div>
      
      {/* List Items (Always Visible) */}
      <div className="p-3 space-y-1">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onItemClick && onItemClick(item)}
            className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors group ${
              onItemClick ? 'cursor-pointer' : 'cursor-default'
            } ${
              item.isHighlight 
                ? (isDark ? 'bg-cyan-950/40 border border-cyan-900/50' : 'bg-cyan-50 border border-cyan-100')
                : (isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50')
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
  );
}