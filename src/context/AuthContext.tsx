import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, RoleType, Company } from '../types/database';
import { auth, onAuthStateChanged, firebaseSignOut } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  profile: Profile | null;
  company: Company | null;
  currentRole: RoleType;
  loading: boolean;
  setProfile: (profile: Profile | null) => void;
  setCompany: (company: Company | null) => void;
  setCurrentRole: (role: RoleType) => void;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem('veyra_hr_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [company, setCompany] = useState<Company | null>(() => {
    try {
      const saved = localStorage.getItem('veyra_company_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentRole, setRoleState] = useState<RoleType>(() => {
    try {
      const savedProfile = localStorage.getItem('veyra_hr_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.role) return parsed.role;
      }
      return (localStorage.getItem('veyra_current_role') as RoleType) || 'employee';
    } catch {
      return 'employee';
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const setCurrentRole = (role: RoleType) => {
    setRoleState(role);
    try {
      localStorage.setItem('veyra_current_role', role);
    } catch {}
  };

  const setProfile = (newProfile: Profile | null) => {
    setProfileState(newProfile);
    if (newProfile) {
      setRoleState(newProfile.role);
      try {
        localStorage.setItem('veyra_current_role', newProfile.role);
        localStorage.setItem('veyra_hr_profile', JSON.stringify(newProfile));
      } catch {}
    } else {
      try {
        localStorage.removeItem('veyra_hr_profile');
        localStorage.removeItem('veyra_current_role');
      } catch {}
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load saved profile if available
        let activeProfile: Profile | null = null;
        const savedProfileRaw = localStorage.getItem('veyra_hr_profile');
        if (savedProfileRaw) {
          try {
            activeProfile = JSON.parse(savedProfileRaw);
          } catch {}
        }

        const userEmail = (user.email || '').toLowerCase();
        const roleFromStorage = (localStorage.getItem('veyra_current_role') as RoleType);
        let determinedRole: RoleType = 'employee';

        // Check if user UID is the designated Security Administrator
        if (user.uid === 'hqLVEthP1kQTcanLBVdCUZ9xpoh1' || user.uid === 'admin_master_001' || userEmail.includes('admin')) {
          determinedRole = 'admin';
        } else if (userEmail.includes('hr') || userEmail.includes('manager')) {
          determinedRole = 'hr_manager';
        } else if (activeProfile?.role) {
          determinedRole = activeProfile.role;
        } else if (roleFromStorage) {
          determinedRole = roleFromStorage;
        }

        const baseProfile: Profile = {
          id: user.uid,
          company_id: activeProfile?.company_id || 'comp_veyra_tn',
          email: user.email || 'user@veyrahr.com',
          full_name: activeProfile?.full_name || user.displayName || user.email?.split('@')[0].toUpperCase() || (determinedRole === 'hr_manager' ? 'HR Operations Manager' : 'VeyraHR User'),
          phone: activeProfile?.phone || '',
          branch_name: activeProfile?.branch_name || 'Chennai HQ',
          department_access: activeProfile?.department_access || 'All Departments',
          role: determinedRole,
        };

        setProfile(baseProfile);

        // Sync from Supabase profiles table if it exists
        try {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .or(`id.eq.${user.uid},email.eq.${user.email}`)
            .single();

          if (dbProfile) {
            const merged: Profile = {
              ...baseProfile,
              full_name: dbProfile.full_name || baseProfile.full_name,
              phone: dbProfile.phone || baseProfile.phone,
              branch_name: dbProfile.branch_name || baseProfile.branch_name,
              department_access: dbProfile.department_access || baseProfile.department_access,
              role: (dbProfile.role as RoleType) || baseProfile.role,
              avatar_url: dbProfile.avatar_url,
            };
            setProfile(merged);
          }
        } catch {}

        setCompany((prev) => prev || {
          id: 'comp_veyra_tn',
          name: 'VeyraHR Technologies',
          industry: 'Software & Technology',
          company_size: '50-200 Employees',
          work_location: 'Chennai HQ & Regional Hubs',
          timezone: 'IST (UTC+5:30)',
          working_hours: '09:00 AM - 06:00 PM',
        });
      } else {
        // If not logged in via Firebase, check if guest/local profile exists
        const savedProfileRaw = localStorage.getItem('veyra_hr_profile');
        if (savedProfileRaw) {
          try {
            const parsed = JSON.parse(savedProfileRaw);
            setProfileState(parsed);
            setRoleState(parsed.role || 'employee');
          } catch {}
        } else {
          setProfileState(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    try {
      localStorage.removeItem('veyra_hr_profile');
      localStorage.removeItem('veyra_current_role');
      localStorage.removeItem('veyra_company_data');
    } catch {}
    setProfileState(null);
    setCompany(null);
    setCurrentUser(null);
    setRoleState('employee');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        company,
        currentRole,
        loading,
        setProfile,
        setCompany,
        setCurrentRole,
        logout,
        isLoggedIn: !!currentUser || !!profile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
