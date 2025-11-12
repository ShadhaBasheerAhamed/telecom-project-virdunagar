import { useState } from 'react';
import type { DataSource } from '../../App';

interface MasterRecordsProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

type SubPage = 'department' | 'designation' | 'employee' | 'user';

export function MasterRecords({ dataSource, theme }: MasterRecordsProps) {
  const isDark = theme === 'dark';
  const [currentSubPage, setCurrentSubPage] = useState<SubPage>('department');

  const subPages = [
    { id: 'department' as SubPage, label: 'Department' },
    { id: 'designation' as SubPage, label: 'Designation' },
    { id: 'employee' as SubPage, label: 'Employee' },
    { id: 'user' as SubPage, label: 'User' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Master Records
      </h1>

      {/* Sub Navigation */}
      <div className={`p-2 rounded-xl border inline-flex gap-2 ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        {subPages.map((page) => (
          <button
            key={page.id}
            onClick={() => setCurrentSubPage(page.id)}
            className={`px-6 py-2 rounded-lg transition-all ${
              currentSubPage === page.id
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`p-8 rounded-xl border ${
        isDark
          ? 'bg-[#1e293b]/50 border-[#334155] backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      }`}>
        <div className="text-center py-12">
          <div className={`text-6xl mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            📋
          </div>
          <h2 className={`text-2xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {subPages.find(p => p.id === currentSubPage)?.label} Management
          </h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Master records for {currentSubPage} will be displayed here
          </p>
          <p className={`text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Features include: Create, Read, Update, and Delete operations
          </p>
        </div>
      </div>
    </div>
  );
}
