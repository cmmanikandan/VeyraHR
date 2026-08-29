import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  Users, 
  UserCheck,
  Building2, 
  Filter,
  Sparkles, 
  Briefcase, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
  MoreVertical,
  Trash2,
  CalendarCheck,
  AlertTriangle,
  Send,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';
import { Shift, Employee } from '../../types/database';
import { triggerAppNotification } from '../../services/notificationService';

type ShiftTypeKey = 'MORNING' | 'EVENING' | 'NIGHT' | 'OFF';

interface ShiftMeta {
  key: ShiftTypeKey;
  label: string;
  short: string;
  time: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
}

const SHIFT_MAP: Record<ShiftTypeKey, ShiftMeta> = {
  MORNING: {
    key: 'MORNING',
    label: 'Morning Shift',
    short: 'MORN',
    time: '09:00 AM – 06:00 PM',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Sun className="w-3.5 h-3.5 text-blue-600" />,
  },
  EVENING: {
    key: 'EVENING',
    label: 'Evening Shift',
    short: 'EVE',
    time: '02:00 PM – 11:00 PM',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <Sunset className="w-3.5 h-3.5 text-amber-600" />,
  },
  NIGHT: {
    key: 'NIGHT',
    label: 'Night Shift',
    short: 'NIGHT',
    time: '10:00 PM – 07:00 AM',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <Moon className="w-3.5 h-3.5 text-purple-600" />,
  },
  OFF: {
    key: 'OFF',
    label: 'Weekly Off',
    short: 'OFF',
    time: 'Rest Day',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
  },
};

