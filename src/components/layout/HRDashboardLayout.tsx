import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { HRSidebar } from './HRSidebar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LogOut, Menu, MapPin, Bell, Check, X, Calendar, Clock, Layers } from 'lucide-react';
import { VeyraBrandHeader } from '../common/VeyraBrandHeader';

export const HRDashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const { profile, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const userInitial = (profile?.full_name?.charAt(0) || 'H').toUpperCase();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex text-[#172033]">
      {/* SIDEBAR (Desktop permanent + Mobile slide-out drawer) */}
      <HRSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* TOP HR NAV BAR */}
        <header className="h-16 bg-white border-b border-[#E8E2D9] px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left section: Mobile Hamburger + Brand Header / Console Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-[#FAF8F5] hover:bg-[#F0EBE3] border border-[#E8E2D9] text-[#172033] transition-all flex items-center justify-center shadow-2xs shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-[#172033]" />
            </button>

            {/* Mobile Brand Identity */}
            <div className="flex md:hidden items-center gap-2">
              <VeyraBrandHeader size="sm" />
              <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-veyra-blue font-extrabold text-[10px] tracking-wide">
                HR
              </span>
            </div>

            {/* Desktop Console Badge & Assigned Location */}
            <div className="hidden md:flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs">
                HR Operations Console
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-mono">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{profile?.branch_name || 'All Regional Hubs (HQ)'}</span>
              </span>
            </div>
          </div>

          {/* Right section: Notification Bell + User Quick Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifsOpen(!isNotifsOpen)}
                className="w-9 h-9 rounded-xl bg-[#FAF8F5] hover:bg-[#F0EBE3] border border-[#E8E2D9] text-slate-700 hover:text-blue-700 flex items-center justify-center transition-all relative shadow-2xs"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifsOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-extrabold text-slate-900">HR Operations Alerts</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.link_url) {
                              setIsNotifsOpen(false);
                              navigate(n.link_url);
                            }
                          }}
                          className={`pt-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            !n.is_read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50 opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-extrabold text-slate-900 text-xs block leading-tight">{n.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/hr/profile"
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-veyra-blue hover:bg-blue-50/50 transition-all shadow-2xs"
              title="My HR Profile"
            >
              <div className="w-7 h-7 rounded-full bg-veyra-blue text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                {userInitial}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-[#172033] truncate max-w-[120px]">
                {profile?.full_name || 'HR Manager'}
              </span>
            </NavLink>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              icon={<LogOut className="w-4 h-4 text-red-500" />}
              className="text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-transparent hover:border-red-100"
              title="Sign Out"
            >
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
