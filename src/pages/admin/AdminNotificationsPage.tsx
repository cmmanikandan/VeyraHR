import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  MailCheck, 
  CheckCircle2, 
  Building2,
  Users,
  ArrowRight,
  ShieldAlert,
  History,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../context/DataContext';

export const AdminNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Security' | 'Branches' | 'Staff' | 'Attendance' | 'Payroll'>('All');

  const adminNotifications = React.useMemo(() => {
    return notifications.filter(
      (n) => n.recipient_role === 'admin' || n.recipient_role === 'all' || n.recipient_profile_id === 'admin' || n.recipient_profile_id === 'all'
    );
  }, [notifications]);

  const unreadCount = adminNotifications.filter((n) => !n.is_read).length;

  const filterTabs: ('All' | 'Security' | 'Branches' | 'Staff' | 'Attendance' | 'Payroll')[] = [
    'All', 'Security', 'Branches', 'Staff', 'Attendance', 'Payroll'
  ];

  const filteredNotifications = adminNotifications.filter((n) => {
    if (selectedFilter === 'All') return true;
    const type = (n.type || '').toLowerCase();
    const title = n.title.toLowerCase();
    const msg = n.message.toLowerCase();

    if (selectedFilter === 'Security') return type === 'security' || title.includes('security') || title.includes('session');
    if (selectedFilter === 'Branches') return type === 'system' || title.includes('branch') || title.includes('hub');
    if (selectedFilter === 'Staff') return type === 'onboarding' || title.includes('manager') || title.includes('employee');
    if (selectedFilter === 'Attendance') return type === 'attendance' || title.includes('punch') || title.includes('check-in');
    if (selectedFilter === 'Payroll') return type === 'payroll' || title.includes('payroll') || title.includes('salary');
    return true;
  });

  const resolveAdminTargetRoute = (n: typeof notifications[0]) => {
    const type = (n.type || '').toLowerCase();
    const url = n.link_url || '';
    if (type === 'security' || url.includes('security')) return '/admin/security';
    if (type === 'system' || url.includes('branch')) return '/admin/branches';
    if (url.includes('hr-manager')) return '/admin/hr-managers';
    if (type === 'payroll' || url.includes('payroll')) return '/admin/payroll';
    if (type === 'attendance' || type === 'leave' || url.includes('audit-log')) return '/admin/audit-logs';
    return '/admin/dashboard';
  };

  const handleNotificationClick = (n: typeof notifications[0]) => {
    markNotificationRead(n.id);
    const target = resolveAdminTargetRoute(n);
    navigate(target);
  };

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#090E1A] via-[#101A2E] to-[#1E293B] border border-cyan-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-cyan-400 border border-white/15 shadow-xs flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono">System Governance</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">Central Audit & Security</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5 flex items-center gap-2">
              <span>Admin Notifications & System Log</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[11px] font-mono font-black shadow-xs animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Live enterprise-wide security notifications, branch health checks, HR activities & audit feeds
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="relative z-10 text-xs font-bold text-white flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 shadow-2xs transition-colors self-start sm:self-auto shrink-0 backdrop-blur-md"
          >
            <CheckCheck className="w-4 h-4 text-cyan-300" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* ─── 2. FILTER TABS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 ${
              selectedFilter === tab
                ? 'bg-veyra-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── 3. NOTIFICATION CARDS LIST ────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <MailCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">All System Audits Clear! ✨</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                No system alerts or compliance escalations in this category.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isUnread = !n.is_read;
            const targetRoute = resolveAdminTargetRoute(n);

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative group hover:border-cyan-300 hover:shadow-md ${
                  isUnread
                    ? 'bg-cyan-50/40 border-cyan-200 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUnread 
                        ? 'bg-veyra-navy text-white border-veyra-navy shadow-2xs' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {n.type === 'Security' && <ShieldCheck className="w-4 h-4" />}
                      {n.type === 'Attendance' && <Clock className="w-4 h-4" />}
                      {n.type === 'Payroll' && <CreditCard className="w-4 h-4" />}
                      {n.type === 'System' && <Building2 className="w-4 h-4" />}
                      {(!n.type || (n.type !== 'Security' && n.type !== 'Attendance' && n.type !== 'Payroll' && n.type !== 'System')) && <Bell className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black font-mono uppercase">
                          {n.type || 'Audit'}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-cyan-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-600 leading-relaxed pl-11">
                  {n.message}
                </p>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 pl-11">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  
                  <div className="flex items-center gap-1 text-[11px] font-bold text-veyra-navy group-hover:text-blue-700">
                    <span>View in Admin Console</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
