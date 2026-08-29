export type RoleType = 'admin' | 'hr_manager' | 'employee';

export interface Company {
  id: string;
  legal_name?: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  favicon_url?: string;
  industry?: string;
  company_size?: string;
  org_type?: string;
  year_founded?: string;
  reg_no?: string;
  gst_no?: string;
  pan_no?: string;
  cin_no?: string;
  
  // Location
  hq_country?: string;
  hq_state?: string;
  district?: string;
  city?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  work_location?: string;
  work_mode?: string;
  office_radius_meters?: number;

  // Regional & Work Settings
  timezone?: string;
  currency?: string;
  date_format?: string;
  time_format?: string;
  week_starts_on?: string;
  language?: string;
  working_days?: string[];
  working_hours?: string;
  break_duration?: string;

  // Attendance Policy
  attendance_methods?: string[];
  grace_period_mins?: number;
  half_day_rule?: string;
  overtime_rule?: string;
  require_gps?: boolean;
  require_qr?: boolean;
  allow_offline?: boolean;

  // Company Identity
  website?: string;
  support_email?: string;
  phone?: string;

  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string; // Firebase UID
  company_id: string;
  email: string;
  full_name: string;
  role: RoleType;
  avatar_url?: string;
  phone?: string;
  branch_name?: string;
  department_access?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
  last_login?: string;
  created_at?: string;
}

export interface HRManager {
  id: string;
  company_id?: string;
  profile_id?: string;
  full_name: string;
  email: string;
  phone: string;
  branch_name: string;
  department_access: string;
  permissions: string[];
  status: 'Active' | 'Inactive' | 'Pending';
  last_login?: string;
  avatar_url?: string;
  password?: string;
  created_at: string;
}

export interface SecuritySession {
  id: string;
  user_email: string;
  user_role: string;
  device: string;
  ip_address: string;
  location: string;
  login_at: string;
  status: 'Active' | 'Revoked';
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  description?: string;
  manager_id?: string;
  head_name?: string;
}

export interface JobRole {
  id: string;
  company_id?: string;
  department_id?: string;
  department_name: string;
  title: string;
  level?: 'L1 - Associate' | 'L2 - Specialist' | 'L3 - Senior' | 'L4 - Lead / Principal' | 'L5 - Manager / Director';
  min_salary?: number;
  max_salary?: number;
  description?: string;
  created_at?: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  district?: string;
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
  manager?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  working_hours?: string;
  is_headquarters?: boolean;
}

export interface Employee {
  id: string;
  profile_id?: string;
  company_id: string;
  employee_id: string; // VEY-EMP-0001
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  department_name?: string;
  team_id?: string;
  branch_id?: string;
  branch_name?: string;
  designation: string;
  joining_date: string;
  work_location: string;
  emergency_contact?: string;
  address?: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatar_url?: string;
  password?: string;
  created_at?: string;
}

export interface DigitalIDCard {
  id: string;
  employee_id: string;
  qr_code_hash: string;
  issued_at: string;
  expires_at?: string;
  status: 'Active' | 'Revoked';
}

export interface Shift {
  id: string;
  company_id: string;
  name: string; // e.g. Morning Shift
  start_time: string; // '09:00:00'
  end_time: string;   // '18:00:00'
  break_duration_mins: number;
  grace_period_mins: number;
  is_active: boolean;
}

export interface ShiftAssignment {
  id: string;
  employee_id: string;
  shift_id: string;
  assigned_date: string;
  status: string;
}

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  target_employee_id: string;
  requester_shift_id: string;
  target_shift_id: string;
  swap_date: string;
  reason?: string;
  target_acceptance: 'Pending' | 'Accepted' | 'Declined';
  hr_approval: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  company_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Half Day';
  verification_method: string;
  check_in_location?: string;
  check_out_location?: string;
  working_hours_mins: number;
  break_duration_mins: number;
  overtime_mins: number;
  is_offline_sync?: boolean;
}

export interface AttendanceCorrection {
  id: string;
  employee_id: string;
  employee_name?: string;
  attendance_date: string;
  correction_type: 'Forgot Check-in' | 'Forgot Check-out' | 'Incorrect Attendance' | 'Wrong Shift';
  requested_check_in?: string;
  requested_check_out?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  hr_comments?: string;
  created_at: string;
}

export interface LeaveType {
  id: string;
  company_id: string;
  name: string; // Casual, Sick, Earned
  days_allowed: number;
  is_paid: boolean;
  requires_document: boolean;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type_name?: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  company_id: string;
  leave_type_id: string;
  leave_type_name?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  document_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  hr_comments?: string;
  created_at: string;
}

export interface CompanyHoliday {
  id: string;
  company_id: string;
  name: string;
  holiday_date: string;
  is_optional?: boolean;
}

export type MoodType = 'Excellent' | 'Happy' | 'Okay' | 'Stressed' | 'Unwell';

export interface MoodLog {
  id: string;
  employee_id: string;
  company_id: string;
  date: string;
  mood: MoodType;
  note?: string;
  created_at?: string;
}

export interface Announcement {
  id: string;
  company_id: string;
  title: string;
  content: string;
  category: 'General' | 'Holiday' | 'Policy' | 'Event';
  priority: 'Normal' | 'Important' | 'Urgent';
  attachment_url?: string;
  author_id?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_profile_id: string;
  title: string;
  message: string;
  type: 'Attendance' | 'Leave' | 'Shift' | 'Announcement' | 'System';
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  actor_profile_id?: string;
  actor_name?: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface OfflinePunch {
  id: string;
  employee_id: string;
  employee_name?: string;
  type: 'check_in' | 'check_out';
  timestamp: string;
  location?: string;
  method: string;
  queued_at: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  category: 'Identity' | 'Employment' | 'Academic' | 'Financial';
  title: string;
  doc_number?: string;
  file_name: string;
  file_size: string;
  issued_date: string;
  expiry_date?: string;
  status: 'Verified' | 'Pending' | 'Expiring Soon' | 'Rejected';
  verification_hash?: string;
  custom_image_url?: string;
}
