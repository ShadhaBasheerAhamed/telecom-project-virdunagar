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

export function Sidebar({ theme, currentPage, onPageChange }: SidebarProps) {
  const isDark = theme === 'dark';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 top-0 h-screen w-64 ${
        isDark 
          ? 'bg-[#1e293b]/80 border-[#334155]' 
          : 'bg-white/80 border-gray-200'
      } backdrop-blur-xl border-r z-50`}>
      {/* Logo/Brand */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-6 border-b border-inherit">
        <h1 className={`mb-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          SPT GLOBAL TELECOM
        </h1>
        <motion.p 
          whileHover={{ scale: 1.05 }}
          className={`text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
          ONE RADIUS
        </motion.p>
      </motion.div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative overflow-hidden ${
                    isActive
                      ? isDark
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                        : 'bg-cyan-50 text-cyan-600 border border-cyan-200 shadow-lg shadow-cyan-500/20'
                      : isDark
                      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {/* Background animation for active state */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 rounded-lg ${
                        isDark ? 'bg-cyan-500/10' : 'bg-cyan-100/50'
                      }`}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <Icon className="w-5 h-5 relative z-10" />
                  </motion.div>
                  <span className="relative z-10 font-medium">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-2 h-2 bg-cyan-400 rounded-full relative z-10"
                    />
                  )}
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Logout at Bottom */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 border-t border-inherit">
        <motion.button
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (confirm('Are you sure you want to log out?')) {
              console.log('Logging out...');
            }
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative overflow-hidden ${
            isDark
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              : 'text-red-600 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          <motion.div
            whileHover={{ rotate: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <LogOut className="w-5 h-5" />
          </motion.div>
          <span className="font-medium">Logout</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
