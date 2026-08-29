'use client';

import React from 'react';
import { 
  getRankTierForLevel, 
  calculateXPForNextLevel 
} from '@/lib/gamification/xpEngine';
import { Sparkles, Zap, Flame } from 'lucide-react';

interface UserLevelBadgeProps {
  level?: number;
  xp?: number;
  compact?: boolean;
}

export function UserLevelBadge({ level = 1, xp = 0, compact = false }: UserLevelBadgeProps) {
  const tier = getRankTierForLevel(level);
  const { currentLevelXP, nextLevelXP } = calculateXPForNextLevel(level);

  const xpInCurrentLevel = Math.max(0, xp - currentLevelXP);
  const xpRequiredForLevel = Math.max(1, nextLevelXP - currentLevelXP);
  const progressPct = Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForLevel) * 100));

  if (compact) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold select-none"
        title={`${tier.name} &bull; Level ${level} (${xp} XP)`}
      >
        <span>{tier.badge}</span>
        <span className="text-zinc-200">Lvl {level}</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-md flex items-center gap-3 select-none">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700 flex items-center justify-center text-lg shadow-inner">
        {tier.badge}
      </div>

      <div className="flex-1 min-w-[120px]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1">
            <span>{tier.name}</span>
          </span>
          <span className="font-mono font-bold text-teal-400">Lvl {level}</span>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${tier.gradient} rounded-full transition-all duration-500`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-1">
          <span>{xp} XP</span>
          <span>{nextLevelXP} XP</span>
        </div>
      </div>
    </div>
  );
}
