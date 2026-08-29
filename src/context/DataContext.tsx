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

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp_001',
    company_id: 'comp_veyra_tn',
    employee_id: 'VEY-EMP-0001',
    first_name: 'Anjali',
    last_name: 'Sharma',
    email: 'anjali.sharma@veyrahr.com',
    designation: 'Senior Full Stack Engineer',
    department_name: 'Engineering & Tech',
    branch_name: 'Chennai HQ',
    work_location: 'Chennai HQ, Tamil Nadu',
    phone: '+91 98765 43210',
    joining_date: '2024-03-01',
    status: 'Active',
    emergency_contact: '+91 98765 00001 (Father)',
    address: 'Flat 4B, Emerald Heights, Anna Nagar, Chennai',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-03-01T09:00:00.000Z',
  },
  {
    id: 'emp_002',
    company_id: 'comp_veyra_tn',
    employee_id: 'VEY-EMP-0002',
    first_name: 'Ravi',
    last_name: 'Kumar',
    email: 'ravi.kumar@veyrahr.com',
    designation: 'HR Operations Executive',
    department_name: 'Human Resources',
    branch_name: 'Coimbatore Branch',
    work_location: 'Coimbatore Branch, Tamil Nadu',
    phone: '+91 91234 56789',
    joining_date: '2024-05-15',
    status: 'Active',
    emergency_contact: '+91 91234 00002 (Spouse)',
    address: '12, Cross Cut Road, Gandhipuram, Coimbatore',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-05-15T09:00:00.000Z',
  },
  {
    id: 'emp_003',
    company_id: 'comp_veyra_tn',
    employee_id: 'VEY-EMP-0003',
    first_name: 'Priya',
    last_name: 'Nair',
    email: 'priya.nair@veyrahr.com',
    designation: 'Sales & Growth Lead',
    department_name: 'Sales & Marketing',
    branch_name: 'Madurai Regional Hub',
    work_location: 'Madurai Regional Hub, Tamil Nadu',
    phone: '+91 99887 76655',
    joining_date: '2023-11-20',
    status: 'Active',
    emergency_contact: '+91 99887 00003 (Brother)',
    address: '88, KK Nagar East, Madurai',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2023-11-20T09:00:00.000Z',
  },
  {
    id: 'emp_004',
    company_id: 'comp_veyra_tn',
    employee_id: 'VEY-EMP-0004',
    first_name: 'Karthik',
    last_name: 'Raja',
    email: 'karthik.raja@veyrahr.com',
    designation: 'DevOps & Cloud Architect',
    department_name: 'Engineering & Tech',
    branch_name: 'Chennai HQ',
    work_location: 'Chennai HQ, Tamil Nadu',
    phone: '+91 97112 23344',
    joining_date: '2024-01-10',
    status: 'Active',
    emergency_contact: '+91 97112 00004 (Mother)',
    address: 'Plot 21, OMR IT Highway, Sholinganallur, Chennai',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-01-10T09:00:00.000Z',
  },
  {
    id: 'emp_005',
    company_id: 'comp_veyra_tn',
    employee_id: 'VEY-EMP-0005',
    first_name: 'Divya',
    last_name: 'Prakash',
    email: 'divya.prakash@veyrahr.com',
    designation: 'Senior Financial Analyst',
    department_name: 'Finance & Operations',
    branch_name: 'Karur Office',
    work_location: 'Karur Office, Tamil Nadu',
    phone: '+91 94433 22110',
    joining_date: '2024-02-01',
    status: 'On Leave',
    emergency_contact: '+91 94433 00005 (Father)',
    address: '45, Thanthonimalai Bye-pass, Karur',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'emp_006',
    company_id: 'comp_veyra_tn',
    employee_id: 'VEY-EMP-0006',
    first_name: 'Suresh',
    last_name: 'Babu',
    email: 'suresh.babu@veyrahr.com',
    designation: 'Customer Success Specialist',
    department_name: 'Customer Support',
    branch_name: 'Chennai HQ',
    work_location: 'Chennai HQ, Tamil Nadu',
    phone: '+91 98401 55667',
    joining_date: '2023-09-01',
    status: 'Active',
    emergency_contact: '+91 98401 00006 (Spouse)',
    address: '15, Guindy Industrial Estate, Chennai',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    created_at: '2023-09-01T09:00:00.000Z',
  },
  {
    id: 'emp_007',
    company_id: 'comp_veyra_tn',
    employee_id: 'VEY-EMP-0007',
    first_name: 'Kamalesh',
    last_name: 'Selvan',
    email: 'kamalesh.selvan@veyrahr.com',
    designation: 'UI/UX Product Designer',
    department_name: 'Product & Design',
    branch_name: 'Chennai HQ',
    work_location: 'Chennai HQ, Tamil Nadu',
    phone: '+91 98844 12345',
    joining_date: '2024-02-15',
    status: 'Active',
    emergency_contact: '+91 98844 00007 (Brother)',
    address: '28, Gandhi Street, T. Nagar, Chennai',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-02-15T09:00:00.000Z',
  },
];

