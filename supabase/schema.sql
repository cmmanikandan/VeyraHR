-- =========================================================================
-- VeyraHR Complete Database Schema & Setup (Supabase PostgreSQL)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- Clean drop of existing legacy tables to prevent foreign key type mismatch
-- =========================================================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.mood_logs CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.leave_types CASCADE;
DROP TABLE IF EXISTS public.attendance_corrections CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.shift_swap_requests CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.security_sessions CASCADE;
DROP TABLE IF EXISTS public.hr_managers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- =========================================================================
-- 1. COMPANIES (Tenants)
-- =========================================================================
CREATE TABLE public.companies (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  legal_name VARCHAR(255) DEFAULT 'VeyraHR Technologies Pvt Ltd',
  name VARCHAR(255) NOT NULL DEFAULT 'VeyraHR', -- Display Name
  short_name VARCHAR(50) DEFAULT 'VeyraHR',
  logo_url TEXT,
  favicon_url TEXT,
  industry VARCHAR(100) DEFAULT 'Software & Technology',
  company_size VARCHAR(50) DEFAULT '50-200 Employees',
  org_type VARCHAR(100) DEFAULT 'Private Limited',
  year_founded VARCHAR(20) DEFAULT '2024',
  reg_no VARCHAR(100),
  gst_no VARCHAR(50),
  pan_no VARCHAR(50),
  cin_no VARCHAR(50),
  
  -- Location (India / Tamil Nadu First)
  hq_country VARCHAR(100) DEFAULT 'India',
  hq_state VARCHAR(100) DEFAULT 'Tamil Nadu',
  district VARCHAR(100) DEFAULT 'Chennai',
  city VARCHAR(100) DEFAULT 'Anna Nagar',
  locality VARCHAR(150),
  address TEXT DEFAULT 'No. 42, 2nd Main Road, Anna Nagar',
  pincode VARCHAR(20) DEFAULT '600040',
  work_location VARCHAR(255) DEFAULT 'Chennai HQ & Regional Hubs',
  work_mode VARCHAR(50) DEFAULT 'Office',
  office_radius_meters INT DEFAULT 200,

  -- Regional & Work Configuration
  timezone VARCHAR(50) DEFAULT 'IST (UTC +05:30)',
  currency VARCHAR(20) DEFAULT 'INR (₹)',
  date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(30) DEFAULT '12-hour AM/PM',
  week_starts_on VARCHAR(30) DEFAULT 'Monday',
  language VARCHAR(50) DEFAULT 'English (India)',
  working_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  working_hours VARCHAR(100) DEFAULT '09:00 AM – 06:00 PM',
  break_duration VARCHAR(50) DEFAULT '60 min',

  -- Attendance Policy Controls
  attendance_methods TEXT[] DEFAULT ARRAY['QR Code', 'GPS'],
  grace_period_mins INT DEFAULT 15,
  half_day_rule VARCHAR(100) DEFAULT 'After 4 hours',
  overtime_rule VARCHAR(100) DEFAULT 'After 8 hours',
  require_gps BOOLEAN DEFAULT TRUE,
  require_qr BOOLEAN DEFAULT TRUE,
  allow_offline BOOLEAN DEFAULT TRUE,

  -- Company Identity & Support
  website VARCHAR(255) DEFAULT 'https://veyrahr.com',
  support_email VARCHAR(255) DEFAULT 'support@veyrahr.com',
  phone VARCHAR(50) DEFAULT '+91 99999 00000',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 2. BRANCHES
-- =========================================================================
CREATE TABLE public.branches (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50),
  district VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100) DEFAULT 'Tamil Nadu',
  country VARCHAR(100) DEFAULT 'India',
  address TEXT,
  pincode VARCHAR(20),
  manager VARCHAR(150),
  latitude NUMERIC DEFAULT 12.9654,
  longitude NUMERIC DEFAULT 80.2461,
  radius_meters INT DEFAULT 150,
  working_hours VARCHAR(100) DEFAULT '09:00 AM - 06:00 PM',
  is_headquarters BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 3. DEPARTMENTS
