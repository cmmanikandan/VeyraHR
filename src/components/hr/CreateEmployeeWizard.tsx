import React, { useState, useRef, useMemo } from 'react';
import { 
  User, 
  Briefcase, 
  Building, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  UploadCloud, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Copy, 
  Check,
  Layers,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Employee } from '../../types/database';
import { useData } from '../../context/DataContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { registerFirebaseUser } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

interface CreateEmployeeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (emp: Employee) => void;
}

const DEFAULT_DEPARTMENTS_LIST = [
  'Engineering & Tech',
  'Human Resources',
  'Product & Design',
  'Sales & Marketing',
  'Finance & Operations',
  'Customer Support',
  'Quality Assurance & Testing',
];

const STANDARD_JOB_ROLES: Record<string, string[]> = {
  'Engineering & Tech': [
    'Senior Full Stack Engineer',
    'Frontend React Developer',
    'Backend Node / Go Architect',
    'DevOps & Cloud Specialist',
    'QA Automation Engineer',
  ],
  'Human Resources': [
    'HR Operations Specialist',
    'HR Business Partner (HRBP)',
    'Talent Acquisition Lead',
    'Payroll & Compliance Manager',
  ],
  'Product & Design': [
    'Lead UI/UX Product Designer',
    'Product Operations Manager',
    'Design System Specialist',
  ],
  'Sales & Marketing': [
    'Senior Enterprise Account Executive',
    'Growth & Marketing Manager',
    'Business Development Associate',
  ],
  'Finance & Operations': [
    'Senior Financial Analyst',
    'Statutory Compliance Lead',
    'Operations Coordinator',
  ],
  'Customer Support': [
    'Technical Support Lead',
    'Customer Success Specialist',
    'Client Solutions Engineer',
  ],
};

const DEFAULT_BRANCHES_LIST = [
  { name: 'Chennai Corporate HQ', city: 'Chennai', address: 'OMR IT Corridor, Perungudi, Chennai' },
  { name: 'Coimbatore Regional Office', city: 'Coimbatore', address: 'Cross Cut Road, Gandhipuram, Coimbatore' },
  { name: 'Madurai Regional Hub', city: 'Madurai', address: '80 Feet Road, KK Nagar, Madurai' },
  { name: 'Karur Office', city: 'Karur', address: 'Thanthonimalai, Karur' },
];

