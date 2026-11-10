import React from 'react';
import {
  LayoutDashboard,
  Video,
  User,
  Users,
  Activity,
  Bell,
  HeartHandshake,
  BarChart3,
  Settings,
  Compass
} from 'lucide-react';

export type NavPage =
  | 'dashboard'
  | 'monitoring'
  | 'profile'
  | 'drivers'
  | 'detections'
  | 'alerts'
  | 'contacts'
  | 'reports'
  | 'settings'
  | 'landing';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isMonitoring: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isMonitoring }) => {
  const navItems: Array<{ id: NavPage; label: string; icon: React.ReactNode; badge?: string; pulse?: boolean }> = [
    { id: 'dashboard', label: 'Fleet Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'monitoring',
      label: 'Live AI Monitoring',
      icon: <Video className="w-4 h-4" />,
      badge: isMonitoring ? 'REC' : undefined,
      pulse: isMonitoring
    },
    { id: 'profile', label: 'Driver Profile', icon: <User className="w-4 h-4" /> },
    { id: 'drivers', label: 'Driver Management', icon: <Users className="w-4 h-4" /> },
    { id: 'detections', label: 'Detection History', icon: <Activity className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alert History', icon: <Bell className="w-4 h-4" /> },
    { id: 'contacts', label: 'Emergency Contacts', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Safety', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'landing', label: 'Landing / Product', icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] border-r border-navy-800">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        item.pulse ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-navy-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex justify-between items-center text-slate-300">
          <span>Engine Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            AI v1.0 Ready
          </span>
        </div>
        <p className="text-[10px] text-slate-400 pt-1">ROADGUARD AI Automotive Core</p>
      </div>
    </aside>
  );
};

