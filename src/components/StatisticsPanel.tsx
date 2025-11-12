import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface StatItem {
  label: string;
  value: string | number;
}

interface StatisticsPanelProps {
  title: string;
  items: StatItem[];
  showRefresh?: boolean;
}

export function StatisticsPanel({ title, items, showRefresh = false }: StatisticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.success('Refreshing data...');
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Data refreshed successfully');
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors"
    >
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm text-slate-200">{title}</h3>
        <div className="flex items-center gap-2">
          {showRefresh && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 180 }}
              onClick={handleRefresh}
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <RefreshCw className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
            )}
          </motion.button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center justify-between py-1.5 hover:bg-slate-700/30 px-2 rounded transition-all cursor-pointer"
                  >
                    <span className="text-sm text-slate-400">{item.label}</span>
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
