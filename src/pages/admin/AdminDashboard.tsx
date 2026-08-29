import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  GitBranch, 
  Layers, 
  Clock, 
  Settings, 
  Plus, 
  UserPlus, 
  MapPin, 
  Shield, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { employees, hrManagers, branches, departments, attendance, leaveRequests } = useData();

  const growthData = [
    { month: 'Jan', employees: 12 },
    { month: 'Feb', employees: 18 },
    { month: 'Mar', employees: 25 },
    { month: 'Apr', employees: 34 },
    { month: 'May', employees: 42 },
    { month: 'Jun', employees: employees.length || 50 },
  ];

  const attendanceData = [
    { day: 'Mon', rate: 96 },
    { day: 'Tue', rate: 98 },
    { day: 'Wed', rate: 94 },
    { day: 'Thu', rate: 97 },
    { day: 'Fri', rate: 92 },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-veyra-text tracking-tight">Organization Overview</h1>
          <p className="text-xs sm:text-sm text-veyra-text-sub font-medium mt-0.5">
            Executive control panel for {company?.name || 'VeyraHR Technologies'}, HR managers, and branch operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/hr-managers')}
            icon={<UserPlus className="w-4 h-4" />}
            className="font-bold shadow-xs"
          >
            Add HR Manager
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/branches')}
            icon={<MapPin className="w-4 h-4" />}
            className="bg-white font-bold"
          >
            Add Branch
          </Button>
        </div>
      </div>

      {/* TOP KPI METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-veyra-text-sub uppercase tracking-wider block">Employees</span>
          <span className="text-2xl font-extrabold text-veyra-blue block">{employees.length}</span>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +12% this mo
          </span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-veyra-text-sub uppercase tracking-wider block">HR Managers</span>
          <span className="text-2xl font-extrabold text-purple-600 block">{hrManagers.length}</span>
          <span className="text-[11px] text-veyra-text-sub font-medium block">Delegated Access</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-veyra-text-sub uppercase tracking-wider block">Branches</span>
          <span className="text-2xl font-extrabold text-emerald-600 block">{branches.length}</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Tamil Nadu 🇮🇳</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-veyra-text-sub uppercase tracking-wider block">Departments</span>
          <span className="text-2xl font-extrabold text-veyra-navy block">{departments.length}</span>
          <span className="text-[11px] text-veyra-text-sub font-medium block">Active Units</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-veyra-text-sub uppercase tracking-wider block">Attendance Today</span>
          <span className="text-2xl font-extrabold text-blue-700 block">{attendance.length}</span>
          <span className="text-[11px] text-veyra-blue font-bold block">Live Verified</span>
        </Card>

        <Card padded={false} className="p-4 bg-white border-veyra-border shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-veyra-text-sub uppercase tracking-wider block">Pending Leave</span>
          <span className="text-2xl font-extrabold text-amber-600 block">
            {leaveRequests.filter((l) => l.status === 'Pending').length}
          </span>
          <span className="text-[11px] text-amber-600 font-bold block">Requires Action</span>
        </Card>
      </div>

      {/* WORKFORCE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card padded={false} className="p-5 bg-white border-veyra-border shadow-xs lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-veyra-text">Workforce Growth Trend</h3>
              <p className="text-xs text-veyra-text-sub font-medium">Headcount expansion over the last 6 months.</p>
            </div>
            <Badge variant="blue" size="sm" className="font-bold">
              2026 Growth
            </Badge>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="employees" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorEmp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* QUICK ACTIONS & BRANCH OVERVIEW */}
        <Card padded={false} className="p-5 bg-white border-veyra-border shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-veyra-text">Quick Admin Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/hr-managers')}
              className="w-full p-3 rounded-xl bg-veyra-bg-secondary hover:bg-veyra-blue-soft border border-veyra-border flex items-center justify-between text-xs font-bold text-veyra-text hover:text-veyra-blue transition-all"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-veyra-blue" />
                <span>Manage HR Managers ({hrManagers.length})</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/admin/branches')}
              className="w-full p-3 rounded-xl bg-veyra-bg-secondary hover:bg-veyra-blue-soft border border-veyra-border flex items-center justify-between text-xs font-bold text-veyra-text hover:text-veyra-blue transition-all"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Configure Branches ({branches.length})</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/admin/security')}
              className="w-full p-3 rounded-xl bg-veyra-bg-secondary hover:bg-veyra-blue-soft border border-veyra-border flex items-center justify-between text-xs font-bold text-veyra-text hover:text-veyra-blue transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Security Governance & Sessions</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full p-3 rounded-xl bg-veyra-bg-secondary hover:bg-veyra-blue-soft border border-veyra-border flex items-center justify-between text-xs font-bold text-veyra-text hover:text-veyra-blue transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-veyra-navy" />
                <span>Company & Attendance Settings</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
