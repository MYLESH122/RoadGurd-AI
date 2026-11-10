import React, { useState, useEffect } from 'react';
import { NavPage } from './components/Sidebar';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SplashLanding } from './pages/SplashLanding';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MainDashboard } from './pages/MainDashboard';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { DriverProfile } from './pages/DriverProfile';
import { DriverManagement } from './pages/DriverManagement';
import { DetectionHistory } from './pages/DetectionHistory';
import { AlertHistory } from './pages/AlertHistory';
import { EmergencyContacts } from './pages/EmergencyContacts';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { SettingsPage } from './pages/Settings';

export function App() {
  const [currentPage, setCurrentPage] = useState<NavPage | 'login' | 'register'>('dashboard');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('driver@roadguard.ai');
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(false);
  const [sessionDurationStr, setSessionDurationStr] = useState<string>('00:00:00');

  useEffect(() => {
    const savedToken = localStorage.getItem('roadguard_token');
    if (savedToken) {
      setAuthToken(savedToken);
    }
  }, []);

  const handleLoginSuccess = (token: string, user: { email: string; full_name: string; role: string }) => {
    setAuthToken(token);
    setUserEmail(user.email);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('roadguard_token');
    setAuthToken(null);
    setCurrentPage('landing');
  };

  // If user is on landing page
  if (currentPage === 'landing') {
    return (
      <SplashLanding
        onGetStarted={() => setCurrentPage(authToken ? 'monitoring' : 'login')}
        onLogin={() => setCurrentPage('login')}
      />
    );
  }

  // If user is on Login
  if (currentPage === 'login') {
    return (
      <Login
        onSuccess={handleLoginSuccess}
        onNavigateRegister={() => setCurrentPage('register')}
      />
    );
  }

  // If user is on Register
  if (currentPage === 'register') {
    return (
      <Register
        onSuccess={handleLoginSuccess}
        onNavigateLogin={() => setCurrentPage('login')}
      />
    );
  }

  // Render main dashboard shell
  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={(page) => setCurrentPage(page)}
      onLogout={handleLogout}
      userEmail={userEmail}
      isMonitoring={isMonitoringActive}
      activeSessionDuration={sessionDurationStr}
    >
      {currentPage === 'dashboard' && (
        <MainDashboard onStartMonitoring={() => setCurrentPage('monitoring')} />
      )}
      {currentPage === 'monitoring' && (
        <LiveMonitoring
          onSessionStateChange={(active, durStr) => {
            setIsMonitoringActive(active);
            setSessionDurationStr(durStr);
          }}
        />
      )}
      {currentPage === 'profile' && <DriverProfile />}
      {currentPage === 'drivers' && <DriverManagement />}
      {currentPage === 'detections' && <DetectionHistory />}
      {currentPage === 'alerts' && <AlertHistory />}
      {currentPage === 'contacts' && <EmergencyContacts />}
      {currentPage === 'reports' && <ReportsAnalytics />}
      {currentPage === 'settings' && <SettingsPage />}
    </DashboardLayout>
  );
}

export default App;

