import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NetworkProviderProvider } from './contexts/NetworkProviderContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css'; // MUST BE HERE

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkProviderProvider>
      <DashboardProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </DashboardProvider>
    </NetworkProviderProvider>
  </React.StrictMode>
);
