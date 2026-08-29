import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { VeyraBrandHeader } from '../common/VeyraBrandHeader';

export const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, logout } = useAuth();
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
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP SYSTEM NAV BAR */}
        <header className="h-16 bg-white border-b border-veyra-border px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left: Hamburger (mobile) + Badge (desktop) */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-[#FAF8F5] hover:bg-[#F0EBE3] border border-[#E8E2D9] text-[#172033] transition-all flex items-center justify-center shadow-2xs shrink-0"
              aria-label="Open Admin Navigation"
            >
              <Menu className="w-5 h-5 text-[#172033]" />
            </button>

            {/* Mobile Brand */}
            <div className="flex md:hidden items-center gap-2">
              <VeyraBrandHeader size="sm" />
              <span className="px-2 py-0.5 rounded-md bg-veyra-navy text-white font-extrabold text-[10px] tracking-wide">
                ADMIN
              </span>
            </div>

            {/* Desktop Badge */}
            <div className="hidden md:flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-veyra-navy text-white font-extrabold text-xs">
                System Admin
              </span>
              <span className="text-xs text-veyra-text-sub font-semibold hidden sm:inline">
                Multi-Branch Governance Mode
              </span>
            </div>
          </div>

          {/* Right: Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-veyra-navy text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-veyra-text truncate max-w-[120px]">
                {profile?.full_name || 'System Admin'}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              icon={<LogOut className="w-3.5 h-3.5 text-veyra-danger" />}
              className="text-xs font-bold text-veyra-danger hover:bg-red-50"
            >
              <span className="hidden sm:inline">Sign Out</span>
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
