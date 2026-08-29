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
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PayslipModal } from '../../components/employee/PayslipModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Employee } from '../../types/database';

export const EmployeePayslips: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { employees } = useData();

  const currentEmp: Employee = useMemo(() => {
    if (profile?.email) {
      const match = employees.find((e) => e.email?.toLowerCase() === profile.email.toLowerCase());
      if (match) return match;
    }
    return employees[0] || {
      id: 'emp_001',
      employee_id: 'VEY-EMP-0001',
      first_name: 'Anjali',
      last_name: 'Sharma',
      designation: 'Senior Full Stack Engineer',
      department_name: 'Engineering & Tech',
      work_location: 'Chennai HQ',
    };
  }, [employees, profile]);

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [searchQuery, setSearchQuery] = useState('');

  // Compensation structure
  const basicPay = 48000;
  const hra = 19200;
  const specialAllowance = 12800;
  const conveyance = 4000;
  const performanceBonus = 6000;
  const totalEarnings = basicPay + hra + specialAllowance + conveyance + performanceBonus; // 90000

  const pf = 5760;
  const professionalTax = 200;
  const tds = 3500;
  const medicalInsurance = 1200;
  const totalDeductions = pf + professionalTax + tds + medicalInsurance; // 10660

  const netSalary = totalEarnings - totalDeductions; // 79340

  const payslipsList = [
    {
      id: 'ps_aug_2026',
      month: 'August 2026',
      period: '01 Aug 2026 – 31 Aug 2026',
      gross: 90000,
      deductions: 10660,
      net: 79340,
      paymentDate: '31 Aug 2026',
      status: 'Paid',
      bankRef: 'HDFC-NEFT-9842109',
    },
    {
      id: 'ps_jul_2026',
      month: 'July 2026',
      period: '01 Jul 2026 – 31 Jul 2026',
      gross: 90000,
      deductions: 10660,
      net: 79340,
      paymentDate: '31 Jul 2026',
      status: 'Paid',
      bankRef: 'HDFC-NEFT-8721491',
    },
    {
      id: 'ps_jun_2026',
      month: 'June 2026',
      period: '01 Jun 2026 – 30 Jun 2026',
      gross: 90000,
      deductions: 10660,
      net: 79340,
      paymentDate: '30 Jun 2026',
      status: 'Paid',
      bankRef: 'HDFC-NEFT-7612093',
    },
    {
      id: 'ps_may_2026',
      month: 'May 2026',
      period: '01 May 2026 – 31 May 2026',
      gross: 90000,
      deductions: 10660,
      net: 79340,
      paymentDate: '31 May 2026',
      status: 'Paid',
      bankRef: 'HDFC-NEFT-6501984',
    },
    {
      id: 'ps_apr_2026',
      month: 'April 2026',
      period: '01 Apr 2026 – 30 Apr 2026',
      gross: 90000,
      deductions: 10660,
      net: 79340,
      paymentDate: '30 Apr 2026',
      status: 'Paid',
      bankRef: 'HDFC-NEFT-5490182',
    },
  ];

  const filteredPayslips = useMemo(() => {
    return payslipsList.filter((p) => {
      return searchQuery === '' || 
        p.month.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.period.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [payslipsList, searchQuery]);

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
              <span className="text-[10px] font-bold text-slate-300 font-mono">Direct Deposits</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">Salary & Payslips</h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Monthly compensation breakdowns, direct deposit records & tax deductions</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<FileText className="w-4 h-4" />}
          className="relative z-10 font-extrabold text-xs shadow-md shrink-0 bg-teal-600 hover:bg-teal-700 self-start sm:self-auto"
          onClick={() => {
            setSelectedMonth('August 2026');
            setIsPayslipModalOpen(true);
          }}
        >
          Latest Slip (Aug 2026)
        </Button>
      </div>

      {/* ─── 2. SALARY HERO CARD ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white p-6 shadow-xl border border-slate-700">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Direct Deposit • HDFC Bank (•••• 4012)
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed on Schedule
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-300 font-medium">Monthly Net Take-Home Pay</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                ₹{netSalary.toLocaleString('en-IN')}
              </h1>
              <span className="text-xs text-emerald-400 font-bold font-mono">/ month</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Earnings</span>
              <span className="font-extrabold text-slate-200 font-mono text-xs sm:text-sm mt-0.5 block">
                ₹{totalEarnings.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Deductions</span>
              <span className="font-extrabold text-rose-300 font-mono text-xs sm:text-sm mt-0.5 block">
                -₹{totalDeductions.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual CTC</span>
              <span className="font-extrabold text-blue-300 font-mono text-xs sm:text-sm mt-0.5 block">
                ₹10,80,000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. SALARY BREAKDOWN (Earnings & Deductions) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Earnings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Earnings (Monthly)
            </h4>
            <span className="font-extrabold text-xs font-mono text-emerald-700">₹{totalEarnings.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Basic Salary</span>
              <span className="font-mono font-bold text-slate-900">₹{basicPay.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>House Rent Allowance (HRA)</span>
              <span className="font-mono font-bold text-slate-900">₹{hra.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Special Allowance</span>
              <span className="font-mono font-bold text-slate-900">₹{specialAllowance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Conveyance Allowance</span>
              <span className="font-mono font-bold text-slate-900">₹{conveyance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Performance Bonus</span>
              <span className="font-mono font-bold text-slate-900">₹{performanceBonus.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-rose-600" /> Deductions (Monthly)
            </h4>
            <span className="font-extrabold text-xs font-mono text-rose-700">-₹{totalDeductions.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Provident Fund (EPF 12%)</span>
              <span className="font-mono font-bold text-slate-900">₹{pf.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Income Tax Deducted (TDS)</span>
              <span className="font-mono font-bold text-slate-900">₹{tds.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Group Medical Insurance</span>
              <span className="font-mono font-bold text-slate-900">₹{medicalInsurance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Professional Tax (PT)</span>
              <span className="font-mono font-bold text-slate-900">₹{professionalTax.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. MONTHLY PAYSLIP HISTORY TABLE ─────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Monthly Payslip Statement Table
            </h3>
            <p className="text-[11px] text-slate-500">Official monthly pay records with view & PDF download options</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search month (e.g. August)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Structured Payslips Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
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
                        <div className="text-[10px] text-slate-400 font-mono">{item.period}</div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        ₹{item.gross.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-rose-600">
                        -₹{item.deductions.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-extrabold text-emerald-700">
                        ₹{item.net.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 text-[11px] hidden md:table-cell font-medium">
                        {item.paymentDate}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {item.status}
                        </span>
                      </td>

                      {/* View & Download Action Icons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMonth(item.month);
                              setIsPayslipModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-2xs"
                            title="View Payslip Breakdown"
                          >
                            <Eye className="w-4 h-4 text-slate-700" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMonth(item.month);
                              setIsPayslipModalOpen(true);
                            }}
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
      {isPayslipModalOpen && (
        <PayslipModal
          isOpen={isPayslipModalOpen}
          onClose={() => setIsPayslipModalOpen(false)}
          employee={currentEmp}
          month={selectedMonth}
        />
      )}
    </div>
  );
};
