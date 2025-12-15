import { Sun, Moon, User, Search, Bell, Menu, Settings, LogOut, Database, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { useNetworkProviders } from '../hooks/useNetworkProviders'; // ✅ Import the hook
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
}

export function Header({
  theme,
  dataSource,
  onThemeToggle,
  onDataSourceChange,
  onMenuClick,
  userRole,
  onLogout,
}: HeaderProps) {
  const isDark = theme === 'dark';
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ Fetch Providers Directly (No need to pass from parent)
  const { activeProviders } = useNetworkProviders();

  const notifications = [
    { id: 1, message: 'New customer registered', time: '5 min ago' },
    { id: 2, message: 'Payment received: INR 1,500', time: '10 min ago' },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
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
        className={`sticky top-0 z-40 h-16 border-b ${
          isDark ? 'bg-[#1e293b]/80 border-[#334155]' : 'bg-white/80 border-gray-200'
        } backdrop-blur-xl`}
      >
        <div className="h-full flex items-center justify-between gap-4 px-6">
          {/* Left side - Menu & Data Source */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onMenuClick}
                className={`md:hidden p-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            )}

            {/* ✅ NEAT DATA SOURCE DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                    isDark 
                      ? 'bg-[#0F172A] border-[#334155] text-white hover:border-blue-500/50' 
                      : 'bg-white border-gray-300 text-gray-900 hover:border-blue-500/50'
                  }`}
                >
                  <Database className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className="text-sm font-medium">
                    {dataSource === 'All' ? 'All Sources' : dataSource}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </motion.button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="start" className={`w-48 ${isDark ? 'bg-[#1e293b] border-[#334155] text-gray-200' : 'bg-white'}`}>
                <DropdownMenuLabel className="text-xs uppercase tracking-wider opacity-70">Select Data Source</DropdownMenuLabel>
                <DropdownMenuSeparator className={isDark ? 'bg-[#334155]' : ''} />
                
                {/* Option: All Sources */}
                <DropdownMenuItem 
                  onClick={() => onDataSourceChange('All')}
                  className={`cursor-pointer gap-2 ${dataSource === 'All' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600') : ''}`}
                >
                  {dataSource === 'All' && <Check className="w-3 h-3" />}
                  <span className={dataSource !== 'All' ? 'pl-5' : ''}>All Sources</span>
                </DropdownMenuItem>

                {/* Dynamic Options from Firebase */}
                {activeProviders.map((provider) => (
                  <DropdownMenuItem 
                    key={provider.id} 
                    onClick={() => onDataSourceChange(provider.name)}
                    className={`cursor-pointer gap-2 ${dataSource === provider.name ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600') : ''}`}
                  >
                    {dataSource === provider.name && <Check className="w-3 h-3" />}
                    <span className={dataSource !== provider.name ? 'pl-5' : ''}>{provider.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                className={`relative p-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={onThemeToggle}
              className={`p-2 rounded-lg transition-all ${
                isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileHover={{ scale: 1.05 }} className="flex items-center gap-3 pl-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className={`text-sm font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {userRole}
                    </p>
                    <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      Authorized
                    </p>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={`w-56 ${isDark ? 'bg-[#1e293b] border-[#334155] text-gray-200' : 'bg-white'}`} align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className={isDark ? 'bg-[#334155]' : ''} />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDark ? 'bg-[#334155]' : ''} />
                <DropdownMenuItem onClick={onLogout} className="text-red-500 cursor-pointer focus:text-red-500">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className={`${isDark ? 'bg-[#1e293b] border-[#334155] text-gray-200' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Search for customers, payments, or leads.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Type to search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isDark ? 'bg-[#0F172A] border-[#334155]' : ''}
            />
            <button onClick={handleSearch} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              Search Results
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper icon component
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}