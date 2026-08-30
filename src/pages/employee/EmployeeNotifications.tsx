import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  CalendarDays, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  Trash2, 
  MailCheck, 
  Info, 
  CheckCircle2, 
  Megaphone,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const EmployeeNotifications: React.FC = () => {
  const { profile } = useAuth();
  const { notifications, employees, markNotificationRead, markAllNotificationsRead } = useData();
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'HR' | 'Attendance' | 'Leave' | 'Payroll'>('All');

  const currentEmp = React.useMemo(() => {
    if (profile?.email) {
      const match = employees.find((e) => e.email?.toLowerCase() === profile.email.toLowerCase());
      if (match) return match;
    }
    return employees[0] || { id: 'emp_current', employee_id: 'VEY-EMP-0001' };
  }, [employees, profile]);

  const employeeNotifications = React.useMemo(() => {
    return notifications.filter(
      (n) => n.recipient_role === 'employee' || n.recipient_role === 'all' || n.recipient_profile_id === currentEmp.id || n.recipient_profile_id === (currentEmp as any).employee_id || n.recipient_profile_id === 'all'
    );
  }, [notifications, currentEmp]);

  const unreadCount = employeeNotifications.filter((n) => !n.is_read).length;

  const filterTabs: ('All' | 'HR' | 'Attendance' | 'Leave' | 'Payroll')[] = [
    'All', 'HR', 'Attendance', 'Leave', 'Payroll'
  ];

  const filteredNotifications = employeeNotifications.filter((n) => {
    if (selectedFilter === 'All') return true;
    const title = n.title.toLowerCase();
    const msg = n.message.toLowerCase();
    const type = (n.type || '').toLowerCase();
    if (selectedFilter === 'HR') return type === 'announcement' || type === 'system' || title.includes('hr') || msg.includes('policy');
    if (selectedFilter === 'Attendance') return type === 'attendance' || title.includes('attendance') || title.includes('check-in');
    if (selectedFilter === 'Leave') return type === 'leave' || title.includes('leave') || title.includes('time-off');
    if (selectedFilter === 'Payroll') return type === 'payroll' || title.includes('salary') || title.includes('payslip') || title.includes('bonus');
    return true;
  });

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#090E1A] via-[#111A2E] to-[#16223B] border border-indigo-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-indigo-400 border border-white/15 shadow-xs flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">Unified Inbox</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">Real-Time Alerts</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5 flex items-center gap-2">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-mono font-black shadow-xs">
                  {unreadCount} unread
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Official company announcements, attendance logs & approvals</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="relative z-10 text-xs font-bold text-white flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 shadow-2xs transition-colors self-start sm:self-auto shrink-0 backdrop-blur-md"
          >
            <CheckCheck className="w-4 h-4 text-indigo-400" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* ─── 2. FILTER CHIPS (ALL, HR, ATTENDANCE, LEAVE, PAYROLL) ─────── */}
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
              <h4 className="text-base font-extrabold text-slate-900">You're all caught up! ✨</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                No new updates in this category. We'll notify you when an action requires your attention.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative group hover:border-slate-300 shadow-2xs ${
                  isUnread
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUnread 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                        {n.title}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </h4>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-600 leading-relaxed pl-10">
                  {n.message}
                </p>

                {/* Bottom Footer Details */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pl-10 pt-1">
                  <span>Priority: Normal</span>
                  <span className="text-blue-600 font-bold group-hover:underline">
                    {isUnread ? 'Mark as read' : 'View details →'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
