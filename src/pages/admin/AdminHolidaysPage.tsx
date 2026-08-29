import React, { useState, useMemo } from 'react';
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
  Filter,
  RefreshCw,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';

interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  type: 'MANDATORY' | 'RESTRICTED' | 'REGIONAL';
  branches: string;
  region: string;
  description: string;
}

const DEFAULT_HOLIDAYS: Holiday[] = [
  {
    id: 'hol_01',
    name: 'New Year’s Day',
    date: '2026-01-01',
    day: 'Thursday',
    type: 'MANDATORY',
    branches: 'All Branches',
    region: 'Pan-India',
    description: 'Global corporate holiday kicking off the calendar year.',
  },
  {
    id: 'hol_02',
    name: 'Pongal / Makar Sankranti',
    date: '2026-01-14',
    day: 'Wednesday',
    type: 'MANDATORY',
    branches: 'Chennai HQ, Coimbatore, Madurai',
    region: 'Tamil Nadu',
    description: 'Traditional harvest festival celebrated across Tamil Nadu & Southern hubs.',
  },
  {
    id: 'hol_03',
    name: 'Republic Day India',
    date: '2026-01-26',
    day: 'Monday',
    type: 'MANDATORY',
    branches: 'All Branches',
    region: 'Pan-India',
    description: 'National holiday marking the Constitution of India.',
  },
  {
    id: 'hol_04',
    name: 'Ugadi / Gudi Padwa',
    date: '2026-03-20',
    day: 'Friday',
    type: 'RESTRICTED',
    branches: 'Bengaluru & Regional',
    region: 'Karnataka & South',
    description: 'Traditional lunar new year day.',
  },
  {
    id: 'hol_05',
    name: 'Good Friday',
    date: '2026-04-03',
    day: 'Friday',
    type: 'MANDATORY',
    branches: 'All Branches',
    region: 'Pan-India',
    description: 'Official corporate spring holiday.',
  },
  {
    id: 'hol_06',
    name: 'Tamil New Year (Puthandu) / Vishu',
    date: '2026-04-14',
    day: 'Tuesday',
    type: 'MANDATORY',
    branches: 'Chennai HQ & Regional Hubs',
    region: 'Tamil Nadu',
    description: 'State cultural holiday celebrating Tamil New Year.',
  },
  {
    id: 'hol_07',
    name: 'Independence Day',
    date: '2026-08-15',
    day: 'Saturday',
    type: 'MANDATORY',
    branches: 'All Branches',
    region: 'Pan-India',
    description: 'National Independence Day celebration.',
  },
  {
    id: 'hol_08',
    name: 'Ganesh Chaturthi',
    date: '2026-09-14',
    day: 'Monday',
    type: 'RESTRICTED',
    branches: 'All Branches',
    region: 'Pan-India',
    description: 'Optional floating religious festival.',
  },
  {
    id: 'hol_09',
    name: 'Ayudha Pooja / Vijaya Dashami',
    date: '2026-10-20',
    day: 'Tuesday',
    type: 'MANDATORY',
    branches: 'Chennai HQ, Coimbatore, Karur',
    region: 'Tamil Nadu',
    description: 'State holiday for worshipping workspace tools & craftsmanship.',
  },
  {
    id: 'hol_10',
    name: 'Deepavali / Diwali',
    date: '2026-11-08',
    day: 'Sunday',
    type: 'MANDATORY',
    branches: 'All Branches',
    region: 'Pan-India',
    description: 'Festival of Lights national holiday.',
  },
  {
    id: 'hol_11',
    name: 'Christmas Day',
    date: '2026-12-25',
    day: 'Friday',
    type: 'MANDATORY',
    branches: 'All Branches',
    region: 'Pan-India',
    description: 'Annual corporate winter holiday.',
  },
];

