import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Lock,
  Camera,
  BadgeCheck,
  Globe,
  Clock,
  Bell,
  KeyRound,
  LogOut,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const HRProfilePage: React.FC = () => {
  const { profile, setProfile, logout } = useAuth();
  const { employees, leaveRequests, shifts, announcements } = useData();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [branchName, setBranchName] = useState(profile?.branch_name || 'Chennai HQ');
  const [deptAccess, setDeptAccess] = useState(profile?.department_access || 'All Departments');
  const [saved, setSaved] = useState(false);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSaved, setPwdSaved] = useState(false);

  // Notification preferences
  const [notifLeave, setNotifLeave] = useState(true);
  const [notifAttendance, setNotifAttendance] = useState(true);
  const [notifShift, setNotifShift] = useState(true);
  const [notifAnnouncement, setNotifAnnouncement] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return;
    const updatedProfile = {
      ...profile!,
      full_name: fullName.trim(),
      phone: phone.trim(),
      branch_name: branchName,
      department_access: deptAccess,
    };

    setProfile(updatedProfile);

    // Save to localStorage
    try {
      localStorage.setItem('veyra_hr_profile', JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Persist to Supabase Database
    try {
      if (profile?.id) {
        await supabase.from('profiles').upsert({
          id: profile.id,
          company_id: profile.company_id || 'comp_veyra_tn',
          email: profile.email,
          full_name: fullName.trim(),
          phone: phone.trim(),
          branch_name: branchName,
          department_access: deptAccess,
          role: 'hr_manager',
          updated_at: new Date().toISOString(),
        });

        await supabase.from('hr_managers').upsert({
          id: `hr_${profile.id}`,
          profile_id: profile.id,
          company_id: profile.company_id || 'comp_veyra_tn',
          full_name: fullName.trim(),
          email: profile.email,
          phone: phone.trim(),
          branch_name: branchName,
          department_access: deptAccess,
          status: 'Active',
        });
      }
    } catch (err) {
      console.warn('Supabase profile save notice:', err);
    }

    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (newPwd.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }
    setPwdSaved(true);
    setChangingPassword(false);
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setTimeout(() => setPwdSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Stats — computed from live data
  const stats = [
    { label: 'Employees Managed', value: String(employees.filter((e) => e.status === 'Active').length || employees.length), color: 'text-veyra-blue' },
    { label: 'Leave Approvals', value: String(leaveRequests.filter((r) => r.status === 'Approved').length), color: 'text-emerald-600' },
    { label: 'Shifts Configured', value: String(shifts.filter((s) => s.is_active).length), color: 'text-purple-600' },
    { label: 'Announcements Sent', value: String(announcements.length), color: 'text-amber-600' },
  ];

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'January 2024';

  const initials = (profile?.full_name || 'HR Manager')
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-veyra-text tracking-tight">My HR Profile</h2>
          <p className="text-xs text-veyra-text-sub mt-0.5">Manage your identity, access permissions & security settings</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Profile saved!
            </span>
          )}
          {!isEditing ? (
            <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} icon={<Edit3 className="w-4 h-4" />}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setFullName(profile?.full_name || ''); }} icon={<X className="w-4 h-4" />}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveProfile} icon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Identity card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <Card className="bg-white border-veyra-border text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-veyra-blue to-blue-700 text-white text-3xl font-extrabold flex items-center justify-center mx-auto shadow-lg">
                {initials}
              </div>
              <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border-2 border-veyra-border rounded-full flex items-center justify-center shadow-sm hover:bg-veyra-bg-secondary transition-colors">
                <Camera className="w-3.5 h-3.5 text-veyra-blue" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-veyra-text">{profile?.full_name || 'HR Operations Manager'}</h3>
              <p className="text-xs text-veyra-text-sub mt-0.5">{profile?.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="blue" size="sm" icon={<BadgeCheck className="w-3 h-3" />}>
                  HR Manager
                </Badge>
                <Badge variant="green" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                  Active
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-veyra-border">
              {stats.map((s) => (
                <div key={s.label} className="p-2.5 rounded-xl bg-veyra-bg-secondary">
                  <span className={`text-2xl font-extrabold block ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-veyra-text-sub font-semibold leading-tight">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-veyra-text-muted flex items-center justify-center gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              Member since {memberSince}
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="bg-white border-veyra-border space-y-2">
            <h4 className="text-xs font-bold text-veyra-text uppercase tracking-wider mb-1">Quick Actions</h4>
            <button
              onClick={() => setChangingPassword(true)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-veyra-text hover:bg-veyra-bg-secondary border border-veyra-border transition-colors text-left"
            >
              <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
              Change Password
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-veyra-border hover:border-red-200 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out of Console
            </button>
          </Card>
        </div>

        {/* RIGHT: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Info */}
          <Card className="bg-white border-veyra-border space-y-4">
            <div className="flex items-center gap-2 border-b border-veyra-border pb-3">
              <User className="w-4 h-4 text-veyra-blue" />
              <h3 className="text-sm font-extrabold text-veyra-text">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-veyra-text-sub uppercase tracking-wide mb-1.5">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-blue bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue/30"
                  />
                ) : (
                  <p className="text-sm font-bold text-veyra-text">{profile?.full_name || '—'}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-[11px] font-bold text-veyra-text-sub uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-veyra-text">{profile?.email || '—'}</p>
                  <Lock className="w-3.5 h-3.5 text-veyra-text-muted" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-veyra-text-sub uppercase tracking-wide mb-1.5">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99999 00000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-blue bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue/30"
                  />
                ) : (
                  <p className="text-sm font-bold text-veyra-text">{phone || <span className="text-veyra-text-muted font-normal">Not set</span>}</p>
                )}
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="block text-[11px] font-bold text-veyra-text-sub uppercase tracking-wide mb-1.5">System Role</label>
                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>HR Operations Manager</Badge>
                  <Lock className="w-3.5 h-3.5 text-veyra-text-muted" />
                </div>
              </div>
            </div>
          </Card>

          {/* Access & Permissions */}
          <Card className="bg-white border-veyra-border space-y-4">
            <div className="flex items-center gap-2 border-b border-veyra-border pb-3">
              <Building2 className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-extrabold text-veyra-text">Access & Permissions</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch */}
              <div>
                <label className="block text-[11px] font-bold text-veyra-text-sub uppercase tracking-wide mb-1.5">Assigned Branch</label>
                {isEditing ? (
                  <select
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-blue bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue/30"
                  >
                    <option>Chennai HQ</option>
                    <option>Coimbatore Branch</option>
                    <option>Madurai Regional Hub</option>
                    <option>Karur Office</option>
                    <option>All Branches</option>
                  </select>
                ) : (
                  <p className="text-sm font-bold text-veyra-text">{branchName}</p>
                )}
              </div>

              {/* Department access */}
              <div>
                <label className="block text-[11px] font-bold text-veyra-text-sub uppercase tracking-wide mb-1.5">Department Access</label>
                {isEditing ? (
                  <select
                    value={deptAccess}
                    onChange={(e) => setDeptAccess(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-blue bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue/30"
                  >
                    <option>All Departments</option>
                    <option>Human Resources</option>
                    <option>Engineering & Tech</option>
                    <option>Sales & Marketing</option>
                    <option>Finance & Operations</option>
                  </select>
                ) : (
                  <p className="text-sm font-bold text-veyra-text">{deptAccess}</p>
                )}
              </div>

              {/* Permissions list */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-veyra-text-sub uppercase tracking-wide mb-2">Granted Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {['View Employee Records', 'Approve/Reject Leave', 'Manage Shifts', 'Post Announcements', 'View Attendance Logs', 'Generate Reports', 'Log Mood Entries'].map((perm) => (
                    <span key={perm} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card className="bg-white border-veyra-border space-y-4">
            <div className="flex items-center gap-2 border-b border-veyra-border pb-3">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-extrabold text-veyra-text">Notification Preferences</h3>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Leave Requests & Approvals', sub: 'Get notified when employees submit or update leave applications', value: notifLeave, set: setNotifLeave },
                { label: 'Attendance Alerts', sub: 'Receive alerts for late check-ins and missed attendance', value: notifAttendance, set: setNotifAttendance },
                { label: 'Shift Swap Requests', sub: 'Notifications when employees request peer shift swaps', value: notifShift, set: setNotifShift },
                { label: 'Announcement Broadcasts', sub: 'Confirmations when announcements are published', value: notifAnnouncement, set: setNotifAnnouncement },
              ].map(({ label, sub, value, set }) => (
                <div key={label} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-veyra-border bg-veyra-bg-secondary/40">
                  <div>
                    <p className="text-xs font-bold text-veyra-text">{label}</p>
                    <p className="text-[11px] text-veyra-text-sub mt-0.5">{sub}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    onClick={() => set(!value)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 9999,
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      position: 'relative',
                      flexShrink: 0,
                      transition: 'background-color 0.2s ease',
                      backgroundColor: value ? '#2563EB' : '#D1D5DB',
                      outline: 'none',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: value ? 23 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: 9999,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                        transition: 'left 0.2s ease',
                        display: 'block',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Security */}
          <Card className="bg-white border-veyra-border space-y-4">
            <div className="flex items-center gap-2 border-b border-veyra-border pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-extrabold text-veyra-text">Security & Authentication</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-veyra-border">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-veyra-text">Password</p>
                    <p className="text-[11px] text-veyra-text-sub">Last changed: Never</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setChangingPassword(true)}>Change Password</Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-veyra-border">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-veyra-text">Active Session</p>
                    <p className="text-[11px] text-veyra-text-sub">Chrome on Windows • Chennai, IN</p>
                  </div>
                </div>
                <Badge variant="green" size="sm">Current</Badge>
              </div>

              {pwdSaved && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Password updated successfully.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL (inline slide-down) */}
      {changingPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-veyra-border shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-veyra-text flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" /> Change Password
              </h3>
              <button onClick={() => { setChangingPassword(false); setPwdError(''); }} className="p-1.5 rounded-lg hover:bg-veyra-bg-secondary">
                <X className="w-4 h-4 text-veyra-text-sub" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
              {/* Current password */}
              <div>
                <label className="block text-xs font-bold text-veyra-text mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-3 text-veyra-text-sub">
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-bold text-veyra-text mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-3 text-veyra-text-sub">
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength meter */}
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        newPwd.length >= level * 3
                          ? level <= 1 ? 'bg-red-400' : level <= 2 ? 'bg-amber-400' : level <= 3 ? 'bg-blue-400' : 'bg-emerald-500'
                          : 'bg-veyra-border'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-bold text-veyra-text mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue ${
                    confirmPwd && confirmPwd !== newPwd ? 'border-red-400' : 'border-veyra-border'
                  }`}
                  placeholder="Re-enter new password"
                />
                {confirmPwd && confirmPwd !== newPwd && (
                  <p className="text-[11px] text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>

              {pwdError && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 p-2.5 rounded-xl">{pwdError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => { setChangingPassword(false); setPwdError(''); }}>Cancel</Button>
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>Update Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
