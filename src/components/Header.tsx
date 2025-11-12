import { Sun, Moon, User } from 'lucide-react';
import type { DataSource } from '../App';

interface HeaderProps {
  theme: 'light' | 'dark';
  dataSource: DataSource;
  onThemeToggle: () => void;
  onDataSourceChange: (source: DataSource) => void;
}

export function Header({ theme, dataSource, onThemeToggle, onDataSourceChange }: HeaderProps) {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 h-16 border-b ${
      isDark 
        ? 'bg-[#1e293b]/80 border-[#334155]' 
        : 'bg-white/80 border-gray-200'
    } backdrop-blur-xl`}>
      <div className="h-full flex items-center justify-end gap-4 px-8">
        {/* Data Source Dropdown */}
        <div className="flex items-center gap-2">
          <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Data Source:
          </label>
          <select
            value={dataSource}
            onChange={(e) => onDataSourceChange(e.target.value as DataSource)}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#0F172A] border-[#334155] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          >
            <option value="All">All</option>
            <option value="BSNL">BSNL</option>
            <option value="RMAX">RMAX</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className={`p-2 rounded-lg transition-all ${
            isDark
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
          }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
          isDark ? 'bg-[#0F172A]' : 'bg-gray-100'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
          }`}>
            <User className="w-5 h-5" />
          </div>
          <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin User
          </span>
        </div>
      </div>
    </header>
  );
}
