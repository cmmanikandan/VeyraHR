import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  CalendarDays, 
  Sparkles, 
  MailCheck, 
  CheckCircle2, 
  Briefcase,
  ArrowRight,
  ShieldAlert,
  Layers,
  RotateCw,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../context/DataContext';

export const HRNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Leave' | 'Attendance' | 'Payroll' | 'Shifts' | 'System'>('All');

  const hrNotifications = React.useMemo(() => {
    return notifications.filter(
      (n) => n.recipient_role === 'hr_manager' || n.recipient_role === 'all' || n.recipient_profile_id === 'hr' || n.recipient_profile_id === 'all'
    );
  }, [notifications]);

  const unreadCount = hrNotifications.filter((n) => !n.is_read).length;

  const filterTabs: ('All' | 'Leave' | 'Attendance' | 'Payroll' | 'Shifts' | 'System')[] = [
    'All', 'Leave', 'Attendance', 'Payroll', 'Shifts', 'System'
  ];

  const filteredNotifications = hrNotifications.filter((n) => {
    if (selectedFilter === 'All') return true;
    const type = (n.type || '').toLowerCase();
    const title = n.title.toLowerCase();
    const msg = n.message.toLowerCase();

    if (selectedFilter === 'Leave') return type === 'leave' || title.includes('leave') || msg.includes('leave');
    if (selectedFilter === 'Attendance') return type === 'attendance' || title.includes('attendance') || title.includes('check-in') || title.includes('check-out') || title.includes('punch');
    if (selectedFilter === 'Payroll') return type === 'payroll' || title.includes('payroll') || title.includes('salary') || title.includes('disburs');
    if (selectedFilter === 'Shifts') return type === 'shift' || title.includes('shift') || msg.includes('swap');
    if (selectedFilter === 'System') return type === 'system' || type === 'security' || type === 'announcement';
    return true;
  });

  const resolveHRTargetRoute = (n: typeof notifications[0]) => {
    const type = (n.type || '').toLowerCase();
    const url = n.link_url || '';
    if (type === 'leave' || url.includes('leave')) return '/hr/leave';
    if (type === 'attendance' || url.includes('attendance')) return '/hr/attendance';
    if (type === 'payroll' || url.includes('payroll') || url.includes('payslip')) return '/hr/payroll';
    if (type === 'shift' || url.includes('shift')) return '/hr/shifts';
    if (type === 'announcement' || url.includes('announcement')) return '/hr/announcements';
    return '/hr/dashboard';
  };

  const handleNotificationClick = (n: typeof notifications[0]) => {
    markNotificationRead(n.id);
    const target = resolveHRTargetRoute(n);
    navigate(target);
  };

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0B1528] via-[#112240] to-[#1E3A8A] border border-blue-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-blue-400 border border-white/15 shadow-xs flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono">HR Operations Console</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">Staff & Workplace Alerts</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5 flex items-center gap-2">
              <span>HR Notifications & Action Items</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-mono font-black shadow-xs animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Live employee attendance punches, leave applications, payroll triggers & shift approvals
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="relative z-10 text-xs font-bold text-white flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 shadow-2xs transition-colors self-start sm:self-auto shrink-0 backdrop-blur-md"
          >
            <CheckCheck className="w-4 h-4 text-blue-300" />
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
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
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
              <h4 className="text-base font-extrabold text-slate-900">All Operations Clear! ✨</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                No active employee requests or pending approvals in this category.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isUnread = !n.is_read;
            const targetRoute = resolveHRTargetRoute(n);

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative group hover:border-blue-300 hover:shadow-md ${
                  isUnread
                    ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUnread 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {n.type === 'Leave' && <CalendarDays className="w-4 h-4" />}
                      {n.type === 'Attendance' && <Clock className="w-4 h-4" />}
                      {n.type === 'Payroll' && <Briefcase className="w-4 h-4" />}
                      {n.type === 'Shift' && <Layers className="w-4 h-4" />}
                      {(!n.type || (n.type !== 'Leave' && n.type !== 'Attendance' && n.type !== 'Payroll' && n.type !== 'Shift')) && <Bell className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black font-mono uppercase">
                          {n.type || 'Alert'}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
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
                  
                  <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-blue-700">
                    <span>Open in HR Operations</span>
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
