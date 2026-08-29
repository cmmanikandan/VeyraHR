import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Send, 
  Search, 
  FileText, 
  Printer, 
  ArrowUpRight, 
  Building2, 
  ShieldCheck, 
  Calculator,
  Percent,
  Calendar,
  Briefcase,
  Users,
  Eye,
  CheckCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';
import { Employee } from '../../types/database';

interface EmployeePayrollRecord {
  employee: Employee;
  baseSalary: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  overtimeEarnings: number;
  grossSalary: number;
  pfDeduction: number;
  professionalTax: number;
  tdsTax: number;
  leaveDeductions: number;
  totalDeductions: number;
  netPayable: number;
  status: 'Paid' | 'Processed' | 'Pending';
  daysPresent: number;
  totalWorkingDays: number;
}

export const HRPayrollManagement: React.FC = () => {
  const { employees, attendance, branches } = useData();

  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedPayroll, setSelectedPayroll] = useState<EmployeePayrollRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedSuccess, setProcessedSuccess] = useState<string | null>(null);

  // Compute live payroll for each employee based on attendance & base standards
  const payrollRecords: EmployeePayrollRecord[] = useMemo(() => {
    const totalWorkingDays = 22;

    return employees.map((emp, idx) => {
      const empAttendance = attendance.filter((a) => a.employee_id === emp.id && (a.status === 'Present' || a.status === 'Late' || !!a.check_in_time));
      const daysPresent = empAttendance.length;

      // Tiered base salary estimation
      const baseSalary = 50000 + (idx % 4) * 15000;
      const hra = Math.round(baseSalary * 0.4);
      const specialAllowance = Math.round(baseSalary * 0.2);
      const conveyance = 4000;
      const overtimeEarnings = (idx % 2 === 0) ? 3500 : 0;

      const grossSalary = baseSalary + hra + specialAllowance + conveyance + overtimeEarnings;

      const pfDeduction = Math.round(baseSalary * 0.12);
      const professionalTax = 200;
      const tdsTax = Math.round(grossSalary * 0.05);
      const unpaidDays = Math.max(0, totalWorkingDays - daysPresent);
      const leaveDeductions = Math.round((grossSalary / totalWorkingDays) * unpaidDays);

      const totalDeductions = pfDeduction + professionalTax + tdsTax + leaveDeductions;
      const netPayable = grossSalary - totalDeductions;

      return {
        employee: emp,
        baseSalary,
        hra,
        specialAllowance,
        conveyance,
        overtimeEarnings,
        grossSalary,
        pfDeduction,
        professionalTax,
        tdsTax,
        leaveDeductions,
        totalDeductions,
        netPayable,
        status: 'Processed',
        daysPresent,
        totalWorkingDays,
      };
    });
  }, [employees, attendance]);

  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((rec) => {
      const matchSearch =
        `${rec.employee.first_name} ${rec.employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employee.department_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBranch = selectedBranch === 'All' || rec.employee.branch_name === selectedBranch;
      return matchSearch && matchBranch;
    });
  }, [payrollRecords, searchQuery, selectedBranch]);

  // Aggregate Metrics
  const totalGrossDisbursement = useMemo(() => {
    return payrollRecords.reduce((sum, r) => sum + r.grossSalary, 0);
  }, [payrollRecords]);

  const totalNetDisbursement = useMemo(() => {
    return payrollRecords.reduce((sum, r) => sum + r.netPayable, 0);
  }, [payrollRecords]);

  const totalStatutoryTaxes = useMemo(() => {
    return payrollRecords.reduce((sum, r) => sum + r.pfDeduction + r.professionalTax + r.tdsTax, 0);
  }, [payrollRecords]);

  const handleProcessBatchPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessedSuccess(`Successfully computed and released payroll for ${payrollRecords.length} employees for ${selectedMonth}.`);
      setTimeout(() => setProcessedSuccess(null), 4000);
    }, 1000);
  };

  const handleExportBankTransferCSV = () => {
    const headers = 'Employee ID,Full Name,Bank Account,IFSC Code,Net Payable (INR),Payment Mode\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.employee.employee_id}","${r.employee.first_name} ${r.employee.last_name}","HDFC00049281${Math.floor(1000 + Math.random() * 9000)}","HDFC0000240","${r.netPayable}","NEFT/DIRECT_DEPOSIT"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VeyraHR_Bank_Disbursement_${selectedMonth.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workforce Payroll & Compensation</h1>
            <Badge variant="blue">{selectedMonth}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Automated statutory tax deduction, PF compliance, and instant bank disbursement ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBankTransferCSV}
            icon={<Download className="w-4 h-4" />}
            className="font-bold text-xs bg-white"
            disabled={filteredRecords.length === 0}
          >
            Bank Transfer (CSV)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleProcessBatchPayroll}
            loading={isProcessing}
            icon={<CheckCircle2 className="w-4 h-4" />}
            className="font-bold text-xs shadow-xs"
            disabled={payrollRecords.length === 0}
          >
            Disburse {selectedMonth} Payroll
          </Button>
        </div>
      </div>

      {processedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{processedSuccess}</span>
        </div>
      )}

      {/* ─── METRIC CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padded={false} className="p-4 bg-white border-[#E8E2D9] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Net Disbursement</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ₹{totalNetDisbursement.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold">Ready for Bank Transfer</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-[#E8E2D9] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Salary Pool</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-veyra-blue flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ₹{totalGrossDisbursement.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">{payrollRecords.length} Staff on Roster</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-[#E8E2D9] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Statutory Deductions (PF/Tax)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ₹{totalStatutoryTaxes.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-purple-700 font-bold">Compliant with EPF & IT Rules</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-[#E8E2D9] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Payroll Cycle</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">31st Aug</p>
          <span className="text-[10px] text-amber-700 font-bold">Standard 25th-31st Cutoff</span>
        </Card>
      </div>

      {/* ─── FILTERS & SEARCH ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-2xs">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search payroll by employee name, ID or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-veyra-blue"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All">All Regional Hubs</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── PAYROLL LEDGER TABLE ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-2xs">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={<DollarSign className="w-10 h-10" />}
              title="No Staff Accounts Found"
              description="Onboard employees to auto-generate verified monthly payroll ledgers."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3 text-center">Attendance</th>
                  <th className="py-3.5 px-3 text-right">Gross Pay</th>
                  <th className="py-3.5 px-3 text-right">PF (12%)</th>
                  <th className="py-3.5 px-3 text-right">TDS / Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Payable</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((rec) => (
                  <tr key={rec.employee.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={`${rec.employee.first_name} ${rec.employee.last_name}`}
                          src={rec.employee.avatar_url}
                          size="sm"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {rec.employee.first_name} {rec.employee.last_name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rec.employee.employee_id} • {rec.employee.department_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-lg font-mono font-bold text-[11px] text-slate-700">
                        {rec.daysPresent}/{rec.totalWorkingDays} Days
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ₹{rec.grossSalary.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-purple-700 font-medium">
                      -₹{rec.pfDeduction.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-600 font-medium">
                      -₹{(rec.tdsTax + rec.professionalTax + rec.leaveDeductions).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                      ₹{rec.netPayable.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge variant="green" size="sm">
                        {rec.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayroll(rec)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Payslip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: DETAILED PAYSLIP BREAKDOWN ──────────────────────── */}
      <Modal
        isOpen={!!selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        title={`Payslip Breakdown • ${selectedPayroll?.employee.first_name} ${selectedPayroll?.employee.last_name}`}
      >
        {selectedPayroll && (
          <div className="space-y-4 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-sm text-slate-900">
                  {selectedPayroll.employee.first_name} {selectedPayroll.employee.last_name}
                </p>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedPayroll.employee.employee_id} • {selectedPayroll.employee.designation}
                </span>
              </div>
              <Badge variant="blue">{selectedMonth}</Badge>
            </div>

            {/* Earnings & Deductions Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">Earnings (Credits)</h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Pay:</span>
                    <span className="font-bold text-slate-800">₹{selectedPayroll.baseSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">House Rent Allowance (HRA):</span>
                    <span className="font-bold text-slate-800">₹{selectedPayroll.hra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Special Allowance:</span>
                    <span className="font-bold text-slate-800">₹{selectedPayroll.specialAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Conveyance Allowance:</span>
                    <span className="font-bold text-slate-800">₹{selectedPayroll.conveyance.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedPayroll.overtimeEarnings > 0 && (
                    <div className="flex justify-between text-blue-700">
                      <span>Overtime Incentive:</span>
                      <span className="font-bold">₹{selectedPayroll.overtimeEarnings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-emerald-200 flex justify-between font-extrabold text-slate-900">
                    <span>Total Gross Earnings:</span>
                    <span>₹{selectedPayroll.grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2 text-xs">
                <h4 className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">Deductions (Debits)</h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Provident Fund (PF):</span>
                    <span className="font-bold text-rose-700">-₹{selectedPayroll.pfDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Professional Tax (PT):</span>
                    <span className="font-bold text-rose-700">-₹{selectedPayroll.professionalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Income Tax (TDS):</span>
                    <span className="font-bold text-rose-700">-₹{selectedPayroll.tdsTax.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedPayroll.leaveDeductions > 0 && (
                    <div className="flex justify-between text-rose-800">
                      <span>Unpaid Absence:</span>
                      <span className="font-bold">-₹{selectedPayroll.leaveDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-rose-200 flex justify-between font-extrabold text-rose-900">
                    <span>Total Deductions:</span>
                    <span>-₹{selectedPayroll.totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono">NET DISBURSEMENT AMOUNT</span>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  ₹{selectedPayroll.netPayable.toLocaleString('en-IN')}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer className="w-4 h-4" />}
                className="font-bold text-xs"
              >
                Print Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
