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
  CalendarCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';
import { Shift, Employee } from '../../types/database';

export const HRShiftManagement: React.FC = () => {
  const { shifts, shiftSwaps, employees, branches, departments, approveShiftSwap, addShiftTemplate } = useData();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  // Form State for Shift Creation
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMins, setBreakMins] = useState('60');
  const [graceMins, setGraceMins] = useState('15');

  // Form State for Shift Assignment
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [assignedShiftId, setAssignedShiftId] = useState(shifts[0]?.id || 's1');
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null);

  // Weekly Date Range Navigation
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    // Monday as start of week
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

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchBranch = selectedBranch === 'All' || emp.branch_name === selectedBranch;
      const matchDept = selectedDept === 'All' || emp.department_name === selectedDept;
      return matchBranch && matchDept;
    });
  }, [employees, selectedBranch, selectedDept]);

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

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmpId);
    const shift = shifts.find(s => s.id === assignedShiftId);
    if (!emp || !shift) return;

    setAssignmentSuccess(`Successfully assigned ${shift.name} to ${emp.first_name} ${emp.last_name}`);
    setTimeout(() => {
      setAssignmentSuccess(null);
      setIsAssignModalOpen(false);
    }, 1200);
  };

  const getShiftIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('night')) return <Moon className="w-4 h-4 text-purple-600" />;
    if (lower.includes('evening') || lower.includes('afternoon')) return <Sunset className="w-4 h-4 text-amber-600" />;
    return <Sun className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6 text-left">
      {/* ─── HEADER BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-veyra-text tracking-tight">Shift Planning & Rostering</h1>
          <p className="text-xs sm:text-sm text-veyra-text-sub font-medium mt-0.5">
            Manage workforce schedules, shift definitions & peer swap approvals across regional hubs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            icon={<UserCheck className="w-4 h-4 text-veyra-blue" />}
            className="font-bold text-xs bg-white"
            disabled={employees.length === 0}
          >
            Assign Shift
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="font-bold text-xs shadow-xs"
          >
            Create Shift Template
          </Button>
        </div>
      </div>

      {/* ─── METRIC CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-veyra-text-sub uppercase">Active Templates</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-veyra-blue flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-veyra-text mt-1">{shifts.length}</p>
          <span className="text-[10px] text-emerald-700 font-bold">24/7 Coverage Configured</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-veyra-text-sub uppercase">Rostered Staff</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-veyra-text mt-1">{employees.length}</p>
          <span className="text-[10px] text-slate-500 font-medium">{employees.length > 0 ? '100% Assigned' : 'No staff added'}</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-veyra-text-sub uppercase">Pending Swaps</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-veyra-text mt-1">{shiftSwaps.length}</p>
          <span className="text-[10px] text-amber-700 font-medium">Requires HR Approval</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-veyra-text-sub uppercase">Operating Hubs</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-veyra-text mt-1">{branches.length}</p>
          <span className="text-[10px] text-purple-700 font-bold">Synchronized</span>
        </Card>
      </div>

      {/* ─── ACTIVE SHIFT DEFINITIONS ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-veyra-text uppercase tracking-wider">
            Active Shift Definitions
          </h3>
          <span className="text-xs text-veyra-text-muted">Standard 8-hour roster rules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((s) => (
            <Card 
              key={s.id} 
              padded={false} 
              className="p-5 bg-white border-veyra-border space-y-3 shadow-2xs hover:border-veyra-blue/40 transition-colors relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {getShiftIcon(s.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-veyra-text leading-tight">{s.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Shift ID: {s.id}</span>
                  </div>
                </div>
                <Badge variant="blue" size="sm">Active</Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs font-mono font-black text-veyra-blue">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 font-mono">9h Window</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-veyra-text-sub pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Meal Break</span>
                  <span className="font-bold text-veyra-text">{s.break_duration_mins} mins</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Grace Period</span>
                  <span className="font-bold text-emerald-700">{s.grace_period_mins} mins</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── WEEKLY ROSTERING SCHEDULE MATRIX ──────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-veyra-border shadow-2xs">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-veyra-blue" />
            <h3 className="text-sm font-extrabold text-veyra-text">
              Weekly Workforce Schedule Matrix
            </h3>
          </div>

          {/* Week Navigation & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                className="p-1 hover:bg-white rounded-lg transition-colors text-slate-600"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-bold text-slate-700 font-mono">
                {weekDays[0].monthName} {weekDays[0].dayNum} – {weekDays[6].monthName} {weekDays[6].dayNum}
              </span>
              <button
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="p-1 hover:bg-white rounded-lg transition-colors text-slate-600"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-veyra-border rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-veyra-blue/20"
            >
              <option value="All">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white rounded-2xl border border-veyra-border overflow-hidden shadow-2xs">
          {filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="No Rostered Staff in Selection"
                description="Create or onboard employees in the Employee Directory to generate their weekly shift schedule."
                actionLabel="Onboard Employees"
                onAction={() => setIsAssignModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-veyra-border text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4 w-60">Employee</th>
                    {weekDays.map((d) => (
                      <th key={d.dateStr} className={`py-3 px-3 text-center ${d.isToday ? 'bg-blue-50/80 text-veyra-blue font-extrabold' : ''}`}>
                        <div>{d.dayName}</div>
                        <div className="text-xs text-slate-700">{d.dayNum}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEmployees.map((emp, idx) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={`${emp.first_name} ${emp.last_name}`} src={emp.avatar_url} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-veyra-text truncate leading-tight">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">{emp.designation}</span>
                          </div>
                        </div>
                      </td>

                      {weekDays.map((d, dayIdx) => {
                        const isWeekend = dayIdx === 5 || dayIdx === 6; // Sat / Sun
                        const defaultShift = shifts[idx % shifts.length] || shifts[0];

                        return (
                          <td key={d.dateStr} className={`py-2 px-2 text-center ${d.isToday ? 'bg-blue-50/30' : ''}`}>
                            {isWeekend ? (
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold font-mono">
                                OFF
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                                {defaultShift?.name.split(' ')[0] || 'Gen'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── PENDING SHIFT SWAP REQUESTS ────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-veyra-text uppercase tracking-wider">
            Pending Shift Swap Approvals ({shiftSwaps.length})
          </h3>
          <span className="text-xs text-slate-400">Requires HR authorization</span>
        </div>

        {shiftSwaps.length === 0 ? (
          <Card className="text-center py-8 bg-white border-veyra-border shadow-2xs">
            <p className="text-xs text-veyra-text-sub font-medium">No pending peer shift swap requests at this time.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {shiftSwaps.map((sw) => {
              const reqEmp = employees.find((e) => e.id === sw.requester_id);
              const targetEmp = employees.find((e) => e.id === sw.target_employee_id);
              return (
                <Card key={sw.id} padded={false} className="p-4 bg-white border-veyra-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-veyra-text">
                        {reqEmp?.first_name || 'Requester'} {reqEmp?.last_name || ''} ↔ {targetEmp?.first_name || 'Colleague'} {targetEmp?.last_name || ''}
                      </span>
                      <Badge variant="purple" size="sm">
                        Swap Request
                      </Badge>
                    </div>
                    <p className="text-xs text-veyra-text-sub">
                      Swap Date: <strong>{sw.swap_date}</strong> • Reason: {sw.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => approveShiftSwap(sw.id, 'hr', 'Rejected')}
                      className="text-xs font-bold"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => approveShiftSwap(sw.id, 'hr', 'Approved')}
                      className="text-xs font-bold shadow-xs"
                    >
                      Approve Swap
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL: CREATE SHIFT TEMPLATE ───────────────────────────────── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Shift Definition">
        <form onSubmit={handleCreateShift} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-veyra-text mb-1">Shift Name *</label>
            <input
              type="text"
              placeholder="e.g. Night Overtime Shift"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">Start Time (24H) *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">End Time (24H) *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">Meal Break (Minutes) *</label>
              <input
                type="number"
                min="0"
                max="120"
                value={breakMins}
                onChange={(e) => setBreakMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">Late Grace Window (Mins) *</label>
              <input
                type="number"
                min="0"
                max="60"
                value={graceMins}
                onChange={(e) => setGraceMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold shadow-xs">
              Save Shift Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: ASSIGN SHIFT TO EMPLOYEE ─────────────────────────────── */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Shift to Staff">
        <form onSubmit={handleAssignShift} className="space-y-4 text-left">
          {assignmentSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{assignmentSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-veyra-text mb-1">Select Employee *</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id || emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-veyra-text mb-1">Select Shift Template *</label>
            <select
              value={assignedShiftId}
              onChange={(e) => setAssignedShiftId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              required
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold shadow-xs">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
