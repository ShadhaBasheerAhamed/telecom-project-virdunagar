import { LayoutDashboard, Users, MessageSquare, UserPlus, CreditCard, Database, FileText, LogOut } from 'lucide-react';
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
    <div className={`fixed left-0 top-0 h-screen w-64 ${
      isDark 
        ? 'bg-[#1e293b]/80 border-[#334155]' 
        : 'bg-white/80 border-gray-200'
    } backdrop-blur-xl border-r z-50`}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-inherit">
        <h1 className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          SPT GLOBAL TELECOM SERVICES
        </h1>
        <p className={`text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
          ONE RADIUS
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                      : isDark
                      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout at Bottom */}
      <div className="p-4 border-t border-inherit">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to log out?')) {
              console.log('Logging out...');
            }
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isDark
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              : 'text-red-600 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
