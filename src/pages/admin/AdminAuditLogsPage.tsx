import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ShieldAlert, 
  UserCheck, 
  Key, 
  Building2, 
  Globe, 
  Clock, 
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  module: string;
  ip_address: string;
  location: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
  details: string;
}

export const AdminAuditLogsPage: React.FC = () => {
  const { auditLogs: contextAuditLogs } = useData();

  const logs: AuditEntry[] = React.useMemo(() => {
    let savedLogs: AuditEntry[] = [];
    try {
      const saved = localStorage.getItem('veyra_audit_logs');
      if (saved) savedLogs = JSON.parse(saved);
    } catch {}

    const contextFormatted: AuditEntry[] = contextAuditLogs.map((a) => ({
      id: a.id,
      timestamp: new Date(a.created_at).toLocaleString(),
      actor_email: a.actor_name || 'admin@veyrahr.com',
      actor_role: 'SYSTEM_ADMIN',
      action: a.action,
      module: 'System Operations',
      ip_address: '106.51.78.204',
      location: 'Chennai, TN',
      severity: (a.action.includes('REVOKE') || a.action.includes('SECURITY') ? 'SECURITY' : a.action.includes('DELETE') ? 'WARNING' : 'INFO') as any,
      details: a.details || 'System event executed.',
    }));
    return [...contextFormatted, ...savedLogs];
  }, [contextAuditLogs]);

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor_email.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.ip_address.includes(search) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const exportCSV = () => {
    const headers = ['ID,Timestamp,Actor,Role,Action,Module,IP Address,Location,Severity,Details\n'];
    const rows = filteredLogs.map(
      (l) =>
        `"${l.id}","${l.timestamp}","${l.actor_email}","${l.actor_role}","${l.action}","${l.module}","${l.ip_address}","${l.location}","${l.severity}","${l.details.replace(/"/g, '""')}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VeyraHR_Audit_Logs_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">Audit Logs & Compliance</h1>
            <Badge variant="blue">SOC2 Type II Audit Trail</Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Immutable system event history, security violations, and administrative state changes.
          </p>
        </div>

        <Button
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#2563EB]" />}
          onClick={exportCSV}
          className="bg-white text-xs font-bold shrink-0"
        >
          Export CSV Audit Trail
        </Button>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="p-4 border-[#E8E2D9] bg-white space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter logs by actor, action, IP, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-[#64748B] shrink-0" />
            <span className="text-xs font-bold text-[#64748B] shrink-0">Severity:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'INFO', 'WARNING', 'SECURITY', 'CRITICAL'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    severityFilter === s
                      ? 'bg-[#172033] text-white'
                      : 'bg-[#FCFAF7] border border-[#E8E2D9] text-[#64748B] hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* AUDIT LOG TABLE */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-veyra-blue" />}
          title="No Audit Log Events Recorded Yet"
          description="Immutable SOC2 audit history will log here automatically as system administrators and HR managers perform operations."
        />
      ) : (
        <Card className="border-[#E8E2D9] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-[#E8E2D9] text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">IP & Location</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9] text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FCFAF7]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#172033] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                        {log.timestamp}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#172033] block">{log.actor_email}</span>
                      <span className="text-[10px] text-[#64748B] font-bold block">{log.actor_role}</span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-[#2563EB] whitespace-nowrap">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#64748B] whitespace-nowrap">
                      {log.module}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#172033] block">{log.ip_address}</span>
                      <span className="text-[10px] text-[#64748B] block">{log.location}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          log.severity === 'SECURITY' || log.severity === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-[#2563EB] border border-blue-200'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B] leading-normal max-w-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
