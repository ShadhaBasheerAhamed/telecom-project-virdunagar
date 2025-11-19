import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface StatItem {
  label: string;
  value: string | number;
}

interface StatisticsPanelProps {
  title: string;
  items: StatItem[];
  showRefresh?: boolean;
  theme: 'light' | 'dark';
}

export function StatisticsPanel({ title, items, showRefresh = false, theme }: StatisticsPanelProps) {
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
      className={`border rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-gray-100 shadow-gray-200'
      }`}
    >
      {/* Header Section */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${
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
          {showRefresh && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-1.5 rounded-md transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700' 
                  : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-50'
              }`}
            >
              <motion.div 
                animate={{ rotate: isRefreshing ? 360 : 0 }} 
                transition={{ duration: 0.5, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-md transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
      
      {/* List Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-5 pt-2">
              <div className="space-y-1">
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors cursor-default group ${
                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Label Color Fix */}
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-gray-600 group-hover:text-gray-900'
                    }`}>
                      {item.label}
                    </span>
                    
                    {/* Value Color Fix */}
                    <span className={`text-sm font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {item.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}