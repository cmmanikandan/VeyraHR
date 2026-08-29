import React, { useState } from 'react';
import { 
  Settings, 
  Clock, 
  Shield, 
  QrCode, 
  MapPin, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Bell, 
  Key,
  Globe,
  Edit3
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const AdminCompanySettingsPage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [gracePeriod, setGracePeriod] = useState('15');
  const [qrRefreshRate, setQrRefreshRate] = useState('30');
  const [geofenceEnforced, setGeofenceEnforced] = useState(true);
  const [autoApproveLeaves, setAutoApproveLeaves] = useState(false);
  const [workingDays, setWorkingDays] = useState('Mon - Fri (5 Days)');
  const [overtimeThreshold, setOvertimeThreshold] = useState('8.0');
  const [mfaRequired, setMfaRequired] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://api.veyrahr.com/webhooks/security-audit');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">Company Policy Settings</h1>
              <Badge variant="blue">System Rules Governance</Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Configure attendance grace thresholds, anti-proxy dynamic QR security timer, and overtime rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3.5 py-2 rounded-xl font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Company policy settings updated!
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
                Edit Policy Settings
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
                  Save Policies
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ATTENDANCE & SHIFT GOVERNANCE */}
        <Card className="p-6 border-[#E8E2D9] bg-white space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#172033]">Attendance & Grace Policy</h3>
              <p className="text-xs text-[#64748B]">Configure check-in tolerance and late penalties.</p>
            </div>
            <Clock className="w-5 h-5 text-[#2563EB]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Check-in Grace Period (Minutes)
              </label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Check-ins within 15 minutes of shift start will not be marked as Late.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Standard Working Schedule
              </label>
              <select
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
              >
                <option value="Mon - Fri (5 Days)">Mon - Fri (5 Days / 40 Hours)</option>
                <option value="Mon - Sat (6 Days)">Mon - Sat (6 Days / 48 Hours)</option>
                <option value="Alternate Saturdays">Alternate Saturdays (5.5 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Overtime Threshold (Hours / Day)
              </label>
              <input
                type="text"
                value={overtimeThreshold}
                onChange={(e) => setOvertimeThreshold(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Hours worked beyond 8.0 hours automatically calculate overtime multiplier (1.5x).
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FCFAF7] border border-[#E8E2D9]">
              <div>
                <span className="text-xs font-extrabold text-[#172033] block">Auto-Approve Casual Leaves</span>
                <span className="text-[11px] text-[#64748B] block">Approve 1-day casual leave requests automatically</span>
              </div>
              <input
                type="checkbox"
                checked={autoApproveLeaves}
                onChange={(e) => setAutoApproveLeaves(e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* ANTI-PROXY & DYNAMIC QR SECURITY */}
        <Card className="p-6 border-[#E8E2D9] bg-white space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#172033]">Anti-Proxy & QR Security Rules</h3>
              <p className="text-xs text-[#64748B]">Sliding token dynamic QR refresh and GPS boundary enforcement.</p>
            </div>
            <QrCode className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Dynamic QR Token Refresh Interval (Seconds)
              </label>
              <input
                type="number"
                value={qrRefreshRate}
                onChange={(e) => setQrRefreshRate(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Static screenshot sharing becomes invalid every 30 seconds.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FCFAF7] border border-[#E8E2D9]">
              <div>
                <span className="text-xs font-extrabold text-[#172033] block">Strict GPS Geofence Check</span>
                <span className="text-[11px] text-[#64748B] block">Require employee device GPS inside branch radius</span>
              </div>
              <input
                type="checkbox"
                checked={geofenceEnforced}
                onChange={(e) => setGeofenceEnforced(e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* SECURITY & WEBHOOKS */}
        <Card className="p-6 border-[#E8E2D9] bg-white space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#172033]">Enterprise Security & Webhooks</h3>
              <p className="text-xs text-[#64748B]">Multi-Factor Authentication and webhook notification endpoints.</p>
            </div>
            <Shield className="w-5 h-5 text-purple-600" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FCFAF7] border border-[#E8E2D9]">
              <div>
                <span className="text-xs font-extrabold text-[#172033] block">Enforce Multi-Factor Auth (MFA)</span>
                <span className="text-[11px] text-[#64748B] block">Require 2FA verification for all Admin & HR Manager accounts</span>
              </div>
              <input
                type="checkbox"
                checked={mfaRequired}
                onChange={(e) => setMfaRequired(e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1.5">
                Audit Event Security Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#FCFAF7] disabled:text-[#475569] disabled:cursor-not-allowed bg-white"
              />
            </div>
          </div>
        </Card>

        {/* SAVE BUTTON (Only shown when editing) */}
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
              Save Company Policies
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
