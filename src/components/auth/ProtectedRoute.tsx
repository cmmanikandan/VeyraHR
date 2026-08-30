import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleType } from '../../types/database';

interface ProtectedRouteProps {
  allowedRoles?: RoleType[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isLoggedIn, profile, currentRole, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Guard against browser bfcache (Back/Forward Cache) on mobile
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const savedProfile = localStorage.getItem('veyra_hr_profile');
        if (!savedProfile) {
          navigate('/', { replace: true });
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 font-mono tracking-wider">Verifying Session...</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> Immediately redirect to landing page and wipe history stack
  if (!isLoggedIn || !profile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role validation
  const effectiveRole = profile.role || currentRole;
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(effectiveRole)) {
    if (effectiveRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (effectiveRole === 'hr_manager') return <Navigate to="/hr/dashboard" replace />;
    return <Navigate to="/employee/home" replace />;
  }

  return <>{children}</>;
};
