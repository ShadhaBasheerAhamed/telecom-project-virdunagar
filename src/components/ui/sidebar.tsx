import { LayoutDashboard, Users, MessageSquare, UserPlus, CreditCard, Database, FileText, LogOut, X, ShoppingCart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ FIXED IMPORT PATH: Types are actually in src/types/index.ts
import type { Page, UserRole } from '../../types';

interface SidebarProps {
  theme: 'light' | 'dark';
  currentPage: Page;
  userRole: UserRole;
  onPageChange: (page: Page) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Menu items with Role Permissions
const allNavItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Sales', 'Maintenance'] },
  { id: 'leads' as Page, label: 'Leads', icon: UserPlus, roles: ['Super Admin', 'Sales'] },
  { id: 'customers' as Page, label: 'Customers', icon: Users, roles: ['Super Admin', 'Sales', 'Maintenance'] },
  { id: 'sales' as Page, label: 'Sales POS', icon: ShoppingCart, roles: ['Super Admin', 'Sales'] },
  { id: 'payment' as Page, label: 'Payment', icon: CreditCard, roles: ['Super Admin', 'Sales'] },
  { id: 'complaints' as Page, label: 'Complaints', icon: MessageSquare, roles: ['Super Admin', 'Maintenance'] },
  { id: 'inventory' as Page, label: 'Inventory', icon: Package, roles: ['Super Admin', 'Sales'] },
  { id: 'master-records' as Page, label: 'Master Records', icon: Database, roles: ['Super Admin'] },
  { id: 'reports' as Page, label: 'Reports', icon: FileText, roles: ['Super Admin'] },
];

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

const SidebarContent = ({ isDark, currentPage, onPageChange, onClose, userRole }: {
  isDark: boolean;
  currentPage: Page;
  userRole: UserRole;
  onPageChange: (page: Page) => void;
  onClose?: () => void;
}) => {
  // Filter items based on the logged-in User Role
  const visibleItems = allNavItems.filter(item => item.roles.includes(userRole || 'Super Admin'));

  return (
    <>
      <div className="p-6 sm:p-8 border-b border-inherit flex items-center justify-between">
        <div>
          <h1 className={`mb-1 text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            SPT TELECOM
          </h1>
          <div className={`text-xs font-bold tracking-[0.2em] uppercase ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
            {userRole || 'ONE RADIUS'}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="p-4 flex-1 overflow-y-auto no-scrollbar">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const pillStyles = getPillStyles(isActive, isDark);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onPageChange(item.id);
                    onClose?.();
                  }}
                  style={pillStyles}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-all relative overflow-hidden group outline-none ${
                    isActive
                      ? isDark ? 'text-cyan-400' : 'text-cyan-700'
                      : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'drop-shadow-md' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="relative z-10 font-medium text-sm tracking-wide">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeDot"
                      className={`ml-auto w-2 h-2 rounded-full ${isDark ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-cyan-600'}`}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-inherit">
        <button
          onClick={() => { if (confirm('Are you sure you want to log out?')) window.location.reload(); }}
          style={{ 
            borderRadius: '1rem',
            border: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.1)'
          }}
          className={`w-full flex items-center gap-4 px-5 py-4 transition-all relative overflow-hidden outline-none ${
            isDark
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
              : 'text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
          }`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </>
  );
};

export function Sidebar(props: SidebarProps) {
  const isDark = props.theme === 'dark';

  return (
    <>
      <div className={`hidden md:flex fixed left-0 top-0 h-screen w-64 z-30 flex-col border-r backdrop-blur-xl ${
          isDark ? 'bg-[#1e293b]/95 border-[#334155]' : 'bg-white/95 border-gray-200'
        }`}>
        <SidebarContent isDark={isDark} {...props} />
      </div>

      <AnimatePresence>
        {props.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={props.onClose}
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className={`md:hidden fixed left-0 top-0 h-screen w-80 max-w-[85vw] z-50 flex flex-col border-r shadow-2xl ${
                isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'
              }`}
            >
              <SidebarContent isDark={isDark} {...props} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}