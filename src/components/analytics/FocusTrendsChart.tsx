"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatMinutesToDisplay } from "@/lib/utils";

interface DailyTrendItem {
  date: string;
  displayDate: string;
  grossMinutes: number;
  netMinutes: number;
  focusRatio: number;
}

interface FocusTrendsChartProps {
  data: DailyTrendItem[];
}

export function FocusTrendsChart({ data }: FocusTrendsChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-72 rounded-2xl glass-card flex items-center justify-center text-xs text-slate-500">
        Loading focus trends chart...
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.displayDate.split(",")[0], // e.g. "Mon"
    fullDate: d.displayDate,
    netFocus: d.netMinutes,
    distraction: Math.max(0, d.grossMinutes - d.netMinutes),
    gross: d.grossMinutes,
    ratio: Math.round(d.focusRatio * 100),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-3 rounded-xl glass-panel border border-border/90 text-xs shadow-xl space-y-1">
          <p className="font-bold text-white mb-1.5">{p.fullDate}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-focus flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-focus" />
              Net Focus:
            </span>
            <span className="font-mono font-bold text-white">
              {formatMinutesToDisplay(p.netFocus)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Mind Pings / Lost:
            </span>
            <span className="font-mono font-bold text-amber-300">
              {formatMinutesToDisplay(p.distraction)}
            </span>
          </div>
          <div className="pt-1.5 border-t border-border/80 flex items-center justify-between gap-4 text-slate-300">
            <span>Focus Ratio:</span>
            <span className="font-mono font-bold text-focus">{p.ratio}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl glass-card border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Daily Focus Velocity & Mind Ping Delta
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gross study clock time vs. actual net focused deep work
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-focus" />
            <span>Net Focus</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Stray Thoughts</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="netFocus" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
            <Bar dataKey="distraction" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
