import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu, Bell, Check, ShieldAlert } from 'lucide-react';
import { VeyraBrandHeader } from '../common/VeyraBrandHeader';
import { useData } from '../../context/DataContext';

export const AdminLayout: React.FC = () => {
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

  const adminNotifications = React.useMemo(() => {
    return notifications.filter(
      (n) => n.recipient_role === 'admin' || n.recipient_role === 'all' || n.recipient_profile_id === 'admin' || n.recipient_profile_id === 'all'
    );
  }, [notifications]);

  const unreadCount = adminNotifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex text-veyra-text">
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP SYSTEM NAV BAR */}
        <header className="h-16 bg-white border-b border-veyra-border px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left: Hamburger (mobile) + Badge (desktop) */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-[#FAF8F5] hover:bg-[#F0EBE3] border border-[#E8E2D9] text-[#172033] transition-all flex items-center justify-center shadow-2xs shrink-0"
              aria-label="Open Admin Navigation"
            >
              <Menu className="w-5 h-5 text-[#172033]" />
            </button>

            {/* Mobile Brand */}
            <div className="flex md:hidden items-center gap-2">
              <VeyraBrandHeader size="sm" />
              <span className="px-2 py-0.5 rounded-md bg-veyra-navy text-white font-extrabold text-[10px] tracking-wide">
                ADMIN
              </span>
            </div>

            {/* Desktop Badge */}
            <div className="hidden md:flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-veyra-navy text-white font-extrabold text-xs">
                System Admin
              </span>
              <span className="text-xs text-veyra-text-sub font-semibold hidden sm:inline">
                Multi-Branch Governance Mode
              </span>
            </div>
          </div>

          {/* Right: Notifications + Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Admin Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifsOpen(!isNotifsOpen)}
                className="w-9 h-9 rounded-xl bg-[#FAF8F5] hover:bg-[#F0EBE3] border border-[#E8E2D9] text-slate-700 hover:text-veyra-navy flex items-center justify-center transition-all relative shadow-2xs"
                title="Admin Governance Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {isNotifsOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-veyra-navy" />
                      <span className="text-xs font-extrabold text-slate-900">System Admin Alerts</span>
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
                    {adminNotifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No admin alerts yet.</p>
                    ) : (
                      adminNotifications.slice(0, 10).map((n) => (
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
                            !n.is_read ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50 opacity-70'
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

            <div className="hidden sm:flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-veyra-navy text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-veyra-text truncate max-w-[120px]">
                {profile?.full_name || 'System Admin'}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              icon={<LogOut className="w-3.5 h-3.5 text-veyra-danger" />}
              className="text-xs font-bold text-veyra-danger hover:bg-red-50"
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
