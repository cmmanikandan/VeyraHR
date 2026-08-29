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

import { EmployeeLayout } from './components/layout/EmployeeLayout';
import { EmployeeHome } from './pages/employee/EmployeeHome';
import { EmployeeAttendance } from './pages/employee/EmployeeAttendance';
import { EmployeeLeave } from './pages/employee/EmployeeLeave';
import { EmployeeNotifications } from './pages/employee/EmployeeNotifications';
import { EmployeeProfile } from './pages/employee/EmployeeProfile';
import { EmployeeDocuments } from './pages/employee/EmployeeDocuments';
import { EmployeePayslips } from './pages/employee/EmployeePayslips';
import { EmployeeHelpdesk } from './pages/employee/EmployeeHelpdesk';
// Kiosk Page
import { KioskPage } from './pages/kiosk/KioskPage';

// Title Updater Hook
const TitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const routeTitles: Record<string, string> = {
      '/': 'VeyraHR | People. Presence. Performance.',
      '/admin/dashboard': 'VeyraHR | Admin Overview',
      '/admin/hr-managers': 'VeyraHR | HR Managers Management',
      '/admin/organization': 'VeyraHR | Organization Setup',
      '/admin/branches': 'VeyraHR | Branch Locations',
      '/admin/security': 'VeyraHR | Security Governance',
      '/admin/audit-logs': 'VeyraHR | Audit Trail',
      '/admin/holidays': 'VeyraHR | Company Holidays',
      '/admin/settings': 'VeyraHR | Company Settings',
      '/hr/dashboard': 'VeyraHR | HR Operations Console',
      '/hr/employees': 'VeyraHR | Employee Directory',
      '/hr/attendance': 'VeyraHR | Live Attendance Stream',
      '/hr/leave': 'VeyraHR | Leave Approvals',
      '/hr/shifts': 'VeyraHR | Shift Rosters',
      '/hr/mood': 'VeyraHR | Team Mood Analytics',
      '/hr/announcements': 'VeyraHR | Company Announcements',
      '/hr/reports': 'VeyraHR | Report Generator',
      '/hr/profile': 'VeyraHR | My HR Profile',
      '/employee/home': 'VeyraHR | Employee Self-Service',
      '/employee/attendance': 'VeyraHR | Mobile Attendance QR',
      '/employee/leave': 'VeyraHR | Time-off Applications',
      '/employee/notifications': 'VeyraHR | Notifications',
      '/employee/profile': 'VeyraHR | Digital ID Card',
    };

    document.title = routeTitles[location.pathname] || 'VeyraHR | Enterprise SaaS';
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
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
        <Route path="/hr" element={<HRDashboardLayout />}>
          <Route index element={<Navigate to="/hr/dashboard" replace />} />
          <Route path="dashboard" element={<HRDashboardWrapper />} />
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
            <EmployeeLayout activeTab="home" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeeHomeWrapper />
            </EmployeeLayout>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <EmployeeLayout activeTab="attendance" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeeAttendance />
            </EmployeeLayout>
          }
        />
        <Route
          path="/employee/leave"
          element={
            <EmployeeLayout activeTab="leave" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeeLeave />
            </EmployeeLayout>
          }
        />
        <Route
          path="/employee/notifications"
          element={
            <EmployeeLayout activeTab="notifications" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeeNotifications />
            </EmployeeLayout>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <EmployeeLayout activeTab="profile" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeeProfile />
            </EmployeeLayout>
          }
        />
        <Route
          path="/employee/documents"
          element={
            <EmployeeLayout activeTab="documents" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeeDocuments />
            </EmployeeLayout>
          }
        />
        <Route
          path="/employee/payslips"
          element={
            <EmployeeLayout activeTab="payslips" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeePayslips />
            </EmployeeLayout>
          }
        />
        <Route
          path="/employee/helpdesk"
          element={
            <EmployeeLayout activeTab="helpdesk" onTabChange={(t) => navigate(`/employee/${t}`)}>
              <EmployeeHelpdesk />
            </EmployeeLayout>
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
