import React, { useState } from 'react';
import { Smartphone, Monitor, ShieldCheck, CheckCircle2, QrCode, Calendar, Users, Building2, Flame } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employee' | 'hr' | 'admin'>('employee');

  return (
    <section id="platform" className="py-16 sm:py-24 bg-white border-y border-veyra-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="blue" className="mb-3">
            Tailored Experiences
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-veyra-text tracking-tight">
            One platform for your entire workforce.
          </h2>
          <p className="text-sm text-veyra-text-sub mt-2 leading-relaxed">
            Engineered specifically for each role: mobile-first check-ins for team members, powerful command dashboards for HR managers, and enterprise governance for admins.
          </p>

          {/* Interactive Role Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 mt-8 p-1.5 bg-veyra-bg-secondary rounded-2xl border border-veyra-border/80 inline-flex">
            <button
              onClick={() => setActiveTab('employee')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'employee'
                  ? 'bg-veyra-blue text-white shadow-sm'
                  : 'text-veyra-text-sub hover:text-veyra-text'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Employee App (Mobile PWA)
            </button>
            <button
              onClick={() => setActiveTab('hr')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'hr'
                  ? 'bg-veyra-blue text-white shadow-sm'
                  : 'text-veyra-text-sub hover:text-veyra-text'
              }`}
            >
              <Monitor className="w-4 h-4" /> HR Workspace (Desktop)
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-veyra-blue text-white shadow-sm'
                  : 'text-veyra-text-sub hover:text-veyra-text'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin Console
            </button>
          </div>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="bg-[#FCFAF7] p-6 sm:p-10 rounded-3xl border border-veyra-border shadow-xl">
          {activeTab === 'employee' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="blue" size="sm" className="mb-3">
                  Mobile-First PWA Experience
                </Badge>
                <h3 className="text-xl sm:text-2xl font-bold text-veyra-text tracking-tight mb-3">
                  Native Mobile Simplicity on Every Device
                </h3>
                <p className="text-xs sm:text-sm text-veyra-text-sub leading-relaxed mb-6">
                  Employees enjoy a 64px fixed bottom navigation bar, 1-tap Dynamic QR code attendance, GPS office verification, offline check-in queueing, daily mood check-ins, and instant digital employee ID card downloads.
                </p>
                <ul className="space-y-2.5 text-xs text-veyra-text font-medium mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dynamic 30-Second Refresh Token QR Security
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Offline Attendance Local Queue with Automatic Resync
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Digital Employee ID Cards with Printable Export
                  </li>
                </ul>
              </div>

              {/* Mobile Phone Screen Frame Mockup */}
              <div className="w-full max-w-xs mx-auto bg-white rounded-[36px] p-4 border-4 border-slate-900 shadow-2xl space-y-3">
                <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto mb-2" />
                <div className="p-3 bg-veyra-blue-soft rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-veyra-blue block">Today's Attendance</span>
                  <span className="text-[11px] text-veyra-text-sub">Shift: 09:00 AM – 06:00 PM</span>
                </div>
                <div className="p-3 bg-veyra-bg-secondary rounded-xl text-center">
                  <QrCode className="w-16 h-16 text-veyra-blue mx-auto mb-1" />
                  <span className="text-[10px] font-mono text-veyra-text-sub">Tap to verify geofence</span>
                </div>
                <Button variant="primary" className="w-full text-xs py-2.5">
                  Check In Now
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'hr' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="navy" size="sm" className="mb-3">
                  HR Management Workspace
                </Badge>
                <h3 className="text-xl sm:text-2xl font-bold text-veyra-text tracking-tight mb-3">
                  Real-time Workforce Command Center
                </h3>
                <p className="text-xs sm:text-sm text-veyra-text-sub leading-relaxed mb-6">
                  HR managers gain a live attendance monitor, 5-step employee creation wizard with auto-generated Employee IDs, leave approval workflow with visual calendars, shift schedule planning, anonymized team mood analytics, and PDF/CSV report exports.
                </p>
                <ul className="space-y-2.5 text-xs text-veyra-text font-medium mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-veyra-blue" /> Live Attendance Stream via Supabase Realtime
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-veyra-blue" /> Sequential Employee ID Generator (`EMP-2026-XXXX`)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-veyra-blue" /> One-Click Export to CSV and Printable PDF
                  </li>
                </ul>
              </div>

              {/* Desktop Dashboard Preview Mock */}
              <div className="bg-white p-5 rounded-2xl border border-veyra-border shadow-lg space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-veyra-border">
                  <span className="text-xs font-bold text-veyra-text">Live Workforce Attendance</span>
                  <Badge variant="green" size="sm">94.6% Turnout</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-veyra-bg-secondary rounded-xl flex justify-between">
                    <span>Sarah Jenkins (HR)</span>
                    <span className="font-bold text-emerald-700">08:55 AM (Verified)</span>
                  </div>
                  <div className="p-2.5 bg-veyra-bg-secondary rounded-xl flex justify-between">
                    <span>Alex Rivera (Engineering)</span>
                    <span className="font-bold text-emerald-700">09:02 AM (Verified)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="purple" size="sm" className="mb-3">
                  Admin Governance
                </Badge>
                <h3 className="text-xl sm:text-2xl font-bold text-veyra-text tracking-tight mb-3">
                  Enterprise Security & Organization Management
                </h3>
                <p className="text-xs sm:text-sm text-veyra-text-sub leading-relaxed mb-6">
                  Complete company setup, department hierarchy, multi-branch geofencing rules, role-based access control (RBAC), and security audit log tracking.
                </p>
                <ul className="space-y-2.5 text-xs text-veyra-text font-medium mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" /> Multi-Branch Regional Office Setup
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" /> Security Audit Log & Login Activity Tracking
                  </li>
                </ul>
              </div>

              {/* Admin Console Mock */}
              <div className="bg-white p-5 rounded-2xl border border-veyra-border shadow-lg space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-veyra-border">
                  <span className="text-xs font-bold text-veyra-text">Organization Governance</span>
                  <Badge variant="navy" size="sm">Audit Active</Badge>
                </div>
                <div className="p-3 bg-veyra-navy text-white rounded-xl text-xs space-y-1">
                  <p className="font-bold">Multi-Tenant Supabase RLS Policy</p>
                  <p className="text-[11px] text-blue-200">Enforces data isolation for all company records.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
