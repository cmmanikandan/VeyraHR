import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Loader2, CheckCircle2, Sparkles, LayoutDashboard, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';

interface OnboardingLaunchSuccessProps {
  companyName: string;
  onGoToDashboard: () => void;
}

export const OnboardingLaunchSuccess: React.FC<OnboardingLaunchSuccessProps> = ({
  companyName,
  onGoToDashboard,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const messages = [
    'Creating organization...',
    'Setting up departments...',
    'Configuring attendance...',
    'Generating workspace...',
    'Creating admin account...',
    'Preparing dashboard...',
  ];

  useEffect(() => {
    if (currentStepIndex < messages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else if (!isCompleted) {
      const timer = setTimeout(() => {
        setIsCompleted(true);

        // Fire Canvas Confetti Celebration
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#163A63', '#16A34A', '#D97706', '#9333EA'],
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isCompleted]);

  return (
    <div className="py-10 px-4 text-center select-none space-y-6">
      {!isCompleted ? (
        <div className="space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-veyra-blue-soft text-veyra-blue flex items-center justify-center mx-auto shadow-md border border-veyra-blue-border/60">
            <Loader2 className="w-8 h-8 animate-spin text-veyra-blue" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-veyra-text tracking-tight">Provisioning Workspace</h3>
            <p className="text-xs text-veyra-text-sub mt-1">Configuring {companyName || 'VeyraHR Workspace'} enterprise rules</p>
          </div>

          {/* Sequential Animated Step Messages */}
          <div className="max-w-xs mx-auto space-y-2 text-left bg-veyra-bg-secondary p-4 rounded-2xl border border-veyra-border">
            {messages.map((msg, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={msg}
                  className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                    isDone ? 'text-emerald-700 font-medium' : isCurrent ? 'text-veyra-blue font-bold' : 'text-slate-300'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin text-veyra-blue shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>{msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg border border-emerald-300">
            <Sparkles className="w-10 h-10 text-emerald-600 fill-emerald-600" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">Provisioning Complete</span>
            <h2 className="text-2xl font-extrabold text-veyra-text tracking-tight mt-1">
              Welcome to VeyraHR
            </h2>
            <p className="text-xs text-veyra-text-sub max-w-md mx-auto mt-1 leading-relaxed">
              Your organization workspace for <strong>{companyName || 'VeyraHR Technologies'}</strong> has been created with default departments, role permissions, and attendance policies.
            </p>
          </div>

          <div className="p-4 bg-veyra-blue-soft/40 border border-veyra-blue-border/60 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-veyra-text-sub">Employee ID Prefix:</span>
              <span className="font-mono font-bold text-veyra-blue">VEY-EMP-0001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-veyra-text-sub">Default Departments:</span>
              <span className="font-semibold text-veyra-text">6 Created (HR, Eng, Sales...)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-veyra-text-sub">Security Policy:</span>
              <span className="font-semibold text-emerald-700">Dynamic QR + GPS Active</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xs mx-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md"
              onClick={onGoToDashboard}
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full font-semibold"
              onClick={onGoToDashboard}
              icon={<UserPlus className="w-4 h-4 text-veyra-blue" />}
            >
              Invite Employees
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
