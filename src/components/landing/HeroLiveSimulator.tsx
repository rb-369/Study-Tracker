"use client";

import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  Flame, 
  Zap, 
  Brain, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  TrendingUp,
  Smartphone,
  Coffee,
  Lightbulb,
  AlertTriangle
} from "lucide-react";

export function HeroLiveSimulator() {
  const [grossMinutes, setGrossMinutes] = useState(50);
  const [pings, setPings] = useState<Array<{ id: string; title: string; minutes: number; icon: any; color: string }>>([
    { id: "1", title: "Instagram Scroll", minutes: 4, icon: Smartphone, color: "text-rose-400 bg-rose-500/10 border-rose-500/25" },
    { id: "2", title: "Snack Urge", minutes: 2, icon: Coffee, color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
  ]);
  const [lastLogged, setLastLogged] = useState<string | null>(null);

  const totalDeductedMinutes = pings.reduce((acc, p) => acc + p.minutes, 0);
  const netMinutes = Math.max(0, grossMinutes - totalDeductedMinutes);
  const focusScore = Math.min(100, Math.max(0, Math.round(((netMinutes * 60) / (grossMinutes * 60)) * 100)));

  const handleAddPing = (title: string, minutes: number, icon: any, color: string) => {
    const id = String(Date.now());
    setPings((prev) => [...prev, { id, title, minutes, icon, color }]);
    setLastLogged(`-${minutes}m (${title})`);
    setTimeout(() => setLastLogged(null), 2500);
  };

  const handleReset = () => {
    setPings([]);
    setGrossMinutes(50);
  };

  return (
    <div className="w-full rounded-2xl bg-[#0f0f14] border border-zinc-800 shadow-2xl p-5 sm:p-6 text-left relative overflow-hidden backdrop-blur-xl group">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">
            Interactive Flow Simulator
          </span>
        </div>
        <button
          onClick={handleReset}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors text-[10px] flex items-center gap-1 font-mono"
          title="Reset Simulator"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Telemetry Gauges */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
          <div className="text-[10px] text-zinc-400 font-mono">Gross Time</div>
          <div className="text-lg sm:text-xl font-black font-mono text-zinc-100 mt-0.5">
            {grossMinutes}<span className="text-xs text-zinc-500 font-normal">m</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/90 border border-emerald-500/30">
          <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-between">
            <span>Net Focus</span>
            {lastLogged && <span className="text-rose-400 text-[9px] animate-bounce">{lastLogged}</span>}
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-0.5">
            {netMinutes}<span className="text-xs text-emerald-500 font-normal">m</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
          <div className="text-[10px] text-zinc-400 font-mono">Focus Score</div>
          <div className="text-lg sm:text-xl font-black font-mono text-zinc-100 mt-0.5">
            {focusScore}<span className="text-xs text-zinc-500 font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* 1-Tap Mind Ping Simulator Bar */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 mb-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test 1-Tap Mind Ping Deduction:</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Click to test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => handleAddPing("Phone Check", 3, Smartphone, "text-rose-400 bg-rose-500/10 border-rose-500/25")}
            className="px-2.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-rose-500/15 border border-zinc-700/60 hover:border-rose-500/40 text-left transition-all active:scale-95 group/btn"
          >
            <div className="text-[11px] font-semibold text-zinc-200 group-hover/btn:text-rose-300 truncate">
              📱 Phone
            </div>
            <div className="text-[9px] text-zinc-400 font-mono">-3 min</div>
          </button>

          <button
            onClick={() => handleAddPing("Hunger / Snack", 2, Coffee, "text-amber-400 bg-amber-500/10 border-amber-500/25")}
            className="px-2.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-amber-500/15 border border-zinc-700/60 hover:border-amber-500/40 text-left transition-all active:scale-95 group/btn"
          >
            <div className="text-[11px] font-semibold text-zinc-200 group-hover/btn:text-amber-300 truncate">
              ☕ Snack
            </div>
            <div className="text-[9px] text-zinc-400 font-mono">-2 min</div>
          </button>

          <button
            onClick={() => handleAddPing("Random Thought", 2, Lightbulb, "text-indigo-400 bg-indigo-500/10 border-indigo-500/25")}
            className="px-2.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-indigo-500/15 border border-zinc-700/60 hover:border-indigo-500/40 text-left transition-all active:scale-95 group/btn"
          >
            <div className="text-[11px] font-semibold text-zinc-200 group-hover/btn:text-indigo-300 truncate">
              💡 Idea
            </div>
            <div className="text-[9px] text-zinc-400 font-mono">-2 min</div>
          </button>

          <button
            onClick={() => handleAddPing("Stress Spike", 4, AlertTriangle, "text-purple-400 bg-purple-500/10 border-purple-500/25")}
            className="px-2.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-purple-500/15 border border-zinc-700/60 hover:border-purple-500/40 text-left transition-all active:scale-95 group/btn"
          >
            <div className="text-[11px] font-semibold text-zinc-200 group-hover/btn:text-purple-300 truncate">
              ⚡ Stress
            </div>
            <div className="text-[9px] text-zinc-400 font-mono">-4 min</div>
          </button>
        </div>
      </div>

      {/* Logged Distraction Feed */}
      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
        {pings.map((ping) => {
          const Icon = ping.icon;
          return (
            <div
              key={ping.id}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between ${ping.color}`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium truncate">{ping.title}</span>
              </div>
              <span className="font-mono text-[10px] font-bold">-{ping.minutes}m</span>
            </div>
          );
        })}
      </div>

      {/* Live AI Coach Insight */}
      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-300">
        <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
          <Brain className="w-3 h-3" />
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200 font-medium">AI Coach Diagnosis:</strong>{" "}
          {pings.length === 0
            ? "Pristine flow state. 100% focus purity."
            : focusScore >= 80
            ? `High focus retention (${focusScore}%). ${pings.length} distraction impulses logged without breaking working memory.`
            : `Focus purity dropped to ${focusScore}%. Recommend a 5-minute non-screen dopamine reset before next block.`}
        </p>
      </div>
    </div>
  );
}
