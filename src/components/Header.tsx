import { Sun, Moon, User, Search, Bell, Menu, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
// ✅ FIXED IMPORT PATH: Adjusted to go up two levels to src/App.tsx
import type { DataSource, UserRole } from '../types';
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

interface HeaderProps {
  theme: 'light' | 'dark';
  dataSource: DataSource;
  onThemeToggle: () => void;
  onDataSourceChange: (source: DataSource) => void;
  onMenuClick?: () => void;
  userRole: UserRole;
  onLogout: () => void;
  availableProviders?: { name: string }[]; // Optional prop for now to avoid break if not passed
}

export function Header({
  theme,
  dataSource,
  onThemeToggle,
  onDataSourceChange,
  onMenuClick,
  userRole,
  onLogout,
  availableProviders = []
}: HeaderProps) {
  const isDark = theme === 'dark';
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: 'New customer registered', time: '5 min ago' },
    { id: 2, message: 'Payment received: INR 1,500', time: '10 min ago' },
    { id: 3, message: 'Complaint resolved #CR-1234', time: '1 hour ago' },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
      console.log('Searching for:', searchQuery);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 z-40 h-16 border-b ${isDark
            ? 'bg-[#1e293b]/80 border-[#334155]'
            : 'bg-white/80 border-gray-200'
          } backdrop-blur-xl`}>
        <div className="h-full flex items-center justify-between gap-4 px-6">
          {/* Left side - Menu button (mobile) + Data Source */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onMenuClick}
                className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            )}

            {/* Data Source Dropdown */}
            <div className="flex items-center gap-2">
              <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Data:
              </label>
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={dataSource}
                onChange={(e) => onDataSourceChange(e.target.value as DataSource)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${isDark
                    ? 'bg-[#0F172A] border-[#334155] text-white hover:border-cyan-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-cyan-500/50'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              >
                <option value="All">All Sources</option>
                {availableProviders.map((provider, index) => (
                  <option key={index} value={provider.name}>{provider.name}</option>
                ))}
              </motion.select>
            </div>
          </div>

          {/* Right side - Actions and Profile */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <Bell className="w-5 h-5" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center"
                >
                  {notifications.length}
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-2 w-80 border rounded-lg shadow-xl overflow-hidden z-50 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'
                      }`}
                  >
                    <div className={`p-4 border-b ${isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
                      <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ x: 5 }}
                          className={`p-4 border-b transition-all cursor-pointer ${isDark
                              ? 'border-[#334155] hover:bg-white/5'
                              : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{notif.message}</p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{notif.time}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={onThemeToggle}
              className={`p-2 rounded-lg transition-all ${isDark
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              aria-label="Toggle theme"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </motion.button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${isDark ? 'bg-[#0F172A] hover:bg-[#0F172A]/80' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                      }`}
                  >
                    <User className="w-5 h-5" />
                  </motion.div>
                  {/* ✅ Dynamic User Role Display */}
                  <div className="hidden md:flex flex-col items-start">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {userRole || 'Guest'}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      Authorized
                    </span>
                  </div>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={`w-56 ${isDark ? 'bg-[#1e293b] border-[#334155] text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className={isDark ? 'bg-[#334155]' : 'bg-gray-200'} />
                <DropdownMenuItem className={`hover:${isDark ? 'bg-[#334155]' : 'bg-gray-100'} cursor-pointer`}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className={`hover:${isDark ? 'bg-[#334155]' : 'bg-gray-100'} cursor-pointer`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDark ? 'bg-[#334155]' : 'bg-gray-200'} />
                {/* ✅ Logout Connected */}
                <DropdownMenuItem
                  onClick={onLogout}
                  className="hover:bg-red-500/10 text-red-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className={`${isDark ? 'bg-[#1e293b] border-[#334155] text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}>
          <DialogHeader>
            <DialogTitle>Search Dashboard</DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Search for customers, invoices, reports, and more
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search customers, invoices, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={`${isDark ? 'bg-[#0F172A] border-[#334155] text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Search
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}