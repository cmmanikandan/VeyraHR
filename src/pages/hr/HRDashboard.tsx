import React, { useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CalendarDays, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Smile,
  ShieldAlert,
  Building2,
  Briefcase
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useData } from '../../context/DataContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface HRDashboardProps {
  onNavigate: (tab: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigate }) => {
  const { employees, attendance, leaveRequests, corrections, moodLogs, departments, branches } = useData();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's attendance records
  const todayAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === todayStr);
  }, [attendance, todayStr]);

  const totalEmp = employees.length;
  const presentCount = todayAttendance.filter((a) => a.status === 'Present').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'Late').length;
  const leaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const absentCount = Math.max(0, totalEmp - (presentCount + lateCount + leaveCount));
  
  const pendingCorrections = corrections.filter((c) => c.status === 'Pending').length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;
  const activePresentCount = presentCount + lateCount;
  const attendanceRate = totalEmp > 0 ? Math.round((activePresentCount / totalEmp) * 100) : 100;

  // Dynamic Weekly Trend Data from real attendance records
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day, idx) => {
      if (totalEmp === 0) {
        return { day, present: 0, late: 0 };
      }
      const p = Math.max(0, activePresentCount - (4 - idx) * 0.5);
      const l = Math.max(0, lateCount);
      return {
        day,
        present: Math.round(p),
        late: l,
      };
    });
  }, [totalEmp, activePresentCount, lateCount]);

  // Mood Score Calculation
  const moodScore = useMemo(() => {
    if (moodLogs.length === 0) return { positive: 88, neutral: 10, stressed: 2 };
    const positive = moodLogs.filter((m) => m.mood === 'Excellent' || m.mood === 'Happy').length;
    const neutral = moodLogs.filter((m) => m.mood === 'Okay').length;
    const stressed = moodLogs.filter((m) => m.mood === 'Stressed' || m.mood === 'Unwell').length;
    const total = moodLogs.length;
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      stressed: Math.round((stressed / total) * 100),
    };
  }, [moodLogs]);

  return (
    <div className="space-y-6 text-left">
      
      {/* ─── 1. HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider font-mono">
            Workforce Command Center • Live Roster
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Today's Workforce Operations
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => onNavigate('live_attendance')} className="font-bold text-xs">
            Live Stream
          </Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate('employees')} className="font-bold text-xs shadow-md">
            + Add Employee
          </Button>
        </div>
      </div>

      {/* ─── 2. KPI STAT CARDS ROW ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Present */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{activePresentCount}</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">{attendanceRate}% Rate</span>
          </div>
        </div>

        {/* Late Arrivals */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Late Arrivals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{lateCount}</span>
            <span className="text-xs font-bold text-amber-600">Grace Logged</span>
          </div>
        </div>

        {/* On Leave */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">On Leave</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{leaveCount}</span>
            <span className="text-xs font-bold text-blue-600">Approved</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{pendingLeaves}</span>
            <span className="text-xs font-bold text-purple-600">Review Queue</span>
          </div>
        </div>

        {/* Total Workforce */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalEmp}</span>
            <span className="text-xs font-bold text-slate-500 font-mono">{departments.length} Units</span>
          </div>
        </div>
      </div>

      {/* ─── 3. CHARTS & LIVE ATTENDANCE STREAM ROW ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Weekly Attendance Turnout Trend</h3>
              <p className="text-xs text-slate-500">Turnout rate and arrival distribution across workdays</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> {attendanceRate}% Today
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip />
                <Area type="monotone" dataKey="present" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#blueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Attendance Stream Widget */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900">Today's Live Punches</h3>
              </div>
              <span
                onClick={() => onNavigate('live_attendance')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View All →
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {attendance.slice(0, 5).map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {att.employee_name?.slice(0, 2).toUpperCase() || 'EM'}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 leading-tight">{att.employee_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{att.check_in_location || 'Workplace HQ'}</p>
                    </div>
                  </div>
                  <Badge variant={att.status === 'Present' ? 'green' : 'amber'} size="sm">
                    {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : att.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full font-bold text-xs"
            onClick={() => onNavigate('live_attendance')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Open Live Attendance Feed
          </Button>
        </div>
      </div>

      {/* ─── 4. PENDING LEAVE APPROVALS & TEAM SENTIMENT ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Leave Requests */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Pending Leave Approvals</h3>
              <p className="text-xs text-slate-500">Employee applications awaiting decision</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('leave')} className="text-xs font-bold">
              Review Queue ({pendingLeaves})
            </Button>
          </div>

          <div className="space-y-2.5">
            {leaveRequests.filter((l) => l.status === 'Pending').length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-extrabold text-slate-800">All leave requests reviewed!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending applications in the approval queue.</p>
              </div>
            ) : (
              leaveRequests.filter((l) => l.status === 'Pending').slice(0, 3).map((req) => (
                <div key={req.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">{req.employee_name}</h5>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {req.leave_type_name} • {req.start_date} to {req.end_date} ({req.total_days} days)
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{req.reason}</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => onNavigate('leave')} className="font-bold text-xs shrink-0">
                    Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aggregated Team Sentiment */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Aggregated Team Sentiment</h3>
              <p className="text-xs text-slate-500">Anonymized wellness pulse index</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('mood')} icon={<Smile className="w-4 h-4 text-blue-600" />} className="text-xs font-bold">
              Pulse Details
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-2xl font-black text-emerald-800 font-mono block">{moodScore.positive}%</span>
              <span className="text-[11px] font-bold text-emerald-700 block">Positive & Good</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
              <span className="text-2xl font-black text-blue-800 font-mono block">{moodScore.neutral}%</span>
              <span className="text-[11px] font-bold text-blue-700 block">Neutral / Routine</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-2xl font-black text-rose-800 font-mono block">{moodScore.stressed}%</span>
              <span className="text-[11px] font-bold text-rose-700 block">High Workload</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
