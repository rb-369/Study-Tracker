"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { formatMinutesToDisplay } from "@/lib/utils";

interface DailyTrendItem {
  date: string;
  displayDate: string;
  grossMinutes: number;
  netMinutes: number;
  focusRatio: number;
  focusScore?: number;
}

interface FocusTrendsChartProps {
  data: DailyTrendItem[];
}

export function FocusTrendsChart({ data }: FocusTrendsChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"stacked" | "score">("stacked");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-80 rounded-2xl bg-[#121215] border border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
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
    score: d.focusScore || (d.grossMinutes > 0 ? Math.round(d.focusRatio * 100) : 0),
  }));

  const totalNetInWindow = chartData.reduce((acc, d) => acc + d.netFocus, 0);
  const avgDailyNet = chartData.length > 0 ? Math.round(totalNetInWindow / chartData.length) : 0;

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs shadow-2xl space-y-1.5 min-w-[190px]">
          <p className="font-bold text-zinc-100 mb-1">{p.fullDate}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Net Focus:
            </span>
            <span className="font-mono font-bold text-white">
              {formatMinutesToDisplay(p.netFocus)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Distractions / Lost:
            </span>
            <span className="font-mono font-bold text-amber-300">
              {formatMinutesToDisplay(p.distraction)}
            </span>
          </div>
          <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between gap-4 text-zinc-400">
            <span>Focus Efficiency:</span>
            <span className="font-mono font-bold text-emerald-400">{p.ratio}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomScoreTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs shadow-2xl space-y-1.5 min-w-[190px]">
          <p className="font-bold text-zinc-100 mb-1">{p.fullDate}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Cognitive Score:
            </span>
            <span className="font-mono font-bold text-white">{p.score}/100</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>Net Focused Time:</span>
            <span className="font-mono text-zinc-200">{formatMinutesToDisplay(p.netFocus)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-zinc-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">
              Daily Focus Velocity & Mind Ping Delta
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              Avg {formatMinutesToDisplay(avgDailyNet)}/day
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gross study clock time vs. true net uninterrupted cognitive focus
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle between Stacked Time and Score Trend */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode("stacked")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "stacked"
                  ? "bg-zinc-800 text-emerald-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Time Split</span>
            </button>
            <button
              onClick={() => setViewMode("score")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "score"
                  ? "bg-zinc-800 text-emerald-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Focus Score</span>
            </button>
          </div>

          {viewMode === "stacked" && (
            <div className="hidden sm:flex items-center gap-3 text-xs pl-2 border-l border-zinc-800">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Net Focus</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Distractions</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "stacked" ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="netFocus" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="distraction" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomScoreTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
