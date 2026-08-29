import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  Clock, 
  Calendar, 
  Smile, 
  FileText, 
  CheckCircle2, 
  Globe, 
  ChevronDown, 
  Lock, 
  Users, 
  Building2,
  QrCode,
  Flame,
  IdCard,
  UserCheck,
  Shield
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { HeroDashboardPreview } from '../../components/landing/HeroDashboardPreview';
import { ProductShowcase } from '../../components/landing/ProductShowcase';
import { LoginModal } from '../../components/auth/LoginModal';
import { CompanyOnboardingWizard } from '../../components/auth/CompanyOnboardingWizard';
import { useAuth } from '../../context/AuthContext';
import { RoleType } from '../../types/database';
import { VeyraBrandHeader } from '../../components/common/VeyraBrandHeader';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, currentUser, currentRole, loading, setCurrentRole } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedLoginRole, setSelectedLoginRole] = useState<RoleType | undefined>(undefined);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (!loading && (currentUser || profile)) {
      const activeRole = profile?.role || (localStorage.getItem('veyra_current_role') as RoleType) || currentRole || 'employee';
      if (activeRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (activeRole === 'hr_manager') {
        navigate('/hr/dashboard', { replace: true });
      } else {
        navigate('/employee/home', { replace: true });
      }
    }
  }, [loading, currentUser, profile, currentRole, navigate]);

  const handleEnterApp = (targetRole?: RoleType) => {
    const roleToUse = targetRole || profile?.role || (localStorage.getItem('veyra_current_role') as RoleType) || currentRole || 'employee';
    if (roleToUse === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (roleToUse === 'hr_manager') {
      navigate('/hr/dashboard', { replace: true });
    } else {
      navigate('/employee/home', { replace: true });
    }
  };

  const openLoginForRole = (role?: RoleType) => {
    setSelectedLoginRole(role);
    setIsLoginOpen(true);
  };

  const faqs = [
    {
      q: 'How does VeyraHR prevent proxy attendance and screenshot sharing?',
      a: 'VeyraHR generates a dynamic 30-second sliding token QR code that continuously refreshes on the employee’s mobile PWA, coupled with optional GPS office radius check. Static screenshots become invalid instantly.'
    },
    {
      q: 'What happens if an employee checks in without an internet connection?',
      a: 'VeyraHR includes a PWA Service Worker and IndexedDB offline queue. Check-ins are timestamped and queued locally on the mobile device, then synced automatically as soon as internet connectivity restores.'
    },
    {
      q: 'Are daily mood check-in responses visible to managers?',
      a: 'No. Employee mood responses are strictly confidential. HR managers and admins see only aggregated, anonymized team sentiment percentages to protect individual employee privacy.'
    },
    {
      q: 'How does automatic Employee ID generation work?',
      a: 'When HR creates a new employee, VeyraHR uses an atomic database counter to generate a unique sequential ID (e.g. VEY-EMP-0001) and issues a digital ID card complete with verification QR code.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#172033] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* FLOATING WHITE NAVBAR */}
      <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-veyra-border shadow-sm px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Logo & Wordmark */}
          <VeyraBrandHeader size="md" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-veyra-text-sub">
            <a href="#platform" className="hover:text-veyra-blue transition-colors">Platform</a>
            <a href="#features" className="hover:text-veyra-blue transition-colors">Features</a>
            <a href="#workflow" className="hover:text-veyra-blue transition-colors">How It Works</a>
            <a href="#security" className="hover:text-veyra-blue transition-colors">Security</a>
            <a href="#faq" className="hover:text-veyra-blue transition-colors">FAQ</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {profile ? (
              <Button variant="primary" size="sm" onClick={() => handleEnterApp()} icon={<ArrowRight className="w-4 h-4" />}>
                Go to App Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openLoginForRole('employee')} className="text-xs font-bold">
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsOnboardingOpen(true)} className="text-xs font-bold shadow-sm">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <Badge variant="blue" icon={<Sparkles className="w-3.5 h-3.5" />}>
              SMART WORKFORCE PLATFORM
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-veyra-text tracking-tight leading-[1.1]">
              People. Presence. <span className="text-veyra-blue">Performance.</span>
            </h1>

            <p className="text-base sm:text-lg text-veyra-text-sub max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Manage attendance, leave, shifts, employee engagement, and workforce operations from one beautifully simple platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsOnboardingOpen(true)}
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto font-bold shadow-md"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setCurrentRole('hr_manager');
                  navigate('/hr/dashboard');
                }}
                className="w-full sm:w-auto font-semibold bg-white"
              >
                Explore Live Demo
              </Button>
            </div>

            {/* Below Trust Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-veyra-text-sub font-semibold">
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-veyra-blue" /> Mobile-first PWA
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Enterprise Secure
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" /> Built for modern teams
              </span>
            </div>
          </div>

          {/* Right Hero Column: Dashboard Preview */}
          <div className="lg:col-span-6">
            <HeroDashboardPreview />
          </div>
        </div>
      </section>

      {/* PRODUCT SHOWCASE WITH ROLE TABS */}
      <ProductShowcase />

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="blue" className="mb-3">
            Core Capabilities
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-veyra-text tracking-tight">
            Designed for clarity & operational efficiency.
          </h2>
          <p className="text-sm text-veyra-text-sub mt-2 leading-relaxed">
            Eliminate proxy attendance, manual spreadsheets, and approval delays with automated workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-veyra-border hover:border-veyra-blue-border transition-all">
            <div className="w-10 h-10 rounded-2xl bg-veyra-blue-soft text-veyra-blue flex items-center justify-center mb-4 border border-veyra-blue-border/40">
              <QrCode className="w-5 h-5 text-veyra-blue" />
            </div>
            <h3 className="text-base font-bold text-veyra-text mb-1">Smart Attendance Verification</h3>
            <p className="text-xs text-veyra-text-sub leading-relaxed">
              Dynamic 30s QR refresh tokens combined with optional GPS geofencing and offline queueing guarantee accurate verification.
            </p>
          </Card>

          <Card className="bg-white border-veyra-border hover:border-veyra-blue-border transition-all">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-200">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-base font-bold text-veyra-text mb-1">Leave & Shift Workflow</h3>
            <p className="text-xs text-veyra-text-sub leading-relaxed">
              Seamless employee leave applications, peer shift swap requests, visual calendars, and manager approval queues.
            </p>
          </Card>

          <Card className="bg-white border-veyra-border hover:border-veyra-blue-border transition-all">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4 border border-cyan-200">
              <IdCard className="w-5 h-5 text-cyan-600" />
            </div>
            <h3 className="text-base font-bold text-veyra-text mb-1">Digital Employee ID Cards</h3>
            <p className="text-xs text-veyra-text-sub leading-relaxed">
              Automatically generates sequential Employee IDs (`VEY-EMP-XXXX`) and printable digital ID credentials with QR verification.
            </p>
          </Card>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 bg-white border-t border-veyra-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="blue" className="mb-2">FAQ</Badge>
            <h2 className="text-2xl font-extrabold text-veyra-text">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Card
                key={i}
                padded={false}
                className="p-4 bg-veyra-bg-secondary/60 border-veyra-border cursor-pointer hover:bg-white transition-colors"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              >
                <div className="flex items-center justify-between font-bold text-xs text-veyra-text">
                  <span>{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-veyra-blue transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
                </div>
                {faqOpen === i && (
                  <p className="text-xs text-veyra-text-sub mt-2.5 pt-2 border-t border-veyra-border/60 leading-relaxed">
                    {f.a}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 px-4 bg-[#163A63] text-white text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to transform your workforce operations?</h2>
          <p className="text-xs sm:text-sm text-blue-200 max-w-xl mx-auto">
            Experience the simplicity of VeyraHR on mobile, desktop, and tablet. Setup your company workspace in under 2 minutes.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => setIsOnboardingOpen(true)} className="font-bold">
              Start Company Setup
            </Button>
          </div>
        </div>
      </section>

      {/* DETAILED SLEEK DARK FOOTER WITH ENTERPRISE MODULES */}
      <footer className="bg-[#0A0F1D] text-slate-400 border-t border-slate-800/80 pt-16 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-left">
          
          {/* Col 1: Brand & Headquarters */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img
                src="/logo.png"
                alt="VeyraHR Logo"
                className="h-9 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col text-left justify-center">
                <h2 className="text-xl font-black tracking-tight text-white leading-none">
                  Veyra<span className="text-blue-500">HR</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider block mt-1 uppercase font-mono">
                  Enterprise Workforce OS
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Next-generation workforce platform with dynamic QR anti-proxy verification, branch kiosks, shift roster manager, and employee self-service.
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-blue-400 font-bold bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-800/50">
                <span>📍</span> Tamil Nadu, India 🇮🇳
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/50">
                <span>🔒</span> 256-Bit SSL Encrypted
              </span>
            </div>
          </div>

          {/* Col 2: Admin Portal Access */}
          <div className="space-y-3">
            <h5 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Shield className="w-4 h-4 text-blue-400" /> Executive Admin
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('admin')}
                  className="font-bold text-blue-400 hover:text-blue-300 hover:underline text-left flex items-center gap-1"
                >
                  <span>Admin Portal Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(true)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Create Company Workspace
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('admin')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Branch Kiosk Management
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('admin')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Security & Audit Trail
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: HR Operations Console */}
          <div className="space-y-3">
            <h5 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4 text-emerald-400" /> HR Operations
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('hr_manager')}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline text-left flex items-center gap-1"
                >
                  <span>HR Manager Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('hr_manager')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Live Attendance Stream
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('hr_manager')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Departments & Role Matrix
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('hr_manager')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Leave Approval Workflow
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Employee Self-Service */}
          <div className="space-y-3">
            <h5 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Smartphone className="w-4 h-4 text-purple-400" /> Employee ESS PWA
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('employee')}
                  className="font-bold text-purple-400 hover:text-purple-300 hover:underline text-left flex items-center gap-1"
                >
                  <span>Employee Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('employee')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Camera QR Check-In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('employee')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Digital ID Pass & Document Vault
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openLoginForRole('employee')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Monthly Payslips & Helpdesk
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Attribution Bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            © 2026 VeyraHR Technologies Pvt Ltd. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-slate-400 font-medium flex-wrap">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Security Governance</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-slate-700">•</span>
            <span className="text-blue-400 font-mono font-bold">ISO/IEC 27001 Certified</span>
          </div>
        </div>
      </footer>

      {/* AUTH MODALS */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleEnterApp}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        initialRole={selectedLoginRole}
      />

      <CompanyOnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={handleEnterApp}
      />
    </div>
  );
};
