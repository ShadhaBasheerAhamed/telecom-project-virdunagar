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
  theme: 'light' | 'dark'; // Add theme prop
}

export function StatisticsPanel({ title, items, showRefresh = false, theme }: StatisticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDark = theme === 'dark'; // Use theme prop

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
      className={`border rounded-lg overflow-hidden transition-colors shadow-lg ${
        isDark
          ? 'bg-[#1e293b] border-slate-700 hover:border-cyan-500/50'
          : 'bg-white border-gray-200 hover:border-cyan-500/50'
      }`}
    >
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isDark
          ? 'bg-[#1e293b]/80 border-slate-700'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h3 className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{title}</h3>
        <div className="flex items-center gap-1">
          {showRefresh && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50'
              }`}
            >
              <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.5, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}>
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4">
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between py-1.5 px-2 rounded transition-all cursor-pointer ${
                      isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{item.label}</span>
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className="text-sm text-blue-400"
                    >
                      {item.value}
                    </motion.span>
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
