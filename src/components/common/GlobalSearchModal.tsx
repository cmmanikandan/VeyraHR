import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, FileText, ArrowRight, Bell } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useData } from '../../context/DataContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { employees, departments, announcements, leaveRequests } = useData();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredEmployees = query.trim()
    ? employees.filter((e) =>
        `${e.first_name} ${e.last_name} ${e.employee_id} ${e.designation}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : employees.slice(0, 3);

  const filteredAnnouncements = query.trim()
    ? announcements.filter((a) =>
        `${a.title} ${a.category}`.toLowerCase().includes(query.toLowerCase())
      )
    : announcements.slice(0, 2);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="-mt-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-veyra-blue" />
          <input
            type="text"
            autoFocus
            placeholder="Search employees, departments, attendance, announcements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-veyra-bg-secondary rounded-xl text-sm font-medium text-veyra-text placeholder:text-veyra-text-muted focus:outline-none focus:ring-2 focus:ring-veyra-blue/30 border border-veyra-border/80"
          />
        </div>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Employees */}
          <div>
            <h5 className="text-[11px] font-bold text-veyra-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-veyra-blue" /> Employees ({filteredEmployees.length})
            </h5>
            <div className="space-y-1.5">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => {
                    onClose();
                    if (onNavigate) onNavigate('workforce');
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-veyra-blue-soft/50 cursor-pointer transition-colors border border-transparent hover:border-veyra-blue-border/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-veyra-blue-soft text-veyra-blue font-bold text-xs flex items-center justify-center border border-veyra-blue-border/60">
                      {emp.first_name[0]}
                      {emp.last_name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-veyra-text">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-[11px] text-veyra-text-sub">
                        {emp.employee_id} • {emp.designation}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-veyra-text-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div>
            <h5 className="text-[11px] font-bold text-veyra-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-veyra-blue" /> Announcements ({filteredAnnouncements.length})
            </h5>
            <div className="space-y-1.5">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => {
                    onClose();
                    if (onNavigate) onNavigate('engagement');
                  }}
                  className="p-2.5 rounded-xl hover:bg-veyra-bg-secondary cursor-pointer transition-colors border border-veyra-border/40"
                >
                  <p className="text-xs font-bold text-veyra-text">{ann.title}</p>
                  <p className="text-[11px] text-veyra-text-sub line-clamp-1 mt-0.5">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-veyra-border flex items-center justify-between text-[11px] text-veyra-text-sub">
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">ESC</kbd> to close</span>
          <span>VeyraHR Global Index</span>
        </div>
      </div>
    </Modal>
  );
};
