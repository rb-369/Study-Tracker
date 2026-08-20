"use client";

import React from "react";
import { Zap, Clock, Brain, Flame, Sparkles, Target, Trophy } from "lucide-react";
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
      value: `${totalNetHours} hrs`,
      subtext: `${(overallFocusRatio * 100).toFixed(0)}% of ${totalGrossHours} gross clock hrs`,
      icon: Zap,
      accentClass: "text-focus bg-focus/15 border-focus/30",
      glowClass: "hover:border-focus/50 hover:shadow-focus/15",
    },
    {
      title: "Overall Focus Ratio",
      value: `${(overallFocusRatio * 100).toFixed(0)}%`,
      subtext: "Effective deep work efficiency",
      icon: Target,
      accentClass: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      glowClass: "hover:border-emerald-500/50",
    },
    {
      title: "Mind Pings Logged",
      value: `${totalThoughtsLogged}`,
      subtext: `${totalDistractionMins}m context switches isolated`,
      icon: Brain,
      accentClass: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      glowClass: "hover:border-amber-500/50 hover:shadow-amber-500/15",
    },
    {
      title: "Longest Deep Streak",
      value: `${formatMinutesToDisplay(longestDeepWorkStreakMinutes)}`,
      subtext: "Max uninterrupted focus span",
      icon: Trophy,
      accentClass: "text-deepwork-light bg-deepwork/15 border-deepwork/30",
      glowClass: "hover:border-deepwork/50",
    },
    {
      title: "Completed Blocks",
      value: `${completedSessionsCount}`,
      subtext: `Avg ${summary.avgSessionMinutes}m per session`,
      icon: Clock,
      accentClass: "text-sky-400 bg-sky-500/15 border-sky-500/30",
      glowClass: "hover:border-sky-500/50",
    },
    {
      title: "Consistency Streak",
      value: `${currentStreakDays} Days`,
      subtext: "Active daily study habit",
      icon: Flame,
      accentClass: "text-orange-400 bg-orange-500/15 border-orange-500/30",
      glowClass: "hover:border-orange-500/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl glass-card transition-all duration-200 ${m.glowClass}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 truncate">
                {m.title}
              </span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${m.accentClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {m.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {m.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
