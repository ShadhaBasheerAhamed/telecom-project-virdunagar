import { Search, Menu, Video, User, Bell, LogOut, Settings, ChevronDown, Filter, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onSearch: (query: string) => void;
  theme: 'light' | 'dark';
  dataSource?: string; 
  onDataSourceChange?: (source: string) => void;
  onThemeToggle?: () => void;
}

const dataSources = ['All Sources', 'BSNL', 'RMAX'];

// Pill-shaped button style generator
const getPillButtonStyles = (isDark: boolean) => ({
  borderRadius: '9999px !important',
  border: isDark ? '1px solid rgb(51 65 85)' : '1px solid rgb(226 232 240)',
  transition: 'all 0.2s ease',
  outline: 'none',
  cursor: 'pointer',
});

export function DashboardHeader({ 
  onMenuClick, 
  onSearch, 
  theme, 
  dataSource = 'All Sources', 
  onDataSourceChange = () => {}, 
  onThemeToggle = () => {} 
}: DashboardHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notifications = [
    { id: 1, message: 'New customer registered', time: '5 min ago' },
    { id: 2, message: 'Payment received: INR 1,500', time: '10 min ago' },
    { id: 3, message: 'Complaint resolved #CR-1234', time: '1 hour ago' },
  ];

  const isDark = theme === 'dark';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <div className={`${
        isDark ? 'bg-[#1e293b]/90 border-[#334155]' : 'bg-white/90 border-gray-200'
      } border-b px-8 py-4 sticky top-0 z-30 transition-colors backdrop-blur-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onMenuClick}
              className={`lg:hidden ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
            >
              <Menu className="w-6 h-6" />
            </motion.button>
            
            <h1 className={`lg:hidden text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SPT TELECOM</h1>

            {/* Data Source Selector - FORCED PILL SHAPE */}
            <div className="hidden md:flex items-center gap-3">
              <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Data:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={`flex items-center gap-2 px-6 py-2.5 font-semibold text-sm select-none overflow-hidden group ${
                      isDark
                        ? 'bg-slate-900 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                        : 'bg-white text-slate-700 hover:border-gray-300 hover:bg-gray-50'
                    } !rounded-full shadow-sm hover:shadow-md transition-all outline-none`}
                    style={getPillButtonStyles(isDark)}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span className="font-semibold">{dataSource}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50 ml-2 group-hover:opacity-70 transition-opacity" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={`rounded-2xl mt-2 w-48 p-2 border shadow-xl ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                   {dataSources.map(source => (
                     <DropdownMenuItem 
                        key={source} 
                        className={`rounded-xl mx-1 my-1 cursor-pointer font-medium transition-colors ${isDark ? 'hover:bg-slate-800 focus:bg-slate-800' : 'hover:bg-gray-100 focus:bg-gray-100'}`}
                        onClick={() => onDataSourceChange(source)}
                      >
                        {source}
                      </DropdownMenuItem>
                   ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Video Tutorials Button - PILL SHAPED */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={getPillButtonStyles(isDark)}
              className={`hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-medium ${
                isDark 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Tutorials</span>
            </motion.button>

            {/* Search Icon - PILL SHAPED */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchOpen(true)}
              style={getPillButtonStyles(isDark)}
              className={`p-3 shadow-sm ${
                isDark ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-gray-50'
              }`}
            >
              <Search className="w-5 h-5" />
            </motion.button>
            
            {/* Notifications - PILL SHAPED */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                style={getPillButtonStyles(isDark)}
                className={`p-3 relative shadow-sm ${
                   isDark ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1e293b]"></span>
              </motion.button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-3 w-80 border rounded-2xl shadow-2xl overflow-hidden z-50 ${
                      isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`p-5 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-3">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-2xl mb-2 cursor-pointer transition-colors ${
                            isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle - PILL SHAPED */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={onThemeToggle}
              style={getPillButtonStyles(isDark)}
              className={`p-3 shadow-sm ${
                isDark ? 'bg-slate-900 text-yellow-400 hover:bg-slate-800' : 'bg-white text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </motion.button>
            
            {/* Admin Profile - FORCED PILL SHAPE */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`flex items-center gap-3 pl-2 pr-5 py-2 font-medium select-none overflow-hidden group ${
                      isDark
                        ? 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                        : 'bg-white text-slate-900 hover:bg-gray-50'
                    } !rounded-full shadow-sm hover:shadow-md transition-all outline-none`}
                  style={getPillButtonStyles(isDark)}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-inner ${
                    isDark ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-200'
                  }`}>
                    <User className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-700'}`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-bold leading-none`}>Admin</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 ml-1 opacity-50 group-hover:opacity-70 transition-opacity ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={`rounded-2xl mt-2 w-56 p-2 border shadow-xl ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                <DropdownMenuLabel className="px-4 py-3">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className={isDark ? 'bg-slate-700' : 'bg-gray-200'} />
                <DropdownMenuItem className={`rounded-xl mx-1 my-1 cursor-pointer ${isDark ? 'hover:bg-slate-700 focus:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className={`rounded-xl mx-1 my-1 cursor-pointer ${isDark ? 'hover:bg-slate-700 focus:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDark ? 'bg-slate-700' : 'bg-gray-200'} />
                <DropdownMenuItem className={`rounded-xl mx-1 my-1 cursor-pointer text-red-400 ${isDark ? 'hover:bg-slate-700 focus:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className={`sm:max-w-[500px] !rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden ${
          isDark ? 'bg-[#1e293b] text-slate-300' : 'bg-white text-gray-900'
        }`}>
          <div className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Global Search</DialogTitle>
            <DialogDescription className="text-base mt-1">Search for customers, invoices, reports, and more.</DialogDescription>
          </div>
          <div className="p-6 space-y-6">
            <div className="relative">
              <Search className={`absolute left-6 top-5 w-6 h-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <Input
                autoFocus
                placeholder="Type keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={`pl-16 py-8 !rounded-[2rem] border-2 text-lg shadow-inner transition-all ${
                  isDark 
                    ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 text-white placeholder:text-slate-600' 
                    : 'bg-gray-50 border-gray-200 focus:border-blue-500 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
            <button
              onClick={handleSearch}
              style={{ borderRadius: '1rem' }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-600/25 transform active:scale-[0.98]"
            >
              Search Results
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}