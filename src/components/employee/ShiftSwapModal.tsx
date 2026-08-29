import React, { useState } from 'react';
import { ArrowLeftRight, UserCheck, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useData } from '../../context/DataContext';

interface ShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmployeeId: string;
}

export const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({
  isOpen,
  onClose,
  currentEmployeeId,
}) => {
  const { employees, shifts, requestShiftSwap } = useData();
  const [targetEmpId, setTargetEmpId] = useState('');
  const [targetShiftId, setTargetShiftId] = useState('s2');
  const [swapDate, setSwapDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const colleagueOptions = employees.filter((e) => e.id !== currentEmployeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmpId) return;

    setLoading(true);
    await requestShiftSwap({
      requester_id: currentEmployeeId,
      target_employee_id: targetEmpId,
      requester_shift_id: 's1',
      target_shift_id: targetShiftId,
      swap_date: swapDate,
      reason,
    });
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center mb-5">
        <div className="w-11 h-11 rounded-2xl bg-veyra-blue-soft text-veyra-blue flex items-center justify-center mx-auto mb-2 border border-veyra-blue-border/40">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-veyra-text tracking-tight">Request Shift Swap</h3>
        <p className="text-xs text-veyra-text-sub mt-0.5">
          Propose a shift exchange with a colleague for HR approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-veyra-text mb-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-veyra-blue" /> Select Colleague
          </label>
          <select
            value={targetEmpId}
            onChange={(e) => setTargetEmpId(e.target.value)}
            className="w-full rounded-xl border border-veyra-border bg-white px-3.5 py-2.5 text-xs text-veyra-text focus:ring-2 focus:ring-veyra-blue/20"
            required
          >
            <option value="">-- Choose Colleague --</option>
            {colleagueOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name} ({e.designation})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Swap Date"
            type="date"
            value={swapDate}
            onChange={(e) => setSwapDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-veyra-text mb-1">Desired Shift</label>
            <select
              value={targetShiftId}
              onChange={(e) => setTargetShiftId(e.target.value)}
              className="w-full rounded-xl border border-veyra-border bg-white px-3 py-2.5 text-xs text-veyra-text"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Reason for Swap"
          placeholder="e.g. Doctor appointment conflict..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
          Submit Swap Request
        </Button>
      </form>
    </Modal>
  );
};
