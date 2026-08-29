import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Flag, 
  Sparkles,
  Trash2,
  Filter
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  type: 'MANDATORY' | 'RESTRICTED' | 'REGIONAL';
  branches: string;
  description: string;
}

export const AdminHolidaysPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('veyra_holidays_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Holidays parse notice:', e);
      }
    }
    return [
      {
        id: 'hol_01',
        name: 'New Year’s Day',
        date: '2026-01-01',
        day: 'Thursday',
        type: 'MANDATORY',
        branches: 'All Branches',
        description: 'Global corporate holiday kicking off the calendar year.',
      },
      {
        id: 'hol_02',
        name: 'Pongal / Makar Sankranti',
        date: '2026-01-14',
        day: 'Wednesday',
        type: 'MANDATORY',
        branches: 'Chennai HQ & Regional',
        description: 'Harvest festival celebrated in Tamil Nadu and Southern hubs.',
      },
      {
        id: 'hol_03',
        name: 'Republic Day India',
        date: '2026-01-26',
        day: 'Monday',
        type: 'MANDATORY',
        branches: 'All Branches',
        description: 'National holiday marking the Constitution of India.',
      },
      {
        id: 'hol_04',
        name: 'Good Friday',
        date: '2026-04-03',
        day: 'Friday',
        type: 'MANDATORY',
        branches: 'All Branches',
        description: 'Official corporate spring holiday.',
      },
      {
        id: 'hol_05',
        name: 'Tamil New Year / Vishu',
        date: '2026-04-14',
        day: 'Tuesday',
        type: 'RESTRICTED',
        branches: 'Chennai HQ',
        description: 'Optional / restricted floating holiday for Southern branches.',
      },
      {
        id: 'hol_06',
        name: 'Independence Day',
        date: '2026-08-15',
        day: 'Saturday',
        type: 'MANDATORY',
        branches: 'All Branches',
        description: 'National Independence Day celebration.',
      },
      {
        id: 'hol_07',
        name: 'Deepavali / Diwali',
        date: '2026-11-08',
        day: 'Sunday',
        type: 'MANDATORY',
        branches: 'All Branches',
        description: 'Festival of Lights national holiday.',
      },
      {
        id: 'hol_08',
        name: 'Christmas Day',
        date: '2026-12-25',
        day: 'Friday',
        type: 'MANDATORY',
        branches: 'All Branches',
        description: 'Annual corporate winter holiday.',
      },
    ];
  });

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Holiday Form
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'MANDATORY' | 'RESTRICTED' | 'REGIONAL'>('MANDATORY');
  const [branchesText, setBranchesText] = useState('All Branches');
  const [desc, setDesc] = useState('');

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const newHol: Holiday = {
      id: 'hol_' + Date.now(),
      name,
      date,
      day: dayName,
      type,
      branches: branchesText || 'All Branches',
      description: desc || 'Corporate calendar holiday.',
    };

    const updated = [...holidays, newHol].sort((a, b) => a.date.localeCompare(b.date));
    setHolidays(updated);
    localStorage.setItem('veyra_holidays_data', JSON.stringify(updated));
    setIsAddModalOpen(false);

    setName('');
    setDate('');
    setDesc('');
  };

  const filteredHolidays = holidays.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.branches.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">Corporate Holiday Calendar</h1>
            <Badge variant="blue">{holidays.length} Holidays Configured</Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Manage mandatory national holidays, regional branch holidays, and employee floating leave quotas.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold shrink-0"
        >
          Add Holiday
        </Button>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-4 border-[#E8E2D9] bg-white">
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search holiday name or applicable branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </Card>

      {/* HOLIDAYS TABLE */}
      <Card className="border-[#E8E2D9] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FCFAF7] border-b border-[#E8E2D9] text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Day</th>
                <th className="py-3.5 px-4">Holiday Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Applicable Branches</th>
                <th className="py-3.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9] text-xs">
              {filteredHolidays.map((h) => (
                <tr key={h.id} className="hover:bg-[#FCFAF7]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#172033] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
                      <div>
                        <span className="block font-extrabold text-[#172033]">{h.date}</span>
                        <span className="text-[10px] text-[#64748B] block font-semibold">{h.day}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-[#172033]">
                    {h.name}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        h.type === 'MANDATORY'
                          ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                          : h.type === 'RESTRICTED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {h.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-[#64748B] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                      {h.branches}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-[#64748B] leading-normal max-w-sm">
                    {h.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADD HOLIDAY MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Schedule New Corporate Holiday">
        <form onSubmit={handleAddHoliday} className="space-y-4 text-left pt-2">
          <div>
            <label className="block text-xs font-extrabold text-[#172033] mb-1">Holiday Title</label>
            <input
              type="text"
              placeholder="e.g. Gandhi Jayanti"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#172033] mb-1">Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold bg-white"
              >
                <option value="MANDATORY">Mandatory National</option>
                <option value="RESTRICTED">Restricted / Floating</option>
                <option value="REGIONAL">Regional Branch Holiday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#172033] mb-1">Applicable Branches</label>
            <input
              type="text"
              placeholder="e.g. All Branches OR Chennai HQ"
              value={branchesText}
              onChange={(e) => setBranchesText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#172033] mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the holiday..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D9]">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="font-bold">
              Save Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
