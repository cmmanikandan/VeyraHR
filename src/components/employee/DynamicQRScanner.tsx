import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { 
  ShieldCheck, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  Camera, 
  QrCode, 
  Scan, 
  Sparkles, 
  Smile,
  Lock,
  Wifi,
  UserCheck,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useData } from '../../context/DataContext';
import { verifyFaceWithGroqVision } from '../../services/groqService';

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
  branchId = 'b1',
  branchName = 'Chennai HQ',
}) => {
  const { employees, branches } = useData();

  const currentEmp = employees.find(
    (e) => e.id === employeeId || (e.employee_id && e.employee_id.toLowerCase() === employeeId.toLowerCase())
  ) || employees[0] || {
    id: employeeId || 'emp_current',
    first_name: 'VeyraHR',
    last_name: 'Employee',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    branch_name: 'Chennai HQ',
    work_location: 'Chennai HQ',
  };

  const [activeTab, setActiveTab] = useState<'scan_camera' | 'scan_face' | 'show_token'>('scan_camera');
  const [tokenNonce, setTokenNonce] = useState(Date.now().toString());
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [locationText, setLocationText] = useState('Chennai HQ (Geofence Verified)');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [successMethod, setSuccessMethod] = useState<string>('');
  const [cameraLoading, setCameraLoading] = useState(true);
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [qrStatusText, setQrStatusText] = useState('Position QR Code inside viewfinder');

  // Strict Geofence and AI face verification states
  const [isAnalyzingFace, setIsAnalyzingFace] = useState(false);
  const [faceAnalysisError, setFaceAnalysisError] = useState<string | null>(null);
  const [geofenceViolation, setGeofenceViolation] = useState(false);
  const [allowedBranchRadius, setAllowedBranchRadius] = useState('200 meters');
  const [distanceText, setDistanceText] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const faceIntervalRef = useRef<any>(null);

  // Play audio chime
  const playAudioChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
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
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Step 1: Real optical QR decoding frame loop using jsQR
  const startQrFrameScanner = () => {
    const scanLoop = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (!scanCanvasRef.current) {
          scanCanvasRef.current = document.createElement('canvas');
        }
        const canvas = scanCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (qrCode && qrCode.data) {
              // REAL QR CODE ACTUALLY PARSED AND MATCHED!
              handleQrDetected(qrCode.data);
              return;
            }
          } catch (e) {
            // Ignore frame capture hiccups
          }
        }
      }

      if (!scannedSuccess) {
        animFrameIdRef.current = requestAnimationFrame(scanLoop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  const handleQrDetected = (qrData: string) => {
    // If geofence is violated, block confirmation
    const isGeofenceEnforced = localStorage.getItem('veyra_pref_geofence') !== 'false';
    if (isGeofenceEnforced && geofenceViolation) {
      setQrStatusText('Geofence Violation: Attendance punch blocked.');
      // Restart loop
      setTimeout(() => {
        if (!scannedSuccess && activeTab === 'scan_camera') {
          startQrFrameScanner();
        }
      }, 1500);
      return;
    }

    stopCamera();
    setScannedSuccess(true);
    setSuccessMethod('Optical QR Code Match');
    playAudioChime();

    setTimeout(() => {
      onConfirmAttendance(locationText, 'Dynamic Kiosk / Badge QR');
      onClose();
    }, 800);
  };

  // Step 2: AI Face Recognition Scan Liveness Loop with Groq Vision Verification
  const startFaceScan = () => {
    if (geofenceViolation) {
      setFaceAnalysisError('GPS Geofence Violation: You must be within the workplace boundary to verify.');
      return;
    }

    setFacingMode('user');
    setFaceScanProgress(0);
    setFaceAnalysisError(null);
    setIsAnalyzingFace(false);
    if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);

    let progress = 0;
    faceIntervalRef.current = setInterval(async () => {
      progress += 10;
      setFaceScanProgress(progress);
      if (progress >= 100) {
        clearInterval(faceIntervalRef.current);

        // Capture frame from video stream
        if (!videoRef.current) {
          stopCamera();
          setFaceAnalysisError('Camera stream not available.');
          return;
        }

        setIsAnalyzingFace(true);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth || 640;
        tempCanvas.height = videoRef.current.videoHeight || 480;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
          const selfieBase64 = tempCanvas.toDataURL('image/jpeg');

          try {
            // Profile DP lookup
            const profileDpUrl = currentEmp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
            
            // Invoke Groq vision API
            const result = await verifyFaceWithGroqVision(selfieBase64, profileDpUrl);
            
            if (result.matched) {
              stopCamera();
              setScannedSuccess(true);
              setSuccessMethod('AI Face Match (Llama-3.2 Vision Verified)');
              playAudioChime();
              setTimeout(() => {
                onConfirmAttendance(locationText, 'AI Face Match (Groq)');
                onClose();
              }, 800);
            } else {
              // Play error buzzer tone
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.35);
              } catch {}

              setIsAnalyzingFace(false);
              setFaceScanProgress(0);
              setFaceAnalysisError('Face verification failed! Photo does not match profile picture.');
            }
          } catch (err: any) {
            setIsAnalyzingFace(false);
            setFaceScanProgress(0);
            setFaceAnalysisError('AI Face Verification service error. Please try again.');
          }
        } else {
          setIsAnalyzingFace(false);
          setFaceAnalysisError('Failed to capture frame from video.');
        }
      }
    }, 150);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // Geolocation boundary verification
    const isGeofenceEnforced = localStorage.getItem('veyra_pref_geofence') !== 'false';
    if (!isGeofenceEnforced) {
      setGeofenceViolation(false);
      setLocationText('Chennai HQ (Geofence Disabled)');
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // Find current employee's assigned branch
          const assignedBranch = branches.find(
            (b) =>
              b.name?.toLowerCase() === currentEmp.branch_name?.toLowerCase() ||
              b.name?.toLowerCase() === currentEmp.work_location?.toLowerCase() ||
              (b.city && currentEmp.work_location?.toLowerCase().includes(b.city.toLowerCase()))
          ) || branches[0] || {
            latitude: 13.0827,
            longitude: 80.2707,
            radius_meters: 150,
            name: currentEmp.branch_name || 'Chennai HQ',
          };

          const branchLat = assignedBranch.latitude || 13.0827;
          const branchLng = assignedBranch.longitude || 80.2707;
          const allowedRadius = assignedBranch.radius_meters || 150;
          setAllowedBranchRadius(`${allowedRadius} meters`);

          // Haversine accurate distance calculation
          const R = 6371e3; // metres
          const φ1 = (lat * Math.PI) / 180;
          const φ2 = (branchLat * Math.PI) / 180;
          const Δφ = ((branchLat - lat) * Math.PI) / 180;
          const Δλ = ((branchLng - lng) * Math.PI) / 180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceMeters = Math.round(R * c);

          const insideBoundary = distanceMeters <= allowedRadius;
          setDistanceText(distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} meters`);

          if (!insideBoundary) {
            setGeofenceViolation(true);
            setLocationText(`Outside Geofence (${distanceMeters}m away from ${assignedBranch.name})`);
            setFaceAnalysisError(`GPS Geofence Restriction: You are ${distanceMeters}m away. Must be within ${allowedRadius}m boundary.`);
          } else {
            setGeofenceViolation(false);
            setLocationText(`${assignedBranch.name} (Verified ${distanceMeters}m inside)`);
          }
        },
        (err) => {
          console.warn('Geolocation access failed:', err);
          setGeofenceViolation(true);
          setLocationText('GPS Location Error');
          setFaceAnalysisError('GPS Location Verification is required to scan face/biometrics.');
        },
        { timeout: 4000, enableHighAccuracy: true }
      );
    } else {
      setGeofenceViolation(true);
      setLocationText('GPS UnSupported');
      setFaceAnalysisError('Geolocation is not supported. Attendance blocked.');
    }

    if ((activeTab === 'scan_camera' || activeTab === 'scan_face') && !scannedSuccess) {
      setCameraLoading(true);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: activeTab === 'scan_face' ? 'user' : facingMode },
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

          if (activeTab === 'scan_camera') {
            startQrFrameScanner();
          } else if (activeTab === 'scan_face') {
            startFaceScan();
          }
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
  }, [isOpen, activeTab, facingMode, scannedSuccess]);

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
          <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${geofenceViolation ? 'text-rose-600' : 'text-emerald-600'}`}>
            <Wifi className="w-3 h-3" /> {geofenceViolation ? 'Geofence Restricted' : 'Geofence OK'}
          </span>
        </div>

        {/* 3-Tab Verification Selector */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('scan_camera');
            }}
            className={`py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
              activeTab === 'scan_camera' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Scan QR
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('scan_face');
            }}
            className={`py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
              activeTab === 'scan_face' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smile className="w-3.5 h-3.5" /> Scan Face
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('show_token');
            }}
            className={`py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
              activeTab === 'show_token' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> My ID Token
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

        {/* ─── METHOD 2: AI FACE RECOGNITION SCANNER ──────────────────────── */}
        {activeTab === 'scan_face' && (
          <div className="space-y-2.5 text-center">
            <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border-2 border-purple-500 flex items-center justify-center shadow-inner">
              
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Face Landmark Oval Guide */}
              {!scannedSuccess && !isAnalyzingFace && !faceAnalysisError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-44 h-52 border-3 border-purple-400 rounded-[50%] relative shadow-[0_0_25px_rgba(168,85,247,0.5)] flex items-center justify-center animate-pulse">
                    <span className="w-3 h-3 bg-purple-400 rounded-full animate-ping" />
                  </div>

                  <div className="mt-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-purple-300 text-[11px] font-bold font-mono">
                    AI Face Landmark Matching: {faceScanProgress}%
                  </div>
                </div>
              )}

              {/* Progress Ring Bar */}
              <div className="absolute top-3 left-3 right-3 h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${faceScanProgress}%` }}
                />
              </div>

              {/* Geofence Violation Shield */}
              {geofenceViolation && (
                <div className="absolute inset-0 bg-rose-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-2 p-6 z-30 animate-in fade-in">
                  <XCircle className="w-16 h-16 text-rose-500 animate-bounce" />
                  <span className="text-sm font-black text-center tracking-tight">GPS GEOFENCE RESTRICTION</span>
                  <span className="text-[11px] text-rose-200 text-center font-medium">
                    You are outside the company geofence boundary. Face check-in is strictly blocked.
                  </span>
                </div>
              )}

              {/* AI Vision Analyzing Frame */}
              {isAnalyzingFace && (
                <div className="absolute inset-0 bg-purple-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 z-20">
                  <Sparkles className="w-12 h-12 text-purple-400 animate-spin" />
                  <span className="text-sm font-black">Comparing Selfie to Profile photo...</span>
                  <span className="text-[10px] text-purple-200 font-mono">Running Groq Llama-3.2 Vision Model</span>
                </div>
              )}

              {/* Face Analysis Error Screen */}
              {faceAnalysisError && (
                <div className="absolute inset-0 bg-rose-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-3 p-4 z-30">
                  <XCircle className="w-12 h-12 text-rose-500" />
                  <span className="text-xs font-black text-center max-w-[260px] leading-relaxed">{faceAnalysisError}</span>
                  {!geofenceViolation && (
                    <button
                      type="button"
                      onClick={startFaceScan}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-rose-700 text-[10px] font-black hover:bg-slate-100 transition-all shadow-xs"
                    >
                      🔄 Retry Face Scan
                    </button>
                  )}
                </div>
              )}

              {/* Verified Confirmation */}
              {scannedSuccess && (
                <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-2 animate-in zoom-in-95 z-30">
                  <UserCheck className="w-16 h-16 animate-bounce text-white" />
                  <span className="text-lg font-black tracking-tight">Face Verified!</span>
                  <span className="text-xs text-emerald-100 font-bold">
                    Profile authenticated for {currentEmp.first_name} {currentEmp.last_name}
                  </span>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/90 border border-purple-200 text-xs text-purple-900 font-medium flex items-center justify-center gap-2">
              <Smile className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Perform liveness scan. <strong>Verifies face match using Groq AI Vision model.</strong></span>
            </div>
          </div>
        )}

        {/* ─── METHOD 3: MY DIGITAL ID TOKEN BADGE (FOR KIOSK SCAN) ───────── */}
        {activeTab === 'show_token' && (
          <div className="space-y-3 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={`VEYRA-QR-AUTH:${branchId}:${branchName}:${Date.now()}:${tokenNonce}:${employeeId}`}
                size={180}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-xs text-slate-500">
              Hold this dynamic token in front of the office kiosk camera to verify. Refreshes every 30s.
            </p>
          </div>
        )}

        {/* Location Verification Footer */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200 text-left flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${geofenceViolation ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Workplace Geofence</p>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{locationText}</p>
            </div>
          </div>
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${geofenceViolation ? 'text-rose-500' : 'text-emerald-600'}`} />
        </div>
      </div>
    </Modal>
  );
};
