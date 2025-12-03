import { useState, useEffect } from 'react';
// ✅ ENHANCED IMPORTS: Using dynamic components with full backend integration
import { Sidebar } from './components/Sidebar'; 
import { Header } from './components/Header';   
import { Login } from './components/Login';
import { NotificationProvider } from './contexts/NotificationContext';
import { DashboardProvider } from './contexts/DashboardContext';

// Enhanced Pages with Dynamic Features
import { EnhancedDashboard } from './components/pages/EnhancedDashboard';
import { EnhancedCustomers } from './components/pages/EnhancedCustomers';
import { Complaints } from './components/pages/Complaints';
import { Leads } from './components/pages/Leads';
import { Payment } from './components/pages/Payment';
import { MasterRecords } from './components/pages/MasterRecords';
import { Reports } from './components/pages/Reports';
import { Inventory } from './components/pages/Inventory';

export type DataSource = 'All' | 'BSNL' | 'RMAX';
export type Page = 'dashboard' | 'customers' | 'complaints' | 'leads' | 'payment' | 'master-records' | 'reports' | 'inventory';
export type UserRole = 'Super Admin' | 'Sales' | 'Maintenance' | null;

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [dataSource, setDataSource] = useState<DataSource>('All');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- AUTH STATE ---
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Load user preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
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
    try {
      switch (currentPage) {
        case 'dashboard':
          return <EnhancedDashboard dataSource={dataSource} theme={theme} />;
        case 'customers':
          return <EnhancedCustomers dataSource={dataSource} theme={theme} />;
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
        default:
          return <EnhancedDashboard dataSource={dataSource} theme={theme} />;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Page</h2>
            <p className="text-gray-600 mb-4">An error occurred while loading this page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <NotificationProvider>
      <DashboardProvider>
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
      </DashboardProvider>
    </NotificationProvider>
  );
}