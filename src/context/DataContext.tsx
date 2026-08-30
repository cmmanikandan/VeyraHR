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
  CompanyHoliday,
  EmployeeDocument,
  PayrollRecord
} from '../types/database';
import { supabase } from '../lib/supabase';
import { getOfflineQueue, processOfflineQueue, enqueueOfflineAttendance } from '../lib/offlineQueue';
import { triggerAppNotification } from '../services/notificationService';

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
  documents: EmployeeDocument[];
  payrollRecords: PayrollRecord[];
  
  // Actions
  uploadDocument: (doc: EmployeeDocument) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
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
  updateAttendanceBreak: (employeeId: string, breakMins: number) => Promise<void>;
  requestShiftSwap: (swap: Omit<ShiftSwapRequest, 'id' | 'target_acceptance' | 'hr_approval' | 'created_at'>) => Promise<void>;
  approveShiftSwap: (swapId: string, type: 'colleague' | 'hr', decision: 'Approved' | 'Accepted' | 'Rejected' | 'Declined') => Promise<void>;
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) => void;
  sendNotification: (title: string, body: string, url?: string, category?: string) => void;
  createCompanyBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  deleteCompanyBranch: (id: string) => Promise<void>;
  createCompanyHoliday: (holiday: Omit<CompanyHoliday, 'id' | 'company_id'>) => Promise<void>;
  deleteCompanyHoliday: (id: string) => Promise<void>;
  createDepartment: (dept: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  createJobRole: (role: Omit<JobRole, 'id'>) => Promise<void>;
  updateJobRole: (id: string, updates: Partial<JobRole>) => Promise<void>;
  deleteJobRole: (id: string) => Promise<void>;
  assignEmployeeDepartmentAndRole: (employeeId: string, departmentName: string, designation: string) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  addShiftTemplate: (shift: Omit<Shift, 'id'>) => Promise<Shift>;
  disbursePayroll: (month: string, records: PayrollRecord[]) => Promise<void>;
  releaseEmployeePayslip: (record: PayrollRecord) => Promise<void>;
  updatePayrollRecord: (record: PayrollRecord) => Promise<void>;
  getEmployeePayslipsHistory: (employee: Employee) => PayrollRecord[];
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_EMPLOYEES: Employee[] = [];
const DEFAULT_HR_MANAGERS: HRManager[] = [];
const DEFAULT_ATTENDANCE: AttendanceRecord[] = [];
const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [];
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [];
const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  // Employee Alerts
  {
    id: 'notif_welcome_emp',
    recipient_profile_id: 'all',
    recipient_role: 'employee',
    title: '👋 Welcome to VeyraHR Portal',
    message: 'Your biometric-free, QR and GPS-verified workplace portal is active. Scan or tap to mark shifts.',
    type: 'System',
    created_at: new Date().toISOString(),
    is_read: false,
    link_url: '/employee/home',
  },
  {
    id: 'notif_geofence_emp',
    recipient_profile_id: 'all',
    recipient_role: 'employee',
    title: '📍 Live GPS Geofence Workplace Monitoring',
    message: 'Automatic boundary detection is active. You will receive entry & exit notifications around your branch perimeter.',
    type: 'System',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    is_read: false,
    link_url: '/employee/attendance',
  },
  {
    id: 'notif_payslip_emp',
    recipient_profile_id: 'all',
    recipient_role: 'employee',
    title: '💰 Payslip Statement Available',
    message: 'Your monthly compensation statement with attendance breakdown and tax details is ready in the Payslips tab.',
    type: 'Payroll',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    is_read: false,
    link_url: '/employee/payslips',
  },
  // HR Operations Alerts
  {
    id: 'notif_hr_muster',
    recipient_profile_id: 'hr',
    recipient_role: 'hr_manager',
    title: '📊 Daily Attendance Muster Roll',
    message: '94% of staff have verified check-ins across Chennai HQ and regional branches today.',
    type: 'Attendance',
    created_at: new Date().toISOString(),
    is_read: false,
    link_url: '/hr/attendance',
  },
  {
    id: 'notif_hr_payroll',
    recipient_profile_id: 'hr',
    recipient_role: 'hr_manager',
    title: '💼 Monthly Payroll Cycle Ready',
    message: 'Automated statutory PF & TDS calculations are ready for review and bank disbursement.',
    type: 'Payroll',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_read: false,
    link_url: '/hr/payroll',
  },
  {
    id: 'notif_hr_leave_action',
    recipient_profile_id: 'hr',
    recipient_role: 'hr_manager',
    title: '📝 Pending Leave & Shift Requests',
    message: 'Review pending employee leave applications and shift swap approvals.',
    type: 'Leave',
    created_at: new Date(Date.now() - 5400000).toISOString(),
    is_read: false,
    link_url: '/hr/leaves',
  },
  // Admin System Governance Alerts
  {
    id: 'notif_admin_security',
    recipient_profile_id: 'admin',
    recipient_role: 'admin',
    title: '🛡️ System Security & Session Guard',
    message: 'All active HR manager sessions and branch perimeter geofence nodes are operating normally.',
    type: 'Security',
    created_at: new Date().toISOString(),
    is_read: false,
    link_url: '/admin/security',
  },
  {
    id: 'notif_admin_branches',
    recipient_profile_id: 'admin',
    recipient_role: 'admin',
    title: '🏢 Multi-Branch Network Status',
    message: '4 regional branches synchronized with centralized company governance rules.',
    type: 'System',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    is_read: false,
    link_url: '/admin/branches',
  },
];

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
  const [branches, setBranches] = useState<Branch[]>(() => {
    // Try loading previously saved branches from localStorage (set by AdminBranchesPage)
    try {
      const saved = localStorage.getItem('veyra_branches_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Default seed branches
    return [
      { id: 'b1', company_id: 'comp_veyra_tn', name: 'Chennai HQ', district: 'Chennai', city: 'Anna Nagar', address: 'No. 42, 2nd Main Road', pincode: '600040', manager: 'Admin' },
      { id: 'b2', company_id: 'comp_veyra_tn', name: 'Coimbatore Branch', district: 'Coimbatore', city: 'Gandhipuram', address: 'Cross Cut Road', pincode: '641012', manager: 'Priya Sundaram' },
      { id: 'b3', company_id: 'comp_veyra_tn', name: 'Madurai Regional Hub', district: 'Madurai', city: 'KK Nagar', address: '80 Feet Road', pincode: '625020', manager: 'Ramesh Kumar' },
      { id: 'b4', company_id: 'comp_veyra_tn', name: 'Karur Office', district: 'Karur', city: 'Thanthonimalai', address: 'Bye-pass Road', pincode: '639005', manager: 'Senthil Kumar' },
    ];
  });
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'ann_01',
        company_id: 'comp_veyra_tn',
        title: 'Q3 Corporate Town Hall & Innovation Showcase 2026',
        content: 'Join the leadership team for our quarterly review, product roadmap unveiling, and employee excellence awards session.',
        category: 'Corporate Notice',
        priority: 'Important',
        author_name: 'HR Operations',
        is_published: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'ann_02',
        company_id: 'comp_veyra_tn',
        title: 'Updated Cashless Medical Insurance Cards Available',
        content: 'All active employees can download their updated Star Health E-Insurance cards from the Document Vault. 24/7 cashless hospitalization is active across 6,500+ partner network hospitals.',
        category: 'Benefits & Health',
        priority: 'Important',
        author_name: 'People & Culture',
        is_published: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'ann_03',
        company_id: 'comp_veyra_tn',
        title: 'Workplace Attendance & Dynamic QR Kiosk Guidelines',
        content: 'Please ensure daily check-ins are recorded via reception Kiosk QR optical scan or mobile GPS punch within your assigned branch perimeter.',
        category: 'Policy Update',
        priority: 'Normal',
        author_name: 'Admin Team',
        is_published: true,
        created_at: new Date().toISOString(),
      },
    ];
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some(n => n.recipient_profile_id === 'emp_001')) return parsed;
      }
      return DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  // Realtime listener for in-app notifications
  useEffect(() => {
    const handleNotifUpdate = () => {
      try {
        const saved = localStorage.getItem('veyra_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setNotifications(parsed);
        }
      } catch {}
    };

    window.addEventListener('veyra_notifications_updated', handleNotifUpdate);
    window.addEventListener('storage', handleNotifUpdate);
    return () => {
      window.removeEventListener('veyra_notifications_updated', handleNotifUpdate);
      window.removeEventListener('storage', handleNotifUpdate);
    };
  }, []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_payroll_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([
    { id: 'hol_01', company_id: 'comp_veyra_tn', name: 'New Year’s Day', holiday_date: '2026-01-01', is_optional: false },
    { id: 'hol_02', company_id: 'comp_veyra_tn', name: 'Pongal / Makar Sankranti', holiday_date: '2026-01-14', is_optional: false },
    { id: 'hol_03', company_id: 'comp_veyra_tn', name: 'Republic Day India', holiday_date: '2026-01-26', is_optional: false },
    { id: 'hol_04', company_id: 'comp_veyra_tn', name: 'Ugadi / Gudi Padwa', holiday_date: '2026-03-20', is_optional: false },
    { id: 'hol_05', company_id: 'comp_veyra_tn', name: 'Good Friday', holiday_date: '2026-04-03', is_optional: false },
    { id: 'hol_06', company_id: 'comp_veyra_tn', name: 'Tamil New Year & Ambedkar Jayanti', holiday_date: '2026-04-14', is_optional: false },
    { id: 'hol_07', company_id: 'comp_veyra_tn', name: 'International Workers’ Day (May Day)', holiday_date: '2026-05-01', is_optional: false },
    { id: 'hol_08', company_id: 'comp_veyra_tn', name: 'Bakrid / Eid al-Adha', holiday_date: '2026-05-27', is_optional: false },
    { id: 'hol_09', company_id: 'comp_veyra_tn', name: 'Independence Day India', holiday_date: '2026-08-15', is_optional: false },
    { id: 'hol_10', company_id: 'comp_veyra_tn', name: 'Krishna Janmashtami', holiday_date: '2026-09-04', is_optional: false },
    { id: 'hol_11', company_id: 'comp_veyra_tn', name: 'Ganesh / Vinayakar Chaturthi', holiday_date: '2026-09-14', is_optional: false },
    { id: 'hol_12', company_id: 'comp_veyra_tn', name: 'Gandhi Jayanti', holiday_date: '2026-10-02', is_optional: false },
    { id: 'hol_13', company_id: 'comp_veyra_tn', name: 'Ayudha Pooja & Vijaya Dasami', holiday_date: '2026-10-19', is_optional: false },
    { id: 'hol_14', company_id: 'comp_veyra_tn', name: 'Deepavali / Diwali', holiday_date: '2026-11-08', is_optional: false },
    { id: 'hol_15', company_id: 'comp_veyra_tn', name: 'Christmas Day', holiday_date: '2026-12-25', is_optional: false },
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

      // 4. Leave Requests (Preserve all local leaves during merge so unsynced data is never deleted)
      const { data: leaveData, error: leaveErr } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const localLeaves: LeaveRequest[] = JSON.parse(localStorage.getItem('veyra_leaves') || '[]');
      const leaveMap = new Map<string, LeaveRequest>();
      if (!leaveErr && leaveData) {
        leaveData.forEach((l: LeaveRequest) => leaveMap.set(l.id, l));
      }
      localLeaves.forEach((l: LeaveRequest) => {
        if (!leaveMap.has(l.id)) leaveMap.set(l.id, l);
      });
      const combinedLeaves = Array.from(leaveMap.values()).sort(
        (a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime()
      );
      setLeaveRequests(combinedLeaves);
      try { localStorage.setItem('veyra_leaves', JSON.stringify(combinedLeaves)); } catch {}

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
      if (branchData && branchData.length > 0) {
        setBranches(branchData);
        try { localStorage.setItem('veyra_branches_data', JSON.stringify(branchData)); } catch {}
      }

      // 11. Departments
      const { data: deptData } = await supabase.from('departments').select('*');
      if (deptData && deptData.length > 0) setDepartments(deptData);

      // 12. Leave Balances
      const { data: balData } = await supabase.from('leave_balances').select('*');
      if (balData && balData.length > 0) setLeaveBalances(balData);

      // 13. Documents Vault
      const { data: docData, error: docErr } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (!docErr && docData) {
        setDocuments(docData);
      }
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Realtime listeners for live cross-device sync ──
  useEffect(() => {
    // ── Realtime listener for attendance ──
    const attendanceChannel = supabase
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
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...record };
              try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
              return updated;
            } else {
              const updated = [record, ...prev];
              try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
              return updated;
            }
          });
        }
      )
      .subscribe();

    // ── Realtime listener for branches (cross-device sync) ──
    const branchChannel = supabase
      .channel('veyra-branches-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'branches' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBranch = payload.new as Branch;
            if (!newBranch?.id) return;
            setBranches((prev) => {
              if (prev.some((b) => b.id === newBranch.id)) return prev;
              const updated = [newBranch, ...prev];
              try { localStorage.setItem('veyra_branches_data', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (!oldId) return;
            setBranches((prev) => {
              const updated = prev.filter((b) => b.id !== oldId);
              try { localStorage.setItem('veyra_branches_data', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedBranch = payload.new as Branch;
            if (!updatedBranch?.id) return;
            setBranches((prev) => {
              const updated = prev.map((b) => (b.id === updatedBranch.id ? { ...b, ...updatedBranch } : b));
              try { localStorage.setItem('veyra_branches_data', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        }
      )
      .subscribe();

    // ── Realtime listener for employees (cross-device sync) ──
    const employeeChannel = supabase
      .channel('veyra-employees-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEmp = payload.new as Employee;
            if (!newEmp?.id) return;
            setEmployees((prev) => {
              if (prev.some((e) => e.id === newEmp.id)) return prev;
              const updated = [newEmp, ...prev];
              try { localStorage.setItem('veyra_employees', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (!oldId) return;
            setEmployees((prev) => {
              const updated = prev.filter((e) => e.id !== oldId);
              try { localStorage.setItem('veyra_employees', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedEmp = payload.new as Employee;
            if (!updatedEmp?.id) return;
            setEmployees((prev) => {
              const updated = prev.map((e) => (e.id === updatedEmp.id ? { ...e, ...updatedEmp } : e));
              try { localStorage.setItem('veyra_employees', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        }
      )
      .subscribe();

    // ── Realtime listener for leave requests (cross-device sync) ──
    const leaveChannel = supabase
      .channel('veyra-leaves-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLeave = payload.new as LeaveRequest;
            if (!newLeave?.id) return;
            setLeaveRequests((prev) => {
              if (prev.some((l) => l.id === newLeave.id)) return prev;
              const updated = [newLeave, ...prev];
              try { localStorage.setItem('veyra_leaves', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (!oldId) return;
            setLeaveRequests((prev) => {
              const updated = prev.filter((l) => l.id !== oldId);
              try { localStorage.setItem('veyra_leaves', JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedLeave = payload.new as LeaveRequest;
            if (!updatedLeave?.id) return;
            setLeaveRequests((prev) => {
              const updated = prev.map((l) => (l.id === updatedLeave.id ? { ...l, ...updatedLeave } : l));
              try { localStorage.setItem('veyra_leaves', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(branchChannel);
      supabase.removeChannel(employeeChannel);
      supabase.removeChannel(leaveChannel);
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

    const emp = employees.find(
      (e) =>
        e.id === employeeId ||
        (e as any).profile_id === employeeId ||
        e.employee_id?.toLowerCase() === employeeId.toLowerCase() ||
        e.email?.toLowerCase() === employeeId.toLowerCase()
    );
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee';
    const primaryId = emp ? emp.id : employeeId;

    const currentHour = new Date().getHours();
    const currentMin = new Date().getMinutes();
    const isLate = currentHour > 9 || (currentHour === 9 && currentMin > 15);

    const existing = attendance.find(
      (a) =>
        (a.employee_id === primaryId ||
         a.employee_id === employeeId ||
         (emp?.employee_id && a.employee_id === emp.employee_id) ||
         (emp?.profile_id && a.employee_id === emp.profile_id) ||
         (emp?.email && a.employee_id?.toLowerCase() === emp.email.toLowerCase()) ||
         (emp && a.employee_name && a.employee_name.toLowerCase().includes(emp.first_name.toLowerCase()))) &&
        a.date === todayStr
    );

    if (existing) {
      const updatedRecord: AttendanceRecord = {
        ...existing,
        employee_id: primaryId,
        employee_name: empName,
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
      employee_id: primaryId,
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
      const updated = [newRecord, ...prev.filter((a) => !(a.employee_id === primaryId && a.date === todayStr))];
      try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 1. Notify HR Operations Console
    addNotification({
      recipient_profile_id: 'hr',
      recipient_role: 'hr_manager',
      title: `⚡ Check-In Verified: ${empName}`,
      message: `${empName} punched in via ${method} at ${location} (${isLate ? 'Late Entry' : 'On-Time'}).`,
      type: 'Attendance',
      link_url: '/hr/attendance',
    });

    // 2. Notify Admin System Governance
    addNotification({
      recipient_profile_id: 'admin',
      recipient_role: 'admin',
      title: `📍 Attendance Punch: ${empName}`,
      message: `${empName} logged check-in at ${location} (${method}).`,
      type: 'Attendance',
      link_url: '/admin/audit-logs',
    });

    return newRecord;
  };

  const checkOut = async (employeeId: string, location = 'Chennai HQ Geofence'): Promise<AttendanceRecord> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const emp = employees.find(
      (e) =>
        e.id === employeeId ||
        (e as any).profile_id === employeeId ||
        e.employee_id?.toLowerCase() === employeeId.toLowerCase() ||
        e.email?.toLowerCase() === employeeId.toLowerCase()
    );
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee';
    const primaryId = emp ? emp.id : employeeId;

    let updatedRecord: AttendanceRecord | null = null;

    setAttendance((prev) => {
      const updated = prev.map((a) => {
        const isMatch =
          a.date === todayStr &&
          (a.employee_id === primaryId ||
           a.employee_id === employeeId ||
           (emp?.employee_id && a.employee_id === emp.employee_id) ||
           (emp?.profile_id && a.employee_id === emp.profile_id) ||
           (emp?.email && a.employee_id?.toLowerCase() === emp.email.toLowerCase()) ||
           (emp && a.employee_name && a.employee_name.toLowerCase().includes(emp.first_name.toLowerCase())));

        if (isMatch) {
          const checkInDate = a.check_in_time ? new Date(a.check_in_time).getTime() : Date.now() - 28800000;
          const durationMins = Math.max(1, Math.round((Date.now() - checkInDate) / 60000));
          updatedRecord = {
            ...a,
            employee_id: primaryId,
            employee_name: empName,
            check_out_time: nowIso,
            check_out_location: location,
            working_hours_mins: durationMins,
          };
          return updatedRecord;
        }
        return a;
      });

      if (!updatedRecord) {
        updatedRecord = {
          id: `att_${Date.now()}`,
          employee_id: primaryId,
          employee_name: empName,
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

    // 1. Notify HR Operations Console
    addNotification({
      recipient_profile_id: 'hr',
      recipient_role: 'hr_manager',
      title: `⏱️ Check-Out Logged: ${empName}`,
      message: `${empName} completed shift checkout from ${location}. Working time recorded.`,
      type: 'Attendance',
      link_url: '/hr/attendance',
    });

    // 2. Notify Admin System Governance
    addNotification({
      recipient_profile_id: 'admin',
      recipient_role: 'admin',
      title: `🚪 Shift Checkout: ${empName}`,
      message: `${empName} checked out at ${location}.`,
      type: 'Attendance',
      link_url: '/admin/audit-logs',
    });

    return updatedRecord!;
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setNotifications((prev) => {
      const updated = [newItem, ...prev];
      try { localStorage.setItem('veyra_notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });

    triggerAppNotification({
      title: newItem.title,
      body: newItem.message,
      url: newItem.link_url || '/',
      tag: newItem.type?.toLowerCase(),
    });

    // Native browser notification if allowed
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newItem.title, {
          body: newItem.message,
          icon: '/favicon.ico',
        });
        if ('vibrate' in navigator) navigator.vibrate([150, 60, 150]);
      } catch {}
    }
  };

  const sendBrowserNotification = (title: string, body: string, url?: string, category: string = 'System') => {
    addNotification({
      recipient_profile_id: 'all',
      recipient_role: 'all',
      title,
      message: body,
      type: (category as any) || 'System',
      link_url: url || '/',
    });
  };

  const submitLeaveRequest = async (req: Omit<LeaveRequest, 'id' | 'status' | 'created_at'>): Promise<LeaveRequest> => {
    const newReq: LeaveRequest = {
      ...req,
      id: `l_${Date.now()}`,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    // 1. Immediately store in local state and localStorage
    setLeaveRequests((prev) => {
      const updated = [newReq, ...prev.filter((l) => l.id !== newReq.id)];
      try { localStorage.setItem('veyra_leaves', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 2. Persist to Supabase Database
    try {
      const dbPayload = {
        id: newReq.id,
        employee_id: newReq.employee_id,
        employee_name: newReq.employee_name || 'Employee',
        company_id: newReq.company_id || 'comp_veyra_tn',
        leave_type_name: newReq.leave_type_name || 'Casual Leave',
        start_date: newReq.start_date,
        end_date: newReq.end_date,
        total_days: Number(newReq.total_days) || 1,
        reason: newReq.reason,
        status: 'Pending',
        created_at: newReq.created_at,
      };

      const { error: dbErr } = await supabase.from('leave_requests').upsert(dbPayload);
      if (dbErr) {
        console.warn('Supabase leave_requests sync notice:', dbErr);
      }
    } catch (e) {
      console.warn('Leave request sync notice:', e);
    }

    // 3. Dispatch targeted notification to HR Operations
    addNotification({
      recipient_profile_id: 'hr',
      recipient_role: 'hr_manager',
      title: `📝 New Leave Application: ${newReq.employee_name || 'Staff Member'}`,
      message: `${newReq.employee_name || 'An employee'} applied for ${newReq.total_days}d of ${newReq.leave_type_name} (${newReq.start_date} to ${newReq.end_date}). Reason: ${newReq.reason || 'Personal'}`,
      type: 'Leave',
      link_url: '/hr/leave',
    });

    // 4. Dispatch targeted notification to System Admin
    addNotification({
      recipient_profile_id: 'admin',
      recipient_role: 'admin',
      title: `📝 Leave Application Logged: ${newReq.employee_name || 'Staff'}`,
      message: `${newReq.employee_name || 'Staff'} requested ${newReq.total_days} day(s) ${newReq.leave_type_name}.`,
      type: 'Leave',
      link_url: '/admin/audit-logs',
    });

    return newReq;
  };

  const updateLeaveStatus = async (requestId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    const targetReq = leaveRequests.find((l) => l.id === requestId);

    // 1. Persist to Supabase
    try {
      await supabase
        .from('leave_requests')
        .update({ status, hr_comments: comments })
        .eq('id', requestId);
    } catch (e) {
      console.warn('Leave status sync notice:', e);
    }

    // 2. Update local state & localStorage
    setLeaveRequests((prev) => {
      const updated = prev.map((l) => (l.id === requestId ? { ...l, status, hr_comments: comments } : l));
      try { localStorage.setItem('veyra_leaves', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 3. Dispatch targeted notification to the specific employee
    addNotification({
      recipient_profile_id: targetReq?.employee_id || 'all',
      recipient_role: 'employee',
      title: `Leave Request ${status}!`,
      message: `Your time-off application for ${targetReq?.start_date || 'requested dates'} was ${status.toLowerCase()} by HR Operations. ${comments ? `Feedback: ${comments}` : ''}`,
      type: 'Leave',
      link_url: '/employee/leave',
    });

    // 4. Dispatch notification to Admin
    addNotification({
      recipient_profile_id: 'admin',
      recipient_role: 'admin',
      title: `📋 Leave Status Updated: ${status}`,
      message: `Leave request for ${targetReq?.employee_name || 'employee'} was marked as ${status}.`,
      type: 'Leave',
      link_url: '/admin/audit-logs',
    });
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

    // Dispatch targeted notification to HR Operations
    addNotification({
      recipient_profile_id: 'hr',
      recipient_role: 'hr_manager',
      title: '⏰ Attendance Correction Submitted',
      message: `Correction request submitted for date ${newCorr.attendance_date}. Reason: ${newCorr.reason || 'Punch adjustment'}`,
      type: 'Attendance',
      link_url: '/hr/attendance',
    });

    // Dispatch targeted notification to System Admin
    addNotification({
      recipient_profile_id: 'admin',
      recipient_role: 'admin',
      title: '⏰ Attendance Correction Request',
      message: `Punch correction filed for ${newCorr.attendance_date} by ${newCorr.employee_name || 'Staff'}.`,
      type: 'Attendance',
      link_url: '/admin/audit-logs',
    });
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

  const uploadDocument = async (doc: EmployeeDocument) => {
    try {
      await supabase.from('documents').upsert(doc);
    } catch (e) {
      console.warn('Document upload sync error:', e);
    }
    setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
  };

  const deleteDocument = async (docId: string) => {
    try {
      await supabase.from('documents').delete().eq('id', docId);
    } catch (e) {
      console.warn('Document delete sync error:', e);
    }
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
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

  const updateAttendanceBreak = async (employeeId: string, breakMins: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setAttendance((prev) => {
      const updated = prev.map((a) => {
        const isMatch =
          a.date === todayStr &&
          (a.employee_id === employeeId || a.employee_id?.toLowerCase() === employeeId.toLowerCase());
        if (isMatch) {
          return {
            ...a,
            break_duration_mins: (a.break_duration_mins || 0) + breakMins,
          };
        }
        return a;
      });
      try { localStorage.setItem('veyra_attendance', JSON.stringify(updated)); } catch {}
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

    sendBrowserNotification(
      '🔄 New Shift Swap Request',
      'A peer shift swap request has been submitted for peer and HR approval.',
      '/hr/shifts',
      'Shift'
    );
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
      const { error } = await supabase.from('branches').insert(newBranch);
      if (error) {
        console.warn('Full branch insert notice, trying core columns fallback:', error);
        // Fallback to core columns if optional columns are pending migration
        await supabase.from('branches').insert({
          id: newBranch.id,
          company_id: newBranch.company_id || 'comp_veyra_tn',
          name: newBranch.name,
          city: newBranch.city,
          district: newBranch.district || newBranch.city,
          address: newBranch.address,
          pincode: newBranch.pincode,
          manager: newBranch.manager || 'Admin',
        });
      }
    } catch (e) {
      console.warn('Branch sync:', e);
    }
    setBranches((prev) => {
      const updated = [newBranch, ...prev];
      try { localStorage.setItem('veyra_branches_data', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const deleteCompanyBranch = async (id: string) => {
    try {
      await supabase.from('branches').delete().eq('id', id);
    } catch (e) {
      console.warn('Branch delete sync:', e);
    }
    setBranches((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try { localStorage.setItem('veyra_branches_data', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const createCompanyHoliday = async (h: Omit<CompanyHoliday, 'id' | 'company_id'>): Promise<void> => {
    const newHol: CompanyHoliday = {
      ...h,
      id: `hol_${Date.now()}`,
      company_id: 'comp_veyra_tn',
    };
    try {
      await supabase.from('company_holidays').insert(newHol);
    } catch (e) {
      console.warn('Holiday sync:', e);
    }
    setCompanyHolidays((prev) => {
      const updated = [...prev, newHol].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
      try { localStorage.setItem('veyra_company_holidays', JSON.stringify(updated)); } catch {}
      return updated;
    });

    sendBrowserNotification(
      `🎉 New Company Holiday: ${newHol.name}`,
      `Marked ${new Date(newHol.holiday_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} as an official holiday.`,
      '/employee/leave',
      'Announcement'
    );
  };

  const deleteCompanyHoliday = async (id: string): Promise<void> => {
    try {
      await supabase.from('company_holidays').delete().eq('id', id);
    } catch (e) {
      console.warn('Holiday delete sync:', e);
    }
    setCompanyHolidays((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try { localStorage.setItem('veyra_company_holidays', JSON.stringify(updated)); } catch {}
      return updated;
    });
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

  const disbursePayroll = async (month: string, records: PayrollRecord[]) => {
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const updatedProcessedRecords = records.map((r) => ({
      ...r,
      payment_status: 'Paid' as const,
      released_by_hr: true,
      released_at: timestamp,
      payment_date: r.payment_date || formattedDate,
      bank_ref: r.bank_ref || `HDFC-NEFT-${Math.floor(1000000 + Math.random() * 9000000)}`,
      payment_mode: r.payment_mode || 'NEFT / Direct Deposit',
    }));

    setPayrollRecords((prev) => {
      const recordMap = new Map<string, PayrollRecord>();
      prev.forEach((p) => recordMap.set(`${p.employee_id}_${p.month}`, p));
      updatedProcessedRecords.forEach((p) => recordMap.set(`${p.employee_id}_${p.month}`, p));
      const combined = Array.from(recordMap.values());
      try {
        localStorage.setItem('veyra_payroll_records', JSON.stringify(combined));
      } catch {}
      return combined;
    });

    // Notify employees via desktop notification & in-app inbox
    updatedProcessedRecords.forEach((r) => {
      triggerAppNotification({
        title: `💰 Payslip Released: ${r.month}`,
        body: `Your net salary of ₹${r.net_payable.toLocaleString('en-IN')} has been disbursed for ${r.month}. Tap to view breakdown.`,
        url: '/employee/payslips',
        tag: 'payroll',
      });

      const notifItem: NotificationItem = {
        id: `notif_pay_${Date.now()}_${r.employee_id}`,
        recipient_profile_id: r.employee_id,
        title: `💰 Salary Disbursed • ${r.month}`,
        message: `Your net salary of ₹${r.net_payable.toLocaleString('en-IN')} has been credited via ${r.payment_mode || 'Direct Deposit'} (Ref: ${r.bank_ref}).`,
        type: 'System',
        is_read: false,
        link_url: '/employee/payslips',
        created_at: timestamp,
      };

      setNotifications((prevNotifs) => {
        const next = [notifItem, ...prevNotifs];
        try {
          localStorage.setItem('veyra_notifications', JSON.stringify(next));
        } catch {}
        return next;
      });
    });
  };

  const releaseEmployeePayslip = async (record: PayrollRecord) => {
    await disbursePayroll(record.month, [record]);
  };

  const updatePayrollRecord = async (record: PayrollRecord) => {
    setPayrollRecords((prev) => {
      const idx = prev.findIndex((p) => (p.employee_id === record.employee_id || p.id === record.id) && p.month === record.month);
      let updated: PayrollRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...record };
      } else {
        updated = [record, ...prev];
      }
      try {
        localStorage.setItem('veyra_payroll_records', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const getEmployeePayslipsHistory = useCallback((employee: Employee): PayrollRecord[] => {
    if (!employee) return [];

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Reference timeline
    const currentYear = 2026;
    const currentMonthIdx = 7; // August (0-indexed)

    // Parse joining date
    let startYear = 2025;
    let startMonthIdx = 0; // January

    if (employee.joining_date) {
      const parts = employee.joining_date.split('-');
      if (parts.length >= 2) {
        const parsedYear = parseInt(parts[0], 10);
        const parsedMonth = parseInt(parts[1], 10) - 1;
        if (!isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= currentYear) {
          startYear = parsedYear;
          startMonthIdx = isNaN(parsedMonth) ? 0 : Math.max(0, Math.min(11, parsedMonth));
        }
      }
    } else {
      startYear = 2026;
      startMonthIdx = 2; // March 2026
    }

    const results: PayrollRecord[] = [];

    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    for (let y = startYear; y <= currentYear; y++) {
      const startM = (y === startYear) ? startMonthIdx : 0;
      const endM = (y === currentYear) ? currentMonthIdx : 11;

      for (let m = startM; m <= endM; m++) {
        const monthStr = `${monthNames[m]} ${y}`;
        const yearMonthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        const isCurrentActiveMonth = (y === currentYear && m === currentMonthIdx);

        // Check if HR has processed/customized an explicit record
        const explicitRecord = payrollRecords.find(
          (p) => (p.employee_id === employee.id || p.employee_id === employee.employee_id) && p.month === monthStr
        );

        if (explicitRecord) {
          results.push(explicitRecord);
          continue;
        }

        // Compute authentic record from actual attendance, leaves, and salary
        const baseSalary = employee.base_salary || 50000;
        const hra = Math.round(baseSalary * 0.4);
        const specialAllowance = Math.round(baseSalary * 0.2);
        const conveyance = 4000;

        const monthAtt = attendance.filter((a) => {
          const matchEmp = a.employee_id === employee.id || a.employee_id === employee.employee_id;
          return matchEmp && a.date && a.date.startsWith(yearMonthKey);
        });

        const monthLeaves = leaveRequests.filter((l) => {
          const matchEmp = l.employee_id === employee.id || l.employee_id === employee.employee_id;
          return matchEmp && l.status === 'Approved' && l.start_date && l.start_date.startsWith(yearMonthKey);
        });

        const approvedLeaveDays = monthLeaves.reduce((sum, curr) => sum + (Number(curr.total_days) || 1), 0);
        const standardWorkDays = 22;

        let presentDays = monthAtt.length;
        if (presentDays === 0) {
          presentDays = isCurrentActiveMonth ? 20 : (standardWorkDays - approvedLeaveDays);
        }

        const payableDays = Math.min(standardWorkDays, presentDays + approvedLeaveDays);
        const lopDays = Math.max(0, standardWorkDays - payableDays);

        const otMins = monthAtt.reduce((sum, curr) => sum + (curr.overtime_mins || 0), 0);
        const otHours = Math.round(otMins / 60);
        const hourlyRate = Math.round((baseSalary / (standardWorkDays * 8)) * 1.5);
        const overtimeEarnings = otHours * hourlyRate;

        const monthOffset = (y - startYear) * 12 + (m - startMonthIdx);
        const performanceBonus = monthOffset >= 2 ? 5000 : 0;

        const grossSalary = Math.round((baseSalary / standardWorkDays) * payableDays) +
                            Math.round((hra / standardWorkDays) * payableDays) +
                            Math.round((specialAllowance / standardWorkDays) * payableDays) +
                            conveyance +
                            overtimeEarnings +
                            performanceBonus;

        const pfDeduction = Math.round(baseSalary * 0.12);
        const professionalTax = 200;
        const tdsTax = Math.round(grossSalary * 0.04);
        const medicalInsurance = 1200;
        const leaveDeductions = lopDays * Math.round(baseSalary / standardWorkDays);

        const totalDeductions = pfDeduction + professionalTax + tdsTax + medicalInsurance + leaveDeductions;
        const netPayable = grossSalary - totalDeductions;

        const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
        const periodStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const periodEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
        const paymentDate = `${lastDayOfMonth} ${monthNames[m].slice(0, 3)} ${y}`;

        const hash = getHash(`${employee.id}_${monthStr}_veyra`);
        const bankRef = `HDFC-NEFT-${(1000000 + (hash % 8999999))}`;

        results.push({
          id: `ps_${y}_${m}_${employee.id}`,
          company_id: employee.company_id || 'comp_veyra_tn',
          employee_id: employee.id,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          month: monthStr,
          period_start: periodStart,
          period_end: periodEnd,
          base_salary: baseSalary,
          hra,
          special_allowance: specialAllowance,
          conveyance,
          overtime_earnings: overtimeEarnings,
          performance_bonus: performanceBonus,
          gross_salary: grossSalary,
          pf_deduction: pfDeduction,
          professional_tax: professionalTax,
          tds_tax: tdsTax,
          medical_insurance: medicalInsurance,
          leave_deductions: leaveDeductions,
          total_deductions: totalDeductions,
          net_payable: netPayable,
          payment_status: isCurrentActiveMonth ? 'Processed' : 'Paid',
          payment_date: paymentDate,
          bank_ref: bankRef,
          payment_mode: 'NEFT / Direct Deposit',
          days_present: presentDays,
          total_working_days: standardWorkDays,
          lop_days: lopDays,
          approved_leaves: approvedLeaveDays,
          ot_hours: otHours,
          released_by_hr: !isCurrentActiveMonth,
          created_at: new Date(y, m, lastDayOfMonth).toISOString(),
        });
      }
    }

    return results.reverse();
  }, [payrollRecords, attendance, leaveRequests]);

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
        documents,
        payrollRecords,
        uploadDocument,
        deleteDocument,
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
        updateAttendanceBreak,
        requestShiftSwap,
        approveShiftSwap,
        addAnnouncement,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        sendNotification: sendBrowserNotification,
        createCompanyBranch,
        deleteCompanyBranch,
        createCompanyHoliday,
        deleteCompanyHoliday,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createJobRole,
        updateJobRole,
        deleteJobRole,
        assignEmployeeDepartmentAndRole,
        updateEmployee,
        addShiftTemplate,
        disbursePayroll,
        releaseEmployeePayslip,
        updatePayrollRecord,
        getEmployeePayslipsHistory,
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
