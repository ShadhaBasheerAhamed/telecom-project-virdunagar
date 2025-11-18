import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  details?: Array<{ label: string; value: string | number }>;
}

export function StatCard({ title, value, color, details }: StatCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => details && setShowDetails(true)}
        className={`bg-[#1e293b] dark:bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg hover:shadow-xl ${
          details ? 'hover:shadow-cyan-500/20' : ''
        }`}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className={`text-4xl mb-2 ${color}`}
        >
          {value}
        </motion.div>
        <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
      </motion.div>

      {details && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-300">
            <DialogHeader>
              <DialogTitle className={color}>{title} Details</DialogTitle>
              <DialogDescription className="text-slate-400">
                Detailed breakdown of {title.toLowerCase()} statistics
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {details.map((detail, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-lg"
                >
                  <span className="text-sm text-slate-400">{detail.label}</span>
                  <span className={`text-lg ${color}`}>{detail.value}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
