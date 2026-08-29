import React, { useState } from 'react';
import { Smile, Meh, Frown, HeartPulse, Sparkles, Check } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { MoodType } from '../../types/database';

interface MoodCheckinSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMood: (mood: MoodType, note?: string) => void;
  currentMood?: MoodType;
}

export const MoodCheckinSheet: React.FC<MoodCheckinSheetProps> = ({
  isOpen,
  onClose,
  onSelectMood,
  currentMood,
}) => {
  const [selected, setSelected] = useState<MoodType>(currentMood || 'Happy');
  const [note, setNote] = useState('');

  const moods: { type: MoodType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { type: 'Excellent', label: 'Excellent', icon: <Sparkles className="w-5 h-5 text-emerald-600" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { type: 'Happy', label: 'Happy', icon: <Smile className="w-5 h-5 text-blue-600" />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    { type: 'Okay', label: 'Okay', icon: <Meh className="w-5 h-5 text-amber-600" />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { type: 'Stressed', label: 'Stressed', icon: <Frown className="w-5 h-5 text-orange-600" />, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    { type: 'Unwell', label: 'Unwell', icon: <HeartPulse className="w-5 h-5 text-red-600" />, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  ];

  const handleSubmit = () => {
    onSelectMood(selected, note);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Daily Mood Check-in">
      <div className="space-y-4">
        <p className="text-xs text-veyra-text-sub text-center">
          How are you feeling today? Your response is private and only shared as anonymized team statistics with HR.
        </p>

        {/* 5 Mood Options */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {moods.map((m) => {
            const isSelected = selected === m.type;
            return (
              <button
                key={m.type}
                onClick={() => setSelected(m.type)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  isSelected ? `${m.bg} ring-2 ring-veyra-blue shadow-xs scale-105` : 'bg-white border-veyra-border hover:bg-veyra-bg-secondary'
                }`}
              >
                <div className="mb-1">{m.icon}</div>
                <span className={`text-[11px] font-bold ${isSelected ? m.color : 'text-veyra-text-sub'}`}>
                  {m.label}
                </span>
                {isSelected && <Check className="w-3 h-3 text-veyra-blue mt-1" />}
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-semibold text-veyra-text mb-1">
            Optional note for yourself
          </label>
          <input
            type="text"
            placeholder="e.g. Excited for team demo today..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-veyra-border bg-white px-3.5 py-2.5 text-xs text-veyra-text placeholder:text-veyra-text-muted focus:outline-none focus:ring-2 focus:ring-veyra-blue/20"
          />
        </div>

        <Button variant="primary" className="w-full mt-2 py-3" onClick={handleSubmit}>
          Save Mood Log
        </Button>
      </div>
    </BottomSheet>
  );
};
