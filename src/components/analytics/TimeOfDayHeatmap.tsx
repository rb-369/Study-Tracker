"use client";

import React from "react";
import { Clock, Sun, Moon, Sparkles } from "lucide-react";

interface HeatmapPoint {
  hour: number;
  dayOfWeek: number;
  count: number;
  avgFocusRatio: number;
}

interface TimeOfDayHeatmapProps {
  data: HeatmapPoint[];
}

export function TimeOfDayHeatmap({ data }: TimeOfDayHeatmapProps) {
  // Aggregate data by 24 hours
  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
    const pointsForHour = data.filter((d) => d.hour === hour);
    const totalCount = pointsForHour.reduce((acc, p) => acc + p.count, 0);
    const avgRatio = pointsForHour.length > 0
      ? pointsForHour.reduce((acc, p) => acc + p.avgFocusRatio, 0) / pointsForHour.length
      : 0;

    return {
      hour,
      count: totalCount,
      avgRatio,
      label: hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
    };
  });

  const maxCount = Math.max(1, ...hourlyActivity.map((h) => h.count));

  // Find peak hour with highest sessions and ratio
  const activeHours = hourlyActivity.filter((h) => h.count > 0);
  const peakHour = activeHours.length > 0
    ? [...activeHours].sort((a, b) => b.count - a.count || b.avgRatio - a.avgRatio)[0]
    : null;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-zinc-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Circadian Focus Rhythm & Chronotype</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            24-hour distribution of focus start times and cognitive velocity
          </p>
        </div>

        {peakHour && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Peak Flow Window: <strong>{peakHour.label}</strong> ({Math.round(peakHour.avgRatio * 100)}% ratio)</span>
          </div>
        )}
      </div>

      {/* 24-Hour Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {hourlyActivity.map((item) => {
          const intensity = item.count > 0 ? Math.min(1, item.count / maxCount) : 0;
          const focusColor =
            item.count === 0
              ? "bg-zinc-900/60 border-zinc-800 text-zinc-600"
              : intensity > 0.7
              ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md font-bold"
              : intensity > 0.3
              ? "bg-emerald-500/60 text-white border-emerald-500/70"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

          return (
            <div
              key={item.hour}
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${focusColor}`}
              title={`${item.label}: ${item.count} sessions, ${(item.avgRatio * 100).toFixed(0)}% focus ratio`}
            >
              <span className="text-[10px] uppercase font-mono font-medium block truncate">
                {item.label}
              </span>
              <span className="text-xs font-mono font-extrabold mt-1">
                {item.count > 0 ? `${item.count}` : "-"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Daylight Sprints (6 AM - 6 PM)</span>
        </div>
        <div className="flex items-center gap-2">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Night Flow (6 PM - 6 AM)</span>
        </div>
      </div>
    </div>
  );
}