-- =========================================================================
CREATE TABLE public.departments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  manager_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 4. ROLES
-- =========================================================================
CREATE TABLE public.roles (
  id VARCHAR(50) PRIMARY KEY, -- 'admin', 'hr_manager', 'employee'
  description TEXT
);

INSERT INTO public.roles (id, description) VALUES
  ('admin', 'Full organization & platform administration'),
  ('hr_manager', 'Workforce management, attendance, leave & shift controls'),
  ('employee', 'Self-service mobile attendance, leave, shift & profile access')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 5. PROFILES (HR Managers, Admins, Employees user accounts)
-- =========================================================================
CREATE TABLE public.profiles (
  id VARCHAR(128) PRIMARY KEY, -- Auth UID or custom string ID
  company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) REFERENCES public.roles(id) DEFAULT 'hr_manager',
  avatar_url TEXT,
  phone VARCHAR(50),
  branch_name VARCHAR(150) DEFAULT 'Chennai HQ',
  department_access VARCHAR(150) DEFAULT 'All Departments',
  status VARCHAR(20) DEFAULT 'Active',
  password TEXT,                             -- Plain-text password for app-level auth (cross-device)
  notification_preferences JSONB DEFAULT '{"leave": true, "attendance": true, "shift": true, "announcements": true}'::jsonb,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 6. HR MANAGERS (HR Console Roster)
-- =========================================================================
CREATE TABLE public.hr_managers (
  id VARCHAR(128) PRIMARY KEY,
  profile_id VARCHAR(128) REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  branch_name VARCHAR(150) DEFAULT 'Chennai HQ',
  department_access VARCHAR(150) DEFAULT 'All Departments',
  permissions TEXT[] DEFAULT ARRAY['Employees', 'Attendance', 'Leaves', 'Shifts', 'Announcements', 'Reports'],
  status VARCHAR(20) DEFAULT 'Active',
  last_login TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT,
  password TEXT,                             -- Plain-text password for app-level auth (cross-device)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 7. SECURITY SESSIONS
-- =========================================================================
CREATE TABLE public.security_sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  device VARCHAR(255) DEFAULT 'Chrome on Windows',
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  location VARCHAR(150) DEFAULT 'Chennai, India',
  login_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'Active'
);

