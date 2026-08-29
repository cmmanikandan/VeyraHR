import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Shield, CheckCircle2, Wifi, Sparkles, Building2, Phone, Award, Cpu } from 'lucide-react';
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

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `VeyraHR_ID_${employee.employee_id || employee.id}.png`;
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
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center space-y-4">
        
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Official Employee Identity Pass</h3>
          <p className="text-xs text-slate-500 font-medium">Enterprise biometric credential & optical kiosk pass</p>
        </div>

        {/* ─── SHARP RECTANGULAR ENTERPRISE ID CARD (NO ROUNDED CORNERS) ──── */}
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

          {/* Card Body */}
          <div className="p-5 space-y-3.5 bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#080D1A]">
            
            {/* Top Row: Photo + Core Details */}
            <div className="flex items-center gap-4">
              {/* Photo Frame (Sharp Rectangular) */}
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

            {/* ─── BIG HIGH-CONTRAST QR CODE (FULL WIDTH & HIGH RES) ────────── */}
            <div className="p-4 bg-white border-2 border-cyan-400 flex items-center justify-center rounded-none shadow-xl">
              <QRCodeSVG
                value={qrPayload}
                size={185}
                level="H"
                includeMargin={false}
                fgColor="#0A0F1D"
              />
            </div>

            {/* Security Verification Footer Strip */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> FIDO2 & KIOSK ENABLED
              </span>
              <span>AUTH CODE: VEY-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>

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
            Print Pass
          </Button>
          <Button 
            variant="primary" 
            className="w-1/2 font-extrabold py-2.5 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl text-xs" 
            onClick={handleDownload} 
            icon={<Download className="w-4 h-4" />}
          >
            Download PNG
          </Button>
        </div>
      </div>
    </Modal>
  );
};
