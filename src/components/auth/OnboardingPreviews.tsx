import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

interface PreviewsProps {
  companyName: string;
  shortName?: string;
  logoUrl?: string;
  supportEmail?: string;
}

export const NavbarPreview: React.FC<PreviewsProps> = ({
  companyName,
  shortName,
  logoUrl,
}) => {
  return (
    <div className="w-full rounded-2xl border border-veyra-border bg-white shadow-xs p-3 select-none">
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#2563EB] text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shadow-2xs shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
            ) : (
              <span className="font-extrabold text-xs text-[#2563EB]">
                {shortName || 'V'}
              </span>
            )}
          </div>
          <div>
            <span className="font-extrabold text-xs text-white tracking-tight block leading-tight">
              {companyName || 'VeyraHR Workspace'}
            </span>
            <span className="text-[9px] text-blue-100 font-semibold uppercase tracking-wider block">
              Enterprise Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/90 font-semibold">
          <span className="hidden sm:inline">Attendance</span>
          <span className="hidden sm:inline">Leave</span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs border border-white/30">
            A
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginPreview: React.FC<PreviewsProps> = ({
  companyName,
  shortName,
  logoUrl,
}) => {
  return (
    <div className="w-full rounded-2xl border border-veyra-border bg-[#FCFAF7] p-5 text-center select-none shadow-xs max-w-sm mx-auto">
      <div className="w-10 h-10 rounded-2xl bg-white p-1.5 mx-auto mb-2 shadow-2xs border border-veyra-border flex items-center justify-center">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
        ) : (
          <span className="font-extrabold text-sm text-[#2563EB]">
            {shortName || 'V'}
          </span>
        )}
      </div>
      <h5 className="text-xs font-extrabold text-veyra-text tracking-tight">
        {companyName || 'VeyraHR Workspace'}
      </h5>
      <p className="text-[10px] text-veyra-text-sub mt-0.5 mb-3">
        Sign in to access your organization portal
      </p>

      <div className="space-y-2 text-left">
        <div className="p-2 bg-white rounded-lg border border-veyra-border text-[10px] text-veyra-text-sub flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-veyra-text-muted" /> name@company.com
        </div>
        <div className="p-2 bg-white rounded-lg border border-veyra-border text-[10px] text-veyra-text-sub flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-veyra-text-muted" /> ••••••••••••
        </div>
        <button
          type="button"
          className="w-full py-2 rounded-lg text-[11px] font-bold text-white bg-[#2563EB] hover:bg-blue-700 shadow-2xs transition-colors"
        >
          Sign In to Workspace
        </button>
      </div>
    </div>
  );
};

export const IDCardPreview: React.FC<PreviewsProps> = ({
  companyName,
  shortName,
  logoUrl,
}) => {
  return (
    <div className="w-full max-w-xs mx-auto p-4 rounded-2xl bg-gradient-to-b from-[#163A63] to-[#0F2947] text-white shadow-md relative overflow-hidden select-none border border-blue-900/40">
      <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-4 h-4 object-contain" />
            ) : (
              <span className="font-extrabold text-[10px] text-[#2563EB]">
                {shortName || 'V'}
              </span>
            )}
          </div>
          <span className="text-xs font-extrabold truncate max-w-[140px]">
            {companyName || 'VeyraHR'}
          </span>
        </div>
        <ShieldCheck className="w-4 h-4 text-blue-300" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
          alt="Employee"
          className="w-12 h-12 rounded-xl object-cover border-2 border-white/40 shadow-xs shrink-0"
        />
        <div>
          <p className="text-xs font-extrabold leading-tight">Sarah Jenkins</p>
          <p className="text-[10px] text-blue-200">Administrator</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-500/30 text-white font-mono font-bold text-[9px] border border-blue-400/30">
            VEY-EMP-0001
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/15 p-2 rounded-xl border border-white/10 text-[9px]">
        <div>
          <span className="text-blue-200 block uppercase tracking-wider text-[8px] font-semibold">Department</span>
          <span className="font-bold text-white">Operations</span>
        </div>
        <div className="bg-white p-1 rounded-lg">
          <QRCodeSVG value="https://veyrahr.com/verify?id=VEY-EMP-0001" size={32} />
        </div>
      </div>
    </div>
  );
};
