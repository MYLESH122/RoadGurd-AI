import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Sidebar, NavPage } from '../components/Sidebar';
import { AudioTestModal } from '../components/AudioTestModal';
import { SOSModal } from '../components/SOSModal';

interface DashboardLayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onLogout: () => void;
  userEmail?: string;
  isMonitoring: boolean;
  activeSessionDuration?: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  userEmail,
  isMonitoring,
  activeSessionDuration,
  children
}) => {
  const [isAudioTestOpen, setIsAudioTestOpen] = useState<boolean>(false);
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header
        userEmail={userEmail}
        onOpenAudioTest={() => setIsAudioTestOpen(true)}
        onOpenSOS={() => setIsSOSOpen(true)}
        onLogout={onLogout}
        activeSessionDuration={isMonitoring ? activeSessionDuration : undefined}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          isMonitoring={isMonitoring}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <AudioTestModal
        isOpen={isAudioTestOpen}
        onClose={() => setIsAudioTestOpen(false)}
      />

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onSuccess={() => {
          setIsSOSOpen(false);
          onNavigate('alerts');
        }}
      />
    </div>
  );
};

