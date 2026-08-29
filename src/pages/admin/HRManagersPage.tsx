import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Trash2, 
  RotateCcw, 
  Edit3, 
  Building2,
  KeyRound
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';
import { HRManager } from '../../types/database';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const HRManagersPage: React.FC = () => {
  const { hrManagers, branches, departments, addHRManager, updateHRManagerStatus, deleteHRManager } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.name || 'Chennai HQ');
  const [deptAccess, setDeptAccess] = useState('All Departments');
  const [password, setPassword] = useState('VeyraHR2026!');
  const [permissions, setPermissions] = useState<string[]>(['Attendance', 'Leave Approvals', 'Shift Roster']);

  const filteredHRs = hrManagers.filter(
    (h) =>
      h.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePermission = (p: string) => {
    if (permissions.includes(p)) {
      setPermissions(permissions.filter((item) => item !== p));
    } else {
      setPermissions([...permissions, p]);
    }
  };

  const handleCreateHR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !workEmail || !mobile || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Firebase Account
      try {
        const userCred = await createUserWithEmailAndPassword(auth, workEmail.trim(), password);
        await sendEmailVerification(userCred.user);
      } catch (fbErr: any) {
        console.warn('Firebase user creation notice:', fbErr);
      }

      // 2. Add HR Manager to Context State & Supabase
      await addHRManager({
        full_name: fullName.trim(),
        email: workEmail.trim(),
        phone: mobile.trim(),
        branch_name: selectedBranch,
        department_access: deptAccess,
        permissions,
        status: 'Active',
        last_login: 'Never',
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      });

      // Reset form
      setFullName('');
      setWorkEmail('');
      setMobile('');
      setPassword('VeyraHR2026!');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create HR Manager.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-veyra-text tracking-tight">HR Managers Management</h1>
          <p className="text-xs sm:text-sm text-veyra-text-sub font-medium mt-0.5">
            Configure HR portal access, branch permissions, and credentials for workforce managers.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          icon={<UserPlus className="w-4 h-4" />}
          className="font-bold shadow-xs self-start sm:self-auto"
        >
          Add HR Manager
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-veyra-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-veyra-border rounded-xl text-xs text-veyra-text placeholder:text-veyra-text-muted focus:outline-none focus:ring-2 focus:ring-veyra-blue/20"
          />
        </div>
      </div>

      {/* LIST TABLE / CARDS */}
      {filteredHRs.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No HR Managers Found"
          description="There are no HR managers configured for your organization yet. Add an HR Manager to delegate daily attendance, leave approvals, and shift management."
          actionLabel="Add HR Manager"
          onAction={() => setIsAddModalOpen(true)}
          actionIcon={<UserPlus className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHRs.map((hr) => (
            <Card key={hr.id} padded={false} className="p-5 bg-white border-veyra-border shadow-xs hover:border-veyra-blue/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={hr.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={hr.full_name}
                      className="w-12 h-12 rounded-2xl object-cover border border-veyra-border shadow-2xs"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        hr.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-veyra-text">{hr.full_name}</h4>
                      <Badge
                        variant={hr.status === 'Active' ? 'success' : 'warning'}
                        size="sm"
                        className="font-bold"
                      >
                        {hr.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-veyra-text-sub font-medium mt-1">
                      <span className="flex items-center gap-1 text-veyra-text">
                        <Mail className="w-3.5 h-3.5 text-veyra-blue" /> {hr.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-veyra-text-muted" /> {hr.phone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-veyra-navy">
                        <MapPin className="w-3.5 h-3.5 text-veyra-blue" /> {hr.branch_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-veyra-border/60 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateHRManagerStatus(hr.id, hr.status === 'Active' ? 'Inactive' : 'Active')}
                    className="bg-white text-xs font-bold"
                  >
                    {hr.status === 'Active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHRManager(hr.id)}
                    className="text-veyra-danger hover:bg-red-50 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-veyra-border/60 flex flex-wrap items-center justify-between text-xs text-veyra-text-sub gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-veyra-text">Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {hr.permissions.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded-lg bg-veyra-bg-secondary text-[11px] font-semibold text-veyra-navy border border-veyra-border">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[11px]">Last login: {hr.last_login || 'Never'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD HR MANAGER MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add HR Manager" maxWidth="md">
        <form onSubmit={handleCreateHR} className="space-y-4 text-left">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-veyra-danger text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Priya Sundaram"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Work Email Address *"
              type="email"
              placeholder="priya.s@company.com"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mobile Phone *"
              placeholder="+91 98401 23456"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-veyra-text mb-1.5">Assigned Branch *</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2.5 bg-white border border-veyra-border rounded-xl text-xs font-medium text-veyra-text"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-veyra-text mb-1.5">Department Access</label>
              <select
                value={deptAccess}
                onChange={(e) => setDeptAccess(e.target.value)}
                className="w-full p-2.5 bg-white border border-veyra-border rounded-xl text-xs font-medium text-veyra-text"
              >
                <option>All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} Only
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Temporary Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-veyra-text uppercase tracking-wider mb-2">
              HR Portal Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Attendance', 'Leave Approvals', 'Shift Roster', 'Employee Onboarding', 'Reports Export'].map((p) => {
                const active = permissions.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePermission(p)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      active
                        ? 'bg-veyra-blue-soft border-veyra-blue-border text-veyra-blue'
                        : 'bg-white border-veyra-border text-veyra-text-sub hover:bg-veyra-bg-secondary'
                    }`}
                  >
                    <span>{p}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-veyra-blue" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-veyra-border">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="font-bold shadow-xs">
              Create HR Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
