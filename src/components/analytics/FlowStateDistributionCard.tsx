"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Zap, ShieldCheck, Flame } from "lucide-react";

interface FlowStateItem {
  rating: string;
  count: number;
  percentage: number;
  color: string;
}

interface FlowStateDistributionCardProps {
  distribution: FlowStateItem[];
  totalSessions: number;
}

export function FlowStateDistributionCard({
  distribution,
  totalSessions,
}: FlowStateDistributionCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = distribution.filter((d) => d.count > 0);
  const deepFlowCount = (distribution[0]?.count || 0) + (distribution[1]?.count || 0);
  const flowQualityPct = totalSessions > 0 ? Math.round((deepFlowCount / totalSessions) * 100) : 0;

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs shadow-2xl space-y-1">
          <div className="flex items-center gap-2 font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.rating}</span>
          </div>
          <div className="flex items-center justify-between gap-4 font-mono text-zinc-300">
            <span>Sessions:</span>
            <span className="font-bold text-white">{data.count} ({data.percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-zinc-800 h-full flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Flow State Distribution</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cognitive immersion depth across {totalSessions} logged sessions
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {flowQualityPct}% High Flow
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mt-2">
          {/* Donut Chart */}
          <div className="w-full h-44 relative flex items-center justify-center">
            {isMounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={chartData}
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                    stroke="#121215"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-zinc-500">No session data</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold font-mono text-zinc-100">{totalSessions}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Blocks</span>
            </div>
          </div>

          {/* Legend / Metrics breakdown */}
          <div className="space-y-2">
            {distribution.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-zinc-300 font-medium text-[11px] truncate">
                    {item.rating}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-zinc-400 text-[11px]">{item.count}</span>
                  <span className="text-zinc-500 text-[10px]">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="text-[11px]">
          Deep Flow is achieved when focus efficiency exceeds 90% with isolated mind pings.
        </span>
      </div>
    </div>
  );
}
