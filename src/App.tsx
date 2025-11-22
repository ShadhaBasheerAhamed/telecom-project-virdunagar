import { useState, useEffect } from 'react';
// ✅ FIXED IMPORTS: Removed '/ui' from path
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login'; 

// Pages
import { Dashboard } from './components/pages/Dashboard';
import { Customers } from './components/pages/Customers';
import { Complaints } from './components/pages/Complaints';
import { Leads } from './components/pages/Leads';
import { Payment } from './components/pages/Payment';
import { MasterRecords } from './components/pages/MasterRecords';
import { Reports } from './components/pages/Reports';
import { Inventory } from './components/pages/Inventory';
import { Sales } from './components/pages/Sales';

export type DataSource = 'All' | 'BSNL' | 'RMAX';
export type Page = 'dashboard' | 'customers' | 'complaints' | 'leads' | 'payment' | 'master-records' | 'reports' | 'inventory' | 'sales';
export type UserRole = 'Super Admin' | 'Sales' | 'Maintenance' | null;

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [dataSource, setDataSource] = useState<DataSource>('All');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- AUTH STATE ---
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // If no user is logged in, show Login Screen
  if (!userRole) {
    return <Login onLogin={(role) => setUserRole(role)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard dataSource={dataSource} theme={theme} />;
      case 'customers':
        return <Customers dataSource={dataSource} theme={theme} />;
      case 'complaints':
        return <Complaints dataSource={dataSource} theme={theme} />;
      case 'leads':
        return <Leads dataSource={dataSource} theme={theme} />;
      case 'payment':
        return <Payment dataSource={dataSource} theme={theme} userRole={userRole} />;
      case 'master-records':
        return <MasterRecords dataSource={dataSource} theme={theme} />;
      case 'reports':
        return <Reports dataSource={dataSource} theme={theme} />;
      case 'inventory':
        return <Inventory theme={theme} />;
      case 'sales':
        return <Sales theme={theme} />;
      default:
        return <Dashboard dataSource={dataSource} theme={theme} />;
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#F1F5F9]'} transition-colors duration-300`}>
      
      {/* Sidebar */}
      <Sidebar
        theme={theme}
        currentPage={currentPage}
        userRole={userRole} 
        onPageChange={(page: any) => {
          setCurrentPage(page);
          closeSidebar(); 
        }}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      
      {/* Main Layout */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-64">
        
        {/* Header */}
        <Header
          theme={theme}
          dataSource={dataSource}
          onThemeToggle={toggleTheme}
          onDataSourceChange={setDataSource}
          onMenuClick={toggleSidebar}
          userRole={userRole}
          onLogout={() => setUserRole(null)}
        />
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {renderPage()}
        </main>
      </div>

    </div>
  );
}