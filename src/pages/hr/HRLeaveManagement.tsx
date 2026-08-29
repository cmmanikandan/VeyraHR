import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  User,
  X,
  ChevronRight,
  Eye,
  Check,
  Building2,
  Sparkles,
  ShieldCheck,
  History,
  FileText
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { LeaveRequest } from '../../types/database';

const STATUS_TABS = ['Pending Review', 'Leave History', 'All Records'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const LEAVE_TYPE_COLORS: Record<string, string> = {
  'Sick Leave': 'bg-rose-50 border-rose-200 text-rose-700',
  'Casual Leave': 'bg-blue-50 border-blue-200 text-blue-700',
  'Earned Leave': 'bg-purple-50 border-purple-200 text-purple-700',
  'Maternity Leave': 'bg-pink-50 border-pink-200 text-pink-700',
  'Paternity Leave': 'bg-teal-50 border-teal-200 text-teal-700',
};

export const HRLeaveManagement: React.FC = () => {
  const { leaveRequests, updateLeaveStatus, employees } = useData();

  const [activeTab, setActiveTab] = useState<StatusTab>('Pending Review');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Approved' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const pendingRequests = useMemo(() => leaveRequests.filter((r) => r.status === 'Pending'), [leaveRequests]);
  const approvedRequests = useMemo(() => leaveRequests.filter((r) => r.status === 'Approved'), [leaveRequests]);
  const rejectedRequests = useMemo(() => leaveRequests.filter((r) => r.status === 'Rejected'), [leaveRequests]);
  const totalDaysPending = useMemo(() => pendingRequests.reduce((a, r) => a + (r.total_days || 0), 0), [pendingRequests]);

  // Tab Filtering
  const displayedRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      let matchesTab = true;
      if (activeTab === 'Pending Review') {
        matchesTab = r.status === 'Pending';
      } else if (activeTab === 'Leave History') {
        matchesTab = r.status !== 'Pending';
        if (historyFilter !== 'All') {
          matchesTab = r.status === historyFilter;
        }
      }

      const matchesSearch = !search || 
        `${r.employee_name} ${r.leave_type_name} ${r.reason}`.toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [leaveRequests, activeTab, historyFilter, search]);

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    if (!selectedReq) return;
    setSubmitting(true);
    await updateLeaveStatus(selectedReq.id, status, comment);
    setSubmitting(false);
    setSelectedReq(null);
    setComment('');
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const timeAgo = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const h = Math.floor(diff / 3600000);
      if (h < 1) return 'Just now';
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* ─── 1. HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Leave Approvals & Workflow</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review pending leave requests in table view with pop-up approval inspection
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const headers = 'Employee Name,Leave Type,Start Date,End Date,Total Days,Reason,Status,Created At\n';
            const rows = leaveRequests.map((l) => 
              `"${l.employee_name}","${l.leave_type_name}","${l.start_date}","${l.end_date}","${l.total_days}","${(l.reason || '').replace(/"/g, '""')}","${l.status}","${l.created_at}"`
            ).join('\n');
            const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `VeyraHR_Leave_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          📊 Export All Leaves CSV
        </Button>
      </div>

      {/* ─── 2. KPI SUMMARY CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: pendingRequests.length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { label: 'Approved Leaves', value: approvedRequests.length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
          { label: 'Rejected Leaves', value: rejectedRequests.length, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: <XCircle className="w-4 h-4 text-rose-500" /> },
          { label: 'Total Pending Days', value: totalDaysPending, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: <CalendarDays className="w-4 h-4 text-blue-500" /> },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl border ${s.bg} bg-white space-y-1 shadow-xs`}>
            <div className="flex items-center gap-1.5">
              {s.icon}
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</span>
            </div>
            <span className={`text-2xl sm:text-3xl font-black block font-mono ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ─── 3. TAB CONTROLS & SEARCH BAR ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        
        {/* Main Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const count = tab === 'Pending Review' 
              ? pendingRequests.length 
              : tab === 'Leave History' 
              ? approvedRequests.length + rejectedRequests.length 
              : leaveRequests.length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'Leave History' && <History className="w-3.5 h-3.5" />}
                <span>{tab}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === tab ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & History Sub-filter */}
        <div className="flex items-center gap-2">
          {activeTab === 'Leave History' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['All', 'Approved', 'Rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
                    historyFilter === f ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, leave type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. STRUCTURED LEAVE APPLICATIONS TABLE ───────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Leave Type</th>
                <th className="py-3 px-3">Duration & Dates</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Applied</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-extrabold text-slate-800">No leave requests found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeTab === 'Pending Review' ? 'All caught up! No pending applications.' : 'No records match your search filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => {
                  const ltStyle = LEAVE_TYPE_COLORS[req.leave_type_name ?? ''] || 'bg-slate-100 text-slate-700 border-slate-200';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {req.employee_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">{req.employee_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">EMP-LEAVE-{req.id.slice(-4)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${ltStyle} inline-block`}>
                          {req.leave_type_name}
                        </span>
                      </td>

                      {/* Duration & Dates */}
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{formatDate(req.start_date)}</span>
                          <span className="text-slate-400">→</span>
                          <span>{formatDate(req.end_date)}</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-extrabold font-mono">
                          {req.total_days} Day{req.total_days !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="text-[11px] text-slate-600 truncate max-w-[200px]" title={req.reason}>
                          {req.reason}
                        </p>
                      </td>

                      {/* Applied Time */}
                      <td className="py-3.5 px-3 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                        {timeAgo(req.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <Badge
                          variant={req.status === 'Approved' ? 'green' : req.status === 'Pending' ? 'amber' : 'red'}
                          size="sm"
                        >
                          {req.status}
                        </Badge>
                      </td>

                      {/* Action: View Pop-up Card */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setComment(req.hr_comments || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-2xs"
                            title="Inspect & Decide Leave in Pop-up"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-700" />
                            <span>{req.status === 'Pending' ? 'Review' : 'View'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. LEAVE REQUEST DETAIL & DECISION POP-UP MODAL ──────────── */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title="Leave Application Inspection"
          description={`Review request details submitted by ${selectedReq.employee_name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            
            {/* Employee Profile Header in Modal */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-md">
                  {selectedReq.employee_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{selectedReq.employee_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">Applied {timeAgo(selectedReq.created_at)}</p>
                </div>
              </div>

              <Badge
                variant={selectedReq.status === 'Approved' ? 'green' : selectedReq.status === 'Pending' ? 'amber' : 'red'}
                size="md"
              >
                {selectedReq.status}
              </Badge>
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave Category</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedReq.leave_type_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                <span className="font-extrabold text-blue-700 font-mono mt-0.5 block">
                  {selectedReq.total_days} Day{selectedReq.total_days !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">{formatDate(selectedReq.start_date)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">End Date</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">{formatDate(selectedReq.end_date)}</span>
              </div>
            </div>

            {/* Employee's Stated Reason */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Reason / Handover Plan</span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {selectedReq.reason || 'No specific notes provided.'}
              </p>
            </div>

            {/* HR Decision / Comment input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                HR Manager Feedback / Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Approved — please ensure all tasks are handed over to the team."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons: Accept / Reject */}
            {selectedReq.status === 'Pending' ? (
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={() => handleAction('Rejected')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold hover:bg-rose-100 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <XCircle className="w-4 h-4 text-rose-600" /> Reject Request
                </button>
                <button
                  onClick={() => handleAction('Approved')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" /> Accept & Approve Leave
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-2xl text-center text-xs font-bold text-slate-600">
                Decision already recorded: <span className="font-extrabold text-slate-900">{selectedReq.status}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
