import { useState, useEffect } from 'react';
import { useNetworkProvider } from './contexts/NetworkProviderContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/pages/Dashboard';
import { Customers } from './components/pages/Customers';
import { Leads } from './components/pages/Leads';
import { Payment } from './components/pages/Payment';
import { Complaints } from './components/pages/Complaints';
import { Inventory } from './components/pages/Inventory';
import { MasterRecords } from './components/pages/MasterRecords';
import { Reports } from './components/pages/Reports';
import { NetworkProviders } from './components/pages/NetworkProviders';
import type { Page, UserRole, DataSource } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userRole, setUserRole] = useState<UserRole>('Super Admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Custom Hook for Global Network Provider
  const { selectedProvider, setSelectedProvider, availableProviders } = useNetworkProvider();

  // Derived state for legacy compatibility
  const dataSource = selectedProvider ? selectedProvider.name : 'All';

  const handleDataSourceChange = (sourceName: string) => {
    if (sourceName === 'All') {
      setSelectedProvider(null);
    } else {
      const provider = availableProviders.find(p => p.name === sourceName);
      if (provider) setSelectedProvider(provider);
    }
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
  };

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
    const commonProps = {
      theme,
      userRole,
      dataSource
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      case 'customers':
        return <Customers {...commonProps} />;
      case 'leads':
        return <Leads {...commonProps} />;
      case 'payment':
        return <Payment {...commonProps} />;
      case 'complaints':
        return <Complaints {...commonProps} />;
      case 'inventory':
        return <Inventory {...commonProps} />;
      case 'master-records':
        return <MasterRecords {...commonProps} />;
      case 'reports':
        return <Reports {...commonProps} />;
      case 'network-providers':
        return <NetworkProviders {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <Sidebar
        theme={theme}
        currentPage={currentPage}
        userRole={userRole}
        onPageChange={handlePageChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <Header
          theme={theme}
          userRole={userRole}
          dataSource={dataSource}
          availableProviders={availableProviders}
          onThemeToggle={handleThemeToggle}
          onDataSourceChange={handleDataSourceChange}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
