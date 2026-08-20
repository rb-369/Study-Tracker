"use client";

import React from "react";
import { Zap, Clock, Brain, Flame, Target, Trophy } from "lucide-react";
import { AnalyticsSummary } from "@/types";
import { formatMinutesToDisplay } from "@/lib/utils";

interface FocusMetricsGridProps {
  summary: AnalyticsSummary;
}

export function FocusMetricsGrid({ summary }: FocusMetricsGridProps) {
  const {
    totalGrossMinutes,
    totalNetMinutes,
    overallFocusRatio,
    completedSessionsCount,
    totalThoughtsLogged,
    longestDeepWorkStreakMinutes,
    currentStreakDays,
  } = summary;

  const totalGrossHours = (totalGrossMinutes / 60).toFixed(1);
  const totalNetHours = (totalNetMinutes / 60).toFixed(1);
  const totalDistractionMins = Math.max(0, totalGrossMinutes - totalNetMinutes);

  const metrics = [
    {
      title: "Net Pure Focus",
      value: `${totalNetHours}h`,
      subtext: `${(overallFocusRatio * 100).toFixed(0)}% of ${totalGrossHours}h gross clock`,
      icon: Zap,
      accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Focus Efficiency Ratio",
      value: `${(overallFocusRatio * 100).toFixed(0)}%`,
      subtext: "Deep work vs distraction ratio",
      icon: Target,
      accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Mind Pings Logged",
      value: `${totalThoughtsLogged}`,
      subtext: `${totalDistractionMins}m stray thoughts isolated`,
      icon: Brain,
      accentClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Longest Deep Streak",
      value: `${formatMinutesToDisplay(longestDeepWorkStreakMinutes)}`,
      subtext: "Max continuous focus span",
      icon: Trophy,
      accentClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Completed Blocks",
      value: `${completedSessionsCount}`,
      subtext: `Avg ${summary.avgSessionMinutes}m per session`,
      icon: Clock,
      accentClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Daily Habit Streak",
      value: `${currentStreakDays} Days`,
      subtext: "Active consistency score",
      icon: Flame,
      accentClass: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl bg-[#121215] border border-zinc-800 transition-all hover:border-zinc-700"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-zinc-400 truncate">
                {m.title}
              </span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${m.accentClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 tabular-nums">
              {m.value}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">
              {m.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
