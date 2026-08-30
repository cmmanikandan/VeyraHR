import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Landing Page
import { LandingPage } from './pages/landing/LandingPage';

// Admin Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HRManagersPage } from './pages/admin/HRManagersPage';
import { SecurityPage } from './pages/admin/SecurityPage';
import { AdminOrganizationPage } from './pages/admin/AdminOrganizationPage';
import { AdminBranchesPage } from './pages/admin/AdminBranchesPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminHolidaysPage } from './pages/admin/AdminHolidaysPage';
import { AdminCompanySettingsPage } from './pages/admin/AdminCompanySettingsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';

// HR Layout & Pages
import { HRDashboardLayout } from './components/layout/HRDashboardLayout';
import { HRDashboard } from './pages/hr/HRDashboard';
import { HRLiveAttendance } from './pages/hr/HRLiveAttendance';
import { HREmployees } from './pages/hr/HREmployees';
import { HRLeaveManagement } from './pages/hr/HRLeaveManagement';
import { HRShiftManagement } from './pages/hr/HRShiftManagement';
import { HRMoodAnalytics } from './pages/hr/HRMoodAnalytics';
import { HRAnnouncementsPage } from './pages/hr/HRAnnouncementsPage';
import { HRReports } from './pages/hr/HRReports';
import { HRProfilePage } from './pages/hr/HRProfilePage';
import { HRKioskManagement } from './pages/hr/HRKioskManagement';
import { HRDepartmentsRoles } from './pages/hr/HRDepartmentsRoles';
import { HRDocumentsPage } from './pages/hr/HRDocumentsPage';
import { HRPayrollManagement } from './pages/hr/HRPayrollManagement';
import { HRNotificationsPage } from './pages/hr/HRNotificationsPage';

import { EmployeeLayout } from './components/layout/EmployeeLayout';
import { EmployeeHome } from './pages/employee/EmployeeHome';
import { EmployeeAttendance } from './pages/employee/EmployeeAttendance';
import { EmployeeLeave } from './pages/employee/EmployeeLeave';
import { EmployeeNotifications } from './pages/employee/EmployeeNotifications';
import { EmployeeProfile } from './pages/employee/EmployeeProfile';
import { EmployeeDocuments } from './pages/employee/EmployeeDocuments';
import { EmployeePayslips } from './pages/employee/EmployeePayslips';
import { EmployeeHelpdesk } from './pages/employee/EmployeeHelpdesk';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Kiosk Page
import { KioskPage } from './pages/kiosk/KioskPage';

// Title Updater Hook
const TitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const routeTitles: Record<string, string> = {
      '/': 'VeyraHR | Enterprise Workforce & Biometric-Free Attendance Management',
      '/admin/dashboard': 'Admin Command Center | VeyraHR',
      '/admin/notifications': 'System Governance Alerts | VeyraHR',
      '/admin/hr-managers': 'HR Manager Operations | VeyraHR',
      '/admin/employees': 'Staff Governance | VeyraHR',
      '/admin/documents': 'Secure Document Repository | VeyraHR',
      '/admin/payroll': 'Enterprise Compensation & Payroll Engine | VeyraHR',
      '/admin/departments': 'Organizational Taxonomy & Roles | VeyraHR',
      '/admin/organization': 'Corporate Entity Hierarchy | VeyraHR',
      '/admin/branches': 'Branch Geofence Network | VeyraHR',
      '/admin/security': 'System Security & MFA Guard | VeyraHR',
      '/admin/audit-logs': 'Immutable Audit Records | VeyraHR',
      '/admin/holidays': 'Holiday Master | VeyraHR',
      '/admin/settings': 'Enterprise Configurations | VeyraHR',
      '/hr/dashboard': 'HR Operations Console | VeyraHR',
      '/hr/notifications': 'HR Action Alerts & Notifications | VeyraHR',
      '/hr/employees': 'Staff Directory | VeyraHR',
      '/hr/documents': 'Compliance Documents | VeyraHR',
      '/hr/payroll': 'Payroll & Salary Ledger | VeyraHR',
      '/hr/departments': 'Departments & Designations | VeyraHR',
      '/hr/attendance': 'Live Attendance Roster | VeyraHR',
      '/hr/leave': 'Leave & Time-Off Approvals | VeyraHR',
      '/hr/shifts': 'Shift Roster & Swaps | VeyraHR',
      '/hr/mood': 'Team Sentiment Pulse | VeyraHR',
      '/hr/announcements': 'Broadcast Announcements | VeyraHR',
      '/hr/reports': 'Custom Analytics & Reports | VeyraHR',
      '/hr/kiosks': 'Branch Terminal Kiosks | VeyraHR',
      '/hr/profile': 'HR Manager Profile | VeyraHR',
      '/employee/home': 'Employee Mobile Portal | VeyraHR',
      '/employee/attendance': 'Dynamic QR Attendance & Geo-Check | VeyraHR',
      '/employee/leave': 'Leave Application & Time-Off | VeyraHR',
      '/employee/notifications': 'Personal Notification Inbox | VeyraHR',
      '/employee/profile': 'My Identity & Employment Details | VeyraHR',
      '/employee/documents': 'Personal Documentation Vault | VeyraHR',
      '/employee/payslips': 'Salary Slips & Tax Summaries | VeyraHR',
      '/employee/helpdesk': 'AI Support Helpdesk | VeyraHR',
      '/kiosk': 'Branch Attendance Kiosk Terminal | VeyraHR',
    };

    document.title = routeTitles[location.pathname] || 'VeyraHR | Enterprise Workforce Management';
  }, [location.pathname]);

  return null;
};

