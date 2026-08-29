import React, { useState } from 'react';
import { Building2, Globe, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';

interface CompanyOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CompanyOnboardingModal: React.FC<CompanyOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setCompany, setProfile, setCurrentRole } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Company Profile
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [companySize, setCompanySize] = useState('20-100 Employees');
  const [workLocation, setWorkLocation] = useState('San Francisco HQ');
  const [timezone, setTimezone] = useState('PST (UTC-8)');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 06:00 PM');

  // Step 2: HR Manager Profile
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const compId = `comp_${Date.now()}`;
    const newCompany = {
      id: compId,
      name: companyName || 'New Enterprise Corp',
      industry,
      company_size: companySize,
      work_location: workLocation,
      timezone,
      working_hours: workingHours,
    };

    setCompany(newCompany);
    setProfile({
      id: `admin_${Date.now()}`,
      company_id: compId,
      email: adminEmail || 'hr@company.com',
      full_name: adminName || 'Admin Manager',
      role: 'admin',
    });
    setCurrentRole('admin');

    setLoading(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-veyra-blue-soft text-veyra-blue flex items-center justify-center mx-auto mb-2 border border-veyra-blue-border/40">
          <Building2 className="w-6 h-6 text-veyra-blue" />
        </div>
        <h3 className="text-xl font-bold text-veyra-text tracking-tight">Organization Setup</h3>
        <p className="text-xs text-veyra-text-sub mt-0.5">
          {step === 1 ? 'Step 1 of 2: Configure your company workspace' : 'Step 2 of 2: Setup initial Administrator profile'}
        </p>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
        {step === 1 ? (
          <>
            <Input
              label="Company Legal Name"
              placeholder="e.g. Acme Global Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-veyra-text mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-veyra-border bg-white px-3 py-2.5 text-xs text-veyra-text focus:ring-2 focus:ring-veyra-blue/20"
                >
                  <option>Technology & Software</option>
                  <option>Financial Services</option>
                  <option>Healthcare & Pharma</option>
                  <option>Manufacturing & Logistics</option>
                  <option>Professional Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-veyra-text mb-1">Company Size</label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full rounded-xl border border-veyra-border bg-white px-3 py-2.5 text-xs text-veyra-text focus:ring-2 focus:ring-veyra-blue/20"
                >
                  <option>1-20 Employees</option>
                  <option>20-100 Employees</option>
                  <option>100-500 Employees</option>
                  <option>500+ Enterprise</option>
                </select>
              </div>
            </div>

            <Input
              label="Primary Work Location / HQ"
              placeholder="e.g. San Francisco HQ"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              icon={<Globe className="w-4 h-4" />}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                icon={<Clock className="w-4 h-4" />}
              />
              <Input
                label="Default Shift Hours"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" icon={<ArrowRight className="w-4 h-4" />}>
              Continue to Admin Setup
            </Button>
          </>
        ) : (
          <>
            <Input
              label="Admin Full Name"
              placeholder="e.g. Sarah Jenkins"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
            />

            <Input
              label="Admin Work Email"
              type="email"
              placeholder="admin@company.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />

            <div className="p-3.5 rounded-xl bg-veyra-bg-secondary border border-veyra-border text-xs text-veyra-text-sub space-y-1.5">
              <p className="font-semibold text-veyra-text flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-veyra-blue" /> Automated Workspace Provisioning
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Generates default Leave Policies & Shift templates</li>
                <li>Configures Dynamic QR Security & GPS Radius verification</li>
                <li>Provisions Admin & HR Manager permissions</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                Back
              </Button>
              <Button type="submit" variant="primary" loading={loading} className="w-2/3">
                Complete Setup & Enter Workspace
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
