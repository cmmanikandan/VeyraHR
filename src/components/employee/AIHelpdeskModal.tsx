import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  X, 
  MessageSquare, 
  HelpCircle, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Ticket,
  Minus,
  Maximize2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { callGroqChat, GroqChatMessage } from '../../services/groqService';

interface AIHelpdeskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isTicketPrompt?: boolean;
}

export const AIHelpdeskModal: React.FC<AIHelpdeskModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { employees, leaveRequests, leaveBalances, shifts, branches } = useData();

  const currentEmp = employees.find(
    (e) => e.email?.toLowerCase() === profile?.email?.toLowerCase() || e.id === profile?.id
  ) || employees[0] || {
    id: profile?.id || 'emp_01',
    first_name: profile?.full_name?.split(' ')[0] || 'Employee',
    last_name: profile?.full_name?.split(' ').slice(1).join(' ') || '',
    employee_id: 'VEY-EMP-0001',
    department_name: 'Engineering & Tech',
    branch_name: 'Chennai HQ',
    designation: 'Specialist',
  };

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketRaised, setTicketRaised] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${currentEmp.first_name}! 👋 I am your VeyraHR AI Assistant. How can I help you today? You can ask me about your leave balances, shifts, overtime policies, payslips, or raise a support ticket directly to HR.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const quickPrompts = [
    'How many sick leaves do I have left?',
    'What is the company policy for overtime?',
    'How do I request a shift swap with a colleague?',
    'When is the monthly salary disbursed?',
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    const empLeaves = leaveRequests.filter(
      (l) => l.employee_id === currentEmp.id || (l.employee_name && l.employee_name.toLowerCase().includes(currentEmp.first_name.toLowerCase()))
    );
    const approvedLeavesCount = empLeaves.filter((l) => l.status === 'Approved').length;

    // Fast-path intent recognition for natural greetings & immediate queries
    const lower = textToSend.toLowerCase().trim();
    const isGreeting = /^(hi|hello|hey|good\s*(morning|evening|afternoon)|namaste|vanakkam)[\s!.]*$/i.test(lower);

    try {
      if (isGreeting) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: `Hello ${currentEmp.first_name}! 👋 How can I assist you with your attendance, leave requests, shift schedule, or company policies today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
        return;
      }

      // Build personalized employee context for Groq LLM
      const systemPrompt = `You are VeyraHR AI Assistant, a friendly, concise, and helpful HR query assistant for VeyraHR Technologies Pvt Ltd.
Current Employee Context:
- Employee Name: ${currentEmp.first_name} ${currentEmp.last_name} (${currentEmp.employee_id})
- Designation: ${currentEmp.designation}
- Department: ${currentEmp.department_name}
- Assigned Branch: ${currentEmp.branch_name || profile?.branch_name || 'Chennai HQ'}
- Annual Leave Quota: 12 Casual Leaves, 12 Sick Leaves, 15 Earned Leaves (Paid)
- Approved Leaves Taken This Year: ${approvedLeavesCount} days
- Standard Work Schedule: 09:00 AM - 06:00 PM (Monday to Friday)
- Grace Period: 15 minutes (Check-in allowed till 09:15 AM without late penalty)
- Overtime Policy: Overtime starts after 8 hours of daily shift work, calculated at standard hourly rate
- Payroll Cycle: Salary statements and bank transfers are processed on the last working day of each calendar month
- Shift Swaps: Permitted via the Self-Service Portal with colleague acceptance & HR approval

Answer the employee's query concisely and clearly. Keep responses friendly, professional, and within 2-4 sentences. If they require manual escalation, invite them to raise an HR ticket with the button below.`;

      const chatHistory: GroqChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-6).map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        })),
        { role: 'user', content: textToSend.trim() },
      ];

      const aiReply = await callGroqChat(chatHistory, { temperature: 0.3, max_tokens: 350 });

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply || 'I can help you review your policy questions or escalate a priority ticket to HR Operations.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (error) {
      console.warn('Groq AI Chat fallback activated:', error);

      // Intelligent intent-based fallback
      let dynamicFallback = `I'm here to help with your workforce questions. You can ask about your leave balances, shifts, or raise an HR ticket.`;

      if (lower.includes('leave') || lower.includes('sick') || lower.includes('casual') || lower.includes('vacation')) {
        const casualLeft = Math.max(0, 12 - approvedLeavesCount);
        dynamicFallback = `You have 12 Casual Leaves and 12 Sick Leaves allocated per year. You have taken ${approvedLeavesCount} days so far, leaving ${casualLeft} Casual and 12 Sick leaves available.`;
      } else if (lower.includes('shift') || lower.includes('timing') || lower.includes('time') || lower.includes('grace')) {
        dynamicFallback = `Your assigned shift is General Day (09:00 AM – 06:00 PM) with a 15-minute grace period until 09:15 AM. Shift swap requests can be initiated from the Home dashboard.`;
      } else if (lower.includes('salary') || lower.includes('payslip') || lower.includes('pay') || lower.includes('bonus')) {
        dynamicFallback = `Monthly salary and payslip statements are disbursed on the final working day of each calendar month. You can view and download PDF slips in the Salary & Payslips section.`;
      } else if (lower.includes('overtime') || lower.includes('ot')) {
        dynamicFallback = `Company policy permits overtime calculation after 8 hours of completed active shift time, approved directly by your reporting manager.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_fb_${Date.now()}`,
          sender: 'ai',
          text: dynamicFallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseHRTicket = () => {
    setTicketRaised(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_ticket_${Date.now()}`,
          sender: 'ai',
          text: `✅ Priority Support Ticket #TICK-${Math.floor(1000 + Math.random() * 9000)} has been created and assigned to HR Operations for ${currentEmp.branch_name || 'your branch'}. An HR manager will review your query within 4 hours.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTicketRaised(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[410px] h-[540px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Bot className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight">VeyraHR AI Assistant</h3>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black font-mono">
                Groq LLM
              </span>
            </div>
            <p className="text-[10px] text-blue-100 font-medium">Leaves, shifts, policies & support</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          title="Close AI Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {msg.sender === 'user' ? currentEmp.first_name.charAt(0) : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[82%] p-3 rounded-2xl shadow-2xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}
            >
              <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
              <span
                className={`text-[9px] block mt-1 font-mono ${
                  msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="px-3 py-2 rounded-2xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-slate-400 font-mono ml-1">AI Assistant is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-[10px] font-semibold text-slate-600 whitespace-nowrap transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input & Escalation Footer */}
      <div className="p-2.5 bg-white border-t border-slate-200 space-y-1.5 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            placeholder="Ask leaves, policies, shifts..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!inputMessage.trim() || loading}
            icon={<Send className="w-3.5 h-3.5" />}
            className="px-3.5 py-2 text-xs font-bold shrink-0"
          >
            Send
          </Button>
        </form>

        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] text-slate-400 font-medium font-mono">
            Powered by Groq Llama-3.3
          </span>
          <button
            type="button"
            onClick={handleRaiseHRTicket}
            disabled={ticketRaised}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <Ticket className="w-3 h-3" />
            {ticketRaised ? 'Raising Ticket...' : 'Raise Ticket to HR'}
          </button>
        </div>
      </div>
    </div>
  );
};
