import React, { useState, useMemo } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  Download, 
  LogOut, 
  ChevronRight, 
  Lock, 
  Bell, 
  Globe, 
  Smartphone, 
  IdCard, 
  CheckCircle2, 
  Sparkles,
  QrCode,
  Shield,
  Fingerprint,
  UserCheck,
  Check,
  Moon,
  Sun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DigitalIDCardModal } from '../../components/employee/DigitalIDCardModal';
import { Employee } from '../../types/database';

export const EmployeeProfile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { employees } = useData();

  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Preference Modals
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Preference States with localStorage persistence
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem('veyra_pref_biometric') !== 'false';
  });
  const [notifyAttendance, setNotifyAttendance] = useState(() => {
    return localStorage.getItem('veyra_pref_notify_att') !== 'false';
  });
  const [notifyLeaves, setNotifyLeaves] = useState(() => {
    return localStorage.getItem('veyra_pref_notify_leave') !== 'false';
  });
  const [notifyAnnounce, setNotifyAnnounce] = useState(() => {
    return localStorage.getItem('veyra_pref_notify_ann') !== 'false';
  });
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('veyra_pref_language') || 'English (IN)';
  });
  const [selectedTimezone, setSelectedTimezone] = useState('IST (UTC +05:30)');

  const currentEmp: Employee = useMemo(() => {
    if (profile?.email) {
      const match = employees.find((e) => e.email?.toLowerCase() === profile.email.toLowerCase());
      if (match) return match;
    }
    if (profile?.full_name) {
      const match = employees.find(
        (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase() === profile.full_name.trim().toLowerCase()
      );
      if (match) return match;
    }
    if (profile?.id) {
      const match = employees.find((e) => e.id === profile.id || e.profile_id === profile.id);
      if (match) return match;
    }
    if (employees.length > 0) {
      return employees[0];
    }
    const nameParts = (profile?.full_name || 'VeyraHR Employee').split(' ');
    return {
      id: profile?.id || 'emp_current',
      company_id: profile?.company_id || 'comp_veyra_tn',
      employee_id: profile?.id ? `VEY-EMP-${profile.id.slice(-4).toUpperCase()}` : 'VEY-EMP-0001',
      first_name: nameParts[0] || 'VeyraHR',
      last_name: nameParts.slice(1).join(' ') || 'Employee',
      email: profile?.email || 'employee@veyrahr.com',
      phone: profile?.phone || '+91 98765 00000',
      designation: 'Software Specialist',
      department_name: profile?.department_access || 'Engineering & Tech',
      branch_name: profile?.branch_name || 'Chennai HQ',
      work_location: profile?.branch_name || 'Chennai HQ, Tamil Nadu',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      emergency_contact: '+91 98765 00001',
      address: 'Chennai HQ Campus',
      avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  }, [employees, profile]);

  const handleSignOutConfirm = async () => {
    setIsSignOutModalOpen(false);
    await logout();
    navigate('/');
  };

  const handleToggleBiometric = () => {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    localStorage.setItem('veyra_pref_biometric', String(next));
  };

  const handleToggleNotifyAtt = () => {
    const next = !notifyAttendance;
    setNotifyAttendance(next);
    localStorage.setItem('veyra_pref_notify_att', String(next));
  };

  const handleToggleNotifyLeave = () => {
    const next = !notifyLeaves;
    setNotifyLeaves(next);
    localStorage.setItem('veyra_pref_notify_leave', String(next));
  };

  const handleToggleNotifyAnnounce = () => {
    const next = !notifyAnnounce;
    setNotifyAnnounce(next);
    localStorage.setItem('veyra_pref_notify_ann', String(next));
  };

  const handleSelectLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('veyra_pref_language', lang);
  };

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. HERO PROFILE CARD ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white p-5 sm:p-6 shadow-xl border border-slate-700">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src={currentEmp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentEmp.first_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-white/20 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 border-[#0F172A] flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                  {currentEmp.first_name} {currentEmp.last_name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  {currentEmp.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-blue-200 font-bold">{currentEmp.designation}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 flex-wrap">
                <span>{currentEmp.department_name || 'Engineering & Tech'}</span>
                <span>•</span>
                <span className="text-blue-300 font-mono font-bold whitespace-nowrap bg-white/10 px-1.5 py-0.5 rounded-md">
                  {currentEmp.employee_id}
                </span>
              </div>
            </div>
          </div>

          {/* Digital ID Pass Action Button */}
          <button
            onClick={() => setIsIdCardOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-xs shrink-0 self-start"
          >
            <IdCard className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Digital Pass</span>
            <span className="sm:hidden">Pass</span>
          </button>
        </div>
      </div>

      {/* ─── 2. PROFILE COMPLETION METER ──────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-slate-900">Enterprise Verified Identity</h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">100% Complete</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Biometrics & compliance verification completed</p>
          </div>
        </div>
        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0 hidden sm:block">
          <div className="bg-emerald-500 h-full rounded-full w-full" />
        </div>
      </div>

      {/* ─── 3. EMPLOYEE DETAILS INFO LIST ────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Employment Details</h3>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
          
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2.5 font-medium">
              <Building2 className="w-4 h-4 text-blue-600" /> Branch & Location
            </span>
            <span className="font-extrabold text-slate-900">{currentEmp.branch_name || 'Chennai HQ'}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2.5 font-medium">
              <Calendar className="w-4 h-4 text-blue-600" /> Date of Joining
            </span>
            <span className="font-extrabold text-slate-900">{currentEmp.joining_date || '2024-01-15'}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2.5 font-medium">
              <Mail className="w-4 h-4 text-blue-600" /> Work Email
            </span>
            <span className="font-extrabold text-slate-900 truncate max-w-[200px]">{currentEmp.email}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2.5 font-medium">
              <Phone className="w-4 h-4 text-blue-600" /> Mobile Phone
            </span>
            <span className="font-extrabold text-slate-900">{currentEmp.phone || '+91 98401 22334'}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2.5 font-medium">
              <MapPin className="w-4 h-4 text-blue-600" /> Work Location
            </span>
            <span className="font-extrabold text-slate-900">{currentEmp.work_location || 'Chennai HQ'}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2.5 font-medium">
              <UserCheck className="w-4 h-4 text-blue-600" /> Emergency Contact
            </span>
            <span className="font-extrabold text-slate-900">{currentEmp.emergency_contact || 'Parent (+91 98400 11223)'}</span>
          </div>
        </div>
      </div>

      {/* ─── 4. FUNCTIONAL SETTINGS & PREFERENCES ─────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Preferences & Security</h3>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
          
          {/* Biometric Security */}
          <div 
            onClick={() => setIsSecurityModalOpen(true)}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <span className="text-slate-700 flex items-center gap-2.5 font-bold">
              <Lock className="w-4 h-4 text-blue-600" /> Biometric & Device Security
            </span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${biometricEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                {biometricEnabled ? 'Active' : 'Disabled'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Push Notifications */}
          <div 
            onClick={() => setIsNotificationsModalOpen(true)}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <span className="text-slate-700 flex items-center gap-2.5 font-bold">
              <Bell className="w-4 h-4 text-blue-600" /> Push Notifications & Alerts
            </span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Configured
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Language & Regional */}
          <div 
            onClick={() => setIsLanguageModalOpen(true)}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <span className="text-slate-700 flex items-center gap-2.5 font-bold">
              <Globe className="w-4 h-4 text-blue-600" /> Language & Regional Locale
            </span>
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              {selectedLanguage} <ChevronRight className="w-4 h-4 text-slate-400" />
            </span>
          </div>
        </div>
      </div>

      {/* ─── 5. LOGOUT BUTTON ─────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          onClick={() => setIsSignOutModalOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors active:scale-98 shadow-xs"
        >
          <LogOut className="w-4 h-4 text-rose-600" /> Sign Out of Employee Session
        </button>
      </div>

      {/* ─── MODAL 1: BIOMETRIC & DEVICE SECURITY MODAL ───────────────── */}
      {isSecurityModalOpen && (
        <Modal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          title="Biometric & Device Security"
          maxWidth="sm"
        >
          <div className="space-y-4 text-left p-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-extrabold text-slate-900">Biometric Authentication</h5>
                  <p className="text-[11px] text-slate-500">Require Touch ID / Face ID / WebAuthn on check-in</p>
                </div>
                <button
                  onClick={handleToggleBiometric}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${biometricEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${biometricEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Current Session: Verified Mobile PWA (Encrypted TLS 1.3)</span>
            </div>

            <Button variant="primary" className="w-full font-bold" onClick={() => setIsSecurityModalOpen(false)}>
              Save Security Settings
            </Button>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 2: NOTIFICATIONS SETTINGS MODAL ────────────────────── */}
      {isNotificationsModalOpen && (
        <Modal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          title="Notification Preferences"
          maxWidth="sm"
        >
          <div className="space-y-4 text-left p-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-extrabold text-slate-900">Attendance Punch Reminder</h5>
                  <p className="text-[11px] text-slate-500">Alert me at 09:00 AM on scheduled workdays</p>
                </div>
                <button
                  onClick={handleToggleNotifyAtt}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${notifyAttendance ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifyAttendance ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <h5 className="font-extrabold text-slate-900">Leave Approval Status</h5>
                  <p className="text-[11px] text-slate-500">Instant notification when HR reviews my leave</p>
                </div>
                <button
                  onClick={handleToggleNotifyLeave}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${notifyLeaves ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifyLeaves ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <h5 className="font-extrabold text-slate-900">Company Announcements</h5>
                  <p className="text-[11px] text-slate-500">Emergency notices & HR updates</p>
                </div>
                <button
                  onClick={handleToggleNotifyAnnounce}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${notifyAnnounce ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifyAnnounce ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <Button variant="primary" className="w-full font-bold" onClick={() => setIsNotificationsModalOpen(false)}>
              Save Notification Preferences
            </Button>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 3: LANGUAGE & LOCALE SELECTOR MODAL ────────────────── */}
      {isLanguageModalOpen && (
        <Modal
          isOpen={isLanguageModalOpen}
          onClose={() => setIsLanguageModalOpen(false)}
          title="Language & Regional Settings"
          maxWidth="sm"
        >
          <div className="space-y-4 text-left p-1 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Display Language</label>
              <div className="space-y-1.5">
                {[
                  { code: 'English (IN)', label: 'English (India)' },
                  { code: 'தமிழ் (Tamil)', label: 'தமிழ் (Tamil - தமிழ்நாடு)' },
                  { code: 'हिन्दी (Hindi)', label: 'हिन्दी (Hindi - भारत)' },
                  { code: 'తెలుగు (Telugu)', label: 'తెలుగు (Telugu)' },
                  { code: 'Español (ES)', label: 'Español (International)' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedLanguage === lang.code
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {selectedLanguage === lang.code && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Timezone & Locale</label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="IST (UTC +05:30)">IST (UTC +05:30) - Chennai / Kolkata / Mumbai</option>
                <option value="SGT (UTC +08:00)">SGT (UTC +08:00) - Singapore / Malaysia</option>
                <option value="GMT (UTC +00:00)">GMT (UTC +00:00) - London / UK</option>
                <option value="EST (UTC -05:00)">EST (UTC -05:00) - New York / USA</option>
              </select>
            </div>

            <Button variant="primary" className="w-full font-bold" onClick={() => setIsLanguageModalOpen(false)}>
              Apply Regional Locale
            </Button>
          </div>
        </Modal>
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {isSignOutModalOpen && (
        <Modal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          maxWidth="sm"
        >
          <div className="text-center space-y-3 p-1">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to end your current session? You will need your credentials to sign in again.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-1/2" onClick={() => setIsSignOutModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="w-1/2 font-bold" onClick={handleSignOutConfirm}>
                Sign Out
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DIGITAL ID PASS MODAL */}
      {isIdCardOpen && (
        <DigitalIDCardModal
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          employee={currentEmp}
        />
      )}
    </div>
  );
};
