"use client";

import React from "react";
import { Brain, AlertCircle, Smartphone, Utensils, Lightbulb, CheckSquare, MoreHorizontal } from "lucide-react";
import { ThoughtCategory } from "@/types";
import { CATEGORY_METADATA, formatMinutesToDisplay } from "@/lib/utils";

interface DistractionItem {
  category: ThoughtCategory;
  count: number;
  totalMinutes: number;
  label: string;
}

interface DistractionAnalysisCardProps {
  distractions: DistractionItem[];
}

export function DistractionAnalysisCard({ distractions }: DistractionAnalysisCardProps) {
  const totalMinutesLost = distractions.reduce((acc, d) => acc + d.totalMinutes, 0);
  const totalCount = distractions.reduce((acc, d) => acc + d.count, 0);

  const sorted = [...distractions].sort((a, b) => b.totalMinutes - a.totalMinutes);
  const topDistraction = sorted[0];

  const getIcon = (cat: ThoughtCategory) => {
    switch (cat) {
      case "phone_social":
        return Smartphone;
      case "hunger_snack":
        return Utensils;
      case "random_idea":
        return Lightbulb;
      case "anxiety_stress":
        return AlertCircle;
      case "urgent_chore":
        return CheckSquare;
      default:
        return MoreHorizontal;
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl glass-card border border-border h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <span>Distraction Root Causes</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalCount} mind pings ({totalMinutesLost} min total lost)
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {formatMinutesToDisplay(totalMinutesLost)} lost
          </span>
        </div>

        {/* Category Breakdown Bars */}
        <div className="space-y-3.5 mt-4">
          {sorted.map((item) => {
            const meta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA.other;
            const Icon = getIcon(item.category);
            const percentage = totalMinutesLost > 0 ? (item.totalMinutes / totalMinutesLost) * 100 : 0;

            return (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: `${meta.bgClass}25`, color: meta.bgClass }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-slate-200">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">
                      {item.count} {item.count === 1 ? "ping" : "pings"}
                    </span>
                    <span className="font-mono font-bold text-white text-xs">
                      {item.totalMinutes}m
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(percentage, 2)}%`,
                      backgroundColor: meta.bgClass,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendation Insight */}
      {topDistraction && topDistraction.totalMinutes > 0 && (
        <div className="mt-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>AI Vulnerability Audit</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Your primary attention leak is <strong className="text-white">{CATEGORY_METADATA[topDistraction.category]?.label}</strong>, accounting for {Math.round((topDistraction.totalMinutes / (totalMinutesLost || 1)) * 100)}% of lost time. Try implementing friction hurdles for this trigger before entering deep focus.
          </p>
        </div>
      )}
    </div>
  );
}
