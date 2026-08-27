"use client";

import React from "react";
import { Brain, AlertCircle, Smartphone, Utensils, Lightbulb, CheckSquare, MoreHorizontal, Tag } from "lucide-react";
import { ThoughtCategory } from "@/types";
import { CATEGORY_METADATA, formatMinutesToDisplay } from "@/lib/utils";

interface DistractionItem {
  category: ThoughtCategory;
  count: number;
  totalMinutes: number;
  label: string;
}

interface TopThoughtTitle {
  title: string;
  count: number;
  totalMinutes: number;
  category: ThoughtCategory;
}

interface DistractionAnalysisCardProps {
  distractions: DistractionItem[];
  topTitles?: TopThoughtTitle[];
}

export function DistractionAnalysisCard({ distractions, topTitles = [] }: DistractionAnalysisCardProps) {
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
    <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-zinc-800 h-full flex flex-col justify-between space-y-5">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <span>Distraction Root Causes</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {totalCount} mind pings ({totalMinutesLost} min total lost)
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {formatMinutesToDisplay(totalMinutesLost)} lost
          </span>
        </div>

        {/* Category Breakdown Bars */}
        <div className="space-y-3 mt-4">
          {sorted.map((item) => {
            const meta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA.other;
            const Icon = getIcon(item.category);
            const percentage = totalMinutesLost > 0 ? (item.totalMinutes / totalMinutesLost) * 100 : 0;

            return (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                      style={{ backgroundColor: `${meta.bgClass}25`, color: meta.bgClass }}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-zinc-200">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-zinc-500 text-[11px]">
                      {item.count} {item.count === 1 ? "ping" : "pings"}
                    </span>
                    <span className="font-bold text-zinc-100 text-xs">
                      {item.totalMinutes}m
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
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

        {/* Top Trigger Keywords / Titles & Custom Pings */}
        {topTitles && topTitles.length > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-amber-400" />
                <span>Frequent Mind Pings & Triggers</span>
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">
                {topTitles.length} unique triggers
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topTitles.map((t, idx) => {
                const meta = CATEGORY_METADATA[t.category] || CATEGORY_METADATA.other;
                return (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5 hover:border-zinc-700 transition-colors"
                  >
                    <span>{meta.icon}</span>
                    <span className="text-zinc-100 font-medium truncate max-w-[140px]">
                      {t.title}
                    </span>
                    <span className="font-mono text-[10px] text-amber-400 font-semibold">
                      {t.count}x ({t.totalMinutes}m)
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation Insight */}
      {topDistraction && topDistraction.totalMinutes > 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Attention Leak Audit</span>
          </div>
          <p className="text-zinc-300 text-[11px] leading-relaxed">
            Your primary attention leak is <strong className="text-white">{CATEGORY_METADATA[topDistraction.category]?.label}</strong>, accounting for {Math.round((topDistraction.totalMinutes / (totalMinutesLost || 1)) * 100)}% of lost time. Try isolating devices or batching checks before starting focus blocks.
          </p>
        </div>
      )}
    </div>
  );
}
