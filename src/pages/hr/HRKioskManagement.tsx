import React, { useState } from 'react';
import { 
  Monitor, 
  QrCode, 
  Plus, 
  Building2, 
  KeyRound, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  MapPin, 
  Trash2, 
  Power, 
  RefreshCw, 
  Sparkles,
  Smartphone,
  Tv
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';

interface KioskTerminal {
  id: string;
  name: string;
  branch_id: string;
  branch_name: string;
  login_id: string;
  pin_code: string;
  device_type: 'Tablet' | 'Smart TV' | 'Desktop / Monitor';
  radius_meters: number;
  status: 'Active' | 'Offline';
  created_at: string;
}

export const HRKioskManagement: React.FC = () => {
  const { branches } = useData();

  const [terminals, setTerminals] = useState<KioskTerminal[]>(() => {
    const saved = localStorage.getItem('veyra_hr_kiosks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      {
        id: 'term_1',
        name: 'Reception Gate 1 Terminal',
        branch_id: branches[0]?.id || 'b1',
        branch_name: branches[0]?.name || 'Chennai Tech Park HQ',
        login_id: 'kiosk.chennai@veyrahr.com',
        pin_code: '1234',
        device_type: 'Tablet',
        radius_meters: 150,
        status: 'Active',
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'b1');
  const [terminalName, setTerminalName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [pinCode, setPinCode] = useState('1234');
  const [deviceType, setDeviceType] = useState<'Tablet' | 'Smart TV' | 'Desktop / Monitor'>('Tablet');
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // HR Master GPS Policy
  const [gpsPunchPolicyEnabled, setGpsPunchPolicyEnabled] = useState(() => {
    return localStorage.getItem('veyra_company_gps_punch_enabled') !== 'false';
  });

  const handleToggleGpsPunchPolicy = () => {
    const next = !gpsPunchPolicyEnabled;
    setGpsPunchPolicyEnabled(next);
    localStorage.setItem('veyra_company_gps_punch_enabled', String(next));
  };

  const handleBranchChange = (bId: string) => {
    setSelectedBranchId(bId);
    const branch = branches.find((b) => b.id === bId);
    if (branch) {
      const cleanCity = (branch.city || branch.name).toLowerCase().replace(/\s+/g, '');
      setLoginId(`kiosk.${cleanCity}@veyrahr.com`);
      setTerminalName(`${branch.city || branch.name} Lobby Terminal`);
    }
  };

  const handleCreateKiosk = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.id === selectedBranchId) || branches[0];

    const newKiosk: KioskTerminal = {
      id: `term_${Date.now()}`,
      name: terminalName || `${branch.name} Terminal`,
      branch_id: branch.id,
      branch_name: branch.name,
      login_id: loginId || `kiosk.${branch.name.toLowerCase().replace(/\s+/g, '')}@veyrahr.com`,
      pin_code: pinCode || '1234',
      device_type: deviceType,
      radius_meters: radiusMeters || 150,
      status: 'Active',
      created_at: new Date().toISOString(),
    };

    const updated = [newKiosk, ...terminals];
    setTerminals(updated);
    localStorage.setItem('veyra_hr_kiosks', JSON.stringify(updated));
    setIsAddModalOpen(false);

    // Reset Form
    setTerminalName('');
    setLoginId('');
    setPinCode('1234');
  };

  const handleDeleteKiosk = (id: string) => {
    if (confirm('Are you sure you want to deactivate and remove this Kiosk Terminal account?')) {
      const updated = terminals.filter((t) => t.id !== id);
      setTerminals(updated);
      localStorage.setItem('veyra_hr_kiosks', JSON.stringify(updated));
    }
  };

  const copyCredentials = (terminal: KioskTerminal) => {
    navigator.clipboard.writeText(
      `VeyraHR Kiosk Credentials\nBranch: ${terminal.branch_name}\nLogin ID: ${terminal.login_id}\nPassword/PIN: ${terminal.pin_code}\nKiosk URL: ${window.location.origin}/kiosk`
    );
    setCopiedId(terminal.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const launchKioskForBranch = (terminal: KioskTerminal) => {
    localStorage.setItem('veyra_kiosk_auth', 'true');
    localStorage.setItem('veyra_kiosk_terminal_id', terminal.login_id);
    localStorage.setItem('veyra_kiosk_branch_id', terminal.branch_id);
    window.open('/kiosk', '_blank');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* ─── 1. TOP HEADER & CREATE TERMINAL BUTTON ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Workplace Kiosk & QR Terminal Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage 2-second dynamic rolling QR attendance terminals for office receptions, gates, and branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/kiosk', '_blank')}
            icon={<ExternalLink className="w-4 h-4 text-blue-600" />}
          >
            Launch Kiosk Screen
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              handleBranchChange(branches[0]?.id || 'b1');
              setIsAddModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            + Create Branch Kiosk Account
          </Button>
        </div>
      </div>

      {/* ─── 1.5 COMPANY ATTENDANCE SECURITY POLICY CARD ─────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/15">
            <Smartphone className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-white">Mobile 1-Tap GPS Geofenced Check-In Policy</h4>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${gpsPunchPolicyEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                {gpsPunchPolicyEnabled ? 'Enabled' : 'Disabled (Kiosk Only)'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-xl">
              {gpsPunchPolicyEnabled 
                ? 'Employees can punch in directly from their personal mobile browsers within the authorized branch GPS perimeter.'
                : 'Mobile GPS punches are locked. Employees MUST physically scan the Reception Kiosk QR terminal.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleGpsPunchPolicy}
          className={`w-14 h-8 rounded-full transition-colors relative p-1 shrink-0 ${gpsPunchPolicyEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}
          title="Toggle GPS Punch Policy"
        >
          <div className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${gpsPunchPolicyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* ─── 2. QUICK STATS BANNER ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Terminals</span>
            <span className="text-xl font-extrabold text-slate-900">{terminals.length} Configured</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Covered Branches</span>
            <span className="text-xl font-extrabold text-emerald-700">{branches.length} Locations</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rolling QR Anti-Spoof</span>
            <span className="text-xl font-extrabold text-purple-700">2-Sec Refresh</span>
          </div>
        </div>
      </div>

      {/* ─── 3. ACTIVE KIOSK TERMINALS LIST ────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
          Configured Branch Kiosk Accounts ({terminals.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terminals.map((terminal) => (
            <div
              key={terminal.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                      {terminal.device_type === 'Smart TV' ? (
                        <Tv className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{terminal.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" /> {terminal.branch_name}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Active Terminal
                  </span>
                </div>

                {/* Credentials Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Terminal Login ID:</span>
                    <span className="font-mono font-bold text-slate-900">{terminal.login_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Password / PIN:</span>
                    <span className="font-mono font-bold text-blue-700">{terminal.pin_code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Geofence Radius:</span>
                    <span className="font-mono font-bold text-slate-900">{terminal.radius_meters}m Perimeter</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCredentials(terminal)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId === terminal.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Credentials
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteKiosk(terminal.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove Terminal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => launchKioskForBranch(terminal)}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  className="font-bold text-xs"
                >
                  Launch Kiosk
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CREATE KIOSK MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Branch Kiosk Terminal Account"
      >
        <form onSubmit={handleCreateKiosk} className="space-y-4 text-left pt-1">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">
              Select Branch Location *
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city || 'Office'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">
              Kiosk Terminal Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Chennai Reception Lobby Terminal"
              value={terminalName}
              onChange={(e) => setTerminalName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">
                Kiosk Terminal Login ID *
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">
                Security Password / PIN *
              </label>
              <input
                type="text"
                placeholder="4-digit PIN (e.g. 1234)"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">
                Hardware Device Type
              </label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Tablet">Tablet (iPad / Android)</option>
                <option value="Smart TV">Smart TV / Large Screen</option>
                <option value="Desktop / Monitor">Reception PC / Monitor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">
                Geofence Radius (Meters)
              </label>
              <input
                type="number"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value) || 150)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Kiosk Account Ready
            </span>
            <p className="text-[11px] text-blue-800">
              Once created, open <code>/kiosk</code> on your reception device and sign in with these credentials.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold">
              Save Kiosk Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