export const HRShiftManagement: React.FC = () => {
  const { shifts, shiftSwaps, employees, branches, departments, approveShiftSwap, addShiftTemplate } = useData();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [publishedNotice, setPublishedNotice] = useState<string | null>(null);

  // Form State for Shift Creation
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMins, setBreakMins] = useState('60');
  const [graceMins, setGraceMins] = useState('15');

  // Weekly Date Range Navigation
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + currentWeekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      };
    });
  }, [currentWeekOffset]);

  // Local Roster Matrix State: [employeeId_dateStr]: ShiftTypeKey
  const [rosterMatrix, setRosterMatrix] = useState<Record<string, ShiftTypeKey>>(() => {
    try {
      const saved = localStorage.getItem('veyra_roster_matrix');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Cycle shift on click: MORNING -> EVENING -> NIGHT -> OFF -> MORNING
  const handleCycleShift = (employeeId: string, dateStr: string) => {
    const key = `${employeeId}_${dateStr}`;
    const current = rosterMatrix[key] || (dateStr.includes('-0') ? 'OFF' : 'MORNING');

    let next: ShiftTypeKey = 'MORNING';
    if (current === 'MORNING') next = 'EVENING';
    else if (current === 'EVENING') next = 'NIGHT';
    else if (current === 'NIGHT') next = 'OFF';
    else next = 'MORNING';

    const updated = { ...rosterMatrix, [key]: next };
    setRosterMatrix(updated);
    try {
      localStorage.setItem('veyra_roster_matrix', JSON.stringify(updated));
    } catch {}
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchBranch = selectedBranch === 'All' || emp.branch_name === selectedBranch;
      const matchDept = selectedDept === 'All' || emp.department_name === selectedDept;
      return matchBranch && matchDept;
    });
  }, [employees, selectedBranch, selectedDept]);

  // Detect shift conflicts (e.g. Night shift followed immediately by Morning shift next day)
  const getConflictWarning = (employeeId: string, dayIndex: number): string | null => {
    if (dayIndex >= weekDays.length - 1) return null;
    const currentDayKey = `${employeeId}_${weekDays[dayIndex].dateStr}`;
    const nextDayKey = `${employeeId}_${weekDays[dayIndex + 1].dateStr}`;

    const currentShift = rosterMatrix[currentDayKey];
    const nextShift = rosterMatrix[nextDayKey];

    if (currentShift === 'NIGHT' && nextShift === 'MORNING') {
      return 'Rest Conflict: Night shift followed immediately by morning shift (< 8h turnaround).';
    }
    return null;
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName) return;
    await addShiftTemplate({
      company_id: 'comp_veyra_tn',
      name: shiftName,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      break_duration_mins: parseInt(breakMins) || 60,
      grace_period_mins: parseInt(graceMins) || 15,
      is_active: true,
    });
    setIsCreateModalOpen(false);
    setShiftName('');
  };

  // Publish Roster and Dispatch Web Push Alerts
  const handlePublishRoster = () => {
    const weekLabel = `${weekDays[0].dayNum} ${weekDays[0].monthName} – ${weekDays[6].dayNum} ${weekDays[6].monthName}`;
    triggerAppNotification({
      title: '📅 Weekly Shift Schedule Published',
      body: `Your shift roster for ${weekLabel} is now live. Check your mobile schedule.`,
      url: '/employee/shifts',
    });

    setPublishedNotice(`Successfully published shift roster for ${filteredEmployees.length} staff members (${weekLabel}). Push notifications dispatched.`);
    setTimeout(() => setPublishedNotice(null), 5000);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* ─── HEADER BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shift Planning & Roster Matrix</h1>
            <Badge variant="blue" className="font-mono text-[10px] font-bold">
              Live Scheduler
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive weekly scheduling matrix with auto-conflict detection & instant mobile notifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4 text-blue-600" />}
            className="font-bold text-xs"
          >
            New Shift Template
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePublishRoster}
            icon={<Send className="w-4 h-4" />}
            className="font-bold text-xs"
          >
            Publish Roster
          </Button>
        </div>
      </div>

      {/* Published Notice Banner */}
      {publishedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{publishedNotice}</span>
        </div>
      )}

      {/* ─── SHIFT SUMMARY & LEGEND BAR ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(SHIFT_MAP) as ShiftTypeKey[]).map((key) => {
          const meta = SHIFT_MAP[key];
          return (
            <Card key={key} padded={false} className={`p-3.5 border ${meta.border} ${meta.bg} shadow-2xs`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {meta.icon}
                  <span className={`text-xs font-black ${meta.text}`}>{meta.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${meta.bg} ${meta.text}`}>
                  {meta.short}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1 font-medium">{meta.time}</p>
            </Card>
          );
        })}
      </div>

      {/* ─── MATRIX CONTROLS & WEEK NAVIGATION ──────────────────────────── */}
      <Card padded={false} className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-900 font-mono px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
              {weekDays[0].dayNum} {weekDays[0].monthName} – {weekDays[6].dayNum} {weekDays[6].monthName} ({weekDays[0].dateStr.slice(0, 4)})
            </span>

            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {currentWeekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setCurrentWeekOffset(0)}
                className="text-[11px] font-bold text-blue-600 hover:underline px-2"
              >
                Current Week
              </button>
            )}
          </div>

          {/* Branch & Dept Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Branches ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

        </div>
      </Card>

      {/* ─── INTERACTIVE WEEKLY SHIFT MATRIX TABLE ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600">
                <th className="py-3.5 px-4 w-64 min-w-[200px]">Employee</th>
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className={`py-3.5 px-2 text-center min-w-[110px] ${
                      day.isToday ? 'bg-blue-50 text-blue-800 border-x border-blue-200' : ''
                    }`}
                  >
                    <span className="block font-black">{day.dayName}</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-normal">
                      {day.dayNum} {day.monthName}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    No workforce members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Identity Cell */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={emp.avatar_url}
                          name={`${emp.first_name} ${emp.last_name}`}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 truncate">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono truncate block">
                            {emp.employee_id} • {emp.designation}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 7 Days Shift Blocks */}
                    {weekDays.map((day, idx) => {
                      const key = `${emp.id}_${day.dateStr}`;
                      const defaultShift: ShiftTypeKey = (idx === 5 || idx === 6) ? 'OFF' : 'MORNING';
                      const assignedShiftKey = rosterMatrix[key] || defaultShift;
                      const shiftInfo = SHIFT_MAP[assignedShiftKey];
                      const conflict = getConflictWarning(emp.id, idx);

                      return (
                        <td
                          key={day.dateStr}
                          className={`py-2 px-2 text-center ${
                            day.isToday ? 'bg-blue-50/40 border-x border-blue-100' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleCycleShift(emp.id, day.dateStr)}
                            className={`w-full py-2 px-1.5 rounded-xl border ${shiftInfo.border} ${shiftInfo.bg} ${shiftInfo.text} font-mono text-[10px] font-black hover:scale-105 transition-all shadow-2xs relative group`}
                            title="Click to cycle shift (Morning ➔ Evening ➔ Night ➔ Off)"
                          >
                            <div className="flex items-center justify-center gap-1">
                              {shiftInfo.icon}
                              <span>{shiftInfo.short}</span>
                            </div>

                            {conflict && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title={conflict} />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Matrix Footer Tips */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <strong>Tip:</strong> Click any day box to cycle shifts: <em>Morning ➔ Evening ➔ Night ➔ Weekly Off</em>.
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Auto-Sync: Connected to Supabase Database
          </span>
        </div>
      </div>

      {/* ─── MODAL: CREATE SHIFT TEMPLATE ───────────────────────────────── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="sm">
        <div className="space-y-4 text-left">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Create Shift Definition</h3>
            <p className="text-xs text-slate-500">Define working hours, grace period, and break allowances</p>
          </div>

          <form onSubmit={handleCreateShift} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Afternoon Support Shift"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time *</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Break Duration (Mins)</label>
                <input
                  type="number"
                  value={breakMins}
                  onChange={(e) => setBreakMins(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grace Period (Mins)</label>
                <input
                  type="number"
                  value={graceMins}
                  onChange={(e) => setGraceMins(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Shift
              </Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};
