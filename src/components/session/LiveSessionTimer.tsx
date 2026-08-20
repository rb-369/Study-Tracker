"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Square, 
  Sparkles, 
  Brain, 
  Clock, 
  Zap, 
  ShieldAlert, 
  Plus, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { formatSecondsToTimer, formatMinutesToDisplay, CATEGORY_METADATA } from "@/lib/utils";
import { MindPingLoggerModal } from "./MindPingLoggerModal";

interface LiveSessionTimerProps {
  onEndSessionClick: () => void;
}

export function LiveSessionTimer({ onEndSessionClick }: LiveSessionTimerProps) {
  const {
    activeSession,
    activeTimer,
    pauseSession,
    resumeSession,
    addThought,
    abandonSession,
    netFocusSeconds,
    currentFocusRatio,
    currentLongestStreakSeconds,
  } = useStudyStore();

  const [isPingModalOpen, setIsPingModalOpen] = useState(false);
  const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "t" || e.key === "T" || e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsPingModalOpen(true);
      } else if (e.code === "Space") {
        e.preventDefault();
        if (activeTimer.isRunning) {
          pauseSession();
        } else {
          resumeSession();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTimer.isRunning, pauseSession, resumeSession]);

  if (!activeSession) return null;

  const grossSeconds = activeTimer.elapsedSeconds;
  const isPomodoro = activeTimer.type === "pomodoro";
  const pomodoroTargetSeconds = (activeTimer.targetMinutes || 25) * 60;
  const pomodoroRemainingSeconds = Math.max(0, pomodoroTargetSeconds - grossSeconds);
  const pomodoroPercent = Math.min(100, Math.round((grossSeconds / pomodoroTargetSeconds) * 100));

  const thoughtsCount = activeSession.thoughts?.length || 0;
  const totalThoughtMinutes = (activeSession.thoughts || []).reduce(
    (acc, t) => acc + (t.approx_duration_minutes || 0),
    0
  );

  return (
    <div className="w-full rounded-3xl glass-panel p-6 sm:p-8 border border-focus/30 shadow-2xl relative overflow-hidden">
      {/* Background radiant focus glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-focus/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-deepwork/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Header Bar with Subject & Topic */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-border/80">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full ring-4 ring-white/10"
              style={{ backgroundColor: activeSession.subject?.color || "#10b981" }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {activeSession.subject?.name || "Study Session"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-focus/10 text-focus border border-focus/25 font-bold uppercase">
                  {activeTimer.type}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeSession.topic}
              </h2>
            </div>
          </div>

          {/* Flow Status Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border">
              <span className={`w-2.5 h-2.5 rounded-full ${activeTimer.isRunning ? "bg-focus animate-pulse" : "bg-amber-400"}`} />
              <span className="text-xs font-medium text-slate-300">
                {activeTimer.isRunning ? "Flow State Active" : "Paused"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Central Timer Display */}
        <div className="my-8 sm:my-10 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Ring Background */}
            <div className="text-center">
              <div className="font-mono text-5xl sm:text-7xl font-extrabold tracking-tighter text-white drop-shadow-md">
                {isPomodoro
                  ? formatSecondsToTimer(pomodoroRemainingSeconds)
                  : formatSecondsToTimer(grossSeconds)}
              </div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mt-1">
                {isPomodoro ? `Pomodoro Countdown (${pomodoroPercent}%)` : "Elapsed Clock Time"}
              </p>
            </div>
          </div>

          {/* Real-time Focus Split Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 w-full max-w-xl">
            {/* Pure Focus Duration */}
            <div className="p-3 sm:p-4 rounded-2xl bg-focus/10 border border-focus/25 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-focus text-xs font-semibold mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Net Focused</span>
              </div>
              <span className="font-mono text-lg sm:text-2xl font-bold text-white">
                {formatSecondsToTimer(netFocusSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {(currentFocusRatio * 100).toFixed(0)}% focus ratio
              </span>
            </div>

            {/* In-Session Distraction Lost */}
            <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                <Brain className="w-3.5 h-3.5" />
                <span>Mind Pings</span>
              </div>
              <span className="font-mono text-lg sm:text-2xl font-bold text-amber-300">
                {thoughtsCount}
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                {totalThoughtMinutes}m captured
              </span>
            </div>

            {/* Longest Deep Work Streak */}
            <div className="p-3 sm:p-4 rounded-2xl bg-deepwork/10 border border-deepwork/25 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-deepwork-light text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deep Streak</span>
              </div>
              <span className="font-mono text-lg sm:text-2xl font-bold text-white">
                {formatMinutesToDisplay(Math.round(currentLongestStreakSeconds / 60))}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                uninterrupted
              </span>
            </div>
          </div>
        </div>

        {/* Primary In-Session Actions */}
        <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-2">
          {/* Pause / Resume Button */}
          {activeTimer.isRunning ? (
            <button
              onClick={pauseSession}
              className="px-5 py-3 rounded-2xl bg-surface-elevated hover:bg-slate-800 border border-border text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Pause Timer</span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">Space</span>
            </button>
          ) : (
            <button
              onClick={resumeSession}
              className="px-5 py-3 rounded-2xl bg-focus hover:bg-focus-light text-slate-950 font-bold text-sm flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-focus/25"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Resume Study</span>
              <span className="text-[10px] font-mono text-slate-900 bg-emerald-400/60 px-1.5 py-0.5 rounded">Space</span>
            </button>
          )}

          {/* Quick Mind Ping Capture CTA (The Hero USP Button) */}
          <button
            onClick={() => setIsPingModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2.5 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25"
          >
            <Brain className="w-4 h-4 fill-slate-950" />
            <span>Log Mind Ping</span>
            <span className="text-[10px] font-mono bg-amber-400/80 px-1.5 py-0.5 rounded text-slate-950 font-extrabold">T / M</span>
          </button>

          {/* Complete & AI Debrief Button */}
          <button
            onClick={onEndSessionClick}
            className="px-5 py-3 rounded-2xl bg-surface-card hover:bg-surface-elevated border border-focus/40 text-focus font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle className="w-4 h-4 text-focus" />
            <span>End & Get AI Debrief</span>
          </button>

          {/* Abandon Button */}
          <button
            onClick={() => setShowConfirmAbandon(true)}
            title="Discard this session"
            className="p-3 rounded-2xl border border-border/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* Live List of Mind Pings Captured this Session */}
        {activeSession.thoughts && activeSession.thoughts.length > 0 && (
          <div className="w-full mt-8 pt-6 border-t border-border/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Logged Thoughts & Context Switches ({activeSession.thoughts.length})
              </span>
              <span className="text-xs text-amber-400 font-mono font-medium">
                -{totalThoughtMinutes} min net focus adjustment
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {activeSession.thoughts.map((thought, idx) => {
                const meta = CATEGORY_METADATA[thought.category];
                return (
                  <div
                    key={thought.id || idx}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-surface-card border border-border/80 text-xs"
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${meta.badgeClass}`}>
                      {meta.label.split('/')[0]}
                    </span>
                    <span className="text-slate-200 font-medium">{thought.title}</span>
                    <span className="text-amber-400 font-mono text-[11px] font-semibold">
                      ~{thought.approx_duration_minutes}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mind Ping Quick Logger Modal */}
      <MindPingLoggerModal
        isOpen={isPingModalOpen}
        onClose={() => setIsPingModalOpen(false)}
        onSubmit={addThought}
      />

      {/* Confirm Abandon Dialog */}
      {showConfirmAbandon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl glass-panel p-6 border border-rose-500/30 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Discard this session?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              This session and its logged thoughts will not be saved to your analytics.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmAbandon(false)}
                className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Keep Studying
              </button>
              <button
                onClick={() => {
                  abandonSession();
                  setShowConfirmAbandon(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
