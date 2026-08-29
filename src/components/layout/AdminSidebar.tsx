import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  MapPin, 
  ShieldCheck, 
  History, 
  Calendar, 
  Settings, 
  LayoutDashboard, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VeyraBrandHeader } from '../common/VeyraBrandHeader';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Organization', path: '/admin/organization', icon: Building2 },
    { label: 'HR Managers', path: '/admin/hr-managers', icon: Users },
    { label: 'Branches', path: '/admin/branches', icon: MapPin },
    { label: 'Security Governance', path: '/admin/security', icon: ShieldCheck },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { label: 'Holidays', path: '/admin/holidays', icon: Calendar },
    { label: 'Company Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-[#F7F5F2] border-r border-[#E8E2D9] h-screen sticky top-0 flex flex-col justify-between transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* BRANDING HEADER */}
      <div>
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between">
          {isCollapsed ? (
            <img src="/logo.png" alt="VeyraHR" className="w-8 h-8 object-contain mx-auto shrink-0" />
          ) : (
            <VeyraBrandHeader size="sm" subtitle="ADMIN PORTAL" />
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-veyra-border text-veyra-text-sub transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-veyra-blue text-white shadow-xs'
                      : 'text-veyra-text-sub hover:text-veyra-text hover:bg-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-3 border-t border-[#E8E2D9] space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-veyra-border">
          <div className="w-8 h-8 rounded-full bg-veyra-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          {!isCollapsed && (
            <div className="truncate text-left">
              <span className="text-xs font-extrabold text-veyra-text block truncate">
                {profile?.full_name || 'System Admin'}
              </span>
              <span className="text-[10px] text-veyra-text-sub block truncate">{profile?.email || 'admin@veyrahr.com'}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-veyra-danger hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Exit Portal</span>}
        </button>
      </div>
    </aside>
  );
};