const DEFAULT_HR_MANAGERS: HRManager[] = [
  {
    id: 'hr_001',
    company_id: 'comp_veyra_tn',
    full_name: 'Sudha Chandran',
    email: 'sudha.hr@veyrahr.com',
    phone: '+91 98400 11223',
    branch_name: 'Chennai HQ',
    department_access: 'All Departments',
    status: 'Active',
    permissions: ['Attendance', 'Leave Approvals', 'Shift Roster', 'Payroll Export'],
    created_at: '2024-01-01T09:00:00.000Z',
  },
  {
    id: 'hr_002',
    company_id: 'comp_veyra_tn',
    full_name: 'Rajesh Subramaniam',
    email: 'rajesh.hr@veyrahr.com',
    phone: '+91 98400 33445',
    branch_name: 'Coimbatore Branch',
    department_access: 'Human Resources',
    status: 'Active',
    permissions: ['Attendance', 'Leave Approvals', 'Shift Roster'],
    created_at: '2024-02-01T09:00:00.000Z',
  },
];

const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_001',
    employee_id: 'emp_001',
    employee_name: 'Anjali Sharma',
    company_id: 'comp_veyra_tn',
    date: new Date().toISOString().split('T')[0],
    check_in_time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: 'Present',
    verification_method: 'Dynamic QR + GPS',
    check_in_location: 'Chennai HQ Geofence (Anna Nagar)',
    working_hours_mins: 240,
    break_duration_mins: 30,
    overtime_mins: 0,
  },
  {
    id: 'att_002',
    employee_id: 'emp_002',
    employee_name: 'Ravi Kumar',
    company_id: 'comp_veyra_tn',
    date: new Date().toISOString().split('T')[0],
    check_in_time: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    status: 'Present',
    verification_method: 'Face Biometrics (Kiosk)',
    check_in_location: 'Coimbatore Branch Kiosk',
    working_hours_mins: 210,
    break_duration_mins: 0,
    overtime_mins: 0,
  },
  {
    id: 'att_003',
    employee_id: 'emp_004',
    employee_name: 'Karthik Raja',
    company_id: 'comp_veyra_tn',
    date: new Date().toISOString().split('T')[0],
    check_in_time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    status: 'Late',
    verification_method: 'Dynamic QR + GPS',
    check_in_location: 'Chennai HQ Geofence',
    working_hours_mins: 180,
    break_duration_mins: 0,
    overtime_mins: 0,
  },
  {
    id: 'att_004',
    employee_id: 'emp_007',
    employee_name: 'Kamalesh Selvan',
    company_id: 'comp_veyra_tn',
    date: new Date().toISOString().split('T')[0],
    check_in_time: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    status: 'Present',
    verification_method: 'Dynamic QR + GPS',
    check_in_location: 'Chennai HQ Geofence (Anna Nagar)',
    working_hours_mins: 150,
    break_duration_mins: 0,
    overtime_mins: 0,
  },
];

