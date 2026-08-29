import React from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Calendar, 
  Smile, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  MapPin,
  Flame,
  IdCard
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

export const HeroDashboardPreview: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none select-none">
      {/* Background Glow */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Realistic Interactive Desktop Mockup Shell */}
      <div className="bg-white rounded-3xl border border-veyra-border shadow-2xl overflow-hidden relative">
        {/* Top Window Header Bar */}
        <div className="h-10 bg-veyra-bg-secondary border-b border-veyra-border/80 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-veyra-border/60 text-[11px] font-mono text-veyra-text-sub">
            <ShieldCheck className="w-3 h-3 text-veyra-blue" />
            <span>app.veyrahr.com/live</span>
          </div>
          <div className="w-12" />
        </div>

        {/* Live Dashboard Mock Content */}
        <div className="p-4 sm:p-6 space-y-4 bg-[#FCFAF7]/50">
          {/* Top KPI Strip */}
          <div className="grid grid-cols-3 gap-3">
            <Card padded={false} className="p-3 bg-white border-veyra-border shadow-2xs">
              <span className="text-[10px] font-bold text-veyra-text-sub uppercase tracking-wider block">Present Today</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-veyra-text">142</span>
                <span className="text-[11px] font-bold text-emerald-600">94.6%</span>
              </div>
            </Card>

            <Card padded={false} className="p-3 bg-white border-veyra-border shadow-2xs">
              <span className="text-[10px] font-bold text-veyra-text-sub uppercase tracking-wider block">Late Arrivals</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-veyra-text">4</span>
                <span className="text-[11px] font-semibold text-amber-600">Grace OK</span>
              </div>
            </Card>

            <Card padded={false} className="p-3 bg-white border-veyra-border shadow-2xs">
              <span className="text-[10px] font-bold text-veyra-text-sub uppercase tracking-wider block">Team Sentiment</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-veyra-blue">96%</span>
                <span className="text-[11px] font-semibold text-emerald-600">High Morale</span>
              </div>
            </Card>
          </div>

          {/* Main Card: Live Attendance Check-ins */}
          <Card className="bg-white border-veyra-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 border-b border-veyra-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-veyra-blue" />
                <span className="text-xs font-bold text-veyra-text">Today's Check-ins & Verifications</span>
              </div>
              <Badge variant="blue" size="sm" icon={<QrCode className="w-3 h-3" />}>
                Dynamic QR + GPS Active
              </Badge>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-xl bg-veyra-bg-secondary text-xs">
                <div className="flex items-center gap-2.5">
                  <Avatar name="Sarah Jenkins" size="sm" status="online" />
                  <div>
                    <p className="font-bold text-veyra-text">Sarah Jenkins</p>
                    <p className="text-[10px] text-veyra-text-sub">EMP-2026-0001 • HR Director</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-700 font-bold text-xs block">08:55 AM</span>
                  <span className="text-[10px] text-veyra-text-sub">San Francisco HQ</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-veyra-bg-secondary text-xs">
                <div className="flex items-center gap-2.5">
                  <Avatar name="Alex Rivera" size="sm" status="online" />
                  <div>
                    <p className="font-bold text-veyra-text">Alex Rivera</p>
                    <p className="text-[10px] text-veyra-text-sub">EMP-2026-0002 • Engineering Lead</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-700 font-bold text-xs block">09:04 AM</span>
                  <span className="text-[10px] text-veyra-text-sub">London Regional Hub</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Floating Mobile Phone Preview Overlay Card */}
          <div className="p-3 bg-gradient-to-r from-[#163A63] to-[#2563EB] text-white rounded-2xl shadow-lg flex items-center justify-between border border-blue-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <p className="text-xs font-bold">7-Day Attendance Streak Unlocked</p>
                <p className="text-[11px] text-blue-200">Mobile PWA offline auto-sync enabled</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-veyra-navy rounded-xl text-xs font-extrabold shadow-2xs">
              PWA Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
