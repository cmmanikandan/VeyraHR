import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Employee, 
  AttendanceRecord, 
  AttendanceCorrection,
  LeaveRequest, 
  LeaveBalance, 
  Shift, 
  ShiftSwapRequest,
  MoodLog, 
  Announcement, 
  NotificationItem, 
  AuditLog,
  Department,
  JobRole,
  Branch,
  HRManager,
  SecuritySession,
  CompanyHoliday
} from '../types/database';
import { supabase } from '../lib/supabase';
import { getOfflineQueue, processOfflineQueue, enqueueOfflineAttendance } from '../lib/offlineQueue';

interface DataContextType {
  employees: Employee[];
  hrManagers: HRManager[];
  securitySessions: SecuritySession[];
  departments: Department[];
  jobRoles: JobRole[];
  branches: Branch[];
  attendance: AttendanceRecord[];
  corrections: AttendanceCorrection[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  shifts: Shift[];
  shiftSwaps: ShiftSwapRequest[];
  moodLogs: MoodLog[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  companyHolidays: CompanyHoliday[];
  isOffline: boolean;
  offlineQueueLength: number;
  
  // Actions
  addEmployee: (emp: Omit<Employee, 'id' | 'employee_id'>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  addHRManager: (hr: Omit<HRManager, 'id' | 'created_at'>) => Promise<HRManager>;
  updateHRManager: (hr: HRManager) => Promise<HRManager>;
  updateHRManagerStatus: (id: string, status: 'Active' | 'Inactive') => Promise<void>;
  deleteHRManager: (id: string) => Promise<void>;
  forceLogoutSession: (sessionId: string) => Promise<void>;
  checkIn: (employeeId: string, location?: string, method?: string) => Promise<AttendanceRecord>;
  checkOut: (employeeId: string, location?: string) => Promise<AttendanceRecord>;
  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'created_at'>) => Promise<LeaveRequest>;
  updateLeaveStatus: (requestId: string, status: 'Approved' | 'Rejected', comments?: string) => Promise<void>;
  submitCorrection: (correction: Omit<AttendanceCorrection, 'id' | 'status' | 'created_at'>) => Promise<void>;
  updateCorrectionStatus: (id: string, status: 'Approved' | 'Rejected', comments?: string) => Promise<void>;
  logMood: (employeeId: string, mood: MoodLog['mood'], note?: string) => Promise<void>;
  requestShiftSwap: (swap: Omit<ShiftSwapRequest, 'id' | 'target_acceptance' | 'hr_approval' | 'created_at'>) => Promise<void>;
  approveShiftSwap: (swapId: string, type: 'colleague' | 'hr', decision: 'Approved' | 'Accepted' | 'Rejected' | 'Declined') => Promise<void>;
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  createCompanyBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  deleteCompanyBranch: (id: string) => Promise<void>;
  createDepartment: (dept: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  createJobRole: (role: Omit<JobRole, 'id'>) => Promise<void>;
  updateJobRole: (id: string, updates: Partial<JobRole>) => Promise<void>;
  deleteJobRole: (id: string) => Promise<void>;
  assignEmployeeDepartmentAndRole: (employeeId: string, departmentName: string, designation: string) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  addShiftTemplate: (shift: Omit<Shift, 'id'>) => Promise<Shift>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_EMPLOYEES: Employee[] = [];
const DEFAULT_HR_MANAGERS: HRManager[] = [];
const DEFAULT_ATTENDANCE: AttendanceRecord[] = [];
const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [];
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [];
const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy demo data from localStorage on fresh boot
  useEffect(() => {
    try {
      const demoKeys = ['veyra_employees', 'veyra_hr_managers', 'veyra_attendance', 'veyra_leaves', 'veyra_announcements', 'veyra_notifications'];
      demoKeys.forEach((k) => {
        const item = localStorage.getItem(k);
        if (item && (item.includes('emp_001') || item.includes('sudha.hr@veyrahr.com') || item.includes('att_001') || item.includes('l_001'))) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }, []);

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_employees');
      if (saved) {
        const parsed: Employee[] = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(e => e.id === 'emp_001')) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [hrManagers, setHrManagers] = useState<HRManager[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_hr_managers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(h => h.id === 'hr_001')) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [securitySessions, setSecuritySessions] = useState<SecuritySession[]>([]);
  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_departments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'd1', company_id: 'comp_veyra_tn', name: 'Engineering & Tech', code: 'ENG', head_name: 'Anjali Sharma', description: 'Core software architecture, full stack development, cloud ops & QA' },
      { id: 'd2', company_id: 'comp_veyra_tn', name: 'Human Resources', code: 'HR', head_name: 'Priya Sundaram', description: 'Talent management, employee relations, payroll & compliance' },
      { id: 'd3', company_id: 'comp_veyra_tn', name: 'Product & Design', code: 'PROD', head_name: 'Arun Prakash', description: 'Product roadmap, UX/UI design systems & user research' },
      { id: 'd4', company_id: 'comp_veyra_tn', name: 'Sales & Marketing', code: 'SALES', head_name: 'Karthik Raja', description: 'Enterprise client acquisition, revenue growth & brand marketing' },
      { id: 'd5', company_id: 'comp_veyra_tn', name: 'Finance & Operations', code: 'FIN', head_name: 'Lakshmi Narayanan', description: 'Statutory compliance, financial reporting, budgeting & payroll' },
      { id: 'd6', company_id: 'comp_veyra_tn', name: 'Customer Support', code: 'SUPP', head_name: 'Suresh Kumar', description: 'Client success, technical helpdesk & 24/7 SLA resolution' },
    ];
  });

  const [jobRoles, setJobRoles] = useState<JobRole[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_job_roles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'r1', company_id: 'comp_veyra_tn', department_name: 'Engineering & Tech', title: 'Senior Full Stack Engineer', level: 'L3 - Senior', min_salary: 800000, max_salary: 1400000, description: 'Core application architect and full-stack development lead' },
      { id: 'r2', company_id: 'comp_veyra_tn', department_name: 'Engineering & Tech', title: 'DevOps & Cloud Engineer', level: 'L2 - Specialist', min_salary: 650000, max_salary: 1100000, description: 'CI/CD pipeline and cloud infrastructure maintainer' },
      { id: 'r3', company_id: 'comp_veyra_tn', department_name: 'Engineering & Tech', title: 'QA Automation Engineer', level: 'L2 - Specialist', min_salary: 500000, max_salary: 900000, description: 'End-to-end integration and automated regression testing' },
      { id: 'r4', company_id: 'comp_veyra_tn', department_name: 'Human Resources', title: 'HR Business Partner (HRBP)', level: 'L3 - Senior', min_salary: 700000, max_salary: 1200000, description: 'Talent acquisition, employee lifecycle, and performance management' },
      { id: 'r5', company_id: 'comp_veyra_tn', department_name: 'Human Resources', title: 'HR Operations Associate', level: 'L1 - Associate', min_salary: 400000, max_salary: 650000, description: 'Attendance records, compliance, and documentation' },
      { id: 'r6', company_id: 'comp_veyra_tn', department_name: 'Product & Design', title: 'Lead UI/UX Product Designer', level: 'L4 - Lead / Principal', min_salary: 900000, max_salary: 1600000, description: 'User interface systems, design tokens, and user research' },
      { id: 'r7', company_id: 'comp_veyra_tn', department_name: 'Sales & Marketing', title: 'Senior Enterprise Account Executive', level: 'L3 - Senior', min_salary: 800000, max_salary: 1500000, description: 'Enterprise client acquisition and revenue operations' },
      { id: 'r8', company_id: 'comp_veyra_tn', department_name: 'Finance & Operations', title: 'Senior Financial Controller', level: 'L4 - Lead / Principal', min_salary: 950000, max_salary: 1600000, description: 'Statutory compliance, tax filing, and payroll disbursement' },
      { id: 'r9', company_id: 'comp_veyra_tn', department_name: 'Customer Support', title: 'Technical Support Lead', level: 'L3 - Senior', min_salary: 550000, max_salary: 950000, description: 'Level 2 customer escalation and service level agreements' },
    ];
  });
  const [branches, setBranches] = useState<Branch[]>([
    { id: 'b1', company_id: 'comp_veyra_tn', name: 'Chennai HQ', district: 'Chennai', city: 'Anna Nagar', address: 'No. 42, 2nd Main Road', pincode: '600040', manager: 'Admin' },
    { id: 'b2', company_id: 'comp_veyra_tn', name: 'Coimbatore Branch', district: 'Coimbatore', city: 'Gandhipuram', address: 'Cross Cut Road', pincode: '641012', manager: 'Priya Sundaram' },
    { id: 'b3', company_id: 'comp_veyra_tn', name: 'Madurai Regional Hub', district: 'Madurai', city: 'KK Nagar', address: '80 Feet Road', pincode: '625020', manager: 'Ramesh Kumar' },
    { id: 'b4', company_id: 'comp_veyra_tn', name: 'Karur Office', district: 'Karur', city: 'Thanthonimalai', address: 'Bye-pass Road', pincode: '639005', manager: 'Senthil Kumar' },
  ]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_attendance');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(a => a.employee_id === 'emp_001')) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_leaves');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(l => l.employee_id === 'emp_001')) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  const [shifts, setShifts] = useState<Shift[]>([
    { id: 's1', company_id: 'comp_veyra_tn', name: 'Morning Shift (General)', start_time: '09:00:00', end_time: '18:00:00', break_duration_mins: 60, grace_period_mins: 15, is_active: true },
    { id: 's2', company_id: 'comp_veyra_tn', name: 'Evening Shift', start_time: '14:00:00', end_time: '23:00:00', break_duration_mins: 60, grace_period_mins: 15, is_active: true },
    { id: 's3', company_id: 'comp_veyra_tn', name: 'Night Shift', start_time: '22:00:00', end_time: '07:00:00', break_duration_mins: 60, grace_period_mins: 15, is_active: true },
  ]);
  const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_mood_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_announcements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(n => n.recipient_profile_id === 'emp_001')) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([
    { id: 'hol_1', company_id: 'comp_veyra_tn', name: 'Independence Day', holiday_date: '2026-08-15', is_optional: false },
    { id: 'hol_2', company_id: 'comp_veyra_tn', name: 'Ganesh Chaturthi', holiday_date: '2026-09-14', is_optional: false },
    { id: 'hol_3', company_id: 'comp_veyra_tn', name: 'Gandhi Jayanti', holiday_date: '2026-10-02', is_optional: false },
  ]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [offlineQueueLength, setOfflineQueueLength] = useState<number>(getOfflineQueue().length);

  // Connectivity Listener
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      await processOfflineQueue(async (item) => {
        try {
          if (item.type === 'check_in') {
            await checkIn(item.employee_id, item.location, item.verification_method);
          } else {
            await checkOut(item.employee_id, item.location);
          }
          return true;
        } catch {
          return false;
        }
      });
      setOfflineQueueLength(getOfflineQueue().length);
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Request notification permission if available
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = useCallback(async () => {
    try {
      // 1. Employees
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      if (!empErr && empData) {
        setEmployees(empData);
        try { localStorage.setItem('veyra_employees', JSON.stringify(empData)); } catch {}
      }

      // 2. HR Managers
      const { data: hrData, error: hrErr } = await supabase
        .from('hr_managers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!hrErr && hrData) {
        setHrManagers(hrData);
        try { localStorage.setItem('veyra_hr_managers', JSON.stringify(hrData)); } catch {}
      }

      // 3. Attendance Records
      const { data: attData, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });
      if (!attErr && attData) {
        setAttendance(attData);
        try { localStorage.setItem('veyra_attendance', JSON.stringify(attData)); } catch {}
      }

      // 4. Leave Requests
      const { data: leaveData, error: leaveErr } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!leaveErr && leaveData) {
        setLeaveRequests(leaveData);
        try { localStorage.setItem('veyra_leaves', JSON.stringify(leaveData)); } catch {}
      }

      // 5. Mood Pulse Logs
      const { data: moodData, error: moodErr } = await supabase
        .from('mood_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!moodErr && moodData) {
        setMoodLogs(moodData);
        try { localStorage.setItem('veyra_mood_logs', JSON.stringify(moodData)); } catch {}
      }

      // 6. Announcements
      const { data: annData, error: annErr } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!annErr && annData) {
        setAnnouncements(annData);
        try { localStorage.setItem('veyra_announcements', JSON.stringify(annData)); } catch {}
      }

      // 7. Shifts
      const { data: shiftData, error: shiftErr } = await supabase.from('shifts').select('*');
      if (!shiftErr && shiftData && shiftData.length > 0) setShifts(shiftData);

      // 8. Shift Swaps
      const { data: swapData } = await supabase
        .from('shift_swap_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (swapData) setShiftSwaps(swapData);

      // 9. Attendance Corrections
      const { data: corrData } = await supabase
        .from('attendance_corrections')
        .select('*')
        .order('created_at', { ascending: false });
      if (corrData) setCorrections(corrData);

      // 10. Branches
      const { data: branchData } = await supabase.from('branches').select('*');
      if (branchData && branchData.length > 0) setBranches(branchData);

      // 11. Departments
      const { data: deptData } = await supabase.from('departments').select('*');
      if (deptData && deptData.length > 0) setDepartments(deptData);

      // 12. Leave Balances
      const { data: balData } = await supabase.from('leave_balances').select('*');
      if (balData && balData.length > 0) setLeaveBalances(balData);
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── SUPABASE REALTIME: Live attendance push (no manual refresh needed) ──
  useEffect(() => {
    const channel = supabase
      .channel('veyra-attendance-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          const record = payload.new as AttendanceRecord;
          if (!record?.id) return;
          setAttendance((prev) => {
            const idx = prev.findIndex((a) => a.id === record.id);
            if (idx !== -1) {
              // UPDATE existing record
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...record };
              try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
              return updated;
            } else {
              // INSERT new record
              const updated = [record, ...prev];
              try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
              return updated;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // HR Manager Actions
  const addHRManager = async (hr: Omit<HRManager, 'id' | 'created_at'>): Promise<HRManager> => {
    const newHR: HRManager = {
      ...hr,
      id: `hr_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setHrManagers((prev) => {
      const updated = [newHR, ...prev];
      try {
        localStorage.setItem('veyra_hr_managers', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      return updated;
    });

    // Sync to Supabase profiles & hr_managers with schema-compliant payload
    try {
      const hrEmail = newHR.email.trim().toLowerCase();

      // Save HR credentials to local credentials store for cross-device login
      if (newHR.password) {
        try {
          const creds = JSON.parse(localStorage.getItem('veyra_hr_credentials') || '{}');
          creds[hrEmail] = newHR.password;
          localStorage.setItem('veyra_hr_credentials', JSON.stringify(creds));
        } catch {}
      }

      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: newHR.id,
        company_id: newHR.company_id || 'comp_veyra_tn',
        full_name: newHR.full_name,
        email: hrEmail,
        phone: newHR.phone || null,
        role: 'hr_manager',
        branch_name: newHR.branch_name || 'Chennai HQ',
        department_access: newHR.department_access || 'All Departments',
        status: newHR.status || 'Active',
        password: newHR.password,
      });
      if (profileErr) console.warn('HR Profile upsert error:', profileErr);

      const { error: hrErr } = await supabase.from('hr_managers').upsert({
        id: newHR.id,
        company_id: newHR.company_id || 'comp_veyra_tn',
        full_name: newHR.full_name,
        email: hrEmail,
        phone: newHR.phone || null,
        branch_name: newHR.branch_name || 'Chennai HQ',
        department_access: newHR.department_access || 'All Departments',
        permissions: newHR.permissions || ['Employees', 'Attendance', 'Leaves', 'Shifts', 'Announcements', 'Reports'],
        status: newHR.status || 'Active',
        avatar_url: newHR.avatar_url || null,
        password: newHR.password,
      });
      if (hrErr) console.warn('HR Manager upsert error:', hrErr);
    } catch (e) {
      console.warn('HR Manager Supabase sync notice:', e);
    }

    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        company_id: newHR.company_id || 'comp_veyra_tn',
        actor_name: 'Master Administrator',
        action: 'HR_MANAGER_CREATED',
        details: `Granted HR Management permissions for ${newHR.full_name} (${newHR.email}) at ${newHR.branch_name}`,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return newHR;
  };

  const updateHRManager = async (hr: HRManager): Promise<HRManager> => {
    setHrManagers((prev) => {
      const updated = prev.map((h) => (h.id === hr.id ? hr : h));
      try {
        localStorage.setItem('veyra_hr_managers', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      return updated;
    });

    try {
      const hrEmail = hr.email.trim().toLowerCase();

      // Save to local credentials store
      if (hr.password) {
        try {
          const creds = JSON.parse(localStorage.getItem('veyra_hr_credentials') || '{}');
          creds[hrEmail] = hr.password;
          localStorage.setItem('veyra_hr_credentials', JSON.stringify(creds));
        } catch {}
      }

      await supabase.from('profiles').upsert({
        id: hr.id,
        company_id: hr.company_id || 'comp_veyra_tn',
        full_name: hr.full_name,
        email: hrEmail,
        phone: hr.phone || null,
        role: 'hr_manager',
        branch_name: hr.branch_name || 'Chennai HQ',
        department_access: hr.department_access || 'All Departments',
        status: hr.status || 'Active',
        password: hr.password,
      });

      await supabase.from('hr_managers').upsert({
        id: hr.id,
        company_id: hr.company_id || 'comp_veyra_tn',
        full_name: hr.full_name,
        email: hrEmail,
        phone: hr.phone || null,
        branch_name: hr.branch_name || 'Chennai HQ',
        department_access: hr.department_access || 'All Departments',
        permissions: hr.permissions || ['Employees', 'Attendance', 'Leaves', 'Shifts', 'Announcements', 'Reports'],
        status: hr.status || 'Active',
        avatar_url: hr.avatar_url || null,
        password: hr.password,
      });
    } catch (e) {
      console.warn('HR Manager Supabase sync error:', e);
    }

    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        company_id: hr.company_id || 'comp_veyra_tn',
        actor_name: 'Master Administrator',
        action: 'HR_MANAGER_UPDATED',
        details: `Updated credentials and permissions for HR Manager ${hr.full_name} (${hr.email})`,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return hr;
  };

  const updateHRManagerStatus = async (id: string, status: 'Active' | 'Inactive') => {
    try {
      await supabase.from('profiles').update({ status }).eq('id', id);
      await supabase.from('hr_managers').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('HR status sync:', e);
    }
    setHrManagers((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, status } : h));
      try {
        localStorage.setItem('veyra_hr_managers', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteHRManager = async (id: string) => {
    try {
      await supabase.from('profiles').delete().eq('id', id);
      await supabase.from('hr_managers').delete().eq('id', id);
    } catch (e) {
      console.warn('HR delete sync:', e);
    }
    setHrManagers((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem('veyra_hr_managers', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const forceLogoutSession = async (sessionId: string) => {
    setSecuritySessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'Revoked' } : s))
    );
  };

  // Employee Actions
  const addEmployee = async (emp: Omit<Employee, 'id' | 'employee_id'>): Promise<Employee> => {
    const nextNumber = employees.length + 1;
    const formattedId = `VEY-EMP-${String(nextNumber).padStart(4, '0')}`;

    const newEmp: Employee = {
      ...emp,
      id: `emp_${Date.now()}`,
      employee_id: formattedId,
      status: 'Active',
      created_at: new Date().toISOString(),
    };

    // 1. Immediately update state and localStorage
    setEmployees((prev) => {
      const updated = [newEmp, ...prev];
      try {
        localStorage.setItem('veyra_employees', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save notice:', err);
      }
      return updated;
    });

    // 2. Persist to Supabase Database (sanitized SQL payload)
    try {
      const dbEmpPayload = {
        id: newEmp.id,
        profile_id: newEmp.profile_id || null,
        company_id: newEmp.company_id || 'comp_veyra_tn',
        employee_id: newEmp.employee_id,
        first_name: newEmp.first_name,
        last_name: newEmp.last_name,
        email: newEmp.email.trim().toLowerCase(),
        phone: newEmp.phone || null,
        department_name: newEmp.department_name || 'Engineering & Tech',
        branch_name: newEmp.branch_name || 'Chennai HQ',
        designation: newEmp.designation,
        joining_date: newEmp.joining_date,
        work_location: newEmp.work_location,
        emergency_contact: newEmp.emergency_contact || null,
        address: newEmp.address || null,
        status: newEmp.status || 'Active',
        avatar_url: newEmp.avatar_url || null,
        password: newEmp.password,
      };

      await supabase.from('employees').upsert(dbEmpPayload);

      await supabase.from('profiles').upsert({
        id: newEmp.id,
        company_id: newEmp.company_id || 'comp_veyra_tn',
        email: newEmp.email.trim().toLowerCase(),
        full_name: `${newEmp.first_name} ${newEmp.last_name}`,
        role: 'employee',
        phone: newEmp.phone || null,
        branch_name: newEmp.branch_name || 'Chennai HQ',
        department_access: newEmp.department_name || 'Engineering & Tech',
        avatar_url: newEmp.avatar_url,
        status: newEmp.status || 'Active',
        password: newEmp.password,
      });
    } catch (e) {
      console.warn('Supabase insertion notice:', e);
    }

    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        company_id: newEmp.company_id,
        actor_name: 'HR Manager',
        action: 'EMPLOYEE_CREATED',
        details: `Issued digital profile & ID card for ${newEmp.first_name} ${newEmp.last_name} (${formattedId})`,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return newEmp;
  };

  const deleteEmployee = async (id: string) => {
    try {
      await supabase.from('profiles').delete().eq('id', id);
      await supabase.from('employees').delete().eq('id', id);
    } catch (e) {
      console.warn('Employee delete sync:', e);
    }
    setEmployees((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try { localStorage.setItem('veyra_employees', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const checkIn = async (employeeId: string, location = 'Chennai HQ Geofence', method = 'Dynamic QR + GPS'): Promise<AttendanceRecord> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const emp = employees.find((e) => e.id === employeeId);
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee';

    const currentHour = new Date().getHours();
    const currentMin = new Date().getMinutes();
    const isLate = currentHour > 9 || (currentHour === 9 && currentMin > 15);

    const existing = attendance.find((a) => a.employee_id === employeeId && a.date === todayStr);

    if (existing) {
      const updatedRecord: AttendanceRecord = {
        ...existing,
        check_in_time: existing.check_in_time || nowIso,
        check_out_time: undefined,
        check_in_location: location,
        verification_method: method,
        working_hours_mins: 0,
      };

      try {
        await supabase.from('attendance').upsert(updatedRecord);
      } catch (e) {
        console.warn('Check-in upsert sync:', e);
      }

      setAttendance((prev) => {
        const updated = [updatedRecord, ...prev.filter((a) => a.id !== existing.id)];
        try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
        return updated;
      });

      return updatedRecord;
    }

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      employee_id: employeeId,
      employee_name: empName,
      company_id: 'comp_veyra_tn',
      date: todayStr,
      check_in_time: nowIso,
      status: isLate ? 'Late' : 'Present',
      verification_method: method,
      check_in_location: location,
      working_hours_mins: 0,
      break_duration_mins: 0,
      overtime_mins: 0,
      is_offline_sync: !navigator.onLine,
    };

    try {
      await supabase.from('attendance').upsert(newRecord);
    } catch (e) {
      console.warn('Check-in sync:', e);
    }

    setAttendance((prev) => {
      const updated = [newRecord, ...prev.filter((a) => !(a.employee_id === employeeId && a.date === todayStr))];
      try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
      return updated;
    });

    return newRecord;
  };

  const checkOut = async (employeeId: string, location = 'Chennai HQ Geofence'): Promise<AttendanceRecord> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    let updatedRecord: AttendanceRecord | null = null;

    setAttendance((prev) => {
      const updated = prev.map((a) => {
        if (a.employee_id === employeeId && a.date === todayStr) {
          const checkInDate = a.check_in_time ? new Date(a.check_in_time).getTime() : Date.now() - 28800000;
          const durationMins = Math.max(1, Math.round((Date.now() - checkInDate) / 60000));
          updatedRecord = {
            ...a,
            check_out_time: nowIso,
            check_out_location: location,
            working_hours_mins: durationMins,
          };
          return updatedRecord;
        }
        return a;
      });

      if (!updatedRecord) {
        const emp = employees.find((e) => e.id === employeeId);
        updatedRecord = {
          id: `att_${Date.now()}`,
          employee_id: employeeId,
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
          company_id: 'comp_veyra_tn',
          date: todayStr,
          check_out_time: nowIso,
          status: 'Present',
          verification_method: 'Dynamic QR + GPS',
          check_out_location: location,
          working_hours_mins: 480,
          break_duration_mins: 60,
          overtime_mins: 0,
        };
        const withNew = [updatedRecord!, ...prev];
        try { localStorage.setItem('veyra_attendance', JSON.stringify(withNew)); } catch {}
        return withNew;
      }

      try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
      return updated;
    });

    try {
      if (updatedRecord) {
        await supabase.from('attendance').upsert(updatedRecord);
      }
    } catch (e) {
      console.warn('Check-out sync:', e);
    }

    return updatedRecord!;
  };

  const submitLeaveRequest = async (req: Omit<LeaveRequest, 'id' | 'status' | 'created_at'>): Promise<LeaveRequest> => {
    const newReq: LeaveRequest = {
      ...req,
      id: `l_${Date.now()}`,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('leave_requests').insert(newReq);
    } catch (e) {
      console.warn('Leave request sync:', e);
    }

    setLeaveRequests((prev) => {
      const updated = [newReq, ...prev];
      try { localStorage.setItem('veyra_leaves', JSON.stringify(updated)); } catch {}
      return updated;
    });
    return newReq;
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/vite.svg' });
      } catch {}
    }
  };

  const updateLeaveStatus = async (requestId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    // Persist to Supabase
    try {
      await supabase
        .from('leave_requests')
        .update({ status, hr_comments: comments })
        .eq('id', requestId);
    } catch (e) { console.warn('Leave status sync:', e); }
    setLeaveRequests((prev) => {
      const updated = prev.map((l) => (l.id === requestId ? { ...l, status, hr_comments: comments } : l));
      try { localStorage.setItem('veyra_leaves', JSON.stringify(updated)); } catch {}
      return updated;
    });

    sendBrowserNotification(
      `Leave Request ${status}!`,
      `Your time-off application was ${status.toLowerCase()} by HR Operations.`
    );
  };

  const submitCorrection = async (correction: Omit<AttendanceCorrection, 'id' | 'status' | 'created_at'>) => {
    const newCorr: AttendanceCorrection = {
      ...correction,
      id: `corr_${Date.now()}`,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    try {
      await supabase.from('attendance_corrections').insert(newCorr);
    } catch (e) {
      console.warn('Correction sync:', e);
    }
    setCorrections((prev) => [newCorr, ...prev]);
  };

  const updateCorrectionStatus = async (id: string, status: 'Approved' | 'Rejected', comments?: string) => {
    try {
      await supabase.from('attendance_corrections').update({ status, hr_comments: comments }).eq('id', id);
    } catch (e) {
      console.warn('Correction status sync:', e);
    }
    setCorrections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, hr_comments: comments } : c))
    );
  };

  const logMood = async (employeeId: string, mood: MoodLog['mood'], note?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newMood: MoodLog = {
      id: `m_${Date.now()}`,
      employee_id: employeeId,
      company_id: 'comp_veyra_tn',
      date: todayStr,
      mood,
      note: note || `Pulse: Feeling ${mood}`,
      created_at: new Date().toISOString(),
    };
    // Persist to Supabase
    try {
      await supabase.from('mood_logs').upsert(newMood);
    } catch (e) { console.warn('Mood log sync:', e); }

    setMoodLogs((prev) => {
      const filtered = prev.filter(
        (m) => !(m.employee_id === employeeId && m.date === todayStr)
      );
      const updated = [newMood, ...filtered];
      try { localStorage.setItem('veyra_mood_logs', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const requestShiftSwap = async (swap: Omit<ShiftSwapRequest, 'id' | 'target_acceptance' | 'hr_approval' | 'created_at'>) => {
    const newSwap: ShiftSwapRequest = {
      ...swap,
      id: `swap_${Date.now()}`,
      target_acceptance: 'Pending',
      hr_approval: 'Pending',
      created_at: new Date().toISOString(),
    };
    try {
      await supabase.from('shift_swap_requests').insert(newSwap);
    } catch (e) {
      console.warn('Shift swap sync:', e);
    }
    setShiftSwaps((prev) => [newSwap, ...prev]);
  };

  const approveShiftSwap = async (swapId: string, type: 'colleague' | 'hr', decision: 'Approved' | 'Accepted' | 'Rejected' | 'Declined') => {
    try {
      const updateData = type === 'colleague' ? { target_acceptance: decision } : { hr_approval: decision };
      await supabase.from('shift_swap_requests').update(updateData).eq('id', swapId);
    } catch (e) {
      console.warn('Shift swap approval sync:', e);
    }
    setShiftSwaps((prev) =>
      prev.map((s) => {
        if (s.id === swapId) {
          if (type === 'colleague') {
            return { ...s, target_acceptance: decision as 'Accepted' | 'Declined' };
          } else {
            return { ...s, hr_approval: decision as 'Approved' | 'Rejected' };
          }
        }
        return s;
      })
    );
  };

  const addAnnouncement = async (ann: Omit<Announcement, 'id' | 'created_at'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: `ann_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    // Persist to Supabase
    try {
      await supabase.from('announcements').insert(newAnn);
    } catch (e) { console.warn('Announcement sync:', e); }
    setAnnouncements((prev) => {
      const updated = [newAnn, ...prev];
      try { localStorage.setItem('veyra_announcements', JSON.stringify(updated)); } catch {}
      return updated;
    });

    sendBrowserNotification(`Company Announcement: ${ann.title}`, ann.content);
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      try { localStorage.setItem('veyra_notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, is_read: true }));
      try { localStorage.setItem('veyra_notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const createCompanyBranch = async (b: Omit<Branch, 'id'>) => {
    const newBranch: Branch = { ...b, id: `b_${Date.now()}` };
    try {
      await supabase.from('branches').insert(newBranch);
    } catch (e) {
      console.warn('Branch sync:', e);
    }
    setBranches((prev) => [...prev, newBranch]);
  };

  const deleteCompanyBranch = async (id: string) => {
    try {
      await supabase.from('branches').delete().eq('id', id);
    } catch (e) {
      console.warn('Branch delete sync:', e);
    }
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  const createDepartment = async (d: Omit<Department, 'id'>) => {
    const newDept: Department = { ...d, id: `d_${Date.now()}` };
    try {
      await supabase.from('departments').insert(newDept);
    } catch (e) {
      console.warn('Department sync:', e);
    }
    setDepartments((prev) => {
      const updated = [...prev, newDept];
      try { localStorage.setItem('veyra_departments', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      await supabase.from('departments').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Dept update:', e);
    }
    setDepartments((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      try { localStorage.setItem('veyra_departments', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const deleteDepartment = async (id: string) => {
    try {
      await supabase.from('departments').delete().eq('id', id);
    } catch (e) {
      console.warn('Dept delete:', e);
    }
    setDepartments((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      try { localStorage.setItem('veyra_departments', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const createJobRole = async (r: Omit<JobRole, 'id'>) => {
    const newRole: JobRole = {
      ...r,
      id: `role_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    try {
      await supabase.from('job_roles').insert(newRole);
    } catch (e) {
      console.warn('Job role sync:', e);
    }
    setJobRoles((prev) => {
      const updated = [...prev, newRole];
      try { localStorage.setItem('veyra_job_roles', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const updateJobRole = async (id: string, updates: Partial<JobRole>) => {
    try {
      await supabase.from('job_roles').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Job role update:', e);
    }
    setJobRoles((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      try { localStorage.setItem('veyra_job_roles', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const deleteJobRole = async (id: string) => {
    try {
      await supabase.from('job_roles').delete().eq('id', id);
    } catch (e) {
      console.warn('Job role delete:', e);
    }
    setJobRoles((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try { localStorage.setItem('veyra_job_roles', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const assignEmployeeDepartmentAndRole = async (employeeId: string, departmentName: string, designation: string) => {
    const targetDept = departments.find((d) => d.name === departmentName);
    const updates: Partial<Employee> = {
      department_name: departmentName,
      department_id: targetDept?.id,
      designation: designation,
    };
    await updateEmployee(employeeId, updates);
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      await supabase.from('employees').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Employee update sync:', e);
    }
    setEmployees((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      try { localStorage.setItem('veyra_employees', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const addShiftTemplate = async (s: Omit<Shift, 'id'>) => {
    const newShift: Shift = { ...s, id: `shift_${Date.now()}` };
    try {
      await supabase.from('shifts').insert(newShift);
    } catch (e) {
      console.warn('Shift sync:', e);
    }
    setShifts((prev) => [...prev, newShift]);
    return newShift;
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        hrManagers,
        securitySessions,
        departments,
        jobRoles,
        branches,
        attendance,
        corrections,
        leaveRequests,
        leaveBalances,
        shifts,
        shiftSwaps,
        moodLogs,
        announcements,
        notifications,
        auditLogs,
        companyHolidays,
        isOffline,
        offlineQueueLength,
        addEmployee,
        deleteEmployee,
        addHRManager,
        updateHRManager,
        updateHRManagerStatus,
        deleteHRManager,
        forceLogoutSession,
        checkIn,
        checkOut,
        submitLeaveRequest,
        updateLeaveStatus,
        submitCorrection,
        updateCorrectionStatus,
        logMood,
        requestShiftSwap,
        approveShiftSwap,
        addAnnouncement,
        markNotificationRead,
        markAllNotificationsRead,
        createCompanyBranch,
        deleteCompanyBranch,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createJobRole,
        updateJobRole,
        deleteJobRole,
        assignEmployeeDepartmentAndRole,
        updateEmployee,
        addShiftTemplate,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