const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'l_001',
    employee_id: 'emp_001',
    employee_name: 'Anjali Sharma',
    company_id: 'comp_veyra_tn',
    leave_type_id: 'lt_annual',
    leave_type_name: 'Annual / Vacation Leave',
    start_date: '2026-08-12',
    end_date: '2026-08-12',
    total_days: 1,
    reason: 'Family event in Bangalore',
    status: 'Approved',
    hr_comments: 'Approved by HR Operations. Enjoy your time off!',
    created_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'l_002',
    employee_id: 'emp_001',
    employee_name: 'Anjali Sharma',
    company_id: 'comp_veyra_tn',
    leave_type_id: 'lt_casual',
    leave_type_name: 'Casual & Personal Leave',
    start_date: '2026-08-25',
    end_date: '2026-08-25',
    total_days: 1,
    reason: 'Personal errands and bank work',
    status: 'Approved',
    hr_comments: 'Approved.',
    created_at: '2026-08-15T11:30:00.000Z',
  },
  {
    id: 'l_003',
    employee_id: 'emp_002',
    employee_name: 'Ravi Kumar',
    company_id: 'comp_veyra_tn',
    leave_type_id: 'lt_sick',
    leave_type_name: 'Sick & Medical Leave',
    start_date: '2026-08-18',
    end_date: '2026-08-19',
    total_days: 2,
    reason: 'Viral fever & medical checkup',
    status: 'Approved',
    hr_comments: 'Approved. Get well soon!',
    created_at: '2026-08-18T08:00:00.000Z',
  },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    company_id: 'comp_veyra_tn',
    title: 'Q3 Enterprise Townhall & Operations Review',
    content: 'All employees and HR managers are invited to the Q3 hybrid townhall scheduled for Friday 4:00 PM IST.',
    category: 'Event',
    priority: 'Important',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ann_002',
    company_id: 'comp_veyra_tn',
    title: 'Dynamic QR Attendance Verification Active',
    content: 'Please ensure location permissions are enabled on your device when scanning your dynamic badge.',
    category: 'Policy',
    priority: 'Normal',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'ann_003',
    company_id: 'comp_veyra_tn',
    title: 'August Payroll & Direct Deposit Processing',
    content: 'Monthly salary disbursement and automated payslips will be generated on August 31st.',
    category: 'General',
    priority: 'Normal',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    recipient_profile_id: 'emp_001',
    title: 'Digital ID Pass Activated',
    message: 'Your holographic QR credential is now active for contactless geofence & kiosk clock-ins.',
    type: 'System',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif_2',
    recipient_profile_id: 'emp_001',
    title: 'Leave Request Approved',
    message: 'Your Casual Leave application for Aug 25 has been approved by HR Operations.',
    type: 'Leave',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'notif_3',
    recipient_profile_id: 'emp_001',
    title: 'Monthly Shift Roster Assigned',
    message: 'General Shift (09:00 AM – 06:00 PM) assigned for all weekdays at Chennai HQ.',
    type: 'Shift',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'notif_4',
    recipient_profile_id: 'emp_001',
    title: 'Company Holiday: Independence Day',
    message: 'All regional branches will observe a paid holiday on August 15th.',
    type: 'Announcement',
    is_read: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_employees');
      if (saved) {
        const parsed: Employee[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all default employees exist
          const existingIds = new Set(parsed.map((p) => p.id));
          const missingDefaults = DEFAULT_EMPLOYEES.filter((d) => !existingIds.has(d.id));
          if (missingDefaults.length > 0) {
            const merged = [...parsed, ...missingDefaults];
            localStorage.setItem('veyra_employees', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
      localStorage.setItem('veyra_employees', JSON.stringify(DEFAULT_EMPLOYEES));
      return DEFAULT_EMPLOYEES;
    } catch {
      return DEFAULT_EMPLOYEES;
    }
  });
  const [hrManagers, setHrManagers] = useState<HRManager[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_hr_managers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('veyra_hr_managers', JSON.stringify(DEFAULT_HR_MANAGERS));
      return DEFAULT_HR_MANAGERS;
    } catch {
      return DEFAULT_HR_MANAGERS;
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('veyra_attendance', JSON.stringify(DEFAULT_ATTENDANCE));
      return DEFAULT_ATTENDANCE;
    } catch {
      return DEFAULT_ATTENDANCE;
    }
  });
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_leaves');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('veyra_leaves', JSON.stringify(DEFAULT_LEAVE_REQUESTS));
      return DEFAULT_LEAVE_REQUESTS;
    } catch {
      return DEFAULT_LEAVE_REQUESTS;
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
      localStorage.setItem('veyra_announcements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
      return DEFAULT_ANNOUNCEMENTS;
    } catch {
      return DEFAULT_ANNOUNCEMENTS;
    }
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('veyra_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
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
      // Employees
      const { data: empData, error: empErr } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (!empErr && empData && empData.length > 0) {
        setEmployees(empData);
        try { localStorage.setItem('veyra_employees', JSON.stringify(empData)); } catch {}
      }

      // Attendance
      const { data: attData, error: attErr } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
      if (!attErr && attData && attData.length > 0) {
        setAttendance(attData);
        try { localStorage.setItem('veyra_attendance', JSON.stringify(attData)); } catch {}
      }

      // Leave Requests
      const { data: leaveData, error: leaveErr } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
      if (!leaveErr && leaveData && leaveData.length > 0) {
        setLeaveRequests(leaveData);
        try { localStorage.setItem('veyra_leaves', JSON.stringify(leaveData)); } catch {}
      }

      // Mood Logs
      const { data: moodData, error: moodErr } = await supabase.from('mood_logs').select('*').order('created_at', { ascending: false });
      if (!moodErr && moodData && moodData.length > 0) {
        setMoodLogs(moodData);
        try { localStorage.setItem('veyra_mood_logs', JSON.stringify(moodData)); } catch {}
      }

      // Announcements
      const { data: annData, error: annErr } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (!annErr && annData && annData.length > 0) {
        setAnnouncements(annData);
        try { localStorage.setItem('veyra_announcements', JSON.stringify(annData)); } catch {}
      }

      // Shifts
      const { data: shiftData } = await supabase.from('shifts').select('*');
      if (shiftData && shiftData.length > 0) setShifts(shiftData);

      // Shift Swaps
      const { data: swapData } = await supabase.from('shift_swap_requests').select('*').order('created_at', { ascending: false });
      if (swapData && swapData.length > 0) setShiftSwaps(swapData);

      // Attendance Corrections
      const { data: corrData } = await supabase.from('attendance_corrections').select('*').order('created_at', { ascending: false });
      if (corrData && corrData.length > 0) setCorrections(corrData);

      // Branches
      const { data: branchData } = await supabase.from('branches').select('*');
      if (branchData && branchData.length > 0) setBranches(branchData);

      // Departments
      const { data: deptData } = await supabase.from('departments').select('*');
      if (deptData && deptData.length > 0) setDepartments(deptData);

      // HR Managers
      const { data: hrData, error: hrErr } = await supabase.from('hr_managers').select('*');
      if (!hrErr && hrData && hrData.length > 0) {
        setHrManagers(hrData);
        try { localStorage.setItem('veyra_hr_managers', JSON.stringify(hrData)); } catch {}
      }

      // Company Holidays
      const { data: holData } = await supabase.from('company_holidays').select('*').order('holiday_date', { ascending: true });
      if (holData && holData.length > 0) setCompanyHolidays(holData);

      // Leave Balances
      const { data: balData } = await supabase.from('leave_balances').select('*');
      if (balData && balData.length > 0) setLeaveBalances(balData);
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // HR Manager Actions
  const addHRManager = async (hr: Omit<HRManager, 'id' | 'created_at'>): Promise<HRManager> => {
    const newHR: HRManager = {
      ...hr,
      id: `hr_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    try {
      await supabase.from('hr_managers').insert(newHR);
    } catch (e) {
      console.warn('HR Manager sync:', e);
    }
    setHrManagers((prev) => [newHR, ...prev]);
    return newHR;
  };

  const updateHRManagerStatus = async (id: string, status: 'Active' | 'Inactive') => {
    try {
      await supabase.from('hr_managers').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('HR Manager status sync:', e);
    }
    setHrManagers((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h)));
  };

  const deleteHRManager = async (id: string) => {
    try {
      await supabase.from('hr_managers').delete().eq('id', id);
    } catch (e) {
      console.warn('HR Manager delete sync:', e);
    }
    setHrManagers((prev) => prev.filter((h) => h.id !== id));
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

    // 2. Persist to Supabase Database
    try {
      const { error } = await supabase.from('employees').insert(newEmp);
      if (error) {
        console.warn('Supabase employee insertion notice:', error);
      }
    } catch (e) {
      console.warn('Supabase insertion error:', e);
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
    const isMorning = note?.includes('Morning') || (!note?.includes('Evening') && new Date().getHours() < 13);
    const sessionTag = isMorning ? 'Morning' : 'Evening';
    const newMood: MoodLog = {
      id: `m_${Date.now()}`,
      employee_id: employeeId,
      company_id: 'comp_veyra_tn',
      date: todayStr,
      mood,
      note: note || `${sessionTag} Pulse: Feeling ${mood}`,
      created_at: new Date().toISOString(),
    };
    // Persist to Supabase
    try {
      await supabase.from('mood_logs').insert(newMood);
    } catch (e) { console.warn('Mood log sync:', e); }

    setMoodLogs((prev) => {
      const filtered = prev.filter(
        (m) => !(m.employee_id === employeeId && m.date === todayStr && (
          isMorning 
            ? (m.note?.includes('Morning') || (new Date(m.created_at || '').getHours() < 13 && !m.note?.includes('Evening')))
            : (m.note?.includes('Evening') || (new Date(m.created_at || '').getHours() >= 13 && !m.note?.includes('Morning')))
        ))
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
