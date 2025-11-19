import { Calendar, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';

interface SubHeaderProps {
  theme: 'light' | 'dark';
}

export function SubHeader({ theme }: SubHeaderProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [walletBalance] = useState(585.52);
  const isDark = theme === 'dark';

  // Update date dynamically
  useEffect(() => {
    setDate(new Date());
    const interval = setInterval(() => setDate(new Date()), 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      isDark ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'
    }`}>
      <div className="flex items-center gap-4">
        {/* Overview Label - Pill shape */}
        <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border ${
           isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
        }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
            <span className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Overview
            </span>
        </div>

        {/* Date Picker - Curved */}
        <Popover>
          <PopoverTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-pointer transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-200 shadow-lg'
                  : 'bg-white border-gray-200 hover:border-gray-300 text-slate-700 shadow-sm'
              }`}
            >
              <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className="text-sm font-bold font-mono tracking-tight">
                {format(date, 'dd MMM, yyyy')}
              </span>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className={`w-auto p-0 border rounded-3xl shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              className={isDark ? "dark" : ""}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Wallet Card - Distinctly Curved */}
      <motion.div
        whileHover={{ y: -2 }}
        className={`relative pl-8 pr-12 py-5 rounded-3xl shadow-xl cursor-pointer overflow-hidden group ${
          isDark
            ? 'bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 shadow-cyan-900/20'
            : 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-blue-500/30'
        }`}
      >
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <Wallet className="w-3.5 h-3.5 text-white/90" />
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">
              Wallet Balance
            </span>
          </div>
          <motion.div
            key={walletBalance}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            INR <span className="font-mono">{walletBalance.toFixed(2)}</span>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl transform -translate-x-8 translate-y-8" />
      </motion.div>
    </div>
  );
}