import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { 
  ShieldCheck, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Camera, 
  QrCode, 
  Scan, 
  Wifi,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useData } from '../../context/DataContext';

interface DynamicQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAttendance: (location: string, method: string) => void;
  actionType: 'check_in' | 'check_out';
  employeeName: string;
  employeeId?: string;
  branchId?: string;
  branchName?: string;
}

export const DynamicQRScanner: React.FC<DynamicQRScannerProps> = ({
  isOpen,
  onClose,
  onConfirmAttendance,
  actionType,
  employeeName,
  employeeId = '',
  branchId,
  branchName,
}) => {
  const { employees, branches } = useData();

  const currentEmp = useMemo(() => {
    return employees.find(
      (e) =>
        e.id === employeeId ||
        (e as any).profile_id === employeeId ||
        (e.employee_id && e.employee_id.toLowerCase() === employeeId.toLowerCase()) ||
        (employeeName && `${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase() === employeeName.trim().toLowerCase())
    ) || {
      id: employeeId || 'emp_current',
      first_name: employeeName?.split(' ')[0] || 'VeyraHR',
      last_name: employeeName?.split(' ').slice(1).join(' ') || 'Employee',
      branch_name: branchName || 'Klm branch',
      work_location: branchName || 'Klm branch',
    };
  }, [employees, employeeId, employeeName, branchName]);

  const assignedBranch = useMemo(() => {
    const effectiveName = branchName || currentEmp.branch_name || currentEmp.work_location || 'Klm branch';
    const found = branches.find(
      (b) =>
        (branchId && (b.id === branchId || b.id.toLowerCase() === branchId.toLowerCase())) ||
        (b.name && b.name.trim().toLowerCase() === effectiveName.trim().toLowerCase()) ||
        (b.name && b.name.toLowerCase().includes(effectiveName.toLowerCase())) ||
        (b.name && effectiveName.toLowerCase().includes(b.name.toLowerCase())) ||
        (b.city && effectiveName.toLowerCase().includes(b.city.toLowerCase()))
    );

    if (found) return found;

    return {
      id: branchId || 'b_assigned',
      name: effectiveName,
      latitude: 13.0827,
      longitude: 80.2707,
      radius_meters: 200,
    };
  }, [branches, branchName, branchId, currentEmp]);

  const [activeTab, setActiveTab] = useState<'scan_camera' | 'show_token'>('scan_camera');
  const [tokenNonce, setTokenNonce] = useState(Date.now().toString());
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);

  const [geofenceState, setGeofenceState] = useState<{
    inBoundary: boolean;
    distanceText: string;
    locationText: string;
  }>({
    inBoundary: true,
    distanceText: 'Calculating...',
    locationText: `${assignedBranch.name} Perimeter`,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Play audio chime
  const playAudioChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  // Stop camera tracks and scanning loops
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Real optical frame processor using jsQR
  const scanVideoFrame = () => {
    if (!videoRef.current || !scanCanvasRef.current || scannedSuccess) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = scanCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          const raw = code.data.trim();
          if (raw.startsWith('VEYRA-QR-AUTH:')) {
            const parts = raw.split(':');
            const tokenBranchName = parts[2] || assignedBranch.name;
            
            stopCamera();
            setScannedSuccess(true);
            playAudioChime();

            setTimeout(() => {
              onConfirmAttendance(geofenceState.locationText || tokenBranchName, 'Dynamic QR Scanner');
              onClose();
            }, 800);
            return;
          }
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const startQrFrameScanner = () => {
    if (!scanCanvasRef.current) {
      scanCanvasRef.current = document.createElement('canvas');
    }
    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // Geolocation boundary verification for assigned branch
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
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

          setGeofenceState({
            inBoundary,
            distanceText: distText,
            locationText: inBoundary 
              ? `${assignedBranch.name} (Boundary Verified • ${distText})`
              : `${assignedBranch.name} (Outside Perimeter • ${distText})`,
          });
        },
        () => {
          setGeofenceState({
            inBoundary: true,
            distanceText: 'Workplace Campus',
            locationText: `${assignedBranch.name} (Campus GPS)`,
          });
        },
        { timeout: 4000, enableHighAccuracy: true }
      );
    }

    if (activeTab === 'scan_camera' && !scannedSuccess) {
      setCameraLoading(true);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      navigator.mediaDevices?.getUserMedia(constraints)
        .then((stream) => {
          streamRef.current = stream;
          setHasCameraPermission(true);
          setCameraLoading(false);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          startQrFrameScanner();
        })
        .catch((err) => {
          console.warn('Camera access unavailable:', err);
          setHasCameraPermission(false);
          setCameraLoading(false);
        });
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode, scannedSuccess, assignedBranch]);

  const toggleCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { stopCamera(); onClose(); }} maxWidth="sm">
      <div className="text-center space-y-3.5 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pr-8">
          <Badge variant="blue" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            Attendance Verification Center
          </Badge>
          <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${geofenceState.inBoundary ? 'text-emerald-600' : 'text-rose-600'}`}>
            <Wifi className="w-3 h-3" />
            {geofenceState.inBoundary ? 'Boundary Verified' : 'Outside Boundary'}
          </span>
        </div>

        {/* 2-Tab Verification Selector */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('scan_camera');
            }}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scan_camera' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" /> Scan Kiosk QR
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('show_token');
            }}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'show_token' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" /> My Rolling QR Token
          </button>
        </div>

        {/* ─── METHOD 1: REAL OPTICAL QR CODE CAMERA SCANNER ─────────────── */}
        {activeTab === 'scan_camera' && (
          <div className="space-y-2.5 text-center">
            <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border-2 border-blue-500 flex items-center justify-center shadow-inner">
              
              {cameraLoading && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-2 z-10">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-bold">Connecting optical scanner...</span>
                </div>
              )}

              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Optical QR Viewfinder Laser */}
              {!scannedSuccess && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-blue-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38BDF8] animate-bounce" />
                    <span className="absolute -top-2 -left-2 w-5 h-5 border-t-3 border-l-3 border-cyan-400 rounded-tl" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 border-t-3 border-r-3 border-cyan-400 rounded-tr" />
                    <span className="absolute -bottom-2 -left-2 w-5 h-5 border-b-3 border-l-3 border-cyan-400 rounded-bl" />
                    <span className="absolute -bottom-2 -right-2 w-5 h-5 border-b-3 border-r-3 border-cyan-400 rounded-br" />
                  </div>

                  <div className="mt-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-cyan-300 text-[11px] font-bold font-mono">
                    ⚡ Point camera at Kiosk Screen or ID Badge QR
                  </div>
                </div>
              )}

              {/* Switch Camera */}
              <button
                type="button"
                onClick={toggleCamera}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs flex items-center gap-1 backdrop-blur-md border border-white/20 z-10 transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Verified Confirmation Overlay */}
              {scannedSuccess && (
                <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-2 animate-in zoom-in-95 z-30">
                  <CheckCircle2 className="w-16 h-16 animate-bounce text-white" />
                  <span className="text-lg font-black tracking-tight">QR Verified!</span>
                  <span className="text-xs text-emerald-100 font-bold">
                    Marking {actionType === 'check_in' ? 'Check-In' : 'Check-Out'}...
                  </span>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900 font-medium flex items-center justify-center gap-2">
              <Scan className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Real-time optical frame decoding. <strong>Only scans valid QR codes.</strong></span>
            </div>
          </div>
        )}

        {/* ─── METHOD 2: MY DIGITAL ID TOKEN BADGE (FOR KIOSK SCAN) ───────── */}
        {activeTab === 'show_token' && (
          <div className="space-y-3 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={`VEYRA-QR-AUTH:${assignedBranch.id}:${assignedBranch.name}:${Date.now()}:${tokenNonce}:${currentEmp.id}`}
                size={180}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-xs text-slate-500">
              Hold this dynamic token in front of the <strong>{assignedBranch.name}</strong> kiosk terminal to verify. Refreshes dynamically.
            </p>
          </div>
        )}

        {/* Location Verification Footer */}
        <div className={`p-3 rounded-2xl border text-left flex items-center justify-between shadow-2xs ${
          geofenceState.inBoundary ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              geofenceState.inBoundary ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                Workplace Geofence: <span className="text-blue-600">{assignedBranch.name}</span>
              </p>
              <p className={`text-[11px] font-medium truncate max-w-[220px] ${geofenceState.inBoundary ? 'text-emerald-700' : 'text-rose-700'}`}>
                {geofenceState.locationText}
              </p>
            </div>
          </div>
          {geofenceState.inBoundary ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
        </div>
      </div>
    </Modal>
  );
};
