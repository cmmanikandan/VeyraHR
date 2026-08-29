import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Printer, 
  Shield, 
  CheckCircle2, 
  Wifi, 
  Sparkles, 
  Building2, 
  Phone, 
  Award, 
  Cpu, 
  RotateCw,
  Heart,
  Calendar,
  MapPin,
  AlertCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Employee } from '../../types/database';

interface DigitalIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  companyName?: string;
}

export const DigitalIDCardModal: React.FC<DigitalIDCardModalProps> = ({
  isOpen,
  onClose,
  employee,
  companyName = 'VeyraHR Technologies',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `VeyraHR_ID_${cardSide.toUpperCase()}_${employee.employee_id || employee.id}.png`;
      link.click();
    } catch (err) {
      console.error('Download ID error:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const qrPayload = JSON.stringify({
    app: 'VeyraHR',
    employee: `${employee.first_name} ${employee.last_name}`,
    employee_id: employee.employee_id || employee.id,
    id: employee.id,
    email: employee.email,
    branch: employee.branch_name || 'Chennai HQ',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Official Employee Identity Badge</h3>
            <p className="text-[11px] text-slate-500 font-medium">Digital NFC & Optical Kiosk Pass</p>
          </div>

          {/* Front / Back Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setCardSide('front')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                cardSide === 'front' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setCardSide('back')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                cardSide === 'back' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Back
            </button>
          </div>
        </div>

        {/* ─── SHARP RECTANGULAR ENTERPRISE ID CARD ──── */}
        <div
          ref={cardRef}
          className="w-full bg-[#080D1A] text-white p-0 shadow-2xl relative overflow-hidden text-left border-2 border-slate-700 select-none rounded-none"
        >
          {/* Top Lanyard Slot Simulation */}
          <div className="bg-[#04060E] py-1.5 px-4 flex items-center justify-between border-b border-slate-800">
            <div className="w-16 h-1.5 bg-slate-700 mx-auto rounded-none" />
          </div>

          {/* Top Company & Security Header */}
          <div className="bg-gradient-to-r from-[#0C1E3D] via-[#162B55] to-[#0C1E3D] px-5 py-3 border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white p-1 flex items-center justify-center rounded-none shadow-md">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white tracking-wide uppercase">{companyName}</h4>
                <p className="text-[10px] text-cyan-300 font-semibold tracking-wider">Enterprise Security Pass</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px] font-bold bg-cyan-950/60 px-2 py-1 border border-cyan-500/30">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>RFID / NFC</span>
            </div>
          </div>

          {/* ─── FRONT SIDE ────────────────────────────────────────────── */}
          {cardSide === 'front' ? (
            <div className="p-5 space-y-3.5 bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#080D1A]">
              
              {/* Photo + Core Details */}
              <div className="flex items-center gap-4">
                {/* Photo Frame */}
                <div className="relative shrink-0">
                  <img
                    src={employee.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={employee.first_name}
                    className="w-24 h-28 object-cover border-2 border-cyan-400 shadow-xl rounded-none"
                  />
                  <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-emerald-500 text-[8px] font-black font-mono uppercase text-white shadow-xs">
                    Active
                  </div>
                </div>

                {/* Identity Info */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div>
                    <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">Employee Name</span>
                    <h3 className="text-lg font-black text-white leading-tight uppercase truncate">
                      {employee.first_name} {employee.last_name}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Designation</span>
                    <p className="text-xs font-semibold text-slate-200 truncate capitalize">
                      {employee.designation || 'Software Specialist'}
                    </p>
                  </div>

                  <div className="pt-0.5">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Employee Code</span>
                    <span className="px-2.5 py-0.5 bg-cyan-950/80 text-cyan-300 font-mono text-xs font-black border border-cyan-500/50 inline-block rounded-none">
                      {employee.employee_id || employee.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Department & Location Meta Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 border border-slate-800 rounded-none text-xs">
                <div>
                  <span className="text-slate-400 block font-mono uppercase font-bold text-[9px]">Department</span>
                  <span className="font-bold text-white truncate block">{employee.department_name || 'Engineering & Tech'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono uppercase font-bold text-[9px]">Work Location</span>
                  <span className="font-bold text-cyan-300 truncate block">{employee.work_location || 'Chennai HQ'}</span>
                </div>
              </div>

              {/* High Contrast QR Code */}
              <div className="p-4 bg-white border-2 border-cyan-400 flex items-center justify-center rounded-none shadow-xl">
                <QRCodeSVG
                  value={qrPayload}
                  size={175}
                  level="H"
                  includeMargin={false}
                  fgColor="#0A0F1D"
                />
              </div>

              {/* Security Verification Footer */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> FIDO2 & KIOSK ENABLED
                </span>
                <span>AUTH: VEY-{employee.id.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          ) : (
            /* ─── BACK SIDE ─────────────────────────────────────────────── */
            <div className="p-5 space-y-4 bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#080D1A] text-xs">
              
              {/* Medical & Emergency Contact Block */}
              <div className="bg-slate-900/90 p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-cyan-400 font-mono font-bold text-[10px] uppercase flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" /> Medical & Emergency
                  </span>
                  <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[9px] font-black font-mono">
                    BLOOD GROUP: {employee.blood_group || 'O+'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block">Emergency Contact</span>
                    <span className="font-bold text-white block">{employee.emergency_contact || '+91 98401 23456'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block">Joining Date</span>
                    <span className="font-mono font-bold text-slate-200 block">{employee.joining_date || '01/01/2026'}</span>
                  </div>
                </div>
              </div>

              {/* Corporate Headquarters Address */}
              <div className="bg-slate-900/90 p-3 border border-slate-800 space-y-1 text-[10px]">
                <span className="text-cyan-400 font-mono font-bold uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" /> Corporate Headquarters & Location
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {employee.address || `${employee.work_location || employee.branch_name || 'Chennai HQ Campus'}, Tamil Nadu, India`}
                </p>
                <p className="text-slate-400 font-mono text-[9px] pt-1">
                  Support: support@veyrahr.com • Tel: +91 44 2840 9000
                </p>
              </div>

              {/* Terms and Card Instructions */}
              <div className="p-2.5 bg-[#04060E] border border-slate-800 text-[8px] font-mono text-slate-400 leading-relaxed space-y-1">
                <p className="font-bold text-slate-300">CARD USAGE TERMS:</p>
                <p>1. This card is the property of VeyraHR Technologies Pvt Ltd and must be presented on demand.</p>
                <p>2. Loss of card must be reported immediately to HR Security Operations.</p>
                <p>3. Non-transferable. Valid till December 2028 unless revoked earlier.</p>
              </div>

              {/* Barcode Strip */}
              <div className="text-center pt-2">
                <div className="h-9 bg-white p-1 flex items-center justify-center">
                  <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px)]" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1 block">
                  *{employee.employee_id || employee.id}*
                </span>
              </div>
            </div>
          )}

          {/* Bottom Security Contact Bar */}
          <div className="bg-[#04060E] px-5 py-2 border-t border-slate-800 text-[8px] font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Property of {companyName}</span>
            <span>If found, return to HR Security</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button 
            variant="outline" 
            className="w-1/2 font-extrabold py-2.5 rounded-xl text-xs" 
            onClick={handlePrint} 
            icon={<Printer className="w-4 h-4" />}
          >
            Print Badge
          </Button>
          <Button 
            variant="primary" 
            className="w-1/2 font-extrabold py-2.5 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl text-xs" 
            onClick={handleDownload} 
            icon={<Download className="w-4 h-4" />}
          >
            Download {cardSide.toUpperCase()} PNG
          </Button>
        </div>
      </div>
    </Modal>
  );
};
