import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Phone, 
  Mail, 
  Building2, 
  Sparkles, 
  Tag, 
  User,
  Headphones,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Employee } from '../../types/database';

export interface HelpdeskTicket {
  id: string;
  ticket_number: string;
  employee_id: string;
  employee_name: string;
  category: 'Payroll & Salary' | 'Leave & Attendance' | 'Health & Benefits' | 'Workplace & Assets' | 'General HR';
  subject: string;
  description: string;
  priority: 'Normal' | 'High' | 'Urgent';
  status: 'Open' | 'In Review' | 'Resolved' | 'Closed';
  created_at: string;
  assigned_to?: string;
  messages: {
    sender: string;
    is_hr: boolean;
    text: string;
    timestamp: string;
  }[];
}

const INITIAL_TICKETS: HelpdeskTicket[] = [
  {
    id: 't_1',
    ticket_number: 'HD-2026-081',
    employee_id: 'emp_001',
    employee_name: 'Anjali Sharma',
    category: 'Payroll & Salary',
    subject: 'Form 16 Part B Tax Declaration Clarification',
    description: 'Need assistance verifying the section 80C investment proof uploaded for Q1 tax declaration.',
    priority: 'Normal',
    status: 'In Review',
    created_at: '2026-08-27T10:30:00.000Z',
    assigned_to: 'Priya Sundaram · HR Operations',
    messages: [
      {
        sender: 'Anjali Sharma',
        is_hr: false,
        text: 'Hi HR team, I submitted my ELSS tax investment receipt for Q1. Could you confirm if it was successfully approved?',
        timestamp: 'Aug 27, 10:30 AM',
      },
      {
        sender: 'Priya Sundaram · HR Operations',
        is_hr: true,
        text: 'Hello Anjali! Your ELSS certificate has been reviewed and verified by payroll accounts. It will reflect in August payslip TDS computation.',
        timestamp: 'Aug 27, 02:15 PM',
      },
    ],
  },
  {
    id: 't_2',
    ticket_number: 'HD-2026-064',
    employee_id: 'emp_001',
    employee_name: 'Anjali Sharma',
    category: 'Health & Benefits',
    subject: 'Group Medical Insurance E-Card Download',
    description: 'Request for cashless hospitalization policy card PDF for family dependents.',
    priority: 'Normal',
    status: 'Resolved',
    created_at: '2026-08-10T11:00:00.000Z',
    assigned_to: 'Karthik Raja · Benefits Team',
    messages: [
      {
        sender: 'Anjali Sharma',
        is_hr: false,
        text: 'Requesting policy card PDF for Star Health group mediclaim policy.',
        timestamp: 'Aug 10, 11:00 AM',
      },
      {
        sender: 'Karthik Raja · Benefits Team',
        is_hr: true,
        text: 'Attached your Star Health E-Card (Policy #SH-VEY-98210). Active at all network hospitals.',
        timestamp: 'Aug 10, 04:00 PM',
      },
    ],
  },
];

const FAQS = [
  {
    q: 'How does the monthly payroll and reimbursement cycle work?',
    a: 'Payroll processing begins on the 25th of every month. Direct bank deposits are released on the last working day of the month. All reimbursement claims must be submitted before the 22nd.',
  },
  {
    q: 'How do I claim cashless medical insurance at partner hospitals?',
    a: 'Show your Star Health insurance e-card along with your VeyraHR Digital ID pass at the hospital TPA desk. For planned procedures, submit pre-authorization 48 hours in advance.',
  },
  {
    q: 'What is the leave encashment and rollover policy?',
    a: 'Up to 10 unused Annual Leaves can be carried forward to the next calendar year. Excess accrued leaves are automatically encashed during the December payroll cycle.',
  },
  {
    q: 'How do I correct a missed punch or biometric verification error?',
    a: 'Go to Attendance → Detailed Logs, and raise an Attendance Correction request within 48 hours for HR manager approval.',
  },
];

