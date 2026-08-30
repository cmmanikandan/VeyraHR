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
  CheckCircle,
  Edit2,
  Lock
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../context/DataContext';
import { Employee, PayrollRecord } from '../../types/database';
import { PayslipModal } from '../../components/employee/PayslipModal';

export const HRPayrollManagement: React.FC = () => {
  const { 
    employees, 
    attendance, 
    leaveRequests, 
    branches, 
    payrollRecords: globalPayrollRecords, 
    disbursePayroll, 
    releaseEmployeePayslip,
    updateEmployee,
    updatePayrollRecord 
  } = useData();

  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<PayrollRecord | null>(null);
  const [isEditingSalaryEmp, setIsEditingSalaryEmp] = useState<Employee | null>(null);
  const [editBaseSalary, setEditBaseSalary] = useState<number>(50000);
  const [editBankAccount, setEditBankAccount] = useState<string>('');
  const [editIfsc, setEditIfsc] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedSuccess, setProcessedSuccess] = useState<string | null>(null);

  const availableMonths = [
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
    'April 2026',
    'March 2026',
    'February 2026',
    'January 2026',
  ];

  // Compute or retrieve live payroll for each employee for the selectedMonth
  const computedPayrollRecords: (PayrollRecord & { employee: Employee })[] = useMemo(() => {
    const totalWorkingDays = 22;

    // Convert month string "August 2026" to "2026-08"
    const monthNames: Record<string, string> = {
      January: '01', February: '02', March: '03', April: '04',
      May: '05', June: '06', July: '07', August: '08',
      September: '09', October: '10', November: '11', December: '12'
    };
    const [mName, yStr] = selectedMonth.split(' ');
    const yearMonthPrefix = `${yStr || '2026'}-${monthNames[mName] || '08'}`;
    const isCurrentActiveMonth = selectedMonth === 'August 2026';

    return employees.map((emp, idx) => {
      // 1. Check if HR previously saved an explicit record for this employee & month
      const existing = globalPayrollRecords.find(
        (p) => (p.employee_id === emp.id || p.employee_id === emp.employee_id) && p.month === selectedMonth
      );

      if (existing) {
        return {
          ...existing,
          employee: emp,
        };
      }

      // 2. Otherwise calculate based on real employee salary, attendance punches & approved leaves
      const baseSalary = emp.base_salary || (50000 + (idx % 4) * 15000);
      const hra = Math.round(baseSalary * 0.4);
      const specialAllowance = Math.round(baseSalary * 0.2);
      const conveyance = 4000;

      const empAttendance = attendance.filter((a) => {
        const matchId = a.employee_id === emp.id || a.employee_id === emp.employee_id;
        return matchId && a.date && a.date.startsWith(yearMonthPrefix);
      });

      const empLeaves = leaveRequests.filter((l) => {
        const matchId = l.employee_id === emp.id || l.employee_id === emp.employee_id;
        return matchId && l.status === 'Approved' && l.start_date && l.start_date.startsWith(yearMonthPrefix);
      });

      const approvedLeaveDays = empLeaves.reduce((sum, curr) => sum + (Number(curr.total_days) || 1), 0);
      let daysPresent = empAttendance.length;
      if (daysPresent === 0) {
        daysPresent = isCurrentActiveMonth ? 20 : (totalWorkingDays - approvedLeaveDays);
      }

      const payableDays = Math.min(totalWorkingDays, daysPresent + approvedLeaveDays);
      const lopDays = Math.max(0, totalWorkingDays - payableDays);

      const otMins = empAttendance.reduce((sum, curr) => sum + (curr.overtime_mins || 0), 0);
      const otHours = Math.round(otMins / 60);
      const hourlyRate = Math.round((baseSalary / (totalWorkingDays * 8)) * 1.5);
      const overtimeEarnings = otHours * hourlyRate;
      const performanceBonus = idx % 2 === 0 ? 5000 : 0;

      const grossSalary = Math.round((baseSalary / totalWorkingDays) * payableDays) +
                          Math.round((hra / totalWorkingDays) * payableDays) +
                          Math.round((specialAllowance / totalWorkingDays) * payableDays) +
                          conveyance +
                          overtimeEarnings +
                          performanceBonus;

      const pfDeduction = Math.round(baseSalary * 0.12);
      const professionalTax = 200;
      const tdsTax = Math.round(grossSalary * 0.04);
      const medicalInsurance = 1200;
      const leaveDeductions = lopDays * Math.round(baseSalary / totalWorkingDays);

      const totalDeductions = pfDeduction + professionalTax + tdsTax + medicalInsurance + leaveDeductions;
      const netPayable = grossSalary - totalDeductions;

      const lastDayOfMonth = new Date(parseInt(yStr || '2026', 10), parseInt(monthNames[mName] || '8', 10), 0).getDate();
      const periodStart = `${yStr || '2026'}-${monthNames[mName] || '08'}-01`;
      const periodEnd = `${yStr || '2026'}-${monthNames[mName] || '08'}-${String(lastDayOfMonth).padStart(2, '0')}`;
      const paymentDate = `${lastDayOfMonth} ${mName.slice(0, 3)} ${yStr || '2026'}`;

      return {
        id: `ps_${yStr}_${mName}_${emp.id}`,
        company_id: emp.company_id || 'comp_veyra_tn',
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        month: selectedMonth,
        period_start: periodStart,
        period_end: periodEnd,
        base_salary: baseSalary,
        hra,
        special_allowance: specialAllowance,
        conveyance,
        overtime_earnings: overtimeEarnings,
        performance_bonus: performanceBonus,
        gross_salary: grossSalary,
        pf_deduction: pfDeduction,
        professional_tax: professionalTax,
        tds_tax: tdsTax,
        medical_insurance: medicalInsurance,
        leave_deductions: leaveDeductions,
        total_deductions: totalDeductions,
        net_payable: netPayable,
        payment_status: isCurrentActiveMonth ? 'Processed' : 'Paid',
        payment_date: paymentDate,
        bank_ref: `HDFC-NEFT-${Math.floor(1000000 + Math.random() * 9000000)}`,
        payment_mode: 'NEFT / Direct Deposit',
        days_present: daysPresent,
        total_working_days: totalWorkingDays,
        lop_days: lopDays,
        approved_leaves: approvedLeaveDays,
        ot_hours: otHours,
        released_by_hr: !isCurrentActiveMonth,
        created_at: new Date().toISOString(),
        employee: emp,
      };
    });
  }, [employees, attendance, leaveRequests, selectedMonth, globalPayrollRecords]);

  const filteredRecords = useMemo(() => {
    return computedPayrollRecords.filter((rec) => {
      const matchSearch =
        `${rec.employee.first_name} ${rec.employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.employee.department_name && rec.employee.department_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchBranch = selectedBranch === 'All' || rec.employee.branch_name === selectedBranch;
      return matchSearch && matchBranch;
    });
  }, [computedPayrollRecords, searchQuery, selectedBranch]);

  // Aggregate Metrics
  const totalGrossDisbursement = useMemo(() => {
    return computedPayrollRecords.reduce((sum, r) => sum + r.gross_salary, 0);
  }, [computedPayrollRecords]);

  const totalNetDisbursement = useMemo(() => {
    return computedPayrollRecords.reduce((sum, r) => sum + r.net_payable, 0);
  }, [computedPayrollRecords]);

  const totalStatutoryTaxes = useMemo(() => {
    return computedPayrollRecords.reduce((sum, r) => sum + r.pf_deduction + r.professional_tax + r.tds_tax, 0);
  }, [computedPayrollRecords]);

  const handleProcessBatchPayroll = async () => {
    setIsProcessing(true);
    try {
      await disbursePayroll(selectedMonth, computedPayrollRecords);
      setProcessedSuccess(`Successfully computed and released payroll for ${computedPayrollRecords.length} employees for ${selectedMonth}. All employees have been notified.`);
      setTimeout(() => setProcessedSuccess(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseSingleRecord = async (record: PayrollRecord & { employee: Employee }) => {
    await releaseEmployeePayslip(record);
    setProcessedSuccess(`Released and notified ${record.employee.first_name} for ${record.month} (Net: ₹${record.net_payable.toLocaleString('en-IN')}).`);
    setTimeout(() => setProcessedSuccess(null), 4000);
  };

  const handleOpenEditSalary = (emp: Employee) => {
    setIsEditingSalaryEmp(emp);
    setEditBaseSalary(emp.base_salary || 50000);
    setEditBankAccount(emp.bank_account || `HDFC00049281${emp.id.slice(-4)}`);
    setEditIfsc(emp.ifsc_code || 'HDFC0000240');
  };

  const handleSaveSalary = async () => {
    if (!isEditingSalaryEmp) return;
    await updateEmployee(isEditingSalaryEmp.id, {
      base_salary: editBaseSalary,
      bank_account: editBankAccount,
      ifsc_code: editIfsc,
    });
    setIsEditingSalaryEmp(null);
    setProcessedSuccess(`Updated salary structure for ${isEditingSalaryEmp.first_name} ${isEditingSalaryEmp.last_name}.`);
    setTimeout(() => setProcessedSuccess(null), 4000);
  };

  const handleExportBankTransferCSV = () => {
    const headers = 'Employee ID,Full Name,Bank Account,IFSC Code,Net Payable (INR),Payment Mode,Payment Status\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.employee.employee_id}","${r.employee.first_name} ${r.employee.last_name}","${r.employee.bank_account || 'HDFC00049281' + r.employee.id.slice(-4)}","${r.employee.ifsc_code || 'HDFC0000240'}","${r.net_payable}","NEFT/DIRECT_DEPOSIT","${r.payment_status}"`
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
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select Payroll Month"
              className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl text-xs focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Automated statutory tax deduction, PF compliance, and instant bank disbursement ledger linked to live attendance.
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
            disabled={computedPayrollRecords.length === 0}
          >
            Disburse {selectedMonth} Payroll
          </Button>
        </div>
      </div>

      {processedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fadeIn">
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
          <span className="text-[10px] text-slate-500 font-medium">{computedPayrollRecords.length} Staff on Roster</span>
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
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{selectedMonth}</p>
          <span className="text-[10px] text-amber-700 font-bold">End-of-Month Settlement</span>
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
            aria-label="Filter by Regional Hub"
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
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3 text-center">Attendance</th>
                  <th className="py-3.5 px-3 text-right">Gross Pay</th>
                  <th className="py-3.5 px-3 text-right">PF (12%)</th>
                  <th className="py-3.5 px-3 text-right">TDS / Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Payable</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
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
                            {rec.employee.employee_id} • {rec.employee.department_name || 'Engineering'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-lg font-mono font-bold text-[11px] text-slate-700">
                        {rec.days_present}/{rec.total_working_days} Days
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ₹{rec.gross_salary.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-purple-700 font-medium">
                      -₹{rec.pf_deduction.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-600 font-medium">
                      -₹{(rec.tds_tax + rec.professional_tax + rec.leave_deductions + (rec.medical_insurance || 0)).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                      ₹{rec.net_payable.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge variant={rec.payment_status === 'Paid' ? 'green' : 'blue'} size="sm">
                        {rec.payment_status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditSalary(rec.employee)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                          title="Edit Salary Structure"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        
                        {rec.payment_status !== 'Paid' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReleaseSingleRecord(rec)}
                            icon={<Send className="w-3 h-3" />}
                            className="text-[11px] font-bold py-1 px-2.5"
                          >
                            Release
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployeeForPayslip(rec.employee);
                            setSelectedPayrollRecord(rec);
                          }}
                          icon={<Eye className="w-3.5 h-3.5" />}
                          className="text-[11px] font-bold py-1 px-2.5"
                        >
                          Payslip
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: OFFICIAL PAYSLIP PREVIEW ───────────────────────── */}
      {selectedEmployeeForPayslip && selectedPayrollRecord && (
        <PayslipModal
          isOpen={true}
          onClose={() => {
            setSelectedEmployeeForPayslip(null);
            setSelectedPayrollRecord(null);
          }}
          employee={selectedEmployeeForPayslip}
          month={selectedPayrollRecord.month}
          payrollData={{
            baseSalary: selectedPayrollRecord.base_salary,
            hra: selectedPayrollRecord.hra,
            specialAllowance: selectedPayrollRecord.special_allowance,
            conveyance: selectedPayrollRecord.conveyance,
            overtimeEarnings: selectedPayrollRecord.overtime_earnings,
            pfDeduction: selectedPayrollRecord.pf_deduction,
            professionalTax: selectedPayrollRecord.professional_tax,
            tdsTax: selectedPayrollRecord.tds_tax,
            leaveDeductions: selectedPayrollRecord.leave_deductions,
            totalDeductions: selectedPayrollRecord.total_deductions,
            grossSalary: selectedPayrollRecord.gross_salary,
            netPayable: selectedPayrollRecord.net_payable,
            daysPresent: selectedPayrollRecord.days_present,
            totalWorkingDays: selectedPayrollRecord.total_working_days,
          }}
        />
      )}

      {/* ─── MODAL: EDIT SALARY STRUCTURE ──────────────────────────── */}
      {isEditingSalaryEmp && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditingSalaryEmp(null)}
          title={`Edit Salary Structure • ${isEditingSalaryEmp.first_name} ${isEditingSalaryEmp.last_name}`}
        >
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{isEditingSalaryEmp.first_name} {isEditingSalaryEmp.last_name}</p>
                <span className="text-slate-500 font-mono">{isEditingSalaryEmp.employee_id} • {isEditingSalaryEmp.designation}</span>
              </div>
              <Badge variant="blue">{isEditingSalaryEmp.department_name || 'Operations'}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Base Salary (₹)</label>
                <input
                  type="number"
                  value={editBaseSalary}
                  onChange={(e) => setEditBaseSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                />
                <p className="text-[10px] text-slate-400 mt-1">HRA (40%), Special Allowance (20%), and PF (12%) will automatically adjust.</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={editBankAccount}
                  onChange={(e) => setEditBankAccount(e.target.value)}
                  placeholder="e.g. 50100492817291"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  value={editIfsc}
                  onChange={(e) => setEditIfsc(e.target.value)}
                  placeholder="e.g. HDFC0000240"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-veyra-blue"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsEditingSalaryEmp(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveSalary} icon={<CheckCircle2 className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
