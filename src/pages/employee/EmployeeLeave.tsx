import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  CalendarDays, 
  Umbrella, 
  HeartPulse, 
  Coffee, 
  Sparkles, 
  Paperclip, 
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Employee, LeaveRequest } from '../../types/database';

export const EmployeeLeave: React.FC = () => {
  const { profile } = useAuth();
  const { employees, leaveRequests, companyHolidays, submitLeaveRequest } = useData();

  const currentEmp: Employee = useMemo(() => {
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

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('lt_annual');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Live employee requests from Supabase
  const myRequests = useMemo(() => {
    return leaveRequests.filter(
      (l) => l.employee_id === currentEmp.id || l.employee_name?.toLowerCase().includes(currentEmp.first_name.toLowerCase())
    );
  }, [leaveRequests, currentEmp]);

  // Live calculation of balances
  const balances = useMemo(() => {
    const annualUsed = myRequests
      .filter((l) => (l.leave_type_id === 'lt_annual' || l.leave_type_name?.toLowerCase().includes('annual')) && l.status === 'Approved')
      .reduce((acc, curr) => acc + (curr.total_days || 1), 0);

    const sickUsed = myRequests
      .filter((l) => (l.leave_type_id === 'lt_sick' || l.leave_type_name?.toLowerCase().includes('sick')) && l.status === 'Approved')
      .reduce((acc, curr) => acc + (curr.total_days || 1), 0);

    const casualUsed = myRequests
      .filter((l) => (l.leave_type_id === 'lt_casual' || l.leave_type_name?.toLowerCase().includes('casual')) && l.status === 'Approved')
      .reduce((acc, curr) => acc + (curr.total_days || 1), 0);

    return {
      annual: { remaining: Math.max(0, 18 - annualUsed), total: 18 },
      sick: { remaining: Math.max(0, 10 - sickUsed), total: 10 },
      casual: { remaining: Math.max(0, 6 - casualUsed), total: 6 },
    };
  }, [myRequests]);

  // Calculate days between dates
  const calculateDays = () => {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const totalDays = calculateDays();
    const typeName = 
      leaveTypeId === 'lt_annual' ? 'Annual / Vacation Leave' :
      leaveTypeId === 'lt_sick' ? 'Sick & Medical Leave' : 'Casual & Personal Leave';

    await submitLeaveRequest({
      employee_id: currentEmp.id,
      employee_name: `${currentEmp.first_name} ${currentEmp.last_name}`,
      company_id: 'comp_veyra_tn',
      leave_type_id: leaveTypeId,
      leave_type_name: typeName,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason,
    });
    setLoading(false);
    setIsApplyOpen(false);
    setReason('');
  };

  // Live calendar days for August 2026 showing scheduled leaves & holidays
  const leaveCalendarDays = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
      const hasHoliday = companyHolidays.some((h) => h.holiday_date === dateStr);
      const userLeave = myRequests.find((r) => r.start_date <= dateStr && r.end_date >= dateStr);
      const isWeekend = day % 7 === 1 || day % 7 === 2;

      let status: 'Holiday' | 'Approved Leave' | 'Pending Leave' | 'Weekend' | 'Workday' = 'Workday';
      if (isWeekend) status = 'Weekend';
      else if (hasHoliday) status = 'Holiday';
      else if (userLeave) status = userLeave.status === 'Approved' ? 'Approved Leave' : 'Pending Leave';

      return { day, dateStr, status, label: userLeave?.leave_type_name || (hasHoliday ? 'Holiday' : undefined) };
    });
  }, [companyHolidays, myRequests]);

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#090E1A] via-[#111A2E] to-[#16223B] border border-emerald-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-400 border border-white/15 shadow-xs flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">Time-Off & Leave</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">Balances & Schedule</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">Leave Workspace</h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Apply for time-off, view live balances, and track approvals</p>
          </div>
        </div>

        <button
          onClick={() => setIsApplyOpen(true)}
          className="relative z-10 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      {/* ─── 2. THREE LEAVE BALANCE CARDS (LIVE CALCULATIONS) ───────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Annual Leave */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Umbrella className="w-3.5 h-3.5" />
            </span>
            <span className="text-[9px] font-bold text-blue-700 uppercase">Paid</span>
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{balances.annual.remaining}</span>
              <span className="text-[10px] text-slate-400 font-semibold">/ {balances.annual.total}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 block mt-0.5">Annual</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${(balances.annual.remaining / balances.annual.total) * 100}%` }}
              className="bg-blue-600 h-full rounded-full transition-all"
            />
          </div>
        </div>

        {/* Sick Leave */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <HeartPulse className="w-3.5 h-3.5" />
            </span>
            <span className="text-[9px] font-bold text-emerald-700 uppercase">Medical</span>
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{balances.sick.remaining}</span>
              <span className="text-[10px] text-slate-400 font-semibold">/ {balances.sick.total}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 block mt-0.5">Sick</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${(balances.sick.remaining / balances.sick.total) * 100}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all"
            />
          </div>
        </div>

        {/* Casual Leave */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Coffee className="w-3.5 h-3.5" />
            </span>
            <span className="text-[9px] font-bold text-amber-700 uppercase">Personal</span>
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{balances.casual.remaining}</span>
              <span className="text-[10px] text-slate-400 font-semibold">/ {balances.casual.total}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 block mt-0.5">Casual</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${(balances.casual.remaining / balances.casual.total) * 100}%` }}
              className="bg-amber-500 h-full rounded-full transition-all"
            />
          </div>
        </div>
      </div>

      {/* ─── 3. LIVE LEAVE & HOLIDAYS SCHEDULE CALENDAR ────────────────── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Schedule Overview</span>
            <h4 className="text-sm font-extrabold text-slate-900">August 2026 Time-Off Calendar</h4>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Leave</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Holiday</span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase py-1 border-b border-slate-100">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {leaveCalendarDays.map((d) => {
            const isLeave = d.status === 'Approved Leave' || d.status === 'Pending Leave';
            const isHoliday = d.status === 'Holiday';
            const isWeekend = d.status === 'Weekend';

            return (
              <div
                key={d.day}
                className={`p-1.5 rounded-xl flex flex-col items-center justify-between h-10 border transition-all ${
                  isLeave 
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-extrabold'
                    : isHoliday
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-extrabold'
                    : isWeekend
                    ? 'bg-slate-50 border-slate-100 text-slate-400'
                    : 'bg-white border-slate-100 text-slate-700'
                }`}
              >
                <span className="text-xs">{d.day}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isLeave ? 'bg-blue-600' : isHoliday ? 'bg-emerald-600' : 'bg-transparent'
                }`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. RECENT LEAVE APPLICATIONS (LIVE SUPABASE LIST) ─────────── */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Leave Applications History</h3>

        {myRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">No Leave Applications</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You haven't submitted any time-off requests yet. Use the button above when you plan a holiday.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-slate-900 block">{req.leave_type_name}</span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> {req.start_date} to {req.end_date}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                    req.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : req.status === 'Rejected'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Reason:</span>
                  <p className="text-[11px] font-medium text-slate-800 mt-0.5">{req.reason || 'Personal time-off request'}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Duration: <strong className="text-slate-900">{req.total_days} Day{req.total_days > 1 ? 's' : ''}</strong></span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <UserCheck className="w-3.5 h-3.5" /> Approver: HR Operations
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 5. UPCOMING PUBLIC HOLIDAYS (CHRONOLOGICAL & LIVE) ───────────── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Upcoming Public & Corporate Holidays</h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Approved official paid holidays for 2026</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black font-mono border border-blue-200">
            {companyHolidays.filter(h => h.holiday_date >= new Date().toISOString().split('T')[0]).length} Upcoming
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {companyHolidays
            .filter((h) => h.holiday_date >= new Date().toISOString().split('T')[0])
            .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
            .slice(0, 6)
            .map((h) => {
              const holDate = new Date(h.holiday_date);
              const today = new Date(new Date().toISOString().split('T')[0]);
              const diffDays = Math.ceil((holDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const countdown = diffDays === 0 ? 'Today 🎉' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
              const monthName = holDate.toLocaleString('default', { month: 'short' });
              const dayOfWeek = holDate.toLocaleString('default', { weekday: 'short' });

              return (
                <div key={h.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                      <span className="text-[9px] font-black uppercase text-blue-400 leading-none">{monthName}</span>
                      <span className="text-xs font-black text-blue-700 leading-none mt-0.5">{h.holiday_date.split('-')[2]}</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 leading-tight">{h.name}</h5>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {dayOfWeek}, {h.holiday_date} • Official Paid Holiday
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold font-mono">
                      {countdown}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Mandatory
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ─── APPLY LEAVE FULL-FEATURED MODAL ──────────────────────────── */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Submit Time-Off Application"
      >
        <form onSubmit={handleApply} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Leave Category *</label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="lt_annual">Annual Leave ({balances.annual.remaining} Days Available)</option>
              <option value="lt_sick">Sick / Medical Leave ({balances.sick.remaining} Days Available)</option>
              <option value="lt_casual">Casual / Personal Leave ({balances.casual.remaining} Days Available)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">From Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">To Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span>Half Day Request</span>
            </label>
            <span className="text-xs font-extrabold text-blue-600 font-mono">
              Total Duration: {calculateDays()} Day{calculateDays() > 1 ? 's' : ''}
            </span>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a brief explanation for management review..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="font-bold shadow-xs">
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