export const EmployeeHelpdesk: React.FC = () => {
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
    };
  }, [employees, profile]);

  const [tickets, setTickets] = useState<HelpdeskTicket[]>(() => {
    try {
      const saved = localStorage.getItem(`veyra_tickets_${currentEmp.id}`);
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [activeTab, setActiveTab] = useState<'tickets' | 'faq'>('tickets');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Form State
  const [category, setCategory] = useState<HelpdeskTicket['category']>('Payroll & Salary');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<HelpdeskTicket['priority']>('Normal');
  const [submitting, setSubmitting] = useState(false);

  // Reply message
  const [replyText, setReplyText] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setSubmitting(true);

    setTimeout(() => {
      const newTicket: HelpdeskTicket = {
        id: `t_${Date.now()}`,
        ticket_number: `HD-2026-${String(tickets.length + 100).padStart(3, '0')}`,
        employee_id: currentEmp.id,
        employee_name: `${currentEmp.first_name} ${currentEmp.last_name}`,
        category,
        subject,
        description,
        priority,
        status: 'Open',
        created_at: new Date().toISOString(),
        assigned_to: 'HR Operations Helpdesk',
        messages: [
          {
            sender: `${currentEmp.first_name} ${currentEmp.last_name}`,
            is_hr: false,
            text: description,
            timestamp: 'Just now',
          },
        ],
      };

      const updated = [newTicket, ...tickets];
      setTickets(updated);
      try {
        localStorage.setItem(`veyra_tickets_${currentEmp.id}`, JSON.stringify(updated));
      } catch {}

      setSubmitting(false);
      setIsNewTicketOpen(false);
      setSubject('');
      setDescription('');
    }, 600);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const newMessage = {
      sender: `${currentEmp.first_name} ${currentEmp.last_name}`,
      is_hr: false,
      text: replyText.trim(),
      timestamp: 'Just now',
    };

    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMessage],
    };

    const updatedTickets = tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t));
    setTickets(updatedTickets);
    setSelectedTicket(updatedTicket);
    try {
      localStorage.setItem(`veyra_tickets_${currentEmp.id}`, JSON.stringify(updatedTickets));
    } catch {}
    setReplyText('');
  };

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#090E1A] via-[#111A2E] to-[#16223B] border border-rose-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

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
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 font-mono">HR Grievance & SLA</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">24/7 Support Desk</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">HR Support & Helpdesk</h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Raise inquiries, track support tickets & access employee policy guide</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          className="relative z-10 font-extrabold text-xs shadow-md shrink-0 bg-rose-600 hover:bg-rose-700 self-start sm:self-auto"
          onClick={() => setIsNewTicketOpen(true)}
        >
          Raise New Ticket
        </Button>
      </div>

      {/* ─── 2. KPI SUMMARY CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tickets</span>
          <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">{tickets.length}</span>
        </div>
        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">In Progress</span>
          <span className="text-lg font-extrabold text-amber-900 font-mono mt-0.5 block">
            {tickets.filter((t) => t.status === 'Open' || t.status === 'In Review').length}
          </span>
        </div>
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Resolved</span>
          <span className="text-lg font-extrabold text-emerald-900 font-mono mt-0.5 block">
            {tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
          </span>
        </div>
      </div>

      {/* ─── 3. TAB NAVIGATION (Tickets vs FAQ) ────────────────────────── */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tickets' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> My Support Tickets
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'faq' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> HR Knowledgebase & FAQs
        </button>
      </div>

      {/* ─── TAB A: MY TICKETS LIST ───────────────────────────────────── */}
      {activeTab === 'tickets' && (
        <div className="space-y-2.5">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <Headphones className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-extrabold text-slate-900">No active tickets</h4>
              <p className="text-xs text-slate-500 mt-0.5">Need assistance? Click 'Raise New Ticket' to get in touch with HR.</p>
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all active:scale-99"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-extrabold text-blue-600">{t.ticket_number}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-500">{t.category}</span>
                  </div>

                  <Badge
                    variant={
                      t.status === 'Resolved'
                        ? 'green'
                        : t.status === 'In Review'
                        ? 'amber'
                        : t.status === 'Open'
                        ? 'blue'
                        : 'gray'
                    }
                    size="sm"
                  >
                    {t.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-medium">
                  <span>Assigned: {t.assigned_to || 'HR Helpdesk'}</span>
                  <span>{t.messages.length} message(s)</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── TAB B: FAQ & KNOWLEDGEBASE ───────────────────────────────── */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-extrabold text-slate-900">{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Direct HR Contact Card */}
          <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3">
            <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-blue-600" /> Direct HR Support Channels
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">HR Email Desk</span>
                  <span className="font-bold text-slate-900">hr.support@veyrahr.com</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Internal Extension</span>
                  <span className="font-bold text-slate-900">+91 44 2812 4000 (Ext 104)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RAISE NEW TICKET MODAL ───────────────────────────────────── */}
      {isNewTicketOpen && (
        <Modal
          isOpen={isNewTicketOpen}
          onClose={() => setIsNewTicketOpen(false)}
          title="Raise Support Ticket"
        >
          <form onSubmit={handleCreateTicket} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Payroll & Salary">Payroll, Tax & Salary Slips</option>
                <option value="Leave & Attendance">Attendance, Geofence & Leaves</option>
                <option value="Health & Benefits">Health Insurance & Mediclaim</option>
                <option value="Workplace & Assets">IT Hardware & Office Assets</option>
                <option value="General HR">General HR & Company Policies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level *</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      priority === p
                        ? p === 'Urgent'
                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-extrabold shadow-xs'
                          : 'bg-blue-50 border-blue-300 text-blue-700 font-extrabold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Summary *</label>
              <input
                type="text"
                required
                placeholder="Brief summary of your inquiry..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                rows={4}
                required
                placeholder="Please describe the issue or question in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting || !subject || !description}>
                {submitting ? 'Submitting...' : 'Submit Support Ticket'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── TICKET CHAT THREAD MODAL ─────────────────────────────────── */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket: ${selectedTicket.ticket_number}`}
        >
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">{selectedTicket.subject}</span>
                <Badge variant={selectedTicket.status === 'Resolved' ? 'green' : 'amber'}>
                  {selectedTicket.status}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">{selectedTicket.description}</p>
            </div>

            {/* Chat Thread Messages */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
              {selectedTicket.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl text-xs space-y-1 ${
                    msg.is_hr
                      ? 'bg-blue-50 border border-blue-100 mr-4'
                      : 'bg-slate-100 border border-slate-200 ml-4'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[10px]">
                    <span className={msg.is_hr ? 'text-blue-700 font-extrabold' : 'text-slate-700'}>
                      {msg.sender}
                    </span>
                    <span className="text-slate-400">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed text-[11px]">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Type your response to HR..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={handleSendReply}>
                Send
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
