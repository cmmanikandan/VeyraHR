import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Clock, 
  CalendarDays, 
  Bell, 
  User, 
  WifiOff,
  IdCard,
  Sun,
  Moon,
  Bot
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DigitalIDCardModal } from '../employee/DigitalIDCardModal';
import { AIHelpdeskModal } from '../employee/AIHelpdeskModal';
import { Employee } from '../../types/database';

export type EmployeeTabType = 'home' | 'attendance' | 'leave' | 'notifications' | 'profile' | 'documents' | 'payslips' | 'helpdesk';

interface EmployeeLayoutProps {
  activeTab: EmployeeTabType;
  onTabChange: (tab: EmployeeTabType) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: 'home' | 'attendance' | 'leave' | 'notifications' | 'profile';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const { profile } = useAuth();
  const { notifications, employees, isOffline, offlineQueueLength } = useData();
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const currentEmp: Employee = React.useMemo(() => {
    let matchedEmp: Employee | undefined = undefined;

    if (profile?.email) {
      matchedEmp = employees.find((e) => e.email?.toLowerCase() === profile.email?.toLowerCase());
    }
    if (!matchedEmp && profile?.id) {
      matchedEmp = employees.find((e) => e.id === profile.id || (e as any).profile_id === profile.id || e.employee_id === profile.id);
    }
    if (!matchedEmp && profile?.full_name) {
      matchedEmp = employees.find(
        (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase() === profile.full_name?.trim().toLowerCase()
      );
    }

    const effectiveBranch = matchedEmp?.branch_name || profile?.branch_name || matchedEmp?.work_location || 'Chennai HQ';
    const effectiveWorkLoc = matchedEmp?.work_location || profile?.branch_name || effectiveBranch;

    if (matchedEmp) {
      return {
        ...matchedEmp,
        branch_name: effectiveBranch,
        work_location: effectiveWorkLoc,
      };
    }

    if (profile) {
      const nameParts = (profile.full_name || 'VeyraHR Employee').split(' ');
      return {
        id: profile.id || 'emp_current',
        company_id: profile.company_id || 'comp_veyra_tn',
        employee_id: profile.id ? `VEY-EMP-${profile.id.slice(-4).toUpperCase()}` : 'VEY-EMP-0001',
        first_name: nameParts[0] || 'Employee',
        last_name: nameParts.slice(1).join(' ') || '',
        email: profile.email || 'employee@veyrahr.com',
        phone: profile.phone || '+91 98765 00000',
        designation: 'Operations Specialist',
        department_name: profile.department_access || 'Engineering & Tech',
        branch_name: effectiveBranch,
        work_location: effectiveWorkLoc,
        joining_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        emergency_contact: '+91 98765 00001',
        address: `${effectiveBranch} Campus`,
        avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    }

    return employees[0] || {
      id: 'emp_default',
      company_id: 'comp_veyra_tn',
      employee_id: 'VEY-EMP-0001',
      first_name: 'Employee',
      last_name: '',
      email: 'employee@veyrahr.com',
      phone: '+91 98765 00000',
      designation: 'Specialist',
      department_name: 'Engineering & Tech',
      branch_name: 'Chennai HQ',
      work_location: 'Chennai HQ',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      emergency_contact: '+91 98765 00001',
      address: 'Chennai HQ Campus',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  }, [employees, profile]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('veyra_theme') === 'dark';
  });

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('veyra_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const employeeNotifications = React.useMemo(() => {
    return notifications.filter(
      (n) => n.recipient_role === 'employee' || n.recipient_role === 'all' || n.recipient_profile_id === currentEmp.id || n.recipient_profile_id === currentEmp.employee_id || n.recipient_profile_id === 'all'
    );
  }, [notifications, currentEmp]);

  const unreadNotificationsCount = employeeNotifications.filter((n) => !n.is_read).length;

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    {
      id: 'notifications',
      label: 'Inbox',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700 transition-colors ${
      isDarkMode ? 'bg-[#090D16] text-slate-100' : 'bg-[#FCFAF7] text-[#172033]'
    }`}>
      
      {/* Digital ID Card Modal */}
      {isIdCardOpen && (
        <DigitalIDCardModal
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          employee={currentEmp}
        />
      )}

      {/* Offline Notice Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Offline Mode — Punches queued locally</span>
          </div>
          {offlineQueueLength > 0 && (
            <span className="px-2.5 py-0.5 bg-amber-800/80 rounded-full text-[11px] font-mono font-bold">
              {offlineQueueLength} queued
            </span>
          )}
        </div>
      )}

      {/* Sticky Full-Width Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b w-full transition-all shadow-2xs ${
        isDarkMode ? 'bg-[#0E1526]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200/80 text-[#172033]'
      }`}>
        <div className="max-w-xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between">
          {/* Brand Logo & Brand Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onTabChange('home')}
          >
            <img
              src="/logo.png"
              alt="VeyraHR Logo"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col text-left justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#172033]'}`}>
                  Veyra<span className="text-[#2563EB]">HR</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[9px] font-extrabold uppercase font-mono border border-blue-400/30">
                  ESS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide block mt-0.5">Self-Service Portal</span>
            </div>
          </div>

          {/* Quick Header Actions: Theme Toggle + ID Card + Notifications + Profile Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dark/Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all border shadow-2xs hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Digital ID Pass Shortcut */}
            <button
              onClick={() => setIsIdCardOpen(true)}
              className={`p-2 rounded-xl transition-all border shadow-2xs hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="View Digital ID Pass"
            >
              <IdCard className="w-4 h-4" />
            </button>

            {/* Notifications Shortcut */}
            <button
              onClick={() => onTabChange('notifications')}
              className={clsx(
                "p-2 rounded-xl border transition-all relative hover:scale-105 active:scale-95",
                activeTab === 'notifications'
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : isDarkMode
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              )}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center border-2 border-white px-0.5">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => onTabChange('profile')}
              className={clsx(
                "relative rounded-full p-0.5 border-2 transition-all hover:scale-105 active:scale-95",
                activeTab === 'profile' ? "border-blue-600 ring-2 ring-blue-400/30" : "border-slate-200 hover:border-blue-400"
              )}
              title="My Profile"
            >
              <img
                src={currentEmp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentEmp.first_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-3 pb-28">
        {children}
      </main>

      {/* Full-Width Standard Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative group active:scale-95",
                  isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {/* Top Active Indicator Line */}
                {isActive && (
                  <span className="absolute top-0 inset-x-4 h-0.5 bg-blue-600 rounded-full" />
                )}

                <div className="relative mt-1">
                  <Icon
                    className={clsx(
                      "w-5 h-5 transition-transform",
                      isActive ? "scale-110 text-blue-600 stroke-[2.25]" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2.5 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={clsx(
                    "text-[11px] mt-1 tracking-tight transition-all",
                    isActive ? "font-extrabold text-blue-600" : "font-semibold text-slate-500"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating AI Assistant Trigger Button */}
      {!isHelpdeskOpen && (
        <button
          onClick={() => setIsHelpdeskOpen(true)}
          className="fixed bottom-24 right-4 z-40 p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border-2 border-white/40 group animate-in fade-in duration-200"
          title="Ask VeyraHR AI Assistant"
        >
          <Bot className="w-5 h-5 animate-pulse text-cyan-300" />
          <span className="text-xs font-black hidden sm:inline pr-1">Ask AI</span>
        </button>
      )}

      {/* Digital ID Card Modal */}
      {isIdCardOpen && (
        <DigitalIDCardModal
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          employee={currentEmp}
        />
      )}

      {/* AI Helpdesk Modal */}
      {isHelpdeskOpen && (
        <AIHelpdeskModal
          isOpen={isHelpdeskOpen}
          onClose={() => setIsHelpdeskOpen(false)}
        />
      )}
    </div>
  );
};
