"use client";

import React from "react";
import { Clock, Sun, Moon } from "lucide-react";

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

  // Find peak hour
  const peakHour = [...hourlyActivity].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="p-5 sm:p-6 rounded-2xl glass-card border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-focus" />
            <span>Circadian Focus Rhythm</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly study frequency and cognitive focus ratio across the day
          </p>
        </div>

        {peakHour && peakHour.count > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-focus/10 border border-focus/25 text-xs text-focus font-medium">
            <span className="w-2 h-2 rounded-full bg-focus animate-pulse" />
            <span>Peak Flow Window: <strong>{peakHour.label}</strong></span>
          </div>
        )}
      </div>

      {/* 24-Hour Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {hourlyActivity.map((item) => {
          const intensity = item.count > 0 ? Math.min(1, item.count / maxCount) : 0;
          const focusColor =
            item.count === 0
              ? "bg-surface-subtle border-border/40 text-slate-600"
              : intensity > 0.7
              ? "bg-focus text-slate-950 border-focus shadow-sm font-bold"
              : intensity > 0.3
              ? "bg-focus/60 text-white border-focus/70"
              : "bg-focus/25 text-focus border-focus/40";

          return (
            <div
              key={item.hour}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${focusColor}`}
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
      <div className="flex items-center justify-between text-xs text-slate-400 mt-5 pt-4 border-t border-border/80">
        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Daylight (6 AM - 6 PM)</span>
        </div>
        <div className="flex items-center gap-2">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Night / Late Sprints (6 PM - 6 AM)</span>
        </div>
      </div>
    </div>
  );
}
