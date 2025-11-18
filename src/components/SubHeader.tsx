import { Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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

  // Update date to current date dynamically and refresh periodically
  useEffect(() => {
    // Set current date immediately
    setDate(new Date());
    
    // Update date every hour to keep it current
    const interval = setInterval(() => {
      setDate(new Date());
    }, 3600000); // 1 hour = 3600000ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`px-6 py-4 flex items-center justify-between border-b ${
      isDark 
        ? 'bg-slate-900/80 border-slate-700' 
        : 'bg-gray-50/90 border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>Search by Date:</span>
        <Popover>
          <PopoverTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-800/80 border-slate-600 hover:border-slate-500 shadow-slate-900/20'
                  : 'bg-white border-gray-300 hover:border-gray-400 shadow-gray-900/10'
              }`}
            >
              <Calendar className={`w-4 h-4 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`} />
              <span className={`text-sm font-medium ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {format(date, 'dd MMM, yyyy')}
              </span>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className={`w-auto p-0 border shadow-xl ${
            isDark
              ? 'bg-slate-800 border-slate-600'
              : 'bg-white border-gray-200'
          }`}>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              className="text-sm"
              classNames={{
                months: "flex flex-col sm:flex-row gap-2",
                month: "flex flex-col gap-4",
                caption: "flex justify-center pt-1 relative items-center w-full",
                caption_label: `text-sm font-medium ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`,
                nav: "flex items-center gap-1",
                nav_button: `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 border bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground size-8 p-0 ${
                  isDark
                    ? 'text-slate-200 hover:text-white hover:bg-slate-700 border-slate-600'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-gray-100 border-gray-300'
                }`,
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-x-1",
                head_row: "flex",
                head_cell: `text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`,
                row: "flex w-full mt-2",
                cell: `relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md ${
                  isDark
                    ? 'text-slate-200'
                    : 'text-slate-900'
                }`,
                day: `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100 size-9 p-0 font-medium ${
                  isDark
                    ? 'text-slate-200 hover:bg-slate-700 hover:text-slate-100 aria-selected:bg-blue-600 aria-selected:text-white'
                    : 'text-slate-900 hover:bg-gray-100 hover:text-slate-900 aria-selected:bg-blue-600 aria-selected:text-white'
                }`,
                day_range_start: "aria-selected:bg-primary aria-selected:text-primary-foreground",
                day_range_end: "aria-selected:bg-primary aria-selected:text-primary-foreground",
                day_selected: `${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`,
                day_today: `${
                  isDark
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-gray-200 text-slate-900'
                }`,
                day_outside: `${
                  isDark
                    ? 'text-slate-500 opacity-60 aria-selected:text-slate-300'
                    : 'text-gray-400 opacity-60 aria-selected:text-gray-500'
                }`,
                day_disabled: `${
                  isDark
                    ? 'text-slate-500 opacity-40'
                    : 'text-gray-400 opacity-40'
                }`,
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className={`px-6 py-3 rounded-lg shadow-xl cursor-pointer transition-all ${
          isDark
            ? 'bg-linear-to-r from-cyan-600 to-blue-600 shadow-cyan-600/40 hover:shadow-cyan-600/60'
            : 'bg-linear-to-r from-blue-500 to-cyan-500 shadow-blue-500/30 hover:shadow-blue-500/50'
        }`}
      >
        <div className={`text-xs mb-1 font-medium ${
          isDark ? 'text-cyan-100' : 'text-blue-50'
        }`}>Wallet Balance</div>
        <motion.div
          key={walletBalance}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-white'
          }`}
        >
          INR {walletBalance.toFixed(2)}
        </motion.div>
      </motion.div>
    </div>
  );
}