export const CreateEmployeeWizard: React.FC<CreateEmployeeWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addEmployee, departments: liveDepartments, branches: liveBranches, jobRoles: liveJobRoles } = useData();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Veyra@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Department & Role state
  const [departmentName, setDepartmentName] = useState('Engineering & Tech');
  const [selectedPresetRole, setSelectedPresetRole] = useState('Senior Full Stack Engineer');
  const [customDesignation, setCustomDesignation] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);

  const [branchName, setBranchName] = useState('Chennai Corporate HQ');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState('Chennai Corporate HQ, Tamil Nadu');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`);

  // Compute active available department choices
  const availableDepartments = useMemo(() => {
    const fromContext = (liveDepartments || []).map((d) => d.name);
    const combined = Array.from(new Set([...fromContext, ...DEFAULT_DEPARTMENTS_LIST]));
    return combined.filter(Boolean);
  }, [liveDepartments]);

  // Compute active available role choices for selected department
  const availableRolesForDept = useMemo(() => {
    const rolesFromContext = (liveJobRoles || [])
      .filter((r) => r.department_name === departmentName)
      .map((r) => r.title);
    const standard = STANDARD_JOB_ROLES[departmentName] || STANDARD_JOB_ROLES['Engineering & Tech'] || [];
    return Array.from(new Set([...rolesFromContext, ...standard]));
  }, [departmentName, liveJobRoles]);

  // Compute active available branch choices
  const availableBranches = useMemo(() => {
    if (liveBranches && liveBranches.length > 0) return liveBranches;
    return DEFAULT_BRANCHES_LIST.map((b, i) => ({ id: `b_${i}`, name: b.name, city: b.city, address: b.address, company_id: 'comp_veyra_tn' }));
  }, [liveBranches]);

  const effectiveDesignation = isCustomRole ? customDesignation : selectedPresetRole;

  const generateRandomPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newPwd = `Veyra#${randomDigits}`;
    setPassword(newPwd);
  };

  const copyPasswordOnly = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const cdnUrl = await uploadToCloudinary(file, 'employee_photos');
      setAvatarUrl(cdnUrl);
    } catch (err) {
      console.warn('Photo upload fallback active:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    // 1. Create real account in Firebase Authentication
    let firebaseUid: string | undefined = undefined;
    try {
      const fbUser = await registerFirebaseUser(email, password, `${firstName} ${lastName}`);
      if (fbUser?.uid) {
        firebaseUid = fbUser.uid;
      }
    } catch (fbErr) {
      console.warn('Firebase registration notice:', fbErr);
    }

    // 2. Add to DataContext & Supabase employees table
    const created = await addEmployee({
      profile_id: firebaseUid,
      company_id: 'comp_veyra_tn',
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password: password.trim(),
      designation: effectiveDesignation || 'Operations Specialist',
      department_name: departmentName,
      branch_name: branchName,
      joining_date: joiningDate,
      work_location: workLocation || `${branchName}, Tamil Nadu`,
      emergency_contact: emergencyContact,
      address,
      status: 'Active',
      avatar_url: avatarUrl,
    });

    // Save credentials to local credentials store for guaranteed login verification
    try {
      const creds = JSON.parse(localStorage.getItem('veyra_employee_credentials') || '{}');
      creds[email.trim().toLowerCase()] = password.trim();
      localStorage.setItem('veyra_employee_credentials', JSON.stringify(creds));
    } catch {}

    // 3. Create user record in Supabase profiles table
    try {
      await supabase.from('profiles').upsert({
        id: firebaseUid || created.id,
        company_id: 'comp_veyra_tn',
        email: email.trim(),
        full_name: `${firstName} ${lastName}`,
        role: 'employee',
        phone,
        branch_name: branchName,
        department_access: departmentName,
        avatar_url: avatarUrl,
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Supabase profile creation notice:', dbErr);
    }

    setLoading(false);
    onSuccess(created);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="text-center mb-6">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Onboard New Employee Profile</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Step {step} of 5: {step === 1 ? 'Personal & Login Credentials' : step === 2 ? 'Department & Role Selection' : step === 3 ? 'Branch & Work Location' : step === 4 ? 'Photo & Address' : 'Review & Confirm'}
        </p>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-veyra-blue' : s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 text-left">
        {/* STEP 1: Personal & Login */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                placeholder="e.g. Ramesh"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name *"
                placeholder="e.g. Manikandan"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Official Corporate Email *"
              type="email"
              placeholder="e.g. ramesh@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contact Phone Number"
              placeholder="e.g. +91 98400 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-800">Initial Login Password *</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-veyra-blue hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-generate
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set login password (min 6 characters)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium pr-10 focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-2 font-bold shadow-xs"
              disabled={!firstName || !lastName || !email || !password || password.length < 6}
              onClick={() => setStep(2)}
            >
              Next: Department & Role Selection
            </Button>
          </>
        )}

        {/* STEP 2: Department & Role Selection */}
        {step === 2 && (
          <>
            {/* Department Select */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-veyra-blue" />
                Select Department *
              </label>
              <select
                value={departmentName}
                onChange={(e) => {
                  setDepartmentName(e.target.value);
                  const firstRole = (STANDARD_JOB_ROLES[e.target.value] || [])[0] || 'Associate Specialist';
                  setSelectedPresetRole(firstRole);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              >
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Role / Designation Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-veyra-blue" />
                  Select Designation / Job Role *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomRole(!isCustomRole)}
                  className="text-[11px] font-bold text-veyra-blue hover:underline"
                >
                  {isCustomRole ? 'Choose from Presets' : '+ Type Custom Role'}
                </button>
              </div>

              {!isCustomRole ? (
                <select
                  value={selectedPresetRole}
                  onChange={(e) => setSelectedPresetRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                >
                  {availableRolesForDept.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  label=""
                  placeholder="e.g. Lead Cloud Architect / AI Engineer"
                  value={customDesignation}
                  onChange={(e) => setCustomDesignation(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Joining Date *"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
              />
              <Input
                label="Emergency Phone"
                placeholder="e.g. +91 98400 99999"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="w-1/3 bg-white" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                variant="primary" 
                className="w-2/3 font-bold shadow-xs" 
                disabled={!effectiveDesignation} 
                onClick={() => setStep(3)}
              >
                Next: Branch & Location
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Branch & Work Location */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-veyra-blue" />
                Assigned Operating Branch *
              </label>
              <select
                value={branchName}
                onChange={(e) => {
                  setBranchName(e.target.value);
                  const matched = availableBranches.find((b) => b.name === e.target.value);
                  if (matched) {
                    setWorkLocation(`${matched.name}, ${matched.city || 'Tamil Nadu'}`);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              >
                {availableBranches.map((b) => (
                  <option key={b.id || b.name} value={b.name}>
                    {b.name} ({b.city || 'Tamil Nadu'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-veyra-blue" />
                Physical Geofence Work Location
              </label>
              <input
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g. Chennai Corporate HQ, Tamil Nadu"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="w-1/3 bg-white" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" className="w-2/3 font-bold shadow-xs" onClick={() => setStep(4)}>
                Next: Photo & Address
              </Button>
            </div>
          </>
        )}

        {/* STEP 4: Photo & Address */}
        {step === 4 && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Profile Photo (Badge ID)</label>
              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-veyra-blue shadow-xs"
                />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={uploadingPhoto}
                    icon={<UploadCloud className="w-3.5 h-3.5" />}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold bg-white"
                  >
                    Upload Photo
                  </Button>
                  <p className="text-[10px] text-slate-400 mt-1">High-resolution headshot for Digital ID Badge</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Residential Address</label>
              <textarea
                rows={2}
                placeholder="e.g. Flat 4B, Anna Nagar West, Chennai - 600040"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="w-1/3 bg-white" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button variant="primary" className="w-2/3 font-bold shadow-xs" onClick={() => setStep(5)}>
                Next: Review & Confirm
              </Button>
            </div>
          </>
        )}

        {/* STEP 5: Review & Issue Credential */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center gap-3">
                <img src={avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-300" />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{firstName} {lastName}</h4>
                  <span className="text-slate-500 font-mono">{email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Role & Dept</span>
                  <span className="font-bold text-slate-800">{effectiveDesignation}</span>
                  <span className="text-slate-500 block">{departmentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Branch</span>
                  <span className="font-bold text-slate-800">{branchName}</span>
                  <span className="text-slate-500 block">{joiningDate}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase block font-mono">Employee Login Password</span>
                <span className="font-mono font-black text-blue-950 text-xs">{password}</span>
              </div>
              <button
                type="button"
                onClick={copyPasswordOnly}
                className="px-2 py-1 bg-white text-blue-700 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="w-1/3 bg-white" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button
                variant="primary"
                className="w-2/3 font-black shadow-md bg-emerald-600 hover:bg-emerald-700"
                loading={loading}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleComplete}
              >
                Confirm & Create Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
