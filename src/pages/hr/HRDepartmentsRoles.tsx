import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Briefcase, 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  Filter, 
  UserPlus,
  Network,
  ChevronRight,
  User,
  GraduationCap
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { Department, JobRole, Employee } from '../../types/database';

export const HRDepartmentsRoles: React.FC = () => {
  const { 
    departments, 
    jobRoles, 
    employees, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment,
    createJobRole,
    updateJobRole,
    deleteJobRole,
    assignEmployeeDepartmentAndRole 
  } = useData();

  const [activeTab, setActiveTab] = useState<'departments' | 'roles' | 'assignments'>('departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDeptName, setRoleDeptName] = useState('');
  const [roleLevel, setRoleLevel] = useState<JobRole['level']>('L3 - Senior');
  const [roleMinSalary, setRoleMinSalary] = useState<number>(600000);
  const [roleMaxSalary, setRoleMaxSalary] = useState<number>(1200000);
  const [roleDesc, setRoleDesc] = useState('');
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Employee Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignDeptName, setAssignDeptName] = useState('');
  const [assignRoleTitle, setAssignRoleTitle] = useState('');
  const [assignSuccessToast, setAssignSuccessToast] = useState<string | null>(null);

  // ─── COMPUTED METRICS ────────────────────────────────────────────────
  const totalEmployees = employees.length;
  const totalDepts = departments.length;
  const totalRoles = jobRoles.length;

  const deptsWithCount = useMemo(() => {
    return departments.map((d) => {
      const assignedEmps = employees.filter((e) => 
        (e.department_name || '').toLowerCase() === d.name.toLowerCase() ||
        e.department_id === d.id
      );
      const rolesInDept = jobRoles.filter((r) => 
        (r.department_name || '').toLowerCase() === d.name.toLowerCase() ||
        r.department_id === d.id
      );
      return {
        ...d,
        employeeCount: assignedEmps.length,
        roleCount: rolesInDept.length,
        members: assignedEmps,
      };
    });
  }, [departments, employees, jobRoles]);

  const rolesWithCount = useMemo(() => {
    return jobRoles.map((r) => {
      const holders = employees.filter((e) => 
        (e.designation || '').toLowerCase() === r.title.toLowerCase()
      );
      return {
        ...r,
        holderCount: holders.length,
        holders,
      };
    });
  }, [jobRoles, employees]);

  // Filtered lists
  const filteredDepartments = useMemo(() => {
    return deptsWithCount.filter((d) => {
      return searchQuery === '' || 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (d.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.head_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [deptsWithCount, searchQuery]);

  const filteredRoles = useMemo(() => {
    return rolesWithCount.filter((r) => {
      const matchesDept = selectedDeptFilter === 'ALL' || r.department_name === selectedDeptFilter;
      const matchesSearch = searchQuery === '' || 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.level || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [rolesWithCount, selectedDeptFilter, searchQuery]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchesDept = selectedDeptFilter === 'ALL' || e.department_name === selectedDeptFilter;
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        fullName.includes(searchQuery.toLowerCase()) || 
        (e.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [employees, selectedDeptFilter, searchQuery]);

  // ─── HANDLERS ────────────────────────────────────────────────────────
  const handleOpenCreateDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptHead('');
    setDeptDesc('');
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code || '');
    setDeptHead(dept.head_name || '');
    setDeptDesc(dept.description || '');
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    if (editingDept) {
      await updateDepartment(editingDept.id, {
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase() || undefined,
        head_name: deptHead.trim() || undefined,
        description: deptDesc.trim() || undefined,
      });
    } else {
      await createDepartment({
        company_id: 'comp_veyra_tn',
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase() || deptName.trim().slice(0, 3).toUpperCase(),
        head_name: deptHead.trim() || undefined,
        description: deptDesc.trim() || undefined,
      });
    }
    setIsDeptModalOpen(false);
  };

  const handleDeleteDeptConfirm = async () => {
    if (!deletingDeptId) return;
    await deleteDepartment(deletingDeptId);
    setDeletingDeptId(null);
  };

  const handleOpenCreateRole = (presetDeptName?: string) => {
    setEditingRole(null);
    setRoleTitle('');
    setRoleDeptName(presetDeptName || departments[0]?.name || 'Engineering & Tech');
    setRoleLevel('L3 - Senior');
    setRoleMinSalary(600000);
    setRoleMaxSalary(1200000);
    setRoleDesc('');
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: JobRole) => {
    setEditingRole(role);
    setRoleTitle(role.title);
    setRoleDeptName(role.department_name);
    setRoleLevel(role.level || 'L3 - Senior');
    setRoleMinSalary(role.min_salary || 600000);
    setRoleMaxSalary(role.max_salary || 1200000);
    setRoleDesc(role.description || '');
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) return;

    const targetDept = departments.find((d) => d.name === roleDeptName);

    if (editingRole) {
      await updateJobRole(editingRole.id, {
        title: roleTitle.trim(),
        department_name: roleDeptName,
        department_id: targetDept?.id,
        level: roleLevel,
        min_salary: Number(roleMinSalary),
        max_salary: Number(roleMaxSalary),
        description: roleDesc.trim() || undefined,
      });
    } else {
      await createJobRole({
        company_id: 'comp_veyra_tn',
        department_id: targetDept?.id,
        department_name: roleDeptName,
        title: roleTitle.trim(),
        level: roleLevel,
        min_salary: Number(roleMinSalary),
        max_salary: Number(roleMaxSalary),
        description: roleDesc.trim() || undefined,
      });
    }
    setIsRoleModalOpen(false);
  };

  const handleDeleteRoleConfirm = async () => {
    if (!deletingRoleId) return;
    await deleteJobRole(deletingRoleId);
    setDeletingRoleId(null);
  };

  const handleOpenAssignModal = (emp?: Employee) => {
    if (emp) {
      setAssignEmployeeId(emp.id);
      setAssignDeptName(emp.department_name || departments[0]?.name || 'Engineering & Tech');
      setAssignRoleTitle(emp.designation || '');
    } else {
      setAssignEmployeeId(employees[0]?.id || '');
      setAssignDeptName(departments[0]?.name || 'Engineering & Tech');
      setAssignRoleTitle('');
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId || !assignDeptName || !assignRoleTitle) return;

    await assignEmployeeDepartmentAndRole(assignEmployeeId, assignDeptName, assignRoleTitle);
    
    const emp = employees.find((e) => e.id === assignEmployeeId);
    setAssignSuccessToast(`Assigned ${emp?.first_name} ${emp?.last_name} to ${assignDeptName} as ${assignRoleTitle}`);
    setIsAssignModalOpen(false);

    setTimeout(() => {
      setAssignSuccessToast(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* ─── 1. HEADER & GLOBAL ACTIONS ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Departments & Job Roles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure organizational units, designation hierarchy & assign employees to roles
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={<UserPlus className="w-4 h-4 text-blue-600" />}
            className="font-bold text-xs"
            onClick={() => handleOpenAssignModal()}
          >
            Assign Employee
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            className="font-extrabold text-xs shadow-md"
            onClick={() => {
              if (activeTab === 'roles') {
                handleOpenCreateRole();
              } else {
                handleOpenCreateDept();
              }
            }}
          >
            {activeTab === 'roles' ? 'Create Job Role' : 'Create Department'}
          </Button>
        </div>
      </div>

      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────── */}
      {assignSuccessToast && (
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{assignSuccessToast}</span>
          </div>
          <button onClick={() => setAssignSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* ─── 2. KPI METRICS CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Departments</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono block">{totalDepts} Units</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Designation Roles</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-purple-900 font-mono block">{totalRoles} Roles</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Assigned Workforce</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono block">{totalEmployees} Active</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Avg. Dept Headcount</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono block">
            {totalDepts > 0 ? (totalEmployees / totalDepts).toFixed(1) : 0} / Unit
          </span>
        </div>
      </div>

      {/* ─── 3. TAB CONTROLS & SEARCH BAR ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'departments' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments Hub</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'departments' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {departments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'roles' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Roles & Levels</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'roles' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {jobRoles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'assignments' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Employee Assignments</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'assignments' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {employees.length}
            </span>
          </button>
        </div>

        {/* Search & Dept Selector */}
        <div className="flex items-center gap-2">
          {activeTab !== 'departments' && (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ─── TAB 1: DEPARTMENTS HUB (CARDS & DIRECTORY) ────────────────── */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-200 shrink-0">
                      {dept.code || dept.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{dept.name}</h3>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" /> Head: {dept.head_name || 'HR Appointed'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDept(dept)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Department"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDeptId(dept.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {dept.description || 'Department responsible for operational excellence, workforce growth, and core deliverables.'}
                </p>

                {/* Sub-KPI Row */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Employees</span>
                    <span className="font-extrabold text-blue-700 font-mono mt-0.5 block">{dept.employeeCount} Assigned</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Roles</span>
                    <span className="font-extrabold text-purple-700 font-mono mt-0.5 block">{dept.roleCount} Defined</span>
                  </div>
                </div>

                {/* Member Avatars preview */}
                {dept.members.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Team Members</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {dept.members.slice(0, 4).map((m) => (
                        <span key={m.id} className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                          {m.first_name} {m.last_name}
                        </span>
                      ))}
                      {dept.members.length > 4 && (
                        <span className="text-[10px] font-bold text-slate-400">+{dept.members.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedDeptFilter(dept.name);
                    setActiveTab('roles');
                  }}
                  className="text-[11px] font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>View {dept.roleCount} Roles</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] py-1 px-2.5 font-bold"
                  onClick={() => handleOpenCreateRole(dept.name)}
                >
                  + Add Role
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 2: JOB ROLES & DESIGNATIONS MATRIX ────────────────────── */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Designation / Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Band / Level</th>
                  <th className="py-3 px-3">Salary Band (Annual CTC)</th>
                  <th className="py-3 px-3 text-center">Active Employees</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-extrabold text-slate-800">No job roles found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Create new designations using the button above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{role.title}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{role.description || 'Core job title'}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                          {role.department_name}
                        </span>
                      </td>

                      {/* Level Band */}
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={
                            role.level?.includes('L5') || role.level?.includes('L4') 
                              ? 'purple' 
                              : role.level?.includes('L3') 
                              ? 'blue' 
                              : 'gray'
                          }
                          size="sm"
                        >
                          {role.level || 'L3 - Senior'}
                        </Badge>
                      </td>

                      {/* Salary Band */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                        ₹{(role.min_salary || 500000).toLocaleString('en-IN')} – ₹{(role.max_salary || 1200000).toLocaleString('en-IN')}
                      </td>

                      {/* Holder Count */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl text-xs">
                          {role.holderCount} Active
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRole(role)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Role"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingRoleId(role.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: EMPLOYEE ASSIGNMENTS CENTER ─────────────────────────── */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Current Department</th>
                  <th className="py-3 px-3">Assigned Job Role / Title</th>
                  <th className="py-3 px-3">Location & Branch</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={emp.first_name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 block">{emp.first_name} {emp.last_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{emp.employee_id} • {emp.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                        {emp.department_name || 'Engineering & Tech'}
                      </span>
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      {emp.designation}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3 text-slate-500 font-medium">
                      {emp.branch_name || emp.work_location || 'Chennai HQ'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <Badge variant="green" size="sm">
                        {emp.status || 'Active'}
                      </Badge>
                    </td>

                    {/* Quick Reassign Button */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold"
                        onClick={() => handleOpenAssignModal(emp)}
                      >
                        Reassign Role & Dept
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL A: CREATE / EDIT DEPARTMENT ─────────────────────────── */}
      {isDeptModalOpen && (
        <Modal
          isOpen={isDeptModalOpen}
          onClose={() => setIsDeptModalOpen(false)}
          title={editingDept ? 'Edit Department' : 'Create New Department'}
          description="Define organizational unit details and assign the Department Head."
          maxWidth="sm"
        >
          <form onSubmit={handleSaveDept} className="space-y-4 text-left p-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
              <input
                type="text"
                placeholder="e.g. Artificial Intelligence & Data Science"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Code</label>
                <input
                  type="text"
                  placeholder="e.g. AIDS"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Head</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Rajesh"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Brief mission or scope of this unit..."
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsDeptModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="font-bold">
                {editingDept ? 'Update Department' : 'Save Department'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL B: CREATE / EDIT JOB ROLE ───────────────────────────── */}
      {isRoleModalOpen && (
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title={editingRole ? 'Edit Job Role' : 'Create New Job Role'}
          description="Define designation title, level band, and salary range for this role."
          maxWidth="sm"
        >
          <form onSubmit={handleSaveRole} className="space-y-4 text-left p-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Designation Title *</label>
              <input
                type="text"
                placeholder="e.g. Principal Cloud Solutions Architect"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={roleDeptName}
                  onChange={(e) => setRoleDeptName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Career Band / Level</label>
                <select
                  value={roleLevel}
                  onChange={(e) => setRoleLevel(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="L1 - Associate">L1 - Associate</option>
                  <option value="L2 - Specialist">L2 - Specialist</option>
                  <option value="L3 - Senior">L3 - Senior</option>
                  <option value="L4 - Lead / Principal">L4 - Lead / Principal</option>
                  <option value="L5 - Manager / Director">L5 - Manager / Director</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min Salary (Annual ₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={roleMinSalary}
                  onChange={(e) => setRoleMinSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Salary (Annual ₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={roleMaxSalary}
                  onChange={(e) => setRoleMaxSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Summary</label>
              <textarea
                rows={2}
                placeholder="Key responsibilities and expectations..."
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="font-bold">
                {editingRole ? 'Update Role' : 'Save Role'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL C: ASSIGN EMPLOYEE TO DEPARTMENT & ROLE ────────────── */}
      {isAssignModalOpen && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Employee to Department & Role"
          description="Map an employee to their official unit and active job designation."
          maxWidth="sm"
        >
          <form onSubmit={handleSaveAssignment} className="space-y-4 text-left p-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
              <select
                value={assignEmployeeId}
                onChange={(e) => setAssignEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id}) — Currently: {emp.department_name || 'Unassigned'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Department *</label>
              <select
                value={assignDeptName}
                onChange={(e) => {
                  setAssignDeptName(e.target.value);
                  const matchingRoles = jobRoles.filter((r) => r.department_name === e.target.value);
                  if (matchingRoles.length > 0) {
                    setAssignRoleTitle(matchingRoles[0].title);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name} ({d.code || 'UNIT'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Role Title *</label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="e.g. Senior Software Architect"
                  value={assignRoleTitle}
                  onChange={(e) => setAssignRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                
                {/* Suggestions from defined roles in this dept */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick pick:</span>
                  {jobRoles.filter((r) => r.department_name === assignDeptName).map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setAssignRoleTitle(r.title)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition-colors"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="font-bold">
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL D: DELETE CONFIRMATION ──────────────────────────────── */}
      {(deletingDeptId || deletingRoleId) && (
        <Modal
          isOpen={!!deletingDeptId || !!deletingRoleId}
          onClose={() => { setDeletingDeptId(null); setDeletingRoleId(null); }}
          title={deletingDeptId ? 'Delete Department' : 'Delete Job Role'}
          maxWidth="sm"
        >
          <div className="space-y-3 p-1 text-left">
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this {deletingDeptId ? 'department' : 'job role'}? Employees assigned will remain active.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDeletingDeptId(null); setDeletingRoleId(null); }}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                className="font-bold"
                onClick={deletingDeptId ? handleDeleteDeptConfirm : handleDeleteRoleConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
