import { useState, useEffect } from 'react';
import { useNetworkProvider } from './contexts/NetworkProviderContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { NotificationProvider } from './contexts/NotificationContext'; // ✅ Added Import

import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

import { EnhancedDashboard } from './components/pages/EnhancedDashboard';
import { Customers } from './components/pages/Customers';
import { Leads } from './components/pages/Leads';
import { Payment } from './components/pages/Payment';
import { Complaints } from './components/pages/Complaints';
import { Inventory } from './components/pages/Inventory';
import { MasterRecords } from './components/pages/MasterRecords';
import { Reports } from './components/pages/Reports';
import { NetworkProviders } from './components/pages/NetworkProviders';
import { SearchProvider } from './contexts/SearchContext';

import type { Page, UserRole } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userRole, setUserRole] = useState<UserRole>('Super Admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { selectedProvider, setSelectedProvider, availableProviders } =
    useNetworkProvider();

  const dataSource = selectedProvider ? selectedProvider.name : 'All';

  const handleDataSourceChange = (sourceName: string) => {
    if (sourceName === 'All') {
      setSelectedProvider(null);
    } else {
      const provider = availableProviders.find(p => p.name === sourceName);
      if (provider) setSelectedProvider(provider);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
  };

  const handleThemeToggle = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      setIsAuthenticated(false);
      setCurrentPage('dashboard');
      setUserRole('Super Admin');
      setSelectedProvider(null);
      setSidebarOpen(false);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <EnhancedDashboard dataSource={dataSource} theme={theme} />;
      case 'customers':
        return <Customers dataSource={dataSource} theme={theme} />;
      case 'leads':
        return <Leads dataSource={dataSource} theme={theme} />;
      case 'payment':
        return <Payment dataSource={dataSource} theme={theme} userRole={userRole} />;
      case 'complaints':
        return <Complaints dataSource={dataSource} theme={theme} />;
      case 'inventory':
        return <Inventory theme={theme} />;
      case 'master-records':
        return <MasterRecords dataSource={dataSource} theme={theme} />;
      case 'reports':
        return <Reports dataSource={dataSource} theme={theme} />;
      case 'network-providers':
        return <NetworkProviders theme={theme} />;
      default:
        return <EnhancedDashboard dataSource={dataSource} theme={theme} />;
    }
  };

  // 🔐 Login screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // ✅ DashboardProvider -> NotificationProvider -> Layout
  return (
    <SearchProvider>
    <DashboardProvider>
      <NotificationProvider> {/* ✅ Added NotificationProvider here */}
        <div
          className={`min-h-screen ${
            theme === 'dark'
              ? 'bg-[#0f172a] text-white'
              : 'bg-gray-50 text-gray-900'
          }`}
        >
          <Sidebar
            theme={theme}
            currentPage={currentPage}
            userRole={userRole}
            onPageChange={handlePageChange}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="md:ml-64">
            <Header
              theme={theme}
              userRole={userRole}
              dataSource={dataSource}
              onThemeToggle={handleThemeToggle}
              onDataSourceChange={handleDataSourceChange}
              onMenuClick={() => setSidebarOpen(true)}
              onLogout={handleLogout}
            />

            <main className="p-4 md:p-6">{renderCurrentPage()}</main>
          </div>
        </div>
      </NotificationProvider> {/* ✅ Closed NotificationProvider */}
    </DashboardProvider>
  </SearchProvider>
  );
}

export default App;