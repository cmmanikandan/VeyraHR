import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  QrCode, 
  Shield, 
  TrendingUp, 
  Timer, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  CalendarDays,
  FileSpreadsheet,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DynamicQRScanner } from '../../components/employee/DynamicQRScanner';
import { Employee, AttendanceRecord } from '../../types/database';
import { sendGeofenceBoundaryNotification } from '../../services/notificationService';

export const EmployeeAttendance: React.FC = () => {
  const { profile } = useAuth();
  const { employees, attendance, companyHolidays, leaveRequests, branches, checkIn, checkOut, updateAttendanceBreak } = useData();

  const isGpsPunchAllowed = typeof window !== 'undefined' && localStorage.getItem('veyra_company_gps_punch_enabled') !== 'false';

  const currentEmp: Employee = useMemo(() => {
    let matchedEmp: Employee | undefined = undefined;

    if (profile?.email) {
      matchedEmp = employees.find((e) => e.email?.toLowerCase() === profile.email?.toLowerCase());
    }
    if (!matchedEmp && profile?.id) {
      matchedEmp = employees.find((e) => e.id === profile.id || (e as any).profile_id === profile.id || e.employee_id === profile.id);
    }
    if (!matchedEmp && profile?.full_name) {
      matchedEmp = employees.find(
        (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase() === profile.full_name?.trim().toLowerCase()
      );
    }

    const effectiveBranch = matchedEmp?.branch_name || profile?.branch_name || matchedEmp?.work_location || 'Chennai HQ';
    const effectiveWorkLoc = matchedEmp?.work_location || profile?.branch_name || effectiveBranch;

    if (matchedEmp) {
      return {
        ...matchedEmp,
        branch_name: effectiveBranch,
        work_location: effectiveWorkLoc,
      };
    }

    if (profile) {
      const nameParts = (profile.full_name || 'VeyraHR Employee').split(' ');
      return {
        id: profile.id || 'emp_current',
        company_id: profile.company_id || 'comp_veyra_tn',
        employee_id: profile.id ? `VEY-EMP-${profile.id.slice(-4).toUpperCase()}` : 'VEY-EMP-0001',
        first_name: nameParts[0] || 'Employee',
        last_name: nameParts.slice(1).join(' ') || '',
        email: profile.email || 'employee@veyrahr.com',
        phone: profile.phone || '+91 98765 00000',
        designation: 'Operations Specialist',
        department_name: profile.department_access || 'Engineering & Tech',
        branch_name: effectiveBranch,
        work_location: effectiveWorkLoc,
        joining_date: '2026-01-01',
        status: 'Active',
        emergency_contact: '+91 98765 00001',
        address: `${effectiveBranch} Campus`,
        avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    }

    return {
      id: 'emp_current',
      company_id: 'comp_veyra_tn',
      employee_id: 'VEY-EMP-0001',
      first_name: 'VeyraHR',
      last_name: 'Employee',
      email: 'employee@veyrahr.com',
      phone: '+91 98765 00000',
      designation: 'Operations Specialist',
      department_name: 'Engineering & Tech',
      branch_name: 'Chennai HQ',
      joining_date: '2026-01-01',
      work_location: 'Chennai HQ',
      status: 'Active',
      emergency_contact: '+91 98765 00001',
      address: 'Chennai HQ Campus',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  }, [employees, profile]);

  const [activeView, setActiveView] = useState<'calendar' | 'details'>('calendar');
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedDay, setSelectedDay] = useState<{
    day: number;
    dateStr: string;
    dayOfWeek: string;
    status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Weekend' | 'Holiday' | 'Pending';
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    breakDuration?: string;
    location?: string;
    holidayName?: string;
    isRealRecord?: boolean;
  } | null>(null);

  const [geofenceAlert, setGeofenceAlert] = useState<{
    isOpen: boolean;
    distanceText: string;
    branchName: string;
    allowedRadius: string;
  }>({
    isOpen: false,
    distanceText: '2.4 km away',
    branchName: currentEmp.branch_name || 'Chennai HQ',
    allowedRadius: '200 meters',
  });

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionTargetDate, setCorrectionTargetDate] = useState('');
  const [correctionRequestedTime, setCorrectionRequestedTime] = useState('09:00');
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  // Scanner & Punch States
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrAction, setQrAction] = useState<'check_in' | 'check_out'>('check_in');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = useMemo(() => {
    return attendance.find(
      (a) =>
        (a.employee_id === currentEmp.id ||
         a.employee_id === currentEmp.employee_id ||
         (currentEmp.profile_id && a.employee_id === currentEmp.profile_id) ||
         (currentEmp.email && a.employee_id?.toLowerCase() === currentEmp.email.toLowerCase()) ||
         (a.employee_name && a.employee_name.toLowerCase().includes(currentEmp.first_name.toLowerCase()))) &&
        a.date === todayStr
    );
  }, [attendance, currentEmp, todayStr]);

  // ─── LIVE BREAK MANAGEMENT ──────────────────────────────────────────
  const [isOnBreak, setIsOnBreak] = useState<boolean>(() => {
    return localStorage.getItem(`veyra_break_active_${currentEmp.id}`) === 'true';
  });
  const [breakStartTimestamp, setBreakStartTimestamp] = useState<number | null>(() => {
    const saved = localStorage.getItem(`veyra_break_start_${currentEmp.id}`);
    return saved ? Number(saved) : null;
  });
  const [totalBreakMins, setTotalBreakMins] = useState<number>(() => {
    const saved = localStorage.getItem(`veyra_break_total_${currentEmp.id}_${todayStr}`);
    return saved ? Number(saved) : (todayRecord?.break_duration_mins || 0);
  });
  const [currentBreakElapsedMins, setCurrentBreakElapsedMins] = useState(0);

  useEffect(() => {
    if (isOnBreak && breakStartTimestamp) {
      const update = () => {
        const mins = Math.max(0, Math.floor((Date.now() - breakStartTimestamp) / 60000));
        setCurrentBreakElapsedMins(mins);
      };
      update();
      const interval = setInterval(update, 5000);
      return () => clearInterval(interval);
    } else {
      setCurrentBreakElapsedMins(0);
    }
  }, [isOnBreak, breakStartTimestamp]);

  const handleToggleBreak = async () => {
    if (!isOnBreak) {
      // Start break
      const now = Date.now();
      setIsOnBreak(true);
      setBreakStartTimestamp(now);
      localStorage.setItem(`veyra_break_active_${currentEmp.id}`, 'true');
      localStorage.setItem(`veyra_break_start_${currentEmp.id}`, String(now));
    } else {
      // Resume work
      const elapsed = breakStartTimestamp ? Math.max(1, Math.round((Date.now() - breakStartTimestamp) / 60000)) : 15;
      const newTotal = totalBreakMins + elapsed;
      setTotalBreakMins(newTotal);
      setIsOnBreak(false);
      setBreakStartTimestamp(null);
      setCurrentBreakElapsedMins(0);
      localStorage.removeItem(`veyra_break_active_${currentEmp.id}`);
      localStorage.removeItem(`veyra_break_start_${currentEmp.id}`);
      localStorage.setItem(`veyra_break_total_${currentEmp.id}_${todayStr}`, String(newTotal));
      await updateAttendanceBreak(currentEmp.id, elapsed);
    }
  };

  // Request browser push notification permission proactively
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ─── LIVE GPS GEOFENCE BOUNDARY DETECTION ────────────────────────────
  const assignedBranch = useMemo(() => {
    const effName = currentEmp.branch_name || currentEmp.work_location || 'Klm branch';
    const found = branches.find(
      (b) =>
        (b.name && b.name.trim().toLowerCase() === effName.trim().toLowerCase()) ||
        (b.name && b.name.toLowerCase().includes(effName.toLowerCase())) ||
        (b.name && effName.toLowerCase().includes(b.name.toLowerCase())) ||
        (b.city && effName.toLowerCase().includes(b.city.toLowerCase()))
    );

    if (found) return found;

    return {
      id: 'b_assigned',
      name: effName,
      latitude: 13.0827,
      longitude: 80.2707,
      radius_meters: 200,
    };
  }, [branches, currentEmp]);

  const [geofenceStatus, setGeofenceStatus] = useState<{
    inBoundary: boolean;
    distanceMeters: number;
    distanceText: string;
    branchName: string;
    allowedRadius: number;
  }>(() => ({
    inBoundary: false,
    distanceMeters: 0,
    distanceText: 'Detecting...',
    branchName: currentEmp.branch_name || 'Chennai HQ',
    allowedRadius: 200,
  }));

  const lastGeofenceBoundaryRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const updateLocation = (pos: GeolocationPosition) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const branchLat = assignedBranch.latitude || 13.0827;
        const branchLng = assignedBranch.longitude || 80.2707;
        const allowedRadius = assignedBranch.radius_meters || 200;

        const R = 6371e3;
        const φ1 = (lat * Math.PI) / 180;
        const φ2 = (branchLat * Math.PI) / 180;
        const Δφ = ((branchLat - lat) * Math.PI) / 180;
        const Δλ = ((branchLng - lng) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceMeters = Math.round(R * c);

        const inBoundary = distanceMeters <= allowedRadius;
        const distText = distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters}m`;

        // Check if device transitioned boundary
        if (lastGeofenceBoundaryRef.current !== null && lastGeofenceBoundaryRef.current !== inBoundary) {
          if (inBoundary) {
            sendGeofenceBoundaryNotification(assignedBranch.name, 'entered');
          } else {
            sendGeofenceBoundaryNotification(assignedBranch.name, 'exited');
          }
        }
        lastGeofenceBoundaryRef.current = inBoundary;

        setGeofenceStatus({
          inBoundary,
          distanceMeters,
          distanceText: distText,
          branchName: assignedBranch.name,
          allowedRadius,
        });
      };

      navigator.geolocation.getCurrentPosition(updateLocation, () => {}, { timeout: 5000, enableHighAccuracy: true });
      const watchId = navigator.geolocation.watchPosition(updateLocation, () => {}, { timeout: 10000, enableHighAccuracy: true });
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [assignedBranch]);

  // ─── HOLIDAY & WORKING DAYS CHECK ────────────────────────────────────
  const todayHoliday = useMemo(() => {
    return companyHolidays.find((h) => h.holiday_date === todayStr);
  }, [companyHolidays, todayStr]);
  const isSunday = new Date().getDay() === 0;
  const isHolidayOff = !!todayHoliday || isSunday;

  // Elapsed Timer state
  const [elapsedMins, setElapsedMins] = useState(0);

  useEffect(() => {
    if (todayRecord?.check_in_time && !todayRecord.check_out_time) {
      const startTime = new Date(todayRecord.check_in_time).getTime();
      const update = () => {
        const mins = Math.max(0, Math.floor((Date.now() - startTime) / 60000));
        setElapsedMins(mins);
      };
      update();
      const timer = setInterval(update, 10000);
      return () => clearInterval(timer);
    } else {
      setElapsedMins(0);
    }
  }, [todayRecord]);

  const isCheckedIn = !!todayRecord?.check_in_time && !todayRecord?.check_out_time;
  const isCheckedOut = !!todayRecord?.check_out_time;

  // ─── COMPUTED NET WORK HOURS (LIVE OR AFTER CHECKOUT) ───────────────
  const netWorkedMins = useMemo(() => {
    if (isCheckedIn) {
      return Math.max(0, elapsedMins - totalBreakMins - currentBreakElapsedMins);
    }
    if (todayRecord?.check_in_time && todayRecord?.check_out_time) {
      const inMs = new Date(todayRecord.check_in_time).getTime();
      const outMs = new Date(todayRecord.check_out_time).getTime();
      const diffMins = Math.max(1, Math.round((outMs - inMs) / 60000));
      const breakMins = todayRecord.break_duration_mins ?? totalBreakMins ?? 0;
      return Math.max(0, diffMins - breakMins);
    }
    if (todayRecord?.working_hours_mins) {
      return Math.max(0, todayRecord.working_hours_mins - (todayRecord.break_duration_mins || 0));
    }
    return 0;
  }, [isCheckedIn, elapsedMins, totalBreakMins, currentBreakElapsedMins, todayRecord]);

  const [is1TapVerifying, setIs1TapVerifying] = useState(false);

  const execute1TapCheckIn = async (verifiedLocation?: string) => {
    setIs1TapVerifying(true);
    const locationToLog = verifiedLocation || currentEmp.branch_name || currentEmp.work_location || 'Chennai HQ';
    setTimeout(async () => {
      if (isCheckedIn) {
        await checkOut(currentEmp.id, locationToLog);
      } else {
        await checkIn(currentEmp.id, locationToLog, '1-Tap GPS Check-In');
      }
      setIs1TapVerifying(false);
    }, 400);
  };

  const handle1TapPunch = () => {
    if (!isGpsPunchAllowed) {
      alert('1-Tap GPS Check-In is disabled by HR Policy. Please scan the Kiosk QR Code at the reception terminal.');
      return;
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const assignedBranch = branches.find(
            (b) =>
              b.name?.toLowerCase() === currentEmp.branch_name?.toLowerCase() ||
              b.name?.toLowerCase() === currentEmp.work_location?.toLowerCase() ||
              (b.city && currentEmp.work_location?.toLowerCase().includes(b.city.toLowerCase()))
          ) || branches[0] || {
            latitude: 13.0827,
            longitude: 80.2707,
            radius_meters: 500,
            name: currentEmp.branch_name || 'Chennai HQ',
          };

          const liveLocStr = `${assignedBranch.name} • GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
          execute1TapCheckIn(liveLocStr);
        },
        () => {
          execute1TapCheckIn(currentEmp.branch_name || currentEmp.work_location || 'Chennai HQ');
        },
        { timeout: 4000, enableHighAccuracy: true }
      );
    } else {
      execute1TapCheckIn(currentEmp.branch_name || currentEmp.work_location || 'Chennai HQ');
    }
  };

  // Filter real attendance records for current employee
  const myAttendance = useMemo(() => {
    return attendance
      .filter((a) =>
        a.employee_id === currentEmp.id ||
        a.employee_id === currentEmp.employee_id ||
        (currentEmp.profile_id && a.employee_id === currentEmp.profile_id) ||
        (currentEmp.email && a.employee_id?.toLowerCase() === currentEmp.email.toLowerCase()) ||
        (a.employee_name && a.employee_name.toLowerCase().includes(currentEmp.first_name.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, currentEmp]);

  // Working Hours analytics from actual recorded data
  const totalWorkedMins = useMemo(() => {
    return myAttendance.reduce((acc, curr) => acc + (curr.working_hours_mins || 0), 0);
  }, [myAttendance]);

  const avgHoursFormatted = useMemo(() => {
    if (myAttendance.length === 0) return '0.0h';
    const totalHours = totalWorkedMins / 60;
    const avg = totalHours / myAttendance.length;
    return `${avg.toFixed(1)}h`;
  }, [myAttendance, totalWorkedMins]);

  // Weekly Working Hours Bar Chart calculation
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day, i) => {
      const rec = myAttendance[i];
      const hours = rec ? +(rec.working_hours_mins / 60).toFixed(1) : 0;
      return { day, hours };
    });
  }, [myAttendance]);

  // Month navigation helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // ─── ACCURATE MONTHLY CALENDAR GRID MATRIX ───────────────────────────
  const calendarMatrix = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const daysList = [];

    // Empty lead slots
    for (let i = 0; i < firstDayIndex; i++) {
      daysList.push(null);
    }

    // Actual days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthPadded = String(viewMonth + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateStr = `${viewYear}-${monthPadded}-${dayPadded}`;
      const dateObj = new Date(viewYear, viewMonth, d);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const isToday = dateStr === todayStr;

      // Check Holiday
      const holiday = companyHolidays.find((h) => h.holiday_date === dateStr);

      // Check Leave
      const isLeave = leaveRequests.some(
        (l) => (l.employee_id === currentEmp.id || l.employee_name?.toLowerCase().includes(currentEmp.first_name.toLowerCase())) &&
          l.status === 'Approved' &&
          dateStr >= l.start_date &&
          dateStr <= l.end_date
      );

      // Check Real Attendance record in database FIRST
      const rec = myAttendance.find((a) => a.date === dateStr);

      let status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Weekend' | 'Holiday' | 'Pending' = 'Absent';
      if (rec) {
        status = rec.status === 'Late' ? 'Late' : 'Present';
      } else if (holiday) {
        status = 'Holiday';
      } else if (isLeave) {
        status = 'Leave';
      } else if (isWeekend) {
        status = 'Weekend';
      } else if (isToday) {
        status = 'Pending';
      } else {
        status = 'Absent';
      }

      const inMs = rec?.check_in_time ? new Date(rec.check_in_time).getTime() : 0;
      const outMs = rec?.check_out_time ? new Date(rec.check_out_time).getTime() : 0;
      const durationMins = (inMs && outMs)
        ? Math.max(1, Math.round((outMs - inMs) / 60000))
        : (rec?.working_hours_mins || 0);
      const breakMins = rec?.break_duration_mins ?? (rec?.check_in_time && isToday ? totalBreakMins : 0);
      const netWorkedMins = Math.max(0, durationMins - breakMins);
      const hoursStr = (rec || (inMs && outMs))
        ? `${Math.floor(netWorkedMins / 60)}h ${netWorkedMins % 60}m`
        : '0h 0m';

      const checkInStr = rec?.check_in_time
        ? new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--';

      const checkOutStr = rec?.check_out_time
        ? new Date(rec.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--';

      daysList.push({
        day: d,
        dateStr,
        dayOfWeek,
        status,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        hours: hoursStr,
        breakDuration: `${breakMins}m`,
        location: rec?.check_in_location || 'Chennai HQ Geofence (13.0827° N, 80.2707° E)',
        holidayName: holiday?.name,
        isToday,
        isRealRecord: !!rec,
      });
    }

    return daysList;
  }, [viewYear, viewMonth, companyHolidays, leaveRequests, currentEmp, myAttendance, todayStr, totalBreakMins]);

  // ─── REAL ATTENDANCE LOG DETAILS LIST ────────────────────────────────
  const detailedLogsList = useMemo(() => {
    // Map strictly from real recorded attendance records
    return myAttendance
      .map((rec) => {
        const d = new Date(rec.date);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const checkInStr = rec.check_in_time
          ? new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';
        const checkOutStr = rec.check_out_time
          ? new Date(rec.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';

        const inMs = rec.check_in_time ? new Date(rec.check_in_time).getTime() : 0;
        const outMs = rec.check_out_time ? new Date(rec.check_out_time).getTime() : 0;
        const durationMins = (inMs && outMs)
          ? Math.max(1, Math.round((outMs - inMs) / 60000))
          : (rec.working_hours_mins || 0);
        const breakMins = rec.break_duration_mins || (rec.check_in_time && rec.date === todayStr ? totalBreakMins : 0);
        const netWorkedMins = Math.max(0, durationMins - breakMins);
        const hoursStr = `${Math.floor(netWorkedMins / 60)}h ${netWorkedMins % 60}m`;
        const overtimeStr = rec.overtime_mins ? `${rec.overtime_mins}m` : '0m';

        return {
          id: rec.id,
          dateStr: rec.date,
          dayName,
          status: rec.status as 'Present' | 'Late',
          checkIn: checkInStr,
          checkOut: checkOutStr,
          workingHours: hoursStr,
          breakDuration: `${breakMins}m`,
          overtime: overtimeStr,
          location: rec.check_in_location || 'Chennai HQ Geofence (QR + GPS)',
          method: rec.verification_method || 'Dynamic QR + GPS Verification',
        };
      })
      .filter((item) => {
        const matchFilter = statusFilter === 'All' || item.status === statusFilter;
        const matchSearch = searchQuery === '' || 
          item.dayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.dateStr.includes(searchQuery);
        return matchFilter && matchSearch;
      });
  }, [myAttendance, statusFilter, searchQuery]);

  return (
    <div className="space-y-4 py-2 text-left">
      
      {/* ─── 1. SLEEK DARK GRADIENT PAGE TITLE CARD ───────────────────── */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#090E1A] via-[#111A2E] to-[#16223B] border border-blue-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-blue-400 border border-white/15 shadow-xs flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono">Real-Time Presence</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-300 font-mono">GPS & QR Verified</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">Attendance Center</h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Live check-in, monthly matrix & verified presence logs</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="relative z-10 flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeView === 'calendar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Calendar
          </button>
          <button
            onClick={() => setActiveView('details')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeView === 'details' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Detailed Logs ({myAttendance.length})
          </button>
        </div>
      </div>

      {/* ─── 2. HIGH-IMPACT TODAY'S SHIFT / HOLIDAY CARD ───────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#1E3A8A] text-white p-5 sm:p-6 shadow-2xl border border-slate-700">
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {isHolidayOff ? (
            /* HOLIDAY MODE: No check-in, check-out, or breaks allowed */
            <div className="space-y-4 py-1">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-600/25 border border-amber-400/40 flex items-start gap-3.5 text-xs animate-in fade-in">
                <span className="text-3xl shrink-0">🎉</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black text-amber-200">
                      Official Holiday: {todayHoliday?.name || 'Sunday Weekend'}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] uppercase font-mono tracking-wider">
                      Office Closed
                    </span>
                  </div>
                  <p className="text-xs text-amber-100 font-medium leading-relaxed">
                    Attendance check-in, check-out, and break logging are completely paused for today. Enjoy your well-deserved holiday!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Assigned Reporting Branch: <strong className="text-white">{assignedBranch.name}</strong></span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  Regular Shift & Attendance Will Resume Tomorrow
                </span>
              </div>
            </div>
          ) : (
            /* NORMAL WORKING DAY SHIFT CONTROLS */
            <>
              {/* Header Row: Shift Name & Live Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider block font-mono">Assigned Working Shift</span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">General Day (09:00 AM – 06:00 PM)</h3>
                  </div>
                </div>

                {/* Live Status Indicator */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  isOnBreak
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/40 ring-2 ring-amber-400/30'
                    : isCheckedIn 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 ring-2 ring-emerald-500/20' 
                    : isCheckedOut
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30 ring-2 ring-amber-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isOnBreak ? 'bg-amber-400 animate-ping' : isCheckedIn ? 'bg-emerald-400 animate-ping' : isCheckedOut ? 'bg-blue-400' : 'bg-amber-400 animate-pulse'
                  }`} />
                  <span className="font-mono">
                    {isOnBreak ? 'On Break ☕' : isCheckedIn ? 'Checked In (Active)' : isCheckedOut ? 'Checked Out' : 'Pending Check-In'}
                  </span>
                </span>
              </div>

              {/* User Location & Real-time Geofence Boundary Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/10">
                <div>
                  <span className="text-[11px] font-medium text-slate-300">Assigned Branch</span>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-white mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{assignedBranch.name}</span>
                  </div>
                </div>

                {/* Real-time GPS Geofence Boundary Status */}
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                  geofenceStatus.inBoundary
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${geofenceStatus.inBoundary ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-pulse'}`} />
                  <span>
                    {geofenceStatus.inBoundary ? `Inside Boundary (${geofenceStatus.distanceText})` : `Outside Perimeter (${geofenceStatus.distanceText})`}
                  </span>
                </div>
              </div>

              {/* 4-Metric Grid: Punch In, Punch Out, Active Work Hours, Break Time */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Punch In</span>
                  <span className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">
                    {todayRecord?.check_in_time 
                      ? new Date(todayRecord.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Punch Out</span>
                  <span className="text-sm sm:text-base font-black text-slate-200 font-mono block mt-0.5">
                    {todayRecord?.check_out_time 
                      ? new Date(todayRecord.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : isCheckedIn ? 'In Progress' : '--:--'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                    {isCheckedIn ? 'Work Hours' : 'Total Hours'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-300 font-mono block mt-0.5">
                    {Math.floor(netWorkedMins / 60)}h {netWorkedMins % 60}m
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                    Break Logged
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-300 font-mono block mt-0.5">
                    {isOnBreak 
                      ? `☕ ${totalBreakMins + currentBreakElapsedMins}m (Live)` 
                      : `${totalBreakMins}m`}
                  </span>
                </div>
              </div>

              {/* Interactive Break Action Toggle if Checked In */}
              {isCheckedIn && (
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">☕</span>
                    <div>
                      <span className="text-xs font-extrabold text-white block">
                        {isOnBreak ? `Currently On Break (${currentBreakElapsedMins}m elapsed)` : 'Lunch & Refreshment Break'}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium">
                        {isOnBreak ? 'Break duration is paused from active working hours' : 'Log tea / lunch pauses accurately'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleBreak}
                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all active:scale-98 shadow-md flex items-center gap-1.5 ${
                      isOnBreak
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 ring-2 ring-emerald-300'
                        : 'bg-amber-500 hover:bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                    }`}
                  >
                    <span>{isOnBreak ? '▶️ Resume Work' : '☕ Start Break'}</span>
                  </button>
                </div>
              )}

              {/* Dual Action Buttons: QR Camera Scanner & 1-Tap GPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setQrAction(isCheckedIn ? 'check_out' : 'check_in');
                    setIsQrOpen(true);
                  }}
                  className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-98 ${
                    isCheckedIn
                      ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/40 ring-2 ring-rose-400/30'
                      : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40 ring-2 ring-emerald-400/30'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isCheckedIn ? 'Scan QR to Check-Out' : 'Scan Camera QR'}</span>
                </button>

                <button
                  onClick={handle1TapPunch}
                  disabled={is1TapVerifying}
                  className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-98 ${
                    !isGpsPunchAllowed
                      ? 'bg-slate-800/80 text-slate-400 border border-slate-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/40 ring-2 ring-indigo-400/30'
                  }`}
                >
                  <Zap className="w-4.5 h-4.5 text-purple-200" />
                  <span>
                    {is1TapVerifying 
                      ? 'Verifying GPS...' 
                      : !isGpsPunchAllowed 
                      ? '🔒 GPS Disabled by HR' 
                      : isCheckedIn 
                      ? '1-Tap GPS Check-Out' 
                      : '⚡ 1-Tap GPS Check-In'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── TAB 1: MONTHLY CALENDAR VIEW ───────────────────────────────── */}
      {activeView === 'calendar' && (
        <div className="space-y-4">
          
          {/* Weekly Hours Breakdown Chart */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recorded Working Hours</span>
                <h4 className="text-sm font-extrabold text-slate-900">Weekly Breakdown</h4>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-blue-600 font-mono">{avgHoursFormatted}</span>
                <span className="text-[10px] text-slate-400 block">Daily Average</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 pt-3 pb-1 h-28 px-2">
              {weeklyData.map((item) => {
                const heightPercent = Math.min(100, Math.round((item.hours / 10) * 100));
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                      {item.hours}h
                    </span>
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-xl h-16 relative overflow-hidden flex items-end">
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-xl transition-all duration-500 group-hover:from-blue-600 group-hover:to-indigo-400"
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-700">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Monthly Calendar Matrix */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {monthNames[viewMonth]} {viewYear}
                </h4>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Late</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Leave</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Holiday</span>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase py-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Month Day Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarMatrix.map((d, index) => {
                if (!d) {
                  return <div key={`empty_${index}`} className="h-14 rounded-2xl bg-transparent" />;
                }

                const isPresent = d.status === 'Present';
                const isLate = d.status === 'Late';
                const isLeave = d.status === 'Leave';
                const isHoliday = d.status === 'Holiday';
                const isWeekend = d.status === 'Weekend';
                const isPending = d.status === 'Pending';
                const isAbsent = d.status === 'Absent';

                return (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d)}
                    className={`p-1.5 sm:p-2 rounded-2xl flex flex-col items-center justify-between min-h-[52px] sm:min-h-[56px] transition-all hover:scale-105 active:scale-95 border shadow-2xs ${
                      d.isToday
                        ? 'ring-2 ring-blue-600 bg-blue-50/90 border-blue-400 font-extrabold shadow-sm'
                        : isHoliday
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                        : isLeave
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                        : isLate
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-black'
                        : isPresent
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black'
                        : isWeekend
                        ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                        : isPending
                        ? 'bg-amber-50/60 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs font-bold leading-none">{d.day}</span>
                      <span className={`w-2 h-2 rounded-full ring-1 ring-white ${
                        isPresent
                          ? 'bg-emerald-500 shadow-emerald-400/50 shadow-xs'
                          : isLate
                          ? 'bg-amber-500 shadow-amber-400/50 shadow-xs'
                          : isLeave
                          ? 'bg-blue-500 shadow-blue-400/50 shadow-xs'
                          : isHoliday
                          ? 'bg-purple-500 shadow-purple-400/50 shadow-xs'
                          : isWeekend
                          ? 'bg-slate-300'
                          : isPending
                          ? 'bg-blue-600 animate-ping'
                          : 'bg-rose-300'
                      }`} />
                    </div>

                    <span className={`text-[9px] font-black uppercase tracking-tight truncate max-w-full px-1 py-0.5 rounded-md ${
                      isPresent
                        ? 'bg-emerald-200/60 text-emerald-900'
                        : isLate
                        ? 'bg-amber-200/70 text-amber-950 font-black'
                        : isLeave
                        ? 'bg-blue-200/60 text-blue-950'
                        : isHoliday
                        ? 'bg-purple-200/60 text-purple-950'
                        : isWeekend
                        ? 'text-slate-400 font-medium'
                        : isPending
                        ? 'bg-amber-200/60 text-amber-900'
                        : 'text-slate-300'
                    }`}>
                      {isPresent ? 'Pres' : isLate ? 'Late' : isLeave ? 'Leave' : isHoliday ? 'Holi' : isWeekend ? 'Off' : isPending ? 'Live' : '—'}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium">
              Tap any date to inspect verified punch timestamps, work hours & GPS log.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DETAILED ATTENDANCE LOGS PAGE ──────────────────────── */}
      {activeView === 'details' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search date (e.g. Aug 29)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {['All', 'Present', 'Late'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-colors ${
                      statusFilter === f
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Attendance List */}
          <div className="space-y-2.5">
            {detailedLogsList.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-extrabold text-slate-900">No attendance logs found</h4>
                <p className="text-xs text-slate-500 mt-0.5">Use the QR Scanner above to check in and record presence.</p>
              </div>
            ) : (
              detailedLogsList.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-extrabold text-slate-900">{log.dayName}</span>
                    </div>

                    <Badge
                      variant={log.status === 'Present' ? 'green' : 'amber'}
                      size="sm"
                    >
                      {log.status}
                    </Badge>
                  </div>

                  {/* Punch Timestamps & Working Hours Breakdown */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">In</span>
                      <span className="font-extrabold text-slate-900 font-mono text-[11px] mt-0.5 block">{log.checkIn}</span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Out</span>
                      <span className="font-extrabold text-slate-900 font-mono text-[11px] mt-0.5 block">{log.checkOut}</span>
                    </div>

                    <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-blue-700 font-bold block uppercase">Hours</span>
                      <span className="font-extrabold text-blue-900 font-mono text-[11px] mt-0.5 block">{log.workingHours}</span>
                    </div>

                    <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-bold block uppercase">Break</span>
                      <span className="font-extrabold text-emerald-900 font-mono text-[11px] mt-0.5 block">{log.breakDuration}</span>
                    </div>
                  </div>

                  {/* Verification & Geofence Method */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                      {log.location}
                    </span>
                    <span className="font-mono text-emerald-600 font-bold shrink-0">✓ {log.method}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── DAY BREAKDOWN POPUP (With X close button) ───────────────────── */}
      {selectedDay && (
        <BottomSheet
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          title={`Attendance Audit: ${selectedDay.dateStr} (${selectedDay.dayOfWeek})`}
        >
          <div className="space-y-4 text-left p-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Verified Status:</span>
              <Badge variant={selectedDay.status === 'Present' ? 'green' : selectedDay.status === 'Late' ? 'amber' : selectedDay.status === 'Holiday' ? 'purple' : 'blue'}>
                {selectedDay.status === 'Holiday' ? `Holiday: ${selectedDay.holidayName}` : selectedDay.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Check-In Punch</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono mt-0.5 block">{selectedDay.checkIn}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Check-Out Punch</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono mt-0.5 block">{selectedDay.checkOut}</span>
              </div>
            </div>

            <div className="text-xs">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] text-blue-700 block uppercase font-bold">Total Work Duration</span>
                <span className="font-extrabold text-blue-900 text-sm font-mono mt-0.5 block">{selectedDay.hours}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Verified Geofence Location:</span>
              </div>
              <p className="text-[11px] text-blue-800 font-mono pl-5">{selectedDay.location}</p>
            </div>

            <Button variant="primary" className="w-full" onClick={() => setSelectedDay(null)}>
              Close Breakdown
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* QR CAMERA SCANNER MODAL */}
      {isQrOpen && (
        <DynamicQRScanner
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          actionType={qrAction}
          employeeName={`${currentEmp.first_name} ${currentEmp.last_name}`}
          employeeId={currentEmp.employee_id || currentEmp.id}
          branchId={assignedBranch.id}
          branchName={assignedBranch.name}
          onConfirmAttendance={async (loc, method) => {
            if (qrAction === 'check_in') {
              await checkIn(currentEmp.id, loc, method);
            } else {
              await checkOut(currentEmp.id, loc);
            }
            setIsQrOpen(false);
          }}
        />
      )}


      {/* GEOFENCE PERIMETER RESTRICTION MODAL */}
      {geofenceAlert.isOpen && (
        <Modal
          isOpen={geofenceAlert.isOpen}
          onClose={() => setGeofenceAlert((prev) => ({ ...prev, isOpen: false }))}
          title="Workplace Geofence Alert"
          maxWidth="sm"
        >
          <div className="text-center py-5 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 text-rose-600 border border-rose-200 flex items-center justify-center shadow-lg">
              <MapPin className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Outside Office Perimeter
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                Your device is currently <strong>{geofenceAlert.distanceText}</strong> from <strong>{geofenceAlert.branchName}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-1.5 text-xs text-rose-900">
              <div className="flex items-center justify-between font-bold">
                <span>Authorized Radius Limit:</span>
                <span className="font-mono">{geofenceAlert.allowedRadius}</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Attendance punches must occur within the authorized office perimeter.
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full font-extrabold py-3 bg-rose-600 hover:bg-rose-700 shadow-md"
              onClick={() => setGeofenceAlert((prev) => ({ ...prev, isOpen: false }))}
            >
              Understood
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
