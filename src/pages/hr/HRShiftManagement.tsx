import React, { useState } from 'react';
import { Calendar, Clock, Plus, ArrowLeftRight, CheckCircle2, XCircle, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';

export const HRShiftManagement: React.FC = () => {
  const { shifts, shiftSwaps, employees, approveShiftSwap, addShiftTemplate } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMins, setBreakMins] = useState('60');
  const [graceMins, setGraceMins] = useState('15');

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName) return;
    await addShiftTemplate({
      company_id: 'comp_veyra_tn',
      name: shiftName,
      start_time: startTime,
      end_time: endTime,
      break_duration_mins: parseInt(breakMins) || 60,
      grace_period_mins: parseInt(graceMins) || 15,
      is_active: true,
    });
    setIsModalOpen(false);
    setShiftName('');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-veyra-text tracking-tight">Shift Planning & Swaps</h2>
          <p className="text-xs text-veyra-text-sub">Manage workforce schedules, shift definitions & peer swap approvals</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="font-bold shadow-xs"
        >
          Create Shift Template
        </Button>
      </div>

      {/* SHIFT DEFINITIONS GRID */}
      <div>
        <h3 className="text-xs font-bold text-veyra-text uppercase tracking-wider mb-3">Active Shift Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shifts.map((s) => (
            <Card key={s.id} padded={false} className="p-4 bg-white border-veyra-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-veyra-text">{s.name}</h4>
                <Badge variant="blue" size="sm">Active</Badge>
              </div>
              <p className="text-sm font-extrabold text-veyra-blue">
                {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
              </p>
              <div className="text-[11px] text-veyra-text-sub flex justify-between pt-1 border-t border-veyra-border/40">
                <span>Break: {s.break_duration_mins}m</span>
                <span>Grace: {s.grace_period_mins}m</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SHIFT SWAP REQUESTS */}
      <div>
        <h3 className="text-xs font-bold text-veyra-text uppercase tracking-wider mb-3">Pending Shift Swap Approvals</h3>
        {shiftSwaps.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-xs text-veyra-text-sub">No pending shift swap requests.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {shiftSwaps.map((sw) => {
              const reqEmp = employees.find((e) => e.id === sw.requester_id);
              const targetEmp = employees.find((e) => e.id === sw.target_employee_id);
              return (
                <Card key={sw.id} padded={false} className="p-4 bg-white border-veyra-border flex items-center justify-between shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-veyra-text">
                        {reqEmp?.first_name} {reqEmp?.last_name} ↔ {targetEmp?.first_name} {targetEmp?.last_name}
                      </span>
                      <Badge variant="purple" size="sm">
                        Swap Request
                      </Badge>
                    </div>
                    <p className="text-xs text-veyra-text-sub">
                      Swap Date: <strong>{sw.swap_date}</strong> • Reason: {sw.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => approveShiftSwap(sw.id, 'hr', 'Rejected')}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => approveShiftSwap(sw.id, 'hr', 'Approved')}
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

      {/* CREATE SHIFT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Shift Template">
        <form onSubmit={handleCreateShift} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-veyra-text mb-1">Shift Name *</label>
            <input
              type="text"
              placeholder="e.g. General Morning Shift"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">End Time *</label>
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
              <label className="block text-xs font-bold text-veyra-text mb-1">Break Duration (Mins)</label>
              <input
                type="number"
                value={breakMins}
                onChange={(e) => setBreakMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">Check-in Grace (Mins)</label>
              <input
                type="number"
                value={graceMins}
                onChange={(e) => setGraceMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Shift
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
