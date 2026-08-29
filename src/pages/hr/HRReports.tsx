import React, { useState } from 'react';
import { Download, FileText, Printer, CheckCircle2, Calendar, FileSpreadsheet } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../context/DataContext';

export const HRReports: React.FC = () => {
  const { attendance, employees, leaveRequests } = useData();
  const [reportType, setReportType] = useState('daily');
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      if (format === 'csv') {
        const headers = 'Employee ID,Name,Date,Check-In,Check-Out,Status,Hours\n';
        const rows = attendance
          .map(
            (a) =>
              `"${a.employee_id}","${a.employee_name}","${a.date}","${a.check_in_time || ''}","${a.check_out_time || ''}","${a.status}","${a.working_hours_mins / 60}h"`
          )
          .join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VeyraHR_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        window.print();
      }
      setExporting(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-veyra-text tracking-tight">Workforce Reports & Data Export</h2>
          <p className="text-xs text-veyra-text-sub">Export verified attendance, overtime & leave utilization data</p>
        </div>
        <Button
          variant="primary"
          onClick={handleExport}
          loading={exporting}
          icon={format === 'csv' ? <FileSpreadsheet className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
        >
          Export Report ({format.toUpperCase()})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-veyra-border">
          <label className="block text-xs font-bold text-veyra-text mb-2">Report Category</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full rounded-xl border border-veyra-border bg-white px-3.5 py-2.5 text-xs text-veyra-text font-medium"
          >
            <option value="daily">Daily Attendance Report</option>
            <option value="weekly">Weekly Summary Report</option>
            <option value="monthly">Monthly Attendance Ledger</option>
            <option value="late">Late Arrival & Grace Period Log</option>
            <option value="leave">Leave Utilization Breakdown</option>
          </select>
        </Card>

        <Card className="bg-white border-veyra-border">
          <label className="block text-xs font-bold text-veyra-text mb-2">Export File Format</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('csv')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                format === 'csv'
                  ? 'bg-veyra-blue-soft text-veyra-blue border-veyra-blue-border'
                  : 'bg-white text-veyra-text-sub border-veyra-border'
              }`}
            >
              CSV / Excel
            </button>
            <button
              onClick={() => setFormat('pdf')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                format === 'pdf'
                  ? 'bg-veyra-blue-soft text-veyra-blue border-veyra-blue-border'
                  : 'bg-white text-veyra-text-sub border-veyra-border'
              }`}
            >
              Print / PDF
            </button>
          </div>
        </Card>

        <Card className="bg-white border-veyra-border flex flex-col justify-center">
          <div className="text-xs text-veyra-text-sub space-y-1">
            <p>
              <strong className="text-veyra-text">Records Ready:</strong> {attendance.length} items
            </p>
            <p>
              <strong className="text-veyra-text">Active Employees:</strong> {employees.length} members
            </p>
          </div>
        </Card>
      </div>

      {/* REPORT PREVIEW TABLE */}
      <div className="bg-white rounded-2xl border border-veyra-border shadow-veyra overflow-hidden">
        <div className="p-4 border-b border-veyra-border bg-veyra-bg-secondary flex items-center justify-between">
          <h3 className="text-xs font-bold text-veyra-text uppercase tracking-wider">Generated Report Preview</h3>
          <Badge variant="blue">Real Supabase Data</Badge>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-white border-b border-veyra-border text-veyra-text-sub font-semibold">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Check-In</th>
              <th className="py-3 px-4">Check-Out</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Hours Worked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-veyra-border/60 font-medium">
            {attendance.map((a) => (
              <tr key={a.id}>
                <td className="py-3 px-4 font-bold text-veyra-text">{a.employee_name}</td>
                <td className="py-3 px-4 text-veyra-text-sub">{a.date}</td>
                <td className="py-3 px-4 text-veyra-text">
                  {a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                </td>
                <td className="py-3 px-4 text-veyra-text">
                  {a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={a.status === 'Present' ? 'green' : 'amber'} size="sm">
                    {a.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 font-bold text-veyra-blue">{Math.floor(a.working_hours_mins / 60)}h {a.working_hours_mins % 60}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