-- =========================================================================
-- 8. EMPLOYEES (Workforce Directory)
-- =========================================================================
CREATE TABLE public.employees (
  id VARCHAR(128) PRIMARY KEY,
  profile_id VARCHAR(128) REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name VARCHAR(100),
  branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(100),
  designation VARCHAR(150),
  joining_date DATE DEFAULT CURRENT_DATE,
  work_location VARCHAR(150) DEFAULT 'Chennai HQ',
  emergency_contact VARCHAR(100),
  address TEXT,
  status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'On Leave'
  avatar_url TEXT,
  password TEXT,                         -- Plain-text password for app-level auth (cross-device)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 9. SHIFTS
-- =========================================================================
CREATE TABLE public.shifts (
  id VARCHAR(128) PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_time VARCHAR(20) NOT NULL, -- e.g. '09:00:00'
  end_time VARCHAR(20) NOT NULL,   -- e.g. '18:00:00'
  break_duration_mins INT DEFAULT 60,
  grace_period_mins INT DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 10. SHIFT SWAP REQUESTS
-- =========================================================================
CREATE TABLE public.shift_swap_requests (
  id VARCHAR(128) PRIMARY KEY,
  requester_id VARCHAR(128),
  requester_name VARCHAR(150),
  target_employee_id VARCHAR(128),
  target_employee_name VARCHAR(150),
  requester_shift_id VARCHAR(128),
  target_shift_id VARCHAR(128),
  shift_date VARCHAR(50),
  reason TEXT,
  target_acceptance VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Declined'
  hr_approval VARCHAR(20) DEFAULT 'Pending',       -- 'Pending', 'Approved', 'Rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 11. ATTENDANCE (Live Check-ins & Records)
-- =========================================================================
CREATE TABLE public.attendance (
  id VARCHAR(128) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  employee_name VARCHAR(150),
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'Present', -- 'Present', 'Late', 'Absent', 'On Leave', 'Half Day'
  verification_method VARCHAR(50) DEFAULT 'Dynamic QR + GPS',
  check_in_location VARCHAR(255),
  check_out_location VARCHAR(255),
  working_hours_mins INT DEFAULT 0,
  break_duration_mins INT DEFAULT 0,
  overtime_mins INT DEFAULT 0,
  is_offline_sync BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 12. ATTENDANCE CORRECTIONS
-- =========================================================================
CREATE TABLE public.attendance_corrections (
  id VARCHAR(128) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  employee_name VARCHAR(150),
  attendance_date DATE NOT NULL,
  correction_type VARCHAR(50) NOT NULL, -- 'Forgot Check-in', 'Forgot Check-out', 'Incorrect Attendance', 'Wrong Shift'
  requested_check_in TIMESTAMPTZ,
  requested_check_out TIMESTAMPTZ,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  hr_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 13. LEAVE TYPES
-- =========================================================================
CREATE TABLE public.leave_types (
  id VARCHAR(128) PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  days_allowed INT DEFAULT 12,
  is_paid BOOLEAN DEFAULT TRUE,
  requires_document BOOLEAN DEFAULT FALSE
);

-- =========================================================================
-- 14. LEAVE BALANCES
-- =========================================================================
CREATE TABLE public.leave_balances (
  id VARCHAR(128) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  leave_type_id VARCHAR(128) REFERENCES public.leave_types(id) ON DELETE CASCADE,
  leave_type_name VARCHAR(100),
  year INT DEFAULT 2026,
  total_days DECIMAL(4,1) DEFAULT 12,
  used_days DECIMAL(4,1) DEFAULT 0,
  pending_days DECIMAL(4,1) DEFAULT 0
);

-- =========================================================================
-- 15. LEAVE REQUESTS
-- =========================================================================
CREATE TABLE public.leave_requests (
  id VARCHAR(128) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  employee_name VARCHAR(150),
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  leave_type_id VARCHAR(128) REFERENCES public.leave_types(id) ON DELETE SET NULL,
  leave_type_name VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4,1) NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  document_url TEXT,
  status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Cancelled'
  hr_comments TEXT,
  reviewed_by VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 16. DAILY MOOD LOGS (Sentiment & Wellness)
-- =========================================================================
CREATE TABLE public.mood_logs (
  id VARCHAR(128) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood VARCHAR(30) NOT NULL, -- 'Excellent', 'Happy', 'Okay', 'Stressed', 'Unwell'
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_mood_employee_date UNIQUE (employee_id, date)
);

-- =========================================================================
-- 17. ANNOUNCEMENTS
-- =========================================================================
CREATE TABLE public.announcements (
  id VARCHAR(128) PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General', -- 'General', 'Holiday', 'Policy', 'Event'
  priority VARCHAR(20) DEFAULT 'Normal',   -- 'Normal', 'Important', 'Urgent'
  is_pinned BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  author_id VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 18. NOTIFICATIONS
-- =========================================================================
CREATE TABLE public.notifications (
  id VARCHAR(128) PRIMARY KEY,
  recipient_profile_id VARCHAR(128),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'System',
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 19. AUDIT LOGS
-- =========================================================================
CREATE TABLE public.audit_logs (
  id VARCHAR(128) PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_name VARCHAR(150) DEFAULT 'HR Manager',
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 20. INITIAL SEED DATA
-- =========================================================================
INSERT INTO public.companies (id, name, legal_name, industry, company_size, hq_state, district, city)
VALUES ('comp_veyra_tn', 'VeyraHR', 'VeyraHR Technologies Pvt Ltd', 'Software & Technology', '50-200 Employees', 'Tamil Nadu', 'Chennai', 'Anna Nagar')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, company_id, name, code) VALUES
  ('d1', 'comp_veyra_tn', 'Human Resources', 'HR'),
  ('d2', 'comp_veyra_tn', 'Engineering & Tech', 'ENG'),
  ('d3', 'comp_veyra_tn', 'Sales & Marketing', 'SALES'),
  ('d4', 'comp_veyra_tn', 'Finance & Operations', 'FIN'),
  ('d5', 'comp_veyra_tn', 'Customer Support', 'SUPP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, company_id, name, district, city, address, pincode, manager) VALUES
  ('b1', 'comp_veyra_tn', 'Chennai HQ', 'Chennai', 'Anna Nagar', 'No. 42, 2nd Main Road', '600040', 'Admin'),
  ('b2', 'comp_veyra_tn', 'Coimbatore Branch', 'Coimbatore', 'Gandhipuram', 'Cross Cut Road', '641012', 'Priya Sundaram'),
  ('b3', 'comp_veyra_tn', 'Madurai Regional Hub', 'Madurai', 'KK Nagar', '80 Feet Road', '625020', 'Ramesh Kumar'),
  ('b4', 'comp_veyra_tn', 'Karur Office', 'Karur', 'Thanthonimalai', 'Bye-pass Road', '639005', 'Senthil Kumar')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shifts (id, company_id, name, start_time, end_time, break_duration_mins, grace_period_mins, is_active) VALUES
  ('s1', 'comp_veyra_tn', 'Morning Shift (General)', '09:00:00', '18:00:00', 60, 15, true),
  ('s2', 'comp_veyra_tn', 'Evening Shift', '14:00:00', '23:00:00', 60, 15, true),
  ('s3', 'comp_veyra_tn', 'Night Shift', '22:00:00', '07:00:00', 60, 15, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.leave_types (id, company_id, name, days_allowed, is_paid) VALUES
  ('lt_1', 'comp_veyra_tn', 'Casual Leave', 12, true),
  ('lt_2', 'comp_veyra_tn', 'Sick Leave', 12, true),
  ('lt_3', 'comp_veyra_tn', 'Earned Leave', 15, true),
  ('lt_4', 'comp_veyra_tn', 'Maternity Leave', 90, true),
  ('lt_5', 'comp_veyra_tn', 'Paternity Leave', 15, true)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 21. ROW LEVEL SECURITY (RLS) POLICIES — Permissive for Web Console Access
-- =========================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant Open Read/Write Policies for All Tenant Data
DROP POLICY IF EXISTS "Public companies" ON public.companies;
CREATE POLICY "Public companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public branches" ON public.branches;
CREATE POLICY "Public branches" ON public.branches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public departments" ON public.departments;
CREATE POLICY "Public departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public roles" ON public.roles;
CREATE POLICY "Public roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public hr_managers" ON public.hr_managers;
CREATE POLICY "Public hr_managers" ON public.hr_managers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public security_sessions" ON public.security_sessions;
CREATE POLICY "Public security_sessions" ON public.security_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public employees" ON public.employees;
CREATE POLICY "Public employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public shifts" ON public.shifts;
CREATE POLICY "Public shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public shift_swap_requests" ON public.shift_swap_requests;
CREATE POLICY "Public shift_swap_requests" ON public.shift_swap_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public attendance" ON public.attendance;
CREATE POLICY "Public attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public attendance_corrections" ON public.attendance_corrections;
CREATE POLICY "Public attendance_corrections" ON public.attendance_corrections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public leave_types" ON public.leave_types;
CREATE POLICY "Public leave_types" ON public.leave_types FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public leave_balances" ON public.leave_balances;
CREATE POLICY "Public leave_balances" ON public.leave_balances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public leave_requests" ON public.leave_requests;
CREATE POLICY "Public leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public mood_logs" ON public.mood_logs;
CREATE POLICY "Public mood_logs" ON public.mood_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public announcements" ON public.announcements;
CREATE POLICY "Public announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public notifications" ON public.notifications;
CREATE POLICY "Public notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public audit_logs" ON public.audit_logs;
CREATE POLICY "Public audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. INITIAL MASTER ADMINISTRATOR PROFILE SETUP
-- ==============================================================================
INSERT INTO public.profiles (
  id,
  company_id,
  full_name,
  email,
  phone,
  role,
  branch_name,
  department_access
) VALUES (
  'hqLVEthP1kQTcanLBVdCUZ9xpoh1',
  'comp_veyra_tn',
  'Master Administrator',
  'manikandanprabhu1221@gmail.com',
  '+91 98765 00000',
  'admin',
  'Chennai HQ',
  'All Departments'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;
