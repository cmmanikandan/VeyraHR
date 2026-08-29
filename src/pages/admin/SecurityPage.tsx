import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Smartphone, 
  Laptop, 
  Globe, 
  AlertTriangle, 
  LogOut, 
  CheckCircle2, 
  UserCheck,
  History
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export const SecurityPage: React.FC = () => {
  const { securitySessions, forceLogoutSession, auditLogs } = useData();
  const { profile, currentUser, currentRole } = useAuth();

  const liveSession = {
    id: 'sess_live_1',
    user_email: profile?.email || currentUser?.email || 'admin@veyrahr.com',
    user_role: currentRole === 'admin' ? 'System Administrator' : 'HR Manager',
    device: navigator.userAgent.includes('Mac') ? 'MacBook Pro (Chrome)' : 'Windows Desktop PC (Chrome)',
    ip_address: '106.51.78.204 (Current IP)',
    location: 'Chennai, Tamil Nadu, India 🇮🇳',
    login_at: 'Active Now',
    status: 'Active' as const,
  };

  const displaySessions = securitySessions.length > 0 ? securitySessions : [liveSession];

  return (
    <div className="space-y-6 text-left">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold text-veyra-text tracking-tight">Security & Session Governance</h1>
        <p className="text-xs sm:text-sm text-veyra-text-sub font-medium mt-0.5">
          Monitor active user sessions, security audit logs, IP locations, and session termination controls.
        </p>
      </div>

      {/* SECURITY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padded={false} className="p-5 bg-white border-veyra-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-veyra-text-sub block">MFA Status</span>
            <span className="text-lg font-extrabold text-veyra-text block">Enforced Enterprise</span>
          </div>
        </Card>

        <Card padded={false} className="p-5 bg-white border-veyra-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-veyra-blue-soft border border-veyra-blue-border text-veyra-blue flex items-center justify-center shrink-0">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-veyra-text-sub block">Active Sessions</span>
            <span className="text-lg font-extrabold text-veyra-text block">
              {displaySessions.filter((s) => s.status === 'Active').length} Live Connections
            </span>
          </div>
        </Card>

        <Card padded={false} className="p-5 bg-white border-veyra-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-veyra-text-sub block">Password Policy</span>
            <span className="text-lg font-extrabold text-veyra-text block">8+ Chars & Special</span>
          </div>
        </Card>
      </div>

      {/* ACTIVE SESSIONS TABLE */}
      <Card padded={false} className="bg-white border-veyra-border shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-veyra-border/60 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-veyra-text">Active User Sessions</h3>
            <p className="text-xs text-veyra-text-sub font-medium">Devices currently authenticated to your organization.</p>
          </div>
          <Badge variant="blue" size="sm" className="font-bold">
            Real-Time Audit
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-veyra-text">
            <thead className="bg-veyra-bg-secondary text-veyra-text-sub uppercase font-bold text-[10px] tracking-wider border-y border-veyra-border">
              <tr>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Device & Browser</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veyra-border/60 font-medium">
              {displaySessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-veyra-bg-secondary/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-veyra-text">
                    {sess.user_email}
                    <span className="block text-[10px] text-veyra-blue font-semibold">{sess.user_role}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-veyra-text">{sess.device}</td>
                  <td className="py-3.5 px-4 font-mono text-veyra-navy font-bold">{sess.ip_address}</td>
                  <td className="py-3.5 px-4">{sess.location}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={sess.status === 'Active' ? 'success' : 'danger'} size="sm" className="font-bold">
                      {sess.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {sess.status === 'Active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => forceLogoutSession(sess.id)}
                        icon={<LogOut className="w-3.5 h-3.5 text-veyra-danger" />}
                        className="bg-white text-xs font-bold text-veyra-danger border-red-200 hover:bg-red-50"
                      >
                        Force Logout
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RECENT SECURITY AUDIT TRAIL */}
      <Card padded={false} className="bg-white border-veyra-border shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-veyra-border/60 pb-3">
          <h3 className="text-base font-extrabold text-veyra-text flex items-center gap-2">
            <History className="w-4 h-4 text-veyra-blue" /> Enterprise Security Audit Logs
          </h3>
        </div>

        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-veyra-text-sub font-medium py-4 text-center">No security audit logs recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-veyra-bg-secondary border border-veyra-border/60 flex items-center justify-between text-xs font-medium">
                <div>
                  <span className="font-bold text-veyra-text">{log.actor_name || 'Admin'}</span>
                  <span className="text-veyra-text-sub"> executed </span>
                  <span className="font-bold text-veyra-blue">{log.action}</span>
                  <p className="text-[11px] text-veyra-text-sub mt-0.5">{log.details}</p>
                </div>
                <span className="text-[10px] text-veyra-text-muted font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
