import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  User,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  Check,
  Building2,
  Sparkles,
  ShieldCheck,
  History,
  FileText,
  Plus,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { LeaveRequest, CompanyHoliday } from '../../types/database';

const STATUS_TABS = ['Pending Review', 'Leave History', 'Holiday & Operations Calendar', 'All Records'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const LEAVE_TYPE_COLORS: Record<string, string> = {
  'Sick Leave': 'bg-rose-50 border-rose-200 text-rose-700',
  'Casual Leave': 'bg-blue-50 border-blue-200 text-blue-700',
  'Earned Leave': 'bg-purple-50 border-purple-200 text-purple-700',
  'Maternity Leave': 'bg-pink-50 border-pink-200 text-pink-700',
  'Paternity Leave': 'bg-teal-50 border-teal-200 text-teal-700',
};

export const HRLeaveManagement: React.FC = () => {
  const { leaveRequests, updateLeaveStatus, employees, companyHolidays, createCompanyHoliday, deleteCompanyHoliday } = useData();

  const [activeTab, setActiveTab] = useState<StatusTab>('Pending Review');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Approved' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Holiday Calendar view state
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHolOptional, setNewHolOptional] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolName.trim() || !newHolDate) return;
    setAddingHoliday(true);
    await createCompanyHoliday({
      name: newHolName.trim(),
      holiday_date: newHolDate,
      is_optional: newHolOptional,
    });
    setAddingHoliday(false);
    setNewHolName('');
    setIsAddHolidayOpen(false);
  };

  // HR Calendar matrix
  const hrCalendarMatrix = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthPadded = String(calMonth + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateStr = `${calYear}-${monthPadded}-${dayPadded}`;
      const dateObj = new Date(calYear, calMonth, d);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      const hol = companyHolidays.find((h) => h.holiday_date === dateStr);
      const approvedLeavesOnDate = leaveRequests.filter(
        (l) => l.status === 'Approved' && dateStr >= l.start_date && dateStr <= l.end_date
      );

      days.push({
        day: d,
        dateStr,
        isWeekend,
        holiday: hol,
        leaves: approvedLeavesOnDate,
      });
    }

    return days;
  }, [calYear, calMonth, companyHolidays, leaveRequests]);

  // Stats
  const pendingRequests = useMemo(() => leaveRequests.filter((r) => r.status === 'Pending'), [leaveRequests]);
  const approvedRequests = useMemo(() => leaveRequests.filter((r) => r.status === 'Approved'), [leaveRequests]);
  const rejectedRequests = useMemo(() => leaveRequests.filter((r) => r.status === 'Rejected'), [leaveRequests]);
  const totalDaysPending = useMemo(() => pendingRequests.reduce((a, r) => a + (r.total_days || 0), 0), [pendingRequests]);

  // Tab Filtering
  const displayedRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      let matchesTab = true;
      if (activeTab === 'Pending Review') {
        matchesTab = r.status === 'Pending';
      } else if (activeTab === 'Leave History') {
        matchesTab = r.status !== 'Pending';
        if (historyFilter !== 'All') {
          matchesTab = r.status === historyFilter;
        }
      }

      const matchesSearch = !search || 
        `${r.employee_name} ${r.leave_type_name} ${r.reason}`.toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [leaveRequests, activeTab, historyFilter, search]);

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    if (!selectedReq) return;
    setSubmitting(true);
    await updateLeaveStatus(selectedReq.id, status, comment);
    setSubmitting(false);
    setSelectedReq(null);
    setComment('');
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const timeAgo = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const h = Math.floor(diff / 3600000);
      if (h < 1) return 'Just now';
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* ─── 1. HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Leave Approvals & Workflow</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review pending leave requests in table view with pop-up approval inspection
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const headers = 'Employee Name,Leave Type,Start Date,End Date,Total Days,Reason,Status,Created At\n';
            const rows = leaveRequests.map((l) => 
              `"${l.employee_name}","${l.leave_type_name}","${l.start_date}","${l.end_date}","${l.total_days}","${(l.reason || '').replace(/"/g, '""')}","${l.status}","${l.created_at}"`
            ).join('\n');
            const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `VeyraHR_Leave_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          📊 Export All Leaves CSV
        </Button>
      </div>

      {/* ─── 2. KPI SUMMARY CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: pendingRequests.length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { label: 'Approved Leaves', value: approvedRequests.length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
          { label: 'Rejected Leaves', value: rejectedRequests.length, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: <XCircle className="w-4 h-4 text-rose-500" /> },
          { label: 'Total Pending Days', value: totalDaysPending, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: <CalendarDays className="w-4 h-4 text-blue-500" /> },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl border ${s.bg} bg-white space-y-1 shadow-xs`}>
            <div className="flex items-center gap-1.5">
              {s.icon}
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</span>
            </div>
            <span className={`text-2xl sm:text-3xl font-black block font-mono ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ─── 3. TAB CONTROLS & SEARCH BAR ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        
        {/* Main Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const count = tab === 'Pending Review' 
              ? pendingRequests.length 
              : tab === 'Leave History' 
              ? approvedRequests.length + rejectedRequests.length 
              : leaveRequests.length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'Leave History' && <History className="w-3.5 h-3.5" />}
                <span>{tab}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === tab ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & History Sub-filter */}
        <div className="flex items-center gap-2">
          {activeTab === 'Leave History' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['All', 'Approved', 'Rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
                    historyFilter === f ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, leave type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. TAB CONTENT: EITHER HOLIDAY CALENDAR OR LEAVE APPLICATIONS TABLE ─── */}
      {activeTab === 'Holiday & Operations Calendar' ? (
        <div className="space-y-6">
          {/* Header & Month Navigator */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevCalMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <h3 className="text-base font-extrabold text-slate-900">
                  {monthNames[calMonth]} {calYear}
                </h3>
                <button
                  onClick={handleNextCalMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddHolidayOpen(true)}
                  className="font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Company Holiday
                </Button>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Company Holiday</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Approved Staff Leave</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Weekend (Off)</span>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase py-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Matrix Grid */}
            <div className="grid grid-cols-7 gap-2">
              {hrCalendarMatrix.map((d, index) => {
                if (!d) {
                  return <div key={`empty_${index}`} className="min-h-[70px] rounded-2xl bg-transparent" />;
                }

                const isHoliday = !!d.holiday;
                const hasLeaves = d.leaves.length > 0;
                const isWeekend = d.isWeekend;

                return (
                  <div
                    key={d.day}
                    className={`p-2 rounded-2xl flex flex-col justify-between min-h-[70px] border transition-all ${
                      isHoliday
                        ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-2xs'
                        : hasLeaves
                        ? 'bg-blue-50 border-blue-200 text-blue-950 shadow-2xs'
                        : isWeekend
                        ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{d.day}</span>
                      {isHoliday && <span className="w-2 h-2 rounded-full bg-purple-600 ring-2 ring-purple-300" />}
                      {!isHoliday && hasLeaves && <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-300" />}
                    </div>

                    {isHoliday && (
                      <span className="text-[9px] font-black text-purple-900 bg-purple-200/70 px-1 py-0.5 rounded truncate block mt-1" title={d.holiday?.name}>
                        🎉 {d.holiday?.name}
                      </span>
                    )}

                    {!isHoliday && hasLeaves && (
                      <span className="text-[9px] font-bold text-blue-900 bg-blue-200/70 px-1 py-0.5 rounded truncate block mt-1">
                        {d.leaves.length} Staff on Leave
                      </span>
                    )}

                    {!isHoliday && !hasLeaves && isWeekend && (
                      <span className="text-[9px] font-medium text-slate-400 block mt-1">Weekend</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Holidays Table / List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Official Company Holidays Schedule ({companyHolidays.length})</h4>
                <p className="text-xs text-slate-400">These non-working dates are synchronized with all employee attendance calendars.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddHolidayOpen(true)}
                className="font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Holiday
              </Button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {companyHolidays.map((hol) => (
                <div key={hol.id} className="p-3.5 hover:bg-slate-50/80 flex items-center justify-between gap-3 text-xs transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold shrink-0">
                      🎉
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">{hol.name}</h5>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {new Date(hol.holiday_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                      {hol.is_optional ? 'Optional Holiday' : 'Mandatory Off'}
                    </span>
                    <button
                      onClick={() => deleteCompanyHoliday(hol.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* STRUCTURED LEAVE APPLICATIONS TABLE */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Leave Type</th>
                  <th className="py-3 px-3">Duration & Dates</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Applied</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-extrabold text-slate-800">No leave requests found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {activeTab === 'Pending Review' ? 'All caught up! No pending applications.' : 'No records match your search filter.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedRequests.map((req) => {
                    const ltStyle = LEAVE_TYPE_COLORS[req.leave_type_name ?? ''] || 'bg-slate-100 text-slate-700 border-slate-200';
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Employee Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {req.employee_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block leading-tight">{req.employee_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">EMP-LEAVE-{req.id.slice(-4)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Leave Type Badge */}
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${ltStyle}`}>
                            {req.leave_type_name}
                          </span>
                        </td>

                        {/* Duration & Date Range */}
                        <td className="py-3.5 px-3">
                          <span className="font-extrabold text-slate-900 block">
                            {req.total_days} Day{req.total_days !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(req.start_date)} – {formatDate(req.end_date)}
                          </span>
                        </td>

                        {/* Reason / Notes */}
                        <td className="py-3.5 px-3 max-w-[200px]">
                          <p className="truncate text-slate-600 font-medium" title={req.reason}>
                            {req.reason || '—'}
                          </p>
                        </td>

                        {/* Applied Time */}
                        <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                          {timeAgo(req.created_at)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <Badge
                            variant={req.status === 'Approved' ? 'green' : req.status === 'Pending' ? 'amber' : 'red'}
                            size="sm"
                          >
                            {req.status}
                          </Badge>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-extrabold text-xs transition-all border border-blue-200/80 shadow-2xs"
                          >
                            Review & Decide →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 5. LEAVE REQUEST DETAIL & DECISION POP-UP MODAL ──────────── */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title="Leave Application Inspection"
          description={`Review request details submitted by ${selectedReq.employee_name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            
            {/* Employee Profile Header in Modal */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-md">
                  {selectedReq.employee_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{selectedReq.employee_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">Applied {timeAgo(selectedReq.created_at)}</p>
                </div>
              </div>

              <Badge
                variant={selectedReq.status === 'Approved' ? 'green' : selectedReq.status === 'Pending' ? 'amber' : 'red'}
                size="md"
              >
                {selectedReq.status}
              </Badge>
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave Category</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedReq.leave_type_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                <span className="font-extrabold text-blue-700 font-mono mt-0.5 block">
                  {selectedReq.total_days} Day{selectedReq.total_days !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">{formatDate(selectedReq.start_date)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">End Date</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">{formatDate(selectedReq.end_date)}</span>
              </div>
            </div>

            {/* Employee's Stated Reason */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Reason / Handover Plan</span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {selectedReq.reason || 'No specific notes provided.'}
              </p>
            </div>

            {/* HR Decision / Comment input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                HR Manager Feedback / Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Approved — please ensure all tasks are handed over to the team."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons: Accept / Reject */}
            {selectedReq.status === 'Pending' ? (
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={() => handleAction('Rejected')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold hover:bg-rose-100 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <XCircle className="w-4 h-4 text-rose-600" /> Reject Request
                </button>
                <button
                  onClick={() => handleAction('Approved')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" /> Accept & Approve Leave
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-2xl text-center text-xs font-bold text-slate-600">
                Decision already recorded: <span className="font-extrabold text-slate-900">{selectedReq.status}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ─── 6. ADD COMPANY HOLIDAY MODAL ─────────────────────────────── */}
      {isAddHolidayOpen && (
        <Modal
          isOpen={isAddHolidayOpen}
          onClose={() => setIsAddHolidayOpen(false)}
          title="Add Official Company Holiday"
          description="Create a non-working company holiday that syncs to all employee attendance calendars."
          maxWidth="sm"
        >
          <form onSubmit={handleCreateHoliday} className="space-y-4 text-left p-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Tamil New Year / Diwali Festival"
                value={newHolName}
                onChange={(e) => setNewHolName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Date *</label>
              <input
                type="date"
                required
                value={newHolDate}
                onChange={(e) => setNewHolDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Optional / Floating Holiday</span>
                <span className="text-[10px] text-slate-400">If enabled, employees can choose to work or take off.</span>
              </div>
              <input
                type="checkbox"
                checked={newHolOptional}
                onChange={(e) => setNewHolOptional(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-bold"
                onClick={() => setIsAddHolidayOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={addingHoliday}
                className="flex-1 font-bold shadow-md"
              >
                {addingHoliday ? 'Adding Holiday...' : 'Save & Publish Holiday'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
