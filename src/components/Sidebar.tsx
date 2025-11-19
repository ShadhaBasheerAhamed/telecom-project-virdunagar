import { LayoutDashboard, Users, MessageSquare, UserPlus, CreditCard, Database, FileText, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Page } from '../App';

interface SidebarProps {
  theme: 'light' | 'dark';
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers' as Page, label: 'Customers', icon: Users },
  { id: 'complaints' as Page, label: 'Complaints', icon: MessageSquare },
  { id: 'leads' as Page, label: 'Leads', icon: UserPlus },
  { id: 'payment' as Page, label: 'Payment', icon: CreditCard },
  { id: 'master-records' as Page, label: 'Master Records', icon: Database },
  { id: 'reports' as Page, label: 'Reports', icon: FileText },
];

// Enhanced pill-style generator for consistent curved aesthetics
const getPillStyles = (isActive: boolean, isDark: boolean) => ({
  borderRadius: '1rem',
  background: isActive 
    ? isDark
      ? 'linear-gradient(to right, rgba(34, 211, 238, 0.2), rgba(59, 130, 246, 0.2))'
      : 'linear-gradient(to right, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.1))'
    : 'transparent',
  border: isActive
    ? isDark
      ? '1px solid rgba(34, 211, 238, 0.3)'
      : '1px solid rgba(34, 211, 238, 0.2)'
    : '1px solid transparent',
  boxShadow: isActive
    ? isDark
      ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(34, 211, 238, 0.1)'
      : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 20px rgba(34, 211, 238, 0.1)'
    : 'none',
});

export function Sidebar({ theme, currentPage, onPageChange }: SidebarProps) {
  const isDark = theme === 'dark';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 top-0 h-screen w-64 ${
        isDark 
          ? 'bg-[#1e293b]/95 border-[#334155]' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl border-r z-50 flex flex-col`}
    >
      {/* Logo/Brand */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-8 border-b border-inherit"
      >
        <h1 className={`mb-1 text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          SPT TELECOM
        </h1>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className={`text-xs font-bold tracking-[0.2em] ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
        >
          ONE RADIUS
        </motion.div>
      </motion.div>

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto no-scrollbar">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const pillStyles = getPillStyles(isActive, isDark);
            
            return (
              <motion.li 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onPageChange(item.id)}
                  style={pillStyles}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-all relative overflow-hidden group outline-none ${
                    isActive
                      ? isDark
                        ? 'text-cyan-400'
                        : 'text-cyan-700'
                      : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'drop-shadow-md' : 'group-hover:scale-110 transition-transform'}`} />
                  </motion.div>
                  
                  <span className="relative z-10 font-medium text-sm tracking-wide">{item.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeDot"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`ml-auto w-2 h-2 rounded-full ${isDark ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-cyan-600'}`}
                    />
                  )}
                  
                  {/* Curved highlight overlay for active state */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`absolute inset-0 rounded-2xl ${
                        isDark 
                          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10' 
                          : 'bg-gradient-to-r from-cyan-50/50 to-blue-50/50'
                      }`}
                    />
                  )}
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Logout at Bottom - PILL SHAPED */}
      <div className="p-6 border-t border-inherit">
        <motion.button
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (confirm('Are you sure you want to log out?')) {
              console.log('Logging out...');
            }
          }}
          style={{ 
            borderRadius: '1rem',
            border: isDark 
              ? '1px solid rgba(239, 68, 68, 0.2)' 
              : '1px solid rgba(239, 68, 68, 0.1)'
          }}
          className={`w-full flex items-center gap-4 px-5 py-4 transition-all relative overflow-hidden outline-none ${
            isDark
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
              : 'text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
          }`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
          
          {/* Subtle curved overlay for logout button */}
          <div className={`absolute inset-0 rounded-2xl transition-colors ${
            isDark ? 'hover:bg-red-500/5' : 'hover:bg-red-50/50'
          }`} />
        </motion.button>
      </div>
    </motion.div>
  );
}