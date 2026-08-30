import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  CreditCard 
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Employee } from '../../types/database';
import { VeyraBrandHeader } from '../common/VeyraBrandHeader';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  month?: string;
  year?: number;
  payrollData?: {
    baseSalary?: number;
    hra?: number;
    specialAllowance?: number;
    conveyance?: number;
    overtimeEarnings?: number;
    performanceBonus?: number;
    pfDeduction?: number;
    professionalTax?: number;
    tdsTax?: number;
    medicalInsurance?: number;
    leaveDeductions?: number;
    totalDeductions?: number;
    grossSalary?: number;
    netPayable?: number;
    daysPresent?: number;
    totalWorkingDays?: number;
    lopDays?: number;
    bankRef?: string;
    paymentDate?: string;
    paymentMode?: string;
  };
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  employee,
  month = 'August 2026',
  payrollData,
}) => {
  // Dynamic earnings breakdown
  const basicPay = payrollData?.baseSalary ?? 48000;
  const hra = payrollData?.hra ?? 19200;
  const specialAllowance = payrollData?.specialAllowance ?? 12800;
  const conveyance = payrollData?.conveyance ?? 4000;
  const overtimeEarnings = payrollData?.overtimeEarnings ?? 0;
  const performanceBonus = payrollData?.performanceBonus ?? 0;
  const grossEarnings = payrollData?.grossSalary ?? (basicPay + hra + specialAllowance + conveyance + overtimeEarnings + performanceBonus);

  // Dynamic deductions breakdown
  const pf = payrollData?.pfDeduction ?? 5760;
  const professionalTax = payrollData?.professionalTax ?? 200;
  const tds = payrollData?.tdsTax ?? 3500;
  const medicalInsurance = payrollData?.medicalInsurance ?? 1200;
  const leaveDeductions = payrollData?.leaveDeductions ?? 0;
  const totalDeductions = payrollData?.totalDeductions ?? (pf + professionalTax + tds + medicalInsurance + leaveDeductions);

  const netSalary = payrollData?.netPayable ?? (grossEarnings - totalDeductions);
  const bankRef = payrollData?.bankRef || `HDFC-NEFT-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const paymentDate = payrollData?.paymentDate || `31 ${month.slice(0, 3)} 2026`;
  const daysPresent = payrollData?.daysPresent ?? 22;
  const totalWorkingDays = payrollData?.totalWorkingDays ?? 22;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-5 text-left p-1" id="printable-payslip">
        
        {/* Company Header & Title */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <VeyraBrandHeader size="sm" className="mb-1" />
            <p className="text-[10px] text-slate-500 font-medium">
              VeyraHR Technologies Pvt Ltd • OMR IT Expressway, Chennai, TN
            </p>
            <p className="text-[10px] text-slate-400 font-mono">CIN: U72200TN2024PTC158920</p>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-extrabold border border-blue-200 block">
              PAYSLIP: {month}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Paid via Direct Deposit</span>
          </div>
        </div>

        {/* Employee & Bank Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Name</span>
            <span className="font-extrabold text-slate-900 mt-0.5 block">{employee.first_name} {employee.last_name}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee ID</span>
            <span className="font-extrabold text-blue-600 font-mono mt-0.5 block">{employee.employee_id}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
            <span className="font-bold text-slate-800 mt-0.5 block truncate">{employee.designation || 'Operations Specialist'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Joining Date</span>
            <span className="font-bold text-slate-800 mt-0.5 block font-mono">{employee.joining_date || '2024-03-01'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Account</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">
              {employee.bank_account ? `•••• ${employee.bank_account.slice(-4)}` : 'HDFC •••• 4928'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">IFSC / Branch</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{employee.ifsc_code || 'HDFC0000240'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Muster</span>
            <span className="font-mono font-bold text-emerald-700 mt-0.5 block">{daysPresent} / {totalWorkingDays} Days</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Transaction Ref</span>
            <span className="font-mono font-bold text-slate-700 mt-0.5 block truncate">{bankRef}</span>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Earnings Column */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-emerald-50/70 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">Earnings (Credits)</span>
              <span className="text-xs font-extrabold text-emerald-800">Amount (₹)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs p-3 space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Basic Salary</span>
                <span className="font-mono font-semibold">₹{basicPay.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1.5">
                <span>House Rent Allowance (HRA)</span>
                <span className="font-mono font-semibold">₹{hra.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1.5">
                <span>Special Allowance</span>
                <span className="font-mono font-semibold">₹{specialAllowance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1.5">
                <span>Conveyance Allowance</span>
                <span className="font-mono font-semibold">₹{conveyance.toLocaleString('en-IN')}</span>
              </div>
              {overtimeEarnings > 0 && (
                <div className="flex justify-between text-blue-700 pt-1.5">
                  <span>Overtime Hours Incentive</span>
                  <span className="font-mono font-semibold">₹{overtimeEarnings.toLocaleString('en-IN')}</span>
                </div>
              )}
              {performanceBonus > 0 && (
                <div className="flex justify-between text-emerald-700 pt-1.5">
                  <span>Performance Incentive</span>
                  <span className="font-mono font-semibold">₹{performanceBonus.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between text-xs font-extrabold text-slate-900">
              <span>Gross Earnings</span>
              <span className="text-emerald-700 font-mono">₹{grossEarnings.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-rose-50/70 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">Deductions (Debits)</span>
              <span className="text-xs font-extrabold text-rose-800">Amount (₹)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs p-3 space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Provident Fund (EPF 12%)</span>
                <span className="font-mono font-semibold">₹{pf.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1.5">
                <span>Professional Tax (PT)</span>
                <span className="font-mono font-semibold">₹{professionalTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1.5">
                <span>Tax Deducted at Source (TDS)</span>
                <span className="font-mono font-semibold">₹{tds.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1.5">
                <span>Group Medical Insurance</span>
                <span className="font-mono font-semibold">₹{medicalInsurance.toLocaleString('en-IN')}</span>
              </div>
              {leaveDeductions > 0 && (
                <div className="flex justify-between text-rose-700 pt-1.5">
                  <span>Leave / Absence LOP Deductions</span>
                  <span className="font-mono font-semibold">-₹{leaveDeductions.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between text-xs font-extrabold text-slate-900">
              <span>Total Deductions</span>
              <span className="text-rose-700 font-mono">₹{totalDeductions.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Highlight Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">Net Take-Home Salary</span>
            <span className="text-2xl font-black font-mono mt-0.5 block">
              ₹{netSalary.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-right text-xs">
            <span className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 inline-flex items-center gap-1.5 text-blue-100 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Direct Disbursal Verified
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Download & Print Payslip PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};
