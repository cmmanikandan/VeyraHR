import React, { useState, useRef } from 'react';
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
  Check 
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

export const CreateEmployeeWizard: React.FC<CreateEmployeeWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addEmployee, departments, branches } = useData();
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

  const [designation, setDesignation] = useState('');
  const [departmentName, setDepartmentName] = useState('Engineering & Tech');
  const [branchName, setBranchName] = useState('Chennai HQ');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState('Chennai HQ, Tamil Nadu');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`);

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
      designation,
      department_name: departmentName,
      branch_name: branchName,
      joining_date: joiningDate,
      work_location: workLocation,
      emergency_contact: emergencyContact,
      address,
      status: 'Active',
      avatar_url: avatarUrl,
    });

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
        <h3 className="text-xl font-extrabold text-veyra-text tracking-tight">Add New Employee Profile</h3>
        <p className="text-xs text-veyra-text-sub font-medium mt-0.5">
          Step {step} of 5: {step === 1 ? 'Personal & Login Credentials' : step === 2 ? 'Employment Info' : step === 3 ? 'Department & Branch' : step === 4 ? 'Photo & Address' : 'Review & Issue Credential'}
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
        {/* STEP 1: Personal & Login Credentials */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                placeholder="e.g. Michael"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name *"
                placeholder="e.g. Vance"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Work Email Address *"
              type="email"
              placeholder="michael.vance@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mobile Phone *"
              placeholder="+91 98401 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            {/* Login Password Input Field */}
            <div className="space-y-1.5 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-veyra-text flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-veyra-blue" /> Login Password *
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-veyra-blue hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set login password (min 6 characters)"
                  className="w-full rounded-xl border border-veyra-border bg-white px-3.5 py-2.5 text-xs text-veyra-text font-medium pr-10 focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-veyra-text-sub hover:text-veyra-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-veyra-text-sub">
                This password will be used by the employee to log in to the employee portal.
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full mt-2 font-bold shadow-xs"
              disabled={!firstName || !lastName || !email || !password || password.length < 6}
              onClick={() => setStep(2)}
            >
              Next: Employment Information
            </Button>
          </>
        )}

        {/* STEP 2: Employment Info */}
        {step === 2 && (
          <>
            <Input
              label="Job Designation / Title *"
              placeholder="e.g. Senior Software Engineer"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Joining Date *"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
              />
              <Input
                label="Primary Work Location *"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="w-1/3 bg-white" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" className="w-2/3 font-bold shadow-xs" disabled={!designation} onClick={() => setStep(3)}>
                Next: Department & Branch
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Department & Branch */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-xs font-semibold text-veyra-text mb-1">Assigned Department *</label>
              <select
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full rounded-xl border border-veyra-border bg-white px-3.5 py-2.5 text-xs text-veyra-text font-medium"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-veyra-text mb-1">Assigned Branch *</label>
              <select
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full rounded-xl border border-veyra-border bg-white px-3.5 py-2.5 text-xs text-veyra-text font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
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
              <label className="block text-xs font-semibold text-veyra-text mb-1.5">Profile Photo (Cloudinary)</label>
              <div className="flex items-center gap-4 p-3.5 bg-white border border-veyra-border rounded-2xl">
                <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover border border-veyra-border shadow-2xs" />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    icon={<UploadCloud className="w-3.5 h-3.5 text-veyra-blue" />}
                    className="bg-white text-xs font-bold"
                  >
                    Upload Photo
                  </Button>
                  <span className="text-[10px] text-veyra-text-sub block mt-1">Cloudinary CDN Storage</span>
                </div>
              </div>
            </div>

            <Input
              label="Emergency Contact & Phone"
              placeholder="e.g. Spouse / Parent (+91 98400 11111)"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />

            <Input
              label="Residential Address"
              placeholder="Door No, Street, City, PIN"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="w-1/3 bg-white" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button variant="primary" className="w-2/3 font-bold shadow-xs" onClick={() => setStep(5)}>
                Review & Issue Credential
              </Button>
            </div>
          </>
        )}

        {/* STEP 5: Review & Issue Credential */}
        {step === 5 && (
          <>
            <div className="p-4 bg-veyra-bg-secondary rounded-2xl border border-veyra-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-veyra-text-sub">Employee Name:</span>
                <span className="font-bold text-veyra-text">{firstName} {lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-veyra-text-sub">Work Email:</span>
                <span className="font-bold text-veyra-text">{email}</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50/80 p-2 rounded-xl border border-blue-100">
                <span className="text-veyra-blue font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Login Password:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-veyra-text bg-white px-2 py-0.5 rounded border border-blue-200">
                    {password}
                  </span>
                  <button
                    type="button"
                    onClick={copyPasswordOnly}
                    className="p-1 rounded-lg hover:bg-blue-100 text-veyra-blue transition-colors flex items-center gap-1 text-[11px] font-semibold"
                    title="Copy Password Only"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied Password!' : 'Copy Password'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-veyra-text-sub">Designation:</span>
                <span className="font-bold text-veyra-text">{designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-veyra-text-sub">Department & Branch:</span>
                <span className="font-bold text-veyra-blue">{departmentName} • {branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-veyra-text-sub">Auto Employee ID:</span>
                <span className="font-mono font-bold text-emerald-600">VEY-EMP-AUTO</span>
              </div>
            </div>

            <div className="p-3 bg-veyra-success-bg border border-emerald-200 rounded-xl text-xs text-veyra-success font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Will create employee login profile and issue Digital ID Card.</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="w-1/3 bg-white" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button variant="primary" className="w-2/3 font-bold shadow-xs" loading={loading} onClick={handleComplete}>
                Create Employee & Issue ID
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
