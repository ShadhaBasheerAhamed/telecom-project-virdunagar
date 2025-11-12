import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/pages/Dashboard';
import { Customers } from './components/pages/Customers';
import { Complaints } from './components/pages/Complaints';
import { Leads } from './components/pages/Leads';
import { Payment } from './components/pages/Payment';
import { MasterRecords } from './components/pages/MasterRecords';
import { Reports } from './components/pages/Reports';

export type DataSource = 'All' | 'BSNL' | 'RMAX';
export type Page = 'dashboard' | 'customers' | 'complaints' | 'leads' | 'payment' | 'master-records' | 'reports';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [dataSource, setDataSource] = useState<DataSource>('All');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
        return <Payment dataSource={dataSource} theme={theme} />;
      case 'master-records':
        return <MasterRecords dataSource={dataSource} theme={theme} />;
      case 'reports':
        return <Reports dataSource={dataSource} theme={theme} />;
      default:
        return <Dashboard dataSource={dataSource} theme={theme} />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#F1F5F9]'} transition-colors duration-300`}>
      <div className="flex">
        <Sidebar 
          theme={theme} 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
        <div className="flex-1 ml-64">
          <Header 
            theme={theme}
            dataSource={dataSource}
            onThemeToggle={toggleTheme}
            onDataSourceChange={setDataSource}
          />
          <main className="p-8">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}
