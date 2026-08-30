import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Download, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  Receipt, 
  Banknote, 
  CheckCircle2,
  Lock,
  ArrowLeft,
  Eye,
  Search,
  Filter,
  Sparkles,
  Clock,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PayslipModal } from '../../components/employee/PayslipModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Employee, PayrollRecord } from '../../types/database';

export const EmployeePayslips: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { employees, attendance, leaveRequests, getEmployeePayslipsHistory } = useData();

  const currentEmp: Employee = useMemo(() => {
    if (profile?.email) {
      const match = employees.find((e) => e.email?.toLowerCase() === profile.email.toLowerCase());
      if (match) return match;
    }
    const nameParts = (profile?.full_name || 'VeyraHR Employee').split(' ');
    return employees[0] || {
      id: profile?.id || 'emp_current',
      employee_id: profile?.id ? `VEY-EMP-${profile.id.slice(-4).toUpperCase()}` : 'VEY-EMP-0001',
      first_name: nameParts[0] || 'VeyraHR',
      last_name: nameParts.slice(1).join(' ') || 'Employee',
      designation: 'Operations Specialist',
      department_name: profile?.department_access || 'Engineering & Tech',
      work_location: profile?.branch_name || 'Chennai HQ',
      joining_date: '2024-03-01',
    };
  }, [employees, profile]);

  // Retrieve genuine payslips from joining date up to current month
  const genuinePayslips = useMemo(() => {
    return getEmployeePayslipsHistory(currentEmp);
  }, [getEmployeePayslipsHistory, currentEmp]);

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active / Latest record for hero cards
  const latestRecord = useMemo(() => {
    return genuinePayslips[0] || null;
  }, [genuinePayslips]);

  const activeRecord = selectedRecord || latestRecord;

  // Filtered payslips by search query
  const filteredPayslips = useMemo(() => {
    return genuinePayslips.filter((p) => {
      return searchQuery === '' || 
        p.month.toLowerCase().includes(searchQuery.toLowerCase()) || 
        `${p.period_start} ${p.period_end}`.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [genuinePayslips, searchQuery]);

  // Aggregate YTD summary from employee's genuine joining date records
  const ytdMetrics = useMemo(() => {
    const totalGross = genuinePayslips.reduce((acc, p) => acc + p.gross_salary, 0);
    const totalNet = genuinePayslips.reduce((acc, p) => acc + p.net_payable, 0);
    const totalPf = genuinePayslips.reduce((acc, p) => acc + p.pf_deduction, 0);
    const totalTax = genuinePayslips.reduce((acc, p) => acc + p.tds_tax + p.professional_tax, 0);
    return { totalGross, totalNet, totalPf, totalTax };
  }, [genuinePayslips]);

  const handleOpenPayslip = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsPayslipModalOpen(true);
  };

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#090E1A] via-[#111A2E] to-[#16223B] border border-teal-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 backdrop-blur-md"
            title="Go Back"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 font-mono">Compensation & Payroll</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">
                Tenure since {currentEmp.joining_date || 'Mar 2024'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">Salary & Payslips</h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Genuine monthly compensation disbursements, live attendance linkages & statutory tax ledgers
            </p>
          </div>
        </div>

        {latestRecord && (
          <Button
            variant="primary"
            icon={<FileText className="w-4 h-4" />}
            className="relative z-10 font-extrabold text-xs shadow-md shrink-0 bg-teal-600 hover:bg-teal-700 self-start sm:self-auto"
            onClick={() => handleOpenPayslip(latestRecord)}
          >
            Latest Slip ({latestRecord.month})
          </Button>
        )}
      </div>

      {/* ─── 2. SALARY HERO CARD ──────────────────────────────────────── */}
      {activeRecord && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white p-6 shadow-xl border border-slate-700">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Direct Deposit • {currentEmp.bank_account ? `Account •••• ${currentEmp.bank_account.slice(-4)}` : 'HDFC Bank (•••• 4928)'}
              </span>
              <span className={`px-3 py-1 rounded-full font-bold text-xs border flex items-center gap-1 ${
                activeRecord.payment_status === 'Paid' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> {activeRecord.payment_status === 'Paid' ? `Disbursed on ${activeRecord.payment_date || 'Schedule'}` : 'Under Payroll Run'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-300 font-medium">Net Take-Home Pay • {activeRecord.month}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  ₹{activeRecord.net_payable.toLocaleString('en-IN')}
                </h1>
                <span className="text-xs text-emerald-400 font-bold font-mono">/ month</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-700/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Earnings</span>
                <span className="font-extrabold text-slate-200 font-mono text-xs sm:text-sm mt-0.5 block">
                  ₹{activeRecord.gross_salary.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Deductions</span>
                <span className="font-extrabold text-rose-300 font-mono text-xs sm:text-sm mt-0.5 block">
                  -₹{activeRecord.total_deductions.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual CTC (Est.)</span>
                <span className="font-extrabold text-blue-300 font-mono text-xs sm:text-sm mt-0.5 block">
                  ₹{((activeRecord.base_salary || 50000) * 12 * 1.8).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cumulative Net</span>
                <span className="font-extrabold text-emerald-300 font-mono text-xs sm:text-sm mt-0.5 block">
                  ₹{ytdMetrics.totalNet.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE ATTENDANCE BASIS BANNER ─────────────────────────────── */}
      {activeRecord && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-teal-50 rounded-2xl p-4 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-900 leading-tight">Live Attendance-Based Payroll Calculation</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black font-mono">
                  {activeRecord.released_by_hr ? 'HR Verified & Released' : 'Live Muster Roll'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Calculated for {activeRecord.month}: {activeRecord.days_present} Present Shifts, {activeRecord.approved_leaves || 0} Approved Paid Leaves, and {activeRecord.ot_hours || 0} Overtime Hours.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-black font-mono border border-slate-200/80 shadow-2xs">
              {Math.min(activeRecord.total_working_days, activeRecord.days_present + (activeRecord.approved_leaves || 0))} / {activeRecord.total_working_days} Payable Days
            </span>
          </div>
        </div>
      )}

      {/* ─── 3. SALARY BREAKDOWN (Earnings & Deductions) ───────────────── */}
      {activeRecord && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Earnings */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Earnings ({activeRecord.month})
              </h4>
              <span className="font-extrabold text-xs font-mono text-emerald-700">₹{activeRecord.gross_salary.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Basic Salary</span>
                <span className="font-mono font-bold text-slate-900">₹{activeRecord.base_salary.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>House Rent Allowance (HRA)</span>
                <span className="font-mono font-bold text-slate-900">₹{activeRecord.hra.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Special Allowance</span>
                <span className="font-mono font-bold text-slate-900">₹{activeRecord.special_allowance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Conveyance Allowance</span>
                <span className="font-mono font-bold text-slate-900">₹{activeRecord.conveyance.toLocaleString('en-IN')}</span>
              </div>
              {activeRecord.overtime_earnings > 0 && (
                <div className="flex items-center justify-between text-blue-700">
                  <span>Overtime Incentive ({activeRecord.ot_hours || 0} hrs)</span>
                  <span className="font-mono font-bold">₹{activeRecord.overtime_earnings.toLocaleString('en-IN')}</span>
                </div>
              )}
              {(activeRecord.performance_bonus || 0) > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Performance Incentive</span>
                  <span className="font-mono font-bold">₹{(activeRecord.performance_bonus || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" /> Deductions ({activeRecord.month})
              </h4>
              <span className="font-extrabold text-xs font-mono text-rose-700">-₹{activeRecord.total_deductions.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Provident Fund (EPF 12%)</span>
                <span className="font-mono font-bold text-slate-900">₹{activeRecord.pf_deduction.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Income Tax Deducted (TDS)</span>
                <span className="font-mono font-bold text-slate-900">₹{activeRecord.tds_tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Group Medical Insurance</span>
                <span className="font-mono font-bold text-slate-900">₹{(activeRecord.medical_insurance || 1200).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Professional Tax (PT)</span>
                <span className="font-mono font-bold text-slate-900">₹{activeRecord.professional_tax.toLocaleString('en-IN')}</span>
              </div>
              {(activeRecord.leave_deductions > 0) && (
                <div className="flex items-center justify-between text-rose-700">
                  <span>Absence / LOP Deduction ({activeRecord.lop_days || 0} days)</span>
                  <span className="font-mono font-bold">-₹{activeRecord.leave_deductions.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. MONTHLY PAYSLIP HISTORY TABLE ─────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Disbursed Payslip Statements (Since Joining: {currentEmp.joining_date || '2024-03-01'})
            </h3>
            <p className="text-[11px] text-slate-500">Official monthly payroll ledger generated and released by HR</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search month or year (e.g. 2026)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Structured Payslips Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Pay Period</th>
                  <th className="py-3 px-3">Gross Pay</th>
                  <th className="py-3 px-3">Deductions</th>
                  <th className="py-3 px-3">Net Salary</th>
                  <th className="py-3 px-3 hidden md:table-cell">Disbursed Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      No payslips found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{item.month}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.period_start} – {item.period_end}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        ₹{item.gross_salary.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-rose-600">
                        -₹{item.total_deductions.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-extrabold text-emerald-700">
                        ₹{item.net_payable.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 text-[11px] hidden md:table-cell font-medium">
                        {item.payment_date || 'End of Month'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          item.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {item.payment_status}
                        </span>
                      </td>

                      {/* View & Download Action Icons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPayslip(item)}
                            className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-2xs"
                            title="View Payslip Breakdown"
                          >
                            <Eye className="w-4 h-4 text-slate-700" />
                          </button>
                          <button
                            onClick={() => handleOpenPayslip(item)}
                            className="p-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
                            title="Download PDF Payslip"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAYSLIP MODAL */}
      {isPayslipModalOpen && activeRecord && (
        <PayslipModal
          isOpen={isPayslipModalOpen}
          onClose={() => setIsPayslipModalOpen(false)}
          employee={currentEmp}
          month={activeRecord.month}
          payrollData={{
            baseSalary: activeRecord.base_salary,
            hra: activeRecord.hra,
            specialAllowance: activeRecord.special_allowance,
            conveyance: activeRecord.conveyance,
            overtimeEarnings: activeRecord.overtime_earnings,
            performanceBonus: activeRecord.performance_bonus,
            grossSalary: activeRecord.gross_salary,
            pfDeduction: activeRecord.pf_deduction,
            professionalTax: activeRecord.professional_tax,
            tdsTax: activeRecord.tds_tax,
            medicalInsurance: activeRecord.medical_insurance || 1200,
            leaveDeductions: activeRecord.leave_deductions,
            totalDeductions: activeRecord.total_deductions,
            netPayable: activeRecord.net_payable,
            daysPresent: activeRecord.days_present,
            totalWorkingDays: activeRecord.total_working_days,
            lopDays: activeRecord.lop_days,
            bankRef: activeRecord.bank_ref,
            paymentDate: activeRecord.payment_date,
            paymentMode: activeRecord.payment_mode,
          }}
        />
      )}
    </div>
  );
};
