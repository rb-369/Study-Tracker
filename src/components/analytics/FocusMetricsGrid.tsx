"use client";

import React from "react";
import { Zap, Clock, Brain, Flame, Target, Trophy, TrendingUp, TrendingDown, Sparkles, Activity } from "lucide-react";
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
    pingsPerHour,
    avgFocusScore,
    comparison,
  } = summary;

  const totalGrossHours = (totalGrossMinutes / 60).toFixed(1);
  const totalNetHours = (totalNetMinutes / 60).toFixed(1);
  const totalDistractionMins = Math.max(0, totalGrossMinutes - totalNetMinutes);

  const metrics = [
    {
      title: "Net Focused Time",
      value: `${totalNetHours}h`,
      subtext: `${(overallFocusRatio * 100).toFixed(0)}% of ${totalGrossHours}h gross clock`,
      icon: Zap,
      accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badge: comparison
        ? {
            text: `${comparison.netMinutesGrowthPct >= 0 ? "+" : ""}${comparison.netMinutesGrowthPct}%`,
            isPositive: comparison.netMinutesGrowthPct >= 0,
          }
        : null,
    },
    {
      title: "Average Focus Score",
      value: `${avgFocusScore}/100`,
      subtext: "Cognitive quality index",
      icon: Sparkles,
      accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badge: comparison
        ? {
            text: `${comparison.focusRatioDeltaPct >= 0 ? "+" : ""}${comparison.focusRatioDeltaPct}%`,
            isPositive: comparison.focusRatioDeltaPct >= 0,
          }
        : null,
    },
    {
      title: "Distraction Velocity",
      value: `${pingsPerHour} /hr`,
      subtext: `${totalThoughtsLogged} pings (${totalDistractionMins}m lost)`,
      icon: Brain,
      accentClass: pingsPerHour > 2 ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20",
      badge: null,
    },
    {
      title: "Max Deep Work Span",
      value: `${formatMinutesToDisplay(longestDeepWorkStreakMinutes)}`,
      subtext: "Longest uninterrupted flow block",
      icon: Trophy,
      accentClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      badge: null,
    },
    {
      title: "Completed Blocks",
      value: `${completedSessionsCount}`,
      subtext: `Avg ${summary.avgSessionMinutes}m per session`,
      icon: Clock,
      accentClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      badge: null,
    },
    {
      title: "Daily Flow Streak",
      value: `${currentStreakDays} Days`,
      subtext: currentStreakDays >= 3 ? "🔥 Momentum compounding" : "Build active streak",
      icon: Flame,
      accentClass: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      badge: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl bg-[#121215] border border-zinc-800 transition-all hover:border-zinc-700 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-zinc-400 truncate">
                {m.title}
              </span>
              <div className="flex items-center gap-1.5">
                {m.badge && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      m.badge.isPositive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {m.badge.isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    <span>{m.badge.text}</span>
                  </span>
                )}
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${m.accentClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 tabular-nums tracking-tight">
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
