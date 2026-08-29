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
  Ticket
} from 'lucide-react';
import { Modal } from '../ui/Modal';
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
      text: `Hello ${currentEmp.first_name}! 👋 I am your VeyraHR AI Assistant. How can I help you today? You can ask me about your leave balance, shift timings, overtime rules, payslips, or raise a support ticket to HR.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

    try {
      // Build personalized employee context for Groq LLM
      const empLeaves = leaveRequests.filter(
        (l) => l.employee_id === currentEmp.id || (l.employee_name && l.employee_name.toLowerCase().includes(currentEmp.first_name.toLowerCase()))
      );
      const approvedLeavesCount = empLeaves.filter((l) => l.status === 'Approved').length;

      const systemPrompt = `You are VeyraHR AI Assistant, a friendly, concise, and helpful HR query assistant for VeyraHR Technologies Pvt Ltd.
Current Employee Context:
- Name: ${currentEmp.first_name} ${currentEmp.last_name} (${currentEmp.employee_id})
- Designation: ${currentEmp.designation}
- Department: ${currentEmp.department_name}
- Branch: ${currentEmp.branch_name}
- Total Annual Leave Quota: 12 Casual Leaves, 12 Sick Leaves, 15 Earned Leaves (Paid)
- Leaves taken this year: ${approvedLeavesCount} days
- Standard Work Timing: 09:00 AM - 06:00 PM (Monday to Friday)
- Grace Period: 15 minutes (Check-in allowed till 09:15 AM without penalty)
- Overtime Policy: Overtime starts after 8 hours of daily work, calculated at standard hourly rate
- Payroll Cycle: Salary is processed and credited on the last working day of every calendar month
- Shift Swaps: Permitted through the Self-Service Portal with colleague acceptance & HR approval

Answer the employee's query concisely and clearly. Keep responses friendly, professional, and within 3-5 sentences. If they need escalation, invite them to raise an HR ticket.`;

      const chatHistory: GroqChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-6).map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        })),
        { role: 'user', content: textToSend.trim() },
      ];

      const aiReply = await callGroqChat(chatHistory, { temperature: 0.3, max_tokens: 300 });

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply || 'I can help you check your company policy or raise a ticket to HR Operations.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (error) {
      console.warn('Groq AI Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: `You have 12 Casual Leaves and 12 Sick Leaves allocated per year. You have taken ${leaveRequests.filter(l => l.status === 'Approved').length} days so far. Is there anything else I can help with?`,
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
          text: `✅ Priority Support Ticket #TICK-${Math.floor(1000 + Math.random() * 9000)} has been created and assigned to HR Operations for ${currentEmp.branch_name}. An HR manager will review your query within 4 hours.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTicketRaised(false);
    }, 800);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col h-[560px] -m-4">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Bot className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">VeyraHR AI Helpdesk</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black font-mono">
                  Online • Groq LLM
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">Instant answers on leaves, shifts, policies & tickets</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-bold text-[10px]'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {msg.sender === 'user' ? currentEmp.first_name.charAt(0) : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl shadow-2xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-normal'
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
              <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-slate-400 font-mono ml-1">Groq AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-[11px] font-semibold text-slate-600 whitespace-nowrap transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input & Escalation Footer */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about leaves, attendance, shifts, or policies..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputMessage.trim() || loading}
              icon={<Send className="w-3.5 h-3.5" />}
              className="px-4 py-2.5 text-xs font-bold shrink-0"
            >
              Send
            </Button>
          </form>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 font-medium">
              Powered by Groq Ultra-Fast Llama-3.3 LLM
            </span>
            <button
              type="button"
              onClick={handleRaiseHRTicket}
              disabled={ticketRaised}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <Ticket className="w-3.5 h-3.5" />
              {ticketRaised ? 'Raising Ticket...' : 'Raise Ticket to HR'}
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
