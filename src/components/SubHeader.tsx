import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';

export function SubHeader() {
  const [date, setDate] = useState<Date>(new Date());
  const [walletBalance] = useState(585.52);

  return (
    <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">Search by Date:</span>
        <Popover>
          <PopoverTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">
                {format(date, 'dd MMM, yyyy')}
              </span>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              className="text-slate-300"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-blue-600 px-6 py-3 rounded-lg shadow-lg shadow-blue-600/30 cursor-pointer"
      >
        <div className="text-xs text-blue-200 mb-1">Wallet Balance</div>
        <motion.div
          key={walletBalance}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-2xl text-white"
        >
          INR {walletBalance.toFixed(2)}
        </motion.div>
      </motion.div>
    </div>
  );
}
