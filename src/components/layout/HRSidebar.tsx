import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Smile, 
  Megaphone, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Layers,
  UserCircle2,
  X,
  ChevronRight as ArrowRight,
  Briefcase,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VeyraBrandHeader } from '../common/VeyraBrandHeader';

interface HRSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const HRSidebar: React.FC<HRSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    if (mobileOpen) onCloseMobile();
    navigate('/', { replace: true });
  };

  const navItems = [
    { label: 'Dashboard Overview', path: '/hr/dashboard', icon: LayoutDashboard },
    { label: 'Employee Directory', path: '/hr/employees', icon: Users },
    { label: 'Document Repository', path: '/hr/documents', icon: FileSpreadsheet },
    { label: 'Payroll & Compensation', path: '/hr/payroll', icon: Briefcase },
    { label: 'Departments & Roles', path: '/hr/departments', icon: Layers },
    { label: 'Live Attendance Stream', path: '/hr/attendance', icon: Clock },
    { label: 'Leave Approvals', path: '/hr/leave', icon: Calendar },
    { label: 'Shift Roster Manager', path: '/hr/shifts', icon: Layers },
    { label: 'Branch Kiosks', path: '/hr/kiosks', icon: QrCode },
    { label: 'Team Sentiment & Mood', path: '/hr/mood', icon: Smile },
    { label: 'Announcements', path: '/hr/announcements', icon: Megaphone },
    { label: 'Reports & Exports', path: '/hr/reports', icon: FileSpreadsheet },
    { label: 'My Profile', path: '/hr/profile', icon: UserCircle2 },
  ];

  const handleNavClick = () => {
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const userInitial = (profile?.full_name?.charAt(0) || 'H').toUpperCase();

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE BACKDROP & DRAWER OVERLAY */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[86vw] bg-[#F7F5F2] border-r border-[#E8E2D9] z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col min-h-0">
          {/* Mobile Drawer Header */}
          <div className="p-4 bg-white border-b border-[#E8E2D9] flex items-center justify-between shadow-2xs">
            <VeyraBrandHeader size="sm" subtitle="HR OPERATIONS" />
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-xl bg-[#F7F5F2] hover:bg-white border border-[#E8E2D9] text-[#172033] flex items-center justify-center transition-all shadow-2xs"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C827A]">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-veyra-blue text-white shadow-md shadow-blue-500/20'
                        : 'text-[#4A5568] hover:text-[#172033] hover:bg-white hover:shadow-2xs'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 opacity-60 shrink-0" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Mobile Footer & Profile / Logout */}
        <div className="p-3.5 border-t border-[#E8E2D9] space-y-2.5 bg-white shadow-xs">
          <NavLink
            to="/hr/profile"
            onClick={handleNavClick}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-veyra-blue hover:bg-blue-50/50 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-veyra-blue text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
              {userInitial}
            </div>
            <div className="truncate text-left flex-1 min-w-0">
              <span className="text-xs font-extrabold text-[#172033] block truncate">
                {profile?.full_name || 'HR Operations Manager'}
              </span>
              <span className="text-[10px] text-veyra-blue block truncate font-bold">
                View & Edit Profile →
              </span>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50/70 hover:bg-red-100/90 transition-colors border border-red-200/80"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. DESKTOP PERMANENT SIDEBAR (Hidden on mobile) */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex bg-[#F7F5F2] border-r border-[#E8E2D9] h-screen sticky top-0 flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* HEADER */}
        <div>
          <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between">
            {isCollapsed ? (
              <img src="/logo.png" alt="VeyraHR" className="w-8 h-8 object-contain mx-auto shrink-0" />
            ) : (
              <VeyraBrandHeader size="sm" subtitle="HR OPERATIONS" />
            )}

            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-veyra-border text-veyra-text-sub transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-veyra-blue text-white shadow-xs'
                        : 'text-veyra-text-sub hover:text-veyra-text hover:bg-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* FOOTER & LOGOUT */}
        <div className="p-3 border-t border-[#E8E2D9] space-y-2">
          <NavLink to="/hr/profile" className="flex items-center gap-3 p-2 rounded-xl bg-white border border-veyra-border hover:border-veyra-blue hover:bg-veyra-blue-soft/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-veyra-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="truncate text-left">
                <span className="text-xs font-extrabold text-veyra-text block truncate">
                  {profile?.full_name || 'HR Operations Manager'}
                </span>
                <span className="text-[10px] text-veyra-blue block truncate font-semibold">View My Profile →</span>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-veyra-danger hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
