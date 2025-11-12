import { Maximize2, Download, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

interface ChartPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartPanel({ title, children, className = '' }: ChartPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleDownload = () => {
    toast.success(`Downloading ${title} chart data...`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-all shadow-lg hover:shadow-xl ${className}`}
      >
        <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm text-slate-200">{title}</h3>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <Filter className="w-4 h-4 text-slate-400 hover:text-blue-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400 hover:text-blue-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(true)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-slate-400 hover:text-blue-400" />
            </motion.button>
          </div>
        </div>
        
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 py-2 bg-slate-900/50 border-b border-slate-700 flex gap-2"
          >
            <select className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-300">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
            <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors">
              Apply
            </button>
          </motion.div>
        )}
        
        <div className="p-4">
          {children}
        </div>
      </motion.div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-300 max-w-6xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Fullscreen view of {title.toLowerCase()} chart
            </DialogDescription>
          </DialogHeader>
          <div className="h-96">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