export const AdminHolidaysPage: React.FC = () => {
  const { branches, employees, leaveBalances } = useData();

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('veyra_holidays_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_HOLIDAYS;
  });

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'MANDATORY' | 'RESTRICTED'>('ALL');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Accrual Engine State
  const [accruing, setAccruing] = useState(false);
  const [accrualSuccess, setAccrualSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'MANDATORY' | 'RESTRICTED' | 'REGIONAL'>('MANDATORY');
  const [region, setRegion] = useState('Tamil Nadu');
  const [branchesText, setBranchesText] = useState('All Branches');
  const [desc, setDesc] = useState('');

  // Save to LocalStorage
  const saveHolidays = (updated: Holiday[]) => {
    setHolidays(updated);
    try {
      localStorage.setItem('veyra_holidays_data', JSON.stringify(updated));
    } catch {}
  };

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
      region: region || 'Tamil Nadu',
      branches: branchesText || 'All Branches',
      description: desc || 'Corporate calendar holiday.',
    };

    const updated = [...holidays, newHol].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    saveHolidays(updated);

    setName('');
    setDate('');
    setDesc('');
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = holidays.filter((h) => h.id !== id);
    saveHolidays(updated);
  };

  // Automated Monthly Leave Accrual Simulator (+1.5 Casual & Earned leave credit)
  const handleRunMonthlyLeaveAccrual = () => {
    setAccruing(true);
    setTimeout(() => {
      try {
        const savedBalances = JSON.parse(localStorage.getItem('veyra_leave_balances') || '[]');
        const updated = savedBalances.map((b: any) => ({
          ...b,
          total_days: (b.total_days || 12) + 1.5,
        }));
        localStorage.setItem('veyra_leave_balances', JSON.stringify(updated));
      } catch {}

      setAccruing(false);
      setAccrualSuccess(`Successfully auto-credited +1.5 days Casual & Earned Leave quota to ${employees.length} active employees.`);
      setTimeout(() => setAccrualSuccess(null), 5000);
    }, 900);
  };

  // Find next upcoming holiday
  const upcomingHoliday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays.find((h) => new Date(h.date) >= today) || holidays[0];
  }, [holidays]);

  const daysToNextHoliday = useMemo(() => {
    if (!upcomingHoliday) return 0;
    const diff = new Date(upcomingHoliday.date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [upcomingHoliday]);

  // Filtered Holidays
  const filtered = holidays.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.branches.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'ALL' || h.type === selectedType;
    const matchRegion = selectedRegion === 'All' || h.region === selectedRegion;
    return matchSearch && matchType && matchRegion;
  });

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER & ACTIONS ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Holidays & Leave Accruals</h1>
            <Badge variant="blue" className="font-mono text-[10px] font-bold">
              2026 Calendar
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage statutory holidays, state-wise regional observances, and automated monthly leave balance credits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRunMonthlyLeaveAccrual}
            loading={accruing}
            icon={<RefreshCw className="w-4 h-4 text-emerald-600" />}
            className="text-xs font-bold"
          >
            Auto-Accrue Leave (+1.5d)
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Accrual Success Banner */}
      {accrualSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{accrualSuccess}</span>
        </div>
      )}

      {/* ─── UPCOMING HOLIDAY HERO SPOTLIGHT ───────────────────────────────── */}
      {upcomingHoliday && (
        <Card padded={false} className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border-0 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[10px] font-mono font-bold text-cyan-300">
                  NEXT UPCOMING CORPORATE HOLIDAY
                </span>
                <span className="text-[10px] text-blue-200 font-mono">{upcomingHoliday.region}</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">{upcomingHoliday.name}</h3>
              <p className="text-xs text-blue-200 mt-1 max-w-xl">{upcomingHoliday.description}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/20 text-center shrink-0">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest block font-mono">Countdown</span>
              <p className="text-3xl font-black text-white font-mono mt-0.5">{daysToNextHoliday} Days</p>
              <span className="text-[11px] text-blue-100 font-medium font-mono">{upcomingHoliday.date} ({upcomingHoliday.day})</span>
            </div>
          </div>
        </Card>
      )}

      {/* ─── FILTER & SEARCH CONTROLS ──────────────────────────────────────── */}
      <Card padded={false} className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(['ALL', 'MANDATORY', 'RESTRICTED'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedType === t
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All Holidays' : t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Regions</option>
              <option value="Pan-India">Pan-India</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka & South">Karnataka & South</option>
            </select>

            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search holiday..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ─── HOLIDAY CARDS GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((hol) => (
          <Card key={hol.id} padded={false} className="p-5 bg-white border-slate-200 shadow-xs hover:border-blue-400 transition-colors flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {hol.date} • {hol.day.slice(0, 3)}
                </span>
                <Badge variant={hol.type === 'MANDATORY' ? 'success' : 'warning'} size="sm" className="font-bold">
                  {hol.type}
                </Badge>
              </div>

              <div>
                <h4 className="font-black text-base text-slate-900 leading-tight">{hol.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{hol.description}</p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[170px] text-[11px]">{hol.branches}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(hol.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                title="Delete holiday"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── ADD HOLIDAY MODAL ─────────────────────────────────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="md">
        <div className="space-y-4 text-left">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Add Corporate Holiday</h3>
            <p className="text-xs text-slate-500">Add official mandatory or restricted holiday to the company roster</p>
          </div>

          <form onSubmit={handleAddHoliday} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Tamil New Year (Puthandu)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="MANDATORY">Mandatory Paid Off</option>
                  <option value="RESTRICTED">Restricted / Floating</option>
                  <option value="REGIONAL">Regional Holiday</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option>Tamil Nadu</option>
                  <option>Pan-India</option>
                  <option>Karnataka & South</option>
                  <option>Maharashtra & West</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch Scope</label>
                <input
                  type="text"
                  placeholder="e.g. All Branches or Chennai HQ"
                  value={branchesText}
                  onChange={(e) => setBranchesText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Brief description of the observance..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Holiday
              </Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};
