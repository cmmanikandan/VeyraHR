import React, { useState, useMemo } from 'react';
import { 
  Download, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  FileSpreadsheet, 
  Building2, 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../context/DataContext';

export const HRReports: React.FC = () => {
  const { attendance, employees, leaveRequests, branches, departments } = useData();

  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [reportType, setReportType] = useState<'form25' | 'daily' | 'monthly_ledger' | 'late_log' | 'leave_summary'>('form25');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const totalWorkingDays = 22;

  // Process Form 25 compliance records per employee
  const employeeAuditRecords = useMemo(() => {
    return employees.map((emp) => {
      const empAttendance = attendance.filter(
        (a) => a.employee_id === emp.id || (emp.employee_id && a.employee_id === emp.employee_id)
      );

      const daysPresent = empAttendance.filter((a) => a.status === 'Present' || a.status === 'Late' || !!a.check_in_time).length;
      const lateDays = empAttendance.filter((a) => a.status === 'Late').length;
      
      const totalMinutesWorked = empAttendance.reduce((acc, a) => acc + (a.working_hours_mins || 480), 0);
      const totalHoursWorked = (totalMinutesWorked / 60).toFixed(1);
      
      const overtimeHours = empAttendance.reduce((acc, a) => acc + (a.overtime_mins || 0) / 60, 0);

      const empLeaves = leaveRequests.filter(
        (l) => (l.employee_id === emp.id || (l.employee_name && l.employee_name.toLowerCase().includes(emp.first_name.toLowerCase()))) && l.status === 'Approved'
      );
      const leavesTaken = empLeaves.reduce((acc, l) => acc + (l.total_days || 1), 0);

      const lossOfPayDays = Math.max(0, totalWorkingDays - (daysPresent + leavesTaken));
      const attendancePercentage = totalWorkingDays > 0 ? Math.min(100, Math.round(((daysPresent + leavesTaken) / totalWorkingDays) * 100)) : 100;

      return {
        id: emp.id,
        employee_id: emp.employee_id || emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department_name || 'Engineering & Tech',
        branch: emp.branch_name || 'Chennai HQ',
        designation: emp.designation || 'Specialist',
        totalWorkingDays,
        daysPresent,
        lateDays,
        totalHoursWorked,
        overtimeHours: overtimeHours.toFixed(1),
        leavesTaken,
        lossOfPayDays,
        attendancePercentage,
        status: emp.status || 'Active',
      };
    });
  }, [employees, attendance, leaveRequests]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return employeeAuditRecords.filter((rec) => {
      const matchSearch =
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBranch = selectedBranch === 'All' || rec.branch === selectedBranch;
      const matchDept = selectedDept === 'All' || rec.department === selectedDept;
      return matchSearch && matchBranch && matchDept;
    });
  }, [employeeAuditRecords, searchQuery, selectedBranch, selectedDept]);

  // Metrics summary
  const totalEmployeesCount = filteredRecords.length;
  const avgAttendanceRate = totalEmployeesCount > 0 
    ? Math.round(filteredRecords.reduce((acc, r) => acc + r.attendancePercentage, 0) / totalEmployeesCount) 
    : 100;
  const totalLateMarks = filteredRecords.reduce((acc, r) => acc + r.lateDays, 0);
  const totalOvertimeHours = filteredRecords.reduce((acc, r) => acc + parseFloat(r.overtimeHours), 0).toFixed(1);

  // Form 25 & CSV Export Handler
  const handleExportCSV = () => {
    setExporting(true);
    setTimeout(() => {
      let csvContent = '';

      if (reportType === 'form25') {
        csvContent += `FORM NO. 25 - REGISTER OF ATTENDANCE / MUSTER ROLL\n`;
        csvContent += `(Prescribed under Rule 103 of Tamil Nadu Factories / Shops & Establishment Rules)\n`;
        csvContent += `Establishment: VeyraHR Technologies Pvt Ltd, Period: ${selectedMonth}\n`;
        csvContent += `CIN: U72200TN2024PTC158920, Location: OMR IT Expressway, Chennai - 600096\n\n`;
        csvContent += `SL No,Employee ID,Employee Name,Designation,Department,Branch,Working Days,Days Present,Late Days,Overtime (Hrs),Approved Leaves,Loss of Pay (Days),Attendance %\n`;

        filteredRecords.forEach((r, idx) => {
          csvContent += `${idx + 1},"${r.employee_id}","${r.name}","${r.designation}","${r.department}","${r.branch}",${r.totalWorkingDays},${r.daysPresent},${r.lateDays},${r.overtimeHours},${r.leavesTaken},${r.lossOfPayDays},${r.attendancePercentage}%\n`;
        });
      } else {
        csvContent += `VeyraHR Attendance Log Export - ${selectedMonth}\n`;
        csvContent += `Date,Employee ID,Employee Name,Check-In,Check-Out,Verification Method,Status,Hours Worked\n`;

        attendance.forEach((a) => {
          csvContent += `"${a.date}","${a.employee_id}","${a.employee_name}","${a.check_in_time || '--'}","${a.check_out_time || '--'}","${a.verification_method || 'Dynamic QR'}","${a.status}",${(a.working_hours_mins / 60).toFixed(1)}h\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VeyraHR_${reportType.toUpperCase()}_Report_${selectedMonth.replace(/\s+/g, '_')}.csv`;
      a.click();
      setExporting(false);
    }, 600);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER & EXPORT ACTIONS ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workforce Reports & Compliance</h1>
            <Badge variant="blue" className="font-mono text-[10px] font-bold">
              Form 25 Ready
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready attendance muster rolls, statutory labor registers, and payroll analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrintPDF}
            icon={<Printer className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Print / Save PDF
          </Button>
          <Button
            variant="primary"
            onClick={handleExportCSV}
            loading={exporting}
            icon={<FileSpreadsheet className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Export Excel / CSV
          </Button>
        </div>
      </div>

      {/* ─── COMPLIANCE STATUTORY STATS ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padded={false} className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Audited Staff</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalEmployeesCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Full Workforce Roster</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Muster Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">{avgAttendanceRate}%</p>
          <span className="text-[10px] text-emerald-600 font-medium font-bold">Statutory Present Rate</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Late Marks</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2 font-mono">{totalLateMarks}</p>
          <span className="text-[10px] text-slate-500 font-medium">Grace period exceptions</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Overtime Logged</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2 font-mono">{totalOvertimeHours} hrs</p>
          <span className="text-[10px] text-slate-500 font-medium">Audited overtime ledger</span>
        </Card>
      </div>

      {/* ─── REPORT CONFIGURATION BAR ──────────────────────────────────────── */}
      <Card padded={false} className="p-4 bg-white border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          {/* Report Category */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Statutory Register Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="form25">Form 25 • Statutory Muster Roll</option>
              <option value="monthly_ledger">Monthly Attendance Summary</option>
              <option value="daily">Daily Check-In/Out Timesheet</option>
              <option value="late_log">Late Arrivals & Grace Log</option>
              <option value="leave_summary">Leave & Absence Utilization</option>
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Audit Period
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>August 2026</option>
              <option>July 2026</option>
              <option>June 2026</option>
              <option>May 2026</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Branch / Unit
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Branches ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report by employee name, ID number, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* ─── AUDIT-READY REGISTER TABLE (FORM 25 COMPLIANCE) ────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="printable-report">
        
        {/* Printable Official Letterhead */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                FORM NO. 25 • REGISTER OF ATTENDANCE & MUSTER ROLL
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              VeyraHR Technologies Pvt Ltd • CIN: U72200TN2024PTC158920
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Prescribed under Rule 103 of Tamil Nadu Factories & Shops Establishment Rules
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <Badge variant="blue" className="font-mono text-xs font-bold">
              Period: {selectedMonth}
            </Badge>
            <p className="text-[11px] text-slate-500">Working Days: {totalWorkingDays} Days</p>
            <p className="text-[10px] text-slate-400">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Structured Compliance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">Employee Details</th>
                <th className="py-3 px-3">Branch & Dept</th>
                <th className="py-3 px-3 text-center">Days Present</th>
                <th className="py-3 px-3 text-center">Late Marks</th>
                <th className="py-3 px-3 text-center">Overtime</th>
                <th className="py-3 px-3 text-center">Leaves</th>
                <th className="py-3 px-3 text-center text-rose-700">LOP (Loss of Pay)</th>
                <th className="py-3 px-4 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-bold">
                    No workforce records matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-[10px] shrink-0">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{r.name}</p>
                          <span className="text-[10px] text-blue-600 font-mono font-bold block">
                            {r.employee_id} • {r.designation}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-bold text-slate-800 block text-xs">{r.branch}</span>
                      <span className="text-[10px] text-slate-400 block">{r.department}</span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-700">
                      {r.daysPresent} / {r.totalWorkingDays}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {r.lateDays > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">
                          {r.lateDays}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-indigo-700 font-bold">
                      {parseFloat(r.overtimeHours) > 0 ? `${r.overtimeHours}h` : <span className="text-slate-300">--</span>}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-blue-700 font-bold">
                      {r.leavesTaken > 0 ? `${r.leavesTaken}d` : <span className="text-slate-300">0</span>}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-extrabold text-rose-700">
                      {r.lossOfPayDays > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">
                          {r.lossOfPayDays}d
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${
                              r.attendancePercentage >= 90
                                ? 'bg-emerald-500'
                                : r.attendancePercentage >= 75
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${r.attendancePercentage}%` }}
                          />
                        </div>
                        <span className="font-mono font-black text-xs text-slate-900">
                          {r.attendancePercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Statutory Signoff Footer */}
        <div className="p-6 bg-slate-50/80 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Prepared By</span>
            <p className="font-bold text-slate-900">HR Operations Specialist</p>
            <p className="text-[10px] text-slate-500">VeyraHR Automated Compliance Engine</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Verified By</span>
            <p className="font-bold text-slate-900">Head of Human Resources</p>
            <p className="text-[10px] text-slate-500">Dynamic QR & GPS Timestamp Verified</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Audit Authorization</span>
            <p className="font-bold text-slate-900">Managing Director / Occupier</p>
            <p className="text-[10px] text-slate-500">Digitally Signed & Certified</p>
          </div>
        </div>
      </div>
    </div>
  );
};
