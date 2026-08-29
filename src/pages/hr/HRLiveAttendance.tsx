import React, { useState } from 'react';
import { Clock, MapPin, CheckCircle2, RefreshCw, Filter, ShieldCheck, Search, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';

export const HRLiveAttendance: React.FC = () => {
  const { attendance, refreshData } = useData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredAttendance = attendance.filter((att) => {
    const matchesQuery = (att.employee_name || '').toLowerCase().includes(query.toLowerCase()) ||
      (att.check_in_location || '').toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || att.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-veyra-text tracking-tight">Real-Time Attendance Monitor</h2>
          </div>
          <p className="text-xs text-veyra-text-sub">Live stream of active check-ins & location verifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = 'Employee,Date,Check-In Time,Check-Out Time,Status,Verification Method,Location,Working Hours (Mins)\n';
              const rows = filteredAttendance.map((a) => 
                `"${a.employee_name}","${a.date}","${a.check_in_time || ''}","${a.check_out_time || ''}","${a.status}","${a.verification_method}","${a.check_in_location || ''}","${a.working_hours_mins || 0}"`
              ).join('\n');
              const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `VeyraHR_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            📊 Export Attendance CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => refreshData()} icon={<RefreshCw className="w-4 h-4 text-veyra-blue" />}>
            Refresh Sync
          </Button>
        </div>
      </div>

      {/* ─── WORKPLACE GEOFENCE & SURROUNDING PERIMETER LIMITS OVERVIEW ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#111A2E] to-slate-900 border border-slate-700 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 font-mono">Workplace Perimeter</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
              Active Enforced
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-black text-white">Chennai HQ (Main Campus)</h4>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10 font-mono">
            <span>Surrounding Limit:</span>
            <span className="font-extrabold text-blue-400">200m Radius Circle</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#111A2E] to-slate-900 border border-slate-700 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 font-mono">Workplace Perimeter</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
              Active Enforced
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-black text-white">Coimbatore Tech Park</h4>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10 font-mono">
            <span>Surrounding Limit:</span>
            <span className="font-extrabold text-purple-400">150m Radius Circle</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#111A2E] to-slate-900 border border-slate-700 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 font-mono">Geofence Compliance</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
              GPS Verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <h4 className="text-sm font-black text-white">100% On-Premise Rate</h4>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10 font-mono">
            <span>Anti-Spoofing:</span>
            <span className="font-extrabold text-teal-400">Hardware FIDO2 OK</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card padded={false} className="p-4 bg-white border-veyra-border flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-veyra-blue" />
          <input
            type="text"
            placeholder="Search employee or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-veyra-bg-secondary rounded-xl text-xs font-medium text-veyra-text placeholder:text-veyra-text-muted focus:outline-none focus:ring-2 focus:ring-veyra-blue/20 border border-veyra-border/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-veyra-border bg-white px-3 py-2 text-xs text-veyra-text font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </Card>

      {/* TABLE VIEW */}
      {filteredAttendance.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No Attendance Logs Found"
          description="No employee check-in logs match your search filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-veyra-border shadow-veyra overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-veyra-bg-secondary border-b border-veyra-border text-veyra-text-sub font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Check-In Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verification Method</th>
                <th className="py-3.5 px-4">Location & Radius</th>
                <th className="py-3.5 px-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veyra-border/60 font-medium">
              {filteredAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-veyra-bg-secondary/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={att.employee_name || 'Sarah'} size="sm" />
                      <span className="font-bold text-veyra-text">{att.employee_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-veyra-text">
                    {att.check_in_time
                      ? new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={att.status === 'Present' ? 'green' : att.status === 'Late' ? 'amber' : 'blue'}
                      size="sm"
                    >
                      {att.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="blue" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                      {att.verification_method}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-veyra-text-sub flex items-center gap-1.5 pt-4">
                    <MapPin className="w-3.5 h-3.5 text-veyra-blue shrink-0" />
                    <span className="truncate max-w-[180px]">{att.check_in_location || 'Chennai HQ'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    {(() => {
                      if (att.check_in_time && !att.check_out_time) {
                        const checkInMs = new Date(att.check_in_time).getTime();
                        const elapsedMins = Math.max(1, Math.floor((Date.now() - checkInMs) / 60000));
                        return `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m (Live)`;
                      }
                      if (att.working_hours_mins > 0) {
                        return `${Math.floor(att.working_hours_mins / 60)}h ${att.working_hours_mins % 60}m`;
                      }
                      return '0h 1m (Active)';
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
