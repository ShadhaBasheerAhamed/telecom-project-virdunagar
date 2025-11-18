import { useState } from 'react';
import { motion } from 'framer-motion';
import { Expand, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface ChartPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  theme: 'light' | 'dark'; // Add theme prop
}

export function ChartPanel({ title, children, className = '', theme }: ChartPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isDark = theme === 'dark'; // Use theme prop

  const handleDownload = () => {
    toast.success(`Downloading ${title} chart...`);
    // In a real app, you'd trigger a download here (e.g., using html2canvas)
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className={`rounded-lg overflow-hidden border transition-all shadow-lg hover:shadow-xl ${
          isDark
            ? 'bg-[#1e293b] border-slate-700 hover:border-cyan-500/50 hover:shadow-cyan-500/20'
            : 'bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-cyan-500/10'
        } ${className}`}
      >
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isDark
            ? 'bg-[#1e293b]/80 border-slate-700'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{title}</h3>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50'
              }`}
            >
              <Filter className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <Download className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(true)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Expand className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 border-b ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-gray-200 bg-gray-50/50'}`}
          >
            <div className="flex items-center gap-2">
              <select className={`px-2 py-1 text-xs rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-gray-300 text-gray-700'}`}>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
          </motion.div>
        )}
        
        <div className="p-4">
          {children}
        </div>
      </motion.div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className={`max-w-4xl h-[80vh] flex flex-col ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-900'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-slate-200' : 'text-gray-900'}>{title} - Fullscreen</DialogTitle>
            <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-500'}>
              Expanded view of the chart
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
