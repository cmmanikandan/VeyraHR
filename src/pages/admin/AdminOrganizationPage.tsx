import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  Sparkles,
  CreditCard,
  Users,
  Save,
  AlertCircle,
  Edit3,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { uploadToCloudinary } from '../../lib/cloudinary';

export const AdminOrganizationPage: React.FC = () => {
  const { company, setCompany } = useAuth();
  const { employees } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState(company?.name || 'VeyraHR Technologies Pvt Ltd');
  const [legalName, setLegalName] = useState('VeyraHR Enterprise Technologies India Private Limited');
  const [taxId, setTaxId] = useState('33AAAAA0000A1Z5 (GSTIN)');
  const [domain, setDomain] = useState('veyrahr.com');
  const [supportEmail, setSupportEmail] = useState('admin@veyrahr.com');
  const [phone, setPhone] = useState('+91 (44) 4500 8899');
  const [headquarters, setHeadquarters] = useState('VeyraHR Tech Tower, OMR IT Corridor, Chennai, TN 600096');
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await uploadToCloudinary(file);
      setLogoUrl(url);
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedComp = {
      ...(company || {}),
      id: company?.id || 'comp_veyra_default',
      name: companyName,
      legal_name: legalName,
      work_location: headquarters,
      support_email: supportEmail,
      phone: phone,
      logo_url: logoUrl,
    };
    if (setCompany) {
      setCompany(updatedComp);
    }
    localStorage.setItem('veyra_company_data', JSON.stringify(updatedComp));
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <form onSubmit={handleSave} className="space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">Organization Profile</h1>
              <Badge variant="blue" className="text-xs font-bold px-2.5 py-0.5">
                <Sparkles className="w-3 h-3 mr-1" /> Enterprise Plan
              </Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Manage legal entity credentials, corporate domain verification, and enterprise brand identity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3.5 py-2 rounded-xl font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Organization settings updated successfully!
              </div>
            )}

            {!isEditing ? (
              <Button
                type="button"
                variant="primary"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => setIsEditing(true)}
                className="font-bold shrink-0 shadow-xs"
              >
                Edit Organization Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="bg-white text-xs font-bold border-[#E8E2D9]"
                >
                  Cancel Edit
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  className="font-bold shadow-xs"
                >
                  Save Details
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* BRAND IDENTITY & LOGO */}
        <Card className="p-6 border-[#E8E2D9] space-y-6 bg-white">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#172033]">Corporate Branding</h3>
              <p className="text-xs text-[#64748B]">Update company logo and public identification assets.</p>
            </div>
            <Badge variant="gray">Cloudinary Storage Sync</Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-[#FCFAF7] border-2 border-dashed border-[#BFDBFE] p-3 flex items-center justify-center overflow-hidden">
                <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                  isEditing
                    ? 'bg-[#2563EB] hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={!isEditing || uploadingLogo}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-[#64748B]">
                Supported formats: PNG, SVG, JPG. Maximum file size: 5 MB. Click 'Edit Organization Profile' to unlock uploads.
              </p>
            </div>
          </div>
        </Card>

        {/* LEGAL & ENTITY INFORMATION */}
        <Card className="p-6 border-[#E8E2D9] space-y-6 bg-white">
          <div className="border-b border-[#E8E2D9] pb-4">
            <h3 className="text-base font-extrabold text-[#172033]">Legal Entity & Registration</h3>
            <p className="text-xs text-[#64748B]">Official corporate details registered with regulatory authorities.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Display Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Registered Legal Name
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Tax Identification Number (GSTIN / EIN)
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Corporate Primary Domain
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Corporate Support Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Headquarters Telephone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Headquarters Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="text"
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SUBSCRIPTION METRICS SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-5 border-[#E8E2D9] bg-white text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#64748B] block">Subscription Tier</span>
                <span className="text-sm font-extrabold text-[#172033]">Enterprise SaaS</span>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">Unlimited branches, custom SLA, dedicated account manager.</p>
          </Card>

          <Card className="p-5 border-[#E8E2D9] bg-white text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#64748B] block">Active Workforce Staff</span>
                <span className="text-sm font-extrabold text-[#172033]">{employees.length} Registered Staff</span>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">Active employees provisioned in your organization workspace.</p>
          </Card>

          <Card className="p-5 border-[#E8E2D9] bg-white text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#64748B] block">Security Compliance</span>
                <span className="text-sm font-extrabold text-[#172033]">SOC2 Type II & ISO 27001</span>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">Automated audit logging and end-to-end data encryption.</p>
          </Card>
        </div>

        {/* SAVE SUBMIT BUTTON (Only shown when editing) */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="bg-white text-xs font-bold border-[#E8E2D9]"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />} className="font-bold">
              Save Organization Details
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
