import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, UserCheck, LogOut } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setCurrentRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex text-veyra-text">
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP SYSTEM NAV BAR */}
        <header className="h-16 bg-white border-b border-veyra-border px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-veyra-navy text-white font-extrabold text-xs">
              System Admin
            </span>
            <span className="text-xs text-veyra-text-sub font-semibold hidden sm:inline">
              Multi-Branch Governance Mode
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              icon={<LogOut className="w-3.5 h-3.5 text-veyra-danger" />}
              className="text-xs font-bold text-veyra-danger hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
