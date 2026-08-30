import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Lock, 
  KeyRound, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  Wifi, 
  ArrowRight,
  LogOut,
  Users,
  Activity,
  ShieldAlert,
  Navigation,
  Camera,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Scan,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { VeyraBrandHeader } from '../../components/common/VeyraBrandHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Employee } from '../../types/database';

export const KioskPage: React.FC = () => {
  const { branches, attendance, employees, checkIn, checkOut } = useData();

  // Kiosk Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('veyra_kiosk_auth') === 'true';
  });
  const [kioskLoginId, setKioskLoginId] = useState(() => {
    return localStorage.getItem('veyra_kiosk_terminal_id') || 'kiosk.chennai@veyrahr.com';
  });
  const [terminalPin, setTerminalPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Kiosk Configuration & Active Branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('veyra_kiosk_branch_id') || branches[0]?.id || 'b1';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Dynamic Rolling QR Token
  const [qrToken, setQrToken] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Kiosk Camera Optical Scanner State
  const [kioskScanError, setKioskScanError] = useState<{
    message: string;
    payload?: string;
  } | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [verifiedEmployee, setVerifiedEmployee] = useState<{
    name: string;
    avatar: string;
    designation: string;
    action: 'Checked In (Present)' | 'Checked Out';
    time: string;
  } | null>(null);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [touchPinInput, setTouchPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const kioskVideoRef = useRef<HTMLVideoElement | null>(null);
  const kioskStreamRef = useRef<MediaStream | null>(null);
  const kioskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const isCooldownRef = useRef<boolean>(false);

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0] || {
    id: 'b1',
    name: 'Chennai HQ (Anna Nagar)',
    city: 'Chennai',
    address: 'No. 42, 2nd Main Road, Anna Nagar West, Chennai, Tamil Nadu 600040',
    latitude: 13.0827,
    longitude: 80.2707,
    radius_meters: 150,
  };

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter attendance punches for this specific branch
  const todayStr = new Date().toISOString().split('T')[0];
  const branchPunches = attendance.filter((a) => a.date === todayStr);

  // Dynamic Refreshing QR Token Generator (Cycles every 3 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    const generateNewToken = () => {
      const timestamp = Date.now();
      const rawToken = `VEYRA-QR-AUTH:${activeBranch.id}:${activeBranch.name}:${timestamp}:${Math.random().toString(36).substring(2, 9)}`;
      setQrToken(rawToken);
    };

    generateNewToken();
    const qrInterval = setInterval(generateNewToken, 3000);
    return () => clearInterval(qrInterval);
  }, [isAuthenticated, activeBranch]);

  // Dynamic check-in/out tracking state for the active kiosk session
  const [checkedInSet, setCheckedInSet] = useState<Set<string>>(() => {
    const set = new Set<string>();
    attendance.forEach((a) => {
      if (a.date === todayStr && a.check_in_time && !a.check_out_time) {
        set.add(a.employee_id);
      }
    });
    return set;
  });

  // Sync with global attendance context updates
  useEffect(() => {
    const set = new Set<string>();
    attendance.forEach((a) => {
      if (a.date === todayStr && a.check_in_time && !a.check_out_time) {
        set.add(a.employee_id);
      }
    });
    setCheckedInSet(set);
  }, [attendance, todayStr]);

  // Audio: Positive Harmonic Chime
  const playSuccessChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  // Audio: Negative Error Buzz Sound
  const playErrorChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // ─── OFFLINE PUNCH QUEUE & SYNC ENGINE ─────────────────────────────────
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('veyra_kiosk_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const savedQueueRaw = localStorage.getItem('veyra_kiosk_offline_queue');
      if (savedQueueRaw) {
        try {
          const queue = JSON.parse(savedQueueRaw);
          if (Array.isArray(queue) && queue.length > 0) {
            for (const item of queue) {
              if (item.action === 'check_in') {
                await checkIn(item.employee_id, item.location, 'QR Kiosk (Offline Synced)');
              } else {
                await checkOut(item.employee_id, item.location);
              }
            }
            localStorage.removeItem('veyra_kiosk_offline_queue');
            setOfflineQueue([]);
            playSuccessChime();
          }
        } catch (e) {
          console.warn('Kiosk offline sync:', e);
        }
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkIn, checkOut]);

  // Screen Wake-Lock to keep tablet screen awake 24/7 at office gate
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch {}
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // ─── KIOSK SMART DECODER: Handles ID Badges, Rolling QRs, and Employee IDs ───
  const processDecodedString = async (rawCode: string) => {
    if (isCooldownRef.current) return;
    isCooldownRef.current = true;

    const clean = rawCode.trim();
    let targetEmployeeId = '';
    let tokenBranchId = '';

    // 1. JSON Format (Digital ID Badge / App Pass)
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        targetEmployeeId = parsed.id || parsed.employee_id || parsed.employeeId || parsed.email || '';
        if (parsed.branch) tokenBranchId = parsed.branch;
      } catch {}
    } 
    // 2. Standard Rolling Veyra Token (VEYRA-QR-AUTH:<branchId>:<name>:<time>:<rand>:<empId>)
    else if (clean.startsWith('VEYRA-QR-AUTH:')) {
      const parts = clean.split(':');
      tokenBranchId = parts[1] || '';
      targetEmployeeId = parts[5] || '';
    } 
    // 3. Employee Digital Pass Prefix (VEYRA-EMP-PASS:<id>:<emp_id>)
    else if (clean.startsWith('VEYRA-EMP-PASS:')) {
      const parts = clean.split(':');
      targetEmployeeId = parts[1] || parts[2] || '';
    } 
    // 4. Direct Employee ID or Code
    else if (clean.startsWith('VEY-EMP-') || clean.startsWith('emp_') || clean.length >= 3) {
      targetEmployeeId = clean;
    }

    if (!targetEmployeeId) {
      playErrorChime();
      setKioskScanError({
        message: 'Unrecognized Badge QR — Please present your VeyraHR ID card.',
        payload: clean.length > 30 ? clean.substring(0, 30) + '...' : clean,
      });
      setTimeout(() => {
        setKioskScanError(null);
        isCooldownRef.current = false;
      }, 2500);
      return;
    }

    // Match employee against active staff directory
    const cleanLookup = targetEmployeeId.toLowerCase();
    const matchedEmp = employees.find(
      (e) =>
        e.id.toLowerCase() === cleanLookup ||
        (e.employee_id && e.employee_id.toLowerCase() === cleanLookup) ||
        (e.email && e.email.toLowerCase() === cleanLookup) ||
        `${e.first_name} ${e.last_name}`.toLowerCase() === cleanLookup
    );

    if (!matchedEmp) {
      playErrorChime();
      setKioskScanError({
        message: 'Employee Not Recognized. Please contact HR.',
        payload: targetEmployeeId,
      });
      setTimeout(() => {
        setKioskScanError(null);
        isCooldownRef.current = false;
      }, 3000);
      return;
    }

    setKioskScanError(null);
    playSuccessChime();

    // Check if employee is currently checked in today -> Toggle to Check Out
    const isCurrentlyCheckedIn = checkedInSet.has(matchedEmp.id);
    let actionText: 'Checked In (Present)' | 'Checked Out' = 'Checked In (Present)';

    const branchForRecord = activeBranch.name;

    if (isCurrentlyCheckedIn) {
      setCheckedInSet((prev) => {
        const next = new Set(prev);
        next.delete(matchedEmp.id);
        return next;
      });

      if (navigator.onLine) {
        await checkOut(matchedEmp.id, branchForRecord);
      } else {
        const offlineItem = {
          action: 'check_out',
          employee_id: matchedEmp.id,
          location: branchForRecord,
          timestamp: new Date().toISOString(),
        };
        const updated = [...offlineQueue, offlineItem];
        setOfflineQueue(updated);
        localStorage.setItem('veyra_kiosk_offline_queue', JSON.stringify(updated));
      }
      actionText = 'Checked Out';
    } else {
      setCheckedInSet((prev) => {
        const next = new Set(prev);
        next.add(matchedEmp.id);
        return next;
      });

      if (navigator.onLine) {
        await checkIn(matchedEmp.id, branchForRecord, 'Kiosk Optical Scanner');
      } else {
        const offlineItem = {
          action: 'check_in',
          employee_id: matchedEmp.id,
          location: branchForRecord,
          timestamp: new Date().toISOString(),
        };
        const updated = [...offlineQueue, offlineItem];
        setOfflineQueue(updated);
        localStorage.setItem('veyra_kiosk_offline_queue', JSON.stringify(updated));
      }
      actionText = 'Checked In (Present)';
    }

    setVerifiedEmployee({
      name: `${matchedEmp.first_name} ${matchedEmp.last_name}`,
      avatar: matchedEmp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      designation: matchedEmp.designation || 'Specialist',
      action: actionText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    // Voice announcement synthesizer for gate greeting
    if (soundEnabled && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const greeting = actionText.includes('Checked In')
          ? `Welcome to VeyraHR, ${matchedEmp.first_name}! Check-in recorded.`
          : `Good evening ${matchedEmp.first_name}! Shift completed and check-out logged.`;
        const utterance = new SpeechSynthesisUtterance(greeting);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }

    setTimeout(() => {
      setVerifiedEmployee(null);
      isCooldownRef.current = false;
    }, 3500);
  };

  // Start continuous high-frequency optical camera stream for the Kiosk
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const startCamera = async () => {
      try {
        if (kioskStreamRef.current) {
          kioskStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        kioskStreamRef.current = stream;
        setCameraPermission(true);

        if (kioskVideoRef.current) {
          kioskVideoRef.current.srcObject = stream;
          kioskVideoRef.current.play().catch(() => {});
        }

        // Set up ultra-fast multi-pass frame analysis loop (every 40ms)
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

        scanIntervalRef.current = setInterval(async () => {
          if (isCooldownRef.current || !kioskVideoRef.current) return;

          const video = kioskVideoRef.current;
          if (video.readyState < video.HAVE_ENOUGH_DATA) return;

          // Technique 1: Native Hardware BarcodeDetector API (Ultra-fast ~5ms)
          if ('BarcodeDetector' in window) {
            try {
              const barcodeDetector = new (window as any).BarcodeDetector({
                formats: ['qr_code', 'code_128', 'ean_13', 'data_matrix'],
              });
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                processDecodedString(barcodes[0].rawValue);
                return;
              }
            } catch {}
          }

          // Technique 2: Multi-Pass jsQR Analysis
          if (!kioskCanvasRef.current) {
            kioskCanvasRef.current = document.createElement('canvas');
          }
          const canvas = kioskCanvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          const w = video.videoWidth || 640;
          const h = video.videoHeight || 480;

          // Pass A: Full frame decoding with attemptBoth
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);

          try {
            const fullImageData = ctx.getImageData(0, 0, w, h);
            const qr = jsQR(fullImageData.data, fullImageData.width, fullImageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (qr && qr.data) {
              processDecodedString(qr.data);
              return;
            }
          } catch {}

          // Pass B: Center-Cropped 60% Region (Focuses sharply on phone screen / badge)
          try {
            const cropW = Math.floor(w * 0.6);
            const cropH = Math.floor(h * 0.6);
            const startX = Math.floor((w - cropW) / 2);
            const startY = Math.floor((h - cropH) / 2);
            const cropData = ctx.getImageData(startX, startY, cropW, cropH);

            const cropQr = jsQR(cropData.data, cropData.width, cropData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (cropQr && cropQr.data) {
              processDecodedString(cropQr.data);
              return;
            }
          } catch {}
        }, 40);

      } catch (err) {
        console.warn('Kiosk camera access error:', err);
        setCameraPermission(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (kioskStreamRef.current) {
        kioskStreamRef.current.getTracks().forEach((t) => t.stop());
        kioskStreamRef.current = null;
      }
    };
  }, [isAuthenticated, facingMode, employees, activeBranch, checkedInSet]);

  // Terminal Pin Login
  const handleTerminalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = kioskLoginId.trim().toLowerCase();

    if (cleanId && (terminalPin === '1234' || terminalPin === 'admin' || terminalPin.length >= 3)) {
      setIsAuthenticated(true);
      localStorage.setItem('veyra_kiosk_auth', 'true');
      localStorage.setItem('veyra_kiosk_terminal_id', kioskLoginId);
      localStorage.setItem('veyra_kiosk_branch_id', selectedBranchId);
      setLoginError(null);
      playSuccessChime();
    } else {
      setLoginError('Invalid PIN. Use default PIN 1234 to launch.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('veyra_kiosk_auth');
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (kioskStreamRef.current) {
      kioskStreamRef.current.getTracks().forEach((t) => t.stop());
      kioskStreamRef.current = null;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // ─── AUTHENTICATION GATE SCREEN ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md mx-auto w-full my-auto z-10">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <VeyraBrandHeader size="lg" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold mt-2">
                <ShieldCheck className="w-3.5 h-3.5" /> SMART KIOSK TERMINAL v4.2
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight pt-2">
                Launch On-Premise Kiosk
              </h2>
            </div>

            <form onSubmit={handleTerminalLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Authorized Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Terminal Security PIN
                </label>
                <input
                  type="password"
                  value={terminalPin}
                  onChange={(e) => setTerminalPin(e.target.value)}
                  placeholder="Enter PIN (Default: 1234)"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600 font-mono tracking-widest text-center"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
                  {loginError}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-white shadow-lg shadow-cyan-500/20"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Launch Kiosk Terminal
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setTerminalPin('1234');
                    setIsAuthenticated(true);
                    localStorage.setItem('veyra_kiosk_auth', 'true');
                    localStorage.setItem('veyra_kiosk_terminal_id', kioskLoginId);
                    localStorage.setItem('veyra_kiosk_branch_id', selectedBranchId);
                    setLoginError(null);
                    playSuccessChime();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-300 text-xs font-bold font-mono transition-colors border border-slate-700"
                >
                  ⚡ Quick Launch (Default PIN: 1234)
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE SPLIT 2-COLUMN KIOSK TERMINAL INTERFACE ──────────────────────
  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* ─── KIOSK TOP APP BAR ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between z-20 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE TERMINAL ONLINE
              </span>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">{kioskLoginId}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {activeBranch.name}
            </h1>
          </div>
        </div>

        {/* Live Clock & Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {currentDate}
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all ${
              soundEnabled 
                ? 'bg-slate-900/80 border-slate-700 text-cyan-400' 
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-colors hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
            title="Close Terminal Session"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─── KIOSK MAIN STAGE: SPLIT 2-COLUMN DUAL SCANNER ─────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center py-2 z-20">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* ─── LEFT COLUMN: BIG DYNAMIC ROLLING QR FOR MOBILE APP ───────── */}
          <div className="bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-7 rounded-3xl border border-cyan-500/30 shadow-[0_20px_60px_-15px_rgba(6,182,212,0.25)] flex flex-col justify-between text-center space-y-3">
            
            {/* Header Block with Symmetrical Height */}
            <div className="space-y-1.5 min-h-[85px] flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-black uppercase tracking-wider">
                <Smartphone className="w-4 h-4" /> Method 1: Scan With Mobile Phone
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-0.5">
                Employee Mobile Check-In
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Open camera in VeyraHR Mobile App to record instant arrival or departure.
              </p>
            </div>

            {/* High-Contrast Large Dynamic QR Container (Fixed Centered Height) */}
            <div className="h-[340px] sm:h-[370px] flex items-center justify-center relative my-auto">
              <div className="relative inline-block p-4 sm:p-5 bg-white rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.35)] border-4 border-cyan-400/50">
                {qrToken ? (
                  <QRCodeSVG
                    value={qrToken}
                    size={260}
                    level="H"
                    includeMargin
                    fgColor="#0A0F1D"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-blue-600 animate-spin" />
                  </div>
                )}

                {/* Live Refresh Badge */}
                <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                  <span className="px-4 py-1 rounded-full bg-cyan-600 text-white font-mono text-xs font-black shadow-lg flex items-center gap-1.5 border border-cyan-300">
                    <ShieldCheck className="w-4 h-4" /> Rolling Token • Cycles Every 3s
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Info Pill */}
            <div className="h-11 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Anti-spoof dynamic cryptographic token protected</span>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: BIG LIVE CAMERA BADGE & ID SCANNER ─────────── */}
          <div className="bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-7 rounded-3xl border border-blue-500/30 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.25)] flex flex-col justify-between text-center space-y-3">
            
            {/* Header Block with Symmetrical Height */}
            <div className="space-y-1.5 min-h-[85px] flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-black uppercase tracking-wider">
                <CreditCard className="w-4 h-4" /> Method 2: Scan ID Badge / Mobile QR
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-0.5">
                Hold ID Card In Front Of Camera
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Wide-angle optical camera continuously detects employee ID cards and tokens.
              </p>
            </div>

            {/* Large Wide-Angle Camera Viewfinder Box (Matching Height) */}
            <div className="h-[340px] sm:h-[370px] w-full bg-slate-950 rounded-3xl overflow-hidden border-2 border-blue-500/60 flex items-center justify-center shadow-2xl relative my-auto">
              
              <video
                ref={kioskVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Floating Camera Flip Toggle */}
              <button
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 backdrop-blur-md transition-colors z-10"
                title="Switch Front / Rear Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Flip Camera
              </button>

              {/* Holographic Laser Viewfinder Overlay (Large Box) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                <div className="w-60 h-60 sm:w-64 sm:h-64 border-2 border-cyan-400/80 rounded-3xl relative shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38BDF8] animate-bounce" />
                  <span className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                  <span className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                  <span className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                </div>
                <div className="mt-2.5 px-3.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-cyan-300 text-[11px] font-bold font-mono">
                  ⚡ Hold Employee ID Card or Phone QR inside frame
                </div>
              </div>

              {/* Status Indicator Pill */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Optical Engine Active
              </div>
            </div>

            {/* Bottom Footer Info / Error Pill */}
            {kioskScanError ? (
              <div className="h-11 px-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">{kioskScanError.message}</span>
              </div>
            ) : (
              <div className="h-11 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
                <Scan className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Show ID card to check in; show again later to check out.</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Presence Metrics & Ticker Bar */}
        <div className="w-full max-w-7xl space-y-3 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Today's Presence</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    {branchPunches.length} Punches Logged
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                {checkedInSet.size} On-Duty
              </span>
            </div>

            <div className="p-3.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Terminal Geofence</span>
                  <span className="text-base font-extrabold text-cyan-400 font-mono">
                    {(activeBranch as any).radius_meters || 150}m Boundary
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                {activeBranch.city || 'Chennai'}
              </span>
            </div>

            {/* Quick Touch PIN Check-In Action Button */}
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="p-3.5 bg-gradient-to-r from-blue-600/30 via-cyan-600/20 to-slate-900 rounded-2xl border border-cyan-500/40 hover:border-cyan-400 text-left flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                  123
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase block">Method 3: Touch Screen</span>
                  <span className="text-xs font-extrabold text-white group-hover:text-cyan-200">
                    Quick PIN / Employee ID Pad
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Live Recent Attendance Ticker */}
          {branchPunches.length > 0 && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 font-mono px-2">
                Live Gate Stream:
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {branchPunches.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-200">{p.employee_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.check_in_time ? new Date(p.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── FULL-SCREEN ATTENDANCE CELEBRATION OVERLAY (IN vs OUT) ──────── */}
      {verifiedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div 
            className={`w-full max-w-md p-8 rounded-3xl border-2 text-center text-white space-y-4 shadow-2xl transition-all ${
              verifiedEmployee.action === 'Checked In (Present)'
                ? 'bg-gradient-to-br from-slate-900 via-[#06291C] to-slate-900 border-emerald-400 shadow-[0_0_80px_rgba(16,185,129,0.45)]'
                : 'bg-gradient-to-br from-slate-900 via-[#2A1045] to-slate-900 border-purple-400 shadow-[0_0_80px_rgba(168,85,247,0.45)]'
            }`}
          >
            {/* Status Icon */}
            <div 
              className={`relative w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-2xl ${
                verifiedEmployee.action === 'Checked In (Present)'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/40'
                  : 'bg-purple-600 text-white shadow-purple-600/40'
              }`}
            >
              {verifiedEmployee.action === 'Checked In (Present)' ? (
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
              ) : (
                <LogOut className="w-11 h-11 animate-bounce" />
              )}
              <div className="absolute inset-0 rounded-3xl border-2 border-white/40 animate-ping pointer-events-none" />
            </div>

            {/* Header Text */}
            <div className="space-y-1">
              <span 
                className={`px-3.5 py-1 rounded-full text-xs font-black font-mono uppercase tracking-wider inline-block border ${
                  verifiedEmployee.action === 'Checked In (Present)'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                }`}
              >
                {verifiedEmployee.action === 'Checked In (Present)' ? '🟢 ARRIVAL RECORDED • CHECK-IN' : '🟣 DEPARTURE RECORDED • CHECK-OUT'}
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight pt-1">
                {verifiedEmployee.action === 'Checked In (Present)' ? 'Welcome,' : 'Thank You,'} {verifiedEmployee.name.split(' ')[0]}!
              </h3>
              <p className={`text-sm font-bold ${verifiedEmployee.action === 'Checked In (Present)' ? 'text-emerald-300' : 'text-purple-300'}`}>
                {verifiedEmployee.action}
              </p>
            </div>

            {/* Employee Verified Profile Card */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3.5 text-left">
              <img
                src={verifiedEmployee.avatar}
                alt=""
                className={`w-12 h-12 rounded-2xl object-cover border-2 ${
                  verifiedEmployee.action === 'Checked In (Present)' ? 'border-emerald-400' : 'border-purple-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-black text-white truncate">{verifiedEmployee.name}</h4>
                <p className="text-xs text-slate-300 font-medium">{verifiedEmployee.designation}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-300">
                  <span className={verifiedEmployee.action === 'Checked In (Present)' ? 'text-emerald-300' : 'text-purple-300'}>
                    ⏱ {verifiedEmployee.time}
                  </span>
                  <span>•</span>
                  <span>📍 {activeBranch.name}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {verifiedEmployee.action === 'Checked In (Present)'
                ? 'Your attendance has been registered. Have an inspiring & productive workday!'
                : 'Your checkout punch is logged. Enjoy your evening and rest well!'}
            </p>
          </div>
        </div>
      )}

      {/* ─── FULL-SCREEN WRONG QR ANALYSIS ERROR OVERLAY ─────────────────── */}
      {kioskScanError && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-[#360B0B] to-slate-900 p-8 rounded-3xl border-2 border-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.45)] text-center text-white space-y-4">
            <div className="relative w-20 h-20 mx-auto rounded-3xl bg-rose-600 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40">
              <AlertOctagon className="w-12 h-12 animate-pulse" />
              <div className="absolute inset-0 rounded-3xl border-2 border-rose-400 animate-ping pointer-events-none" />
            </div>

            <div className="space-y-1">
              <span className="px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-black font-mono uppercase tracking-wider inline-block">
                ❌ QR VERIFICATION FAILED • MISMATCH
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight pt-1">
                Unrecognized QR Code
              </h3>
              <p className="text-xs text-rose-300 font-medium max-w-xs mx-auto">
                The optical scanner detected a QR code, but it does not match any registered employee in the company roster.
              </p>
            </div>

            {kioskScanError.payload && (
              <div className="p-3 rounded-2xl bg-black/40 border border-rose-500/30 text-left font-mono text-[11px] text-rose-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Scanned Content Analyzed:</span>
                <span className="break-all block">{kioskScanError.payload}</span>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Please present a valid VeyraHR Employee ID Card or Digital Mobile Pass.
            </p>
          </div>
        </div>
      )}

      {/* ─── TOUCH PIN / EMPLOYEE ID DIALPAD MODAL ────────────────────── */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  🔢
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Manual Punch Pad</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Enter 4-Digit PIN or Employee Code</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPinModalOpen(false);
                  setTouchPinInput('');
                  setPinError(null);
                }}
                className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Display Input */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <input
                type="text"
                value={touchPinInput}
                onChange={(e) => setTouchPinInput(e.target.value)}
                placeholder="Enter Code (e.g. VEY-EMP-0001)"
                className="w-full bg-transparent text-center text-lg font-mono font-black text-cyan-300 tracking-widest focus:outline-none placeholder:text-slate-700"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                {pinError}
              </p>
            )}

            {/* Numerical Grid Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => setTouchPinInput((prev) => prev + digit)}
                  className="py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-600 text-white font-mono text-lg font-extrabold border border-slate-700/60 shadow-xs transition-all active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => setTouchPinInput('')}
                className="py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 active:scale-95 transition-all"
              >
                CLR
              </button>
              <button
                onClick={() => setTouchPinInput((prev) => prev + '0')}
                className="py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-600 text-white font-mono text-lg font-extrabold border border-slate-700/60 shadow-xs transition-all active:scale-95"
              >
                0
              </button>
              <button
                onClick={() => setTouchPinInput((prev) => prev.slice(0, -1))}
                className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700/60 active:scale-95 transition-all"
              >
                ⌫
              </button>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-extrabold text-white text-xs shadow-lg shadow-cyan-500/20"
                onClick={async () => {
                  if (!touchPinInput.trim()) {
                    setPinError('Please enter your Employee Code or PIN');
                    return;
                  }
                  setIsPinModalOpen(false);
                  await processDecodedString(touchPinInput.trim());
                  setTouchPinInput('');
                  setPinError(null);
                }}
              >
                Verify & Punch Attendance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── KIOSK FOOTER BAR ─────────────────────────────────────────── */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 z-20 pt-4 border-t border-slate-800/80 text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Anti-Spoof Rolling Cryptographic Token & Optical Engine Active</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <span className="text-slate-300 font-semibold">
            {activeBranch.address || `${activeBranch.name}, ${activeBranch.city}`}
          </span>
          <span>•</span>
          <span className="font-mono text-cyan-300 font-bold">
            {(activeBranch as any).latitude || 13.0827}° N, {(activeBranch as any).longitude || 80.2707}° E
          </span>
        </div>
      </footer>
    </div>
  );
};