// Global Automatic Scroll To Top Hook
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainElements = document.querySelectorAll('main, .overflow-y-auto');
    mainElements.forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
};

const HRDashboardWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <HRDashboard
      onNavigate={(targetTab) => {
        const routeMap: Record<string, string> = {
          live_attendance: '/hr/attendance',
          employees: '/hr/employees',
          leave: '/hr/leave',
          shifts: '/hr/shifts',
          mood: '/hr/mood',
          reports: '/hr/reports',
        };
        if (routeMap[targetTab]) navigate(routeMap[targetTab]);
      }}
    />
  );
};

const EmployeeHomeWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <EmployeeHome
      onNavigate={(tab) => {
        const routeMap: Record<string, string> = {
          home: '/employee/home',
          attendance: '/employee/attendance',
          leave: '/employee/leave',
          notifications: '/employee/notifications',
          profile: '/employee/profile',
          documents: '/employee/documents',
          payslips: '/employee/payslips',
          helpdesk: '/employee/helpdesk',
        };
        if (routeMap[tab]) navigate(routeMap[tab]);
      }}
    />
  );
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <ScrollToTop />
      <TitleUpdater />
      <Routes>
        {/* LANDING PAGE ROUTE */}
        <Route path="/" element={<LandingPage />} />

        {/* ADMIN PORTAL ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="hr-managers" element={<HRManagersPage />} />
          <Route path="employees" element={<HREmployees />} />
          <Route path="documents" element={<HRDocumentsPage />} />
          <Route path="payroll" element={<HRPayrollManagement />} />
          <Route path="departments" element={<HRDepartmentsRoles />} />
          <Route path="organization" element={<AdminOrganizationPage />} />
          <Route path="branches" element={<AdminBranchesPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="holidays" element={<AdminHolidaysPage />} />
          <Route path="settings" element={<AdminCompanySettingsPage />} />
        </Route>

        {/* HR PORTAL ROUTES */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={['hr_manager', 'admin']}>
              <HRDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/hr/dashboard" replace />} />
          <Route path="dashboard" element={<HRDashboardWrapper />} />
          <Route path="notifications" element={<HRNotificationsPage />} />
          <Route path="employees" element={<HREmployees />} />
          <Route path="documents" element={<HRDocumentsPage />} />
          <Route path="payroll" element={<HRPayrollManagement />} />
          <Route path="departments" element={<HRDepartmentsRoles />} />
          <Route path="attendance" element={<HRLiveAttendance />} />
          <Route path="leave" element={<HRLeaveManagement />} />
          <Route path="shifts" element={<HRShiftManagement />} />
          <Route path="mood" element={<HRMoodAnalytics />} />
          <Route path="announcements" element={<HRAnnouncementsPage />} />
          <Route path="reports" element={<HRReports />} />
          <Route path="kiosks" element={<HRKioskManagement />} />
          <Route path="profile" element={<HRProfilePage />} />
        </Route>

        {/* EMPLOYEE MOBILE PWA ROUTES */}
        <Route
          path="/employee/home"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="home" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeeHomeWrapper />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="attendance" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeeAttendance />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="leave" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeeLeave />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/notifications"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="notifications" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeeNotifications />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="profile" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeeProfile />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/documents"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="documents" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeeDocuments />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/payslips"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="payslips" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeePayslips />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/helpdesk"
          element={
            <ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']}>
              <EmployeeLayout activeTab="helpdesk" onTabChange={(t) => navigate(`/employee/${t}`)}>
                <EmployeeHelpdesk />
              </EmployeeLayout>
            </ProtectedRoute>
          }
        />

        {/* KIOSK TERMINAL ATTENDANCE DISPLAY */}
        <Route path="/kiosk" element={<KioskPage />} />

        {/* FALLBACK REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
