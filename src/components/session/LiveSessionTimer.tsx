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
  Plus, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  X,
  Target,
  Bell
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { formatSecondsToTimer, formatMinutesToDisplay, CATEGORY_METADATA } from "@/lib/utils";
import { MindPingLoggerModal } from "./MindPingLoggerModal";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/sound";

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
    goals,
  } = useStudyStore();

  const [isPingModalOpen, setIsPingModalOpen] = useState(false);
  const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleToggleNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  // Quick 1-tap categories to log without opening full modal
  const quickCategories = [
    { id: "micro_30s", key: "phone_social" as const, label: "30s Micro Ping", icon: "⚡", minutes: 0.5, displayTime: "30s" },
    { id: "social_3m", key: "phone_social" as const, label: "Social / Phone", icon: "📱", minutes: 3, displayTime: "+3m" },
    { id: "snack_5m", key: "hunger_snack" as const, label: "Snack / Water", icon: "☕", minutes: 5, displayTime: "+5m" },
    { id: "idea_2m", key: "random_idea" as const, label: "Random Idea", icon: "💡", minutes: 2, displayTime: "+2m" },
    { id: "daydream_4m", key: "anxiety_stress" as const, label: "Daydreaming", icon: "💭", minutes: 4, displayTime: "+4m" },
  ];

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (isPingModalOpen || showConfirmAbandon) {
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
  }, [activeTimer.isRunning, pauseSession, resumeSession, isPingModalOpen, showConfirmAbandon]);

  if (!activeSession) return null;

  const linkedGoal = activeSession.goal || (activeSession.goal_id ? goals.find((g) => g.id === activeSession.goal_id) : undefined);

  const grossSeconds = activeTimer.elapsedSeconds;
  const isPomodoro = activeTimer.type === "pomodoro";
  const pomodoroTargetSeconds = (activeTimer.targetMinutes || 25) * 60;
  const isPomodoroComplete = isPomodoro && grossSeconds >= pomodoroTargetSeconds;
  const pomodoroRemainingSeconds = Math.max(0, pomodoroTargetSeconds - grossSeconds);
  const pomodoroOvertimeSeconds = Math.max(0, grossSeconds - pomodoroTargetSeconds);
  const pomodoroPercent = Math.min(100, Math.round((grossSeconds / pomodoroTargetSeconds) * 100));

  const thoughtsCount = activeSession.thoughts?.length || 0;
  const totalDistractionMinutes = (activeSession.thoughts || []).reduce(
    (acc, t) => acc + (t.approx_duration_minutes || 0),
    0
  );

  const focusRatioPercent = Math.round(currentFocusRatio * 100);

  return (
    <div className="w-full rounded-2xl bg-[#111114] border border-zinc-800/90 shadow-xl overflow-hidden">
      {/* Header telemetry ribbon */}
      <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: activeSession.subject?.color || "#10b981" }}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {activeSession.subject?.name || "General Study"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                {activeTimer.type.toUpperCase()}
              </span>
              {linkedGoal && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>{linkedGoal.title}</span>
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
              {activeSession.topic}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifPermission === "default" && (
            <button
              onClick={handleToggleNotifications}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 transition-colors"
              title="Enable background tab notifications & sound alerts"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-[11px] font-medium">Alerts</span>
            </button>
          )}
          {notifPermission === "granted" && (
            <div
              className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              title="Background tab notifications & sound chime active"
            >
              <Bell className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="text-xs font-mono text-zinc-300">
              {activeTimer.isRunning ? "FLOW ACTIVE" : "PAUSED"}
            </span>
          </div>

          <button
            onClick={() => setShowConfirmAbandon(true)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Cancel session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="px-6 py-8 sm:py-10 flex flex-col items-center justify-center">
        {/* Digital Clock */}
        <div className="text-center select-none">
          <div className={`font-mono text-6xl sm:text-8xl font-black tracking-tight tabular-nums drop-shadow-sm transition-colors ${
            isPomodoroComplete ? "text-emerald-400" : "text-white"
          }`}>
            {isPomodoro
              ? isPomodoroComplete
                ? `+${formatSecondsToTimer(pomodoroOvertimeSeconds)}`
                : formatSecondsToTimer(pomodoroRemainingSeconds)
              : formatSecondsToTimer(grossSeconds)}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {isPomodoroComplete && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono animate-pulse">
                TARGET REACHED
              </span>
            )}
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
              {isPomodoro
                ? isPomodoroComplete
                  ? `Overtime Flow (${pomodoroPercent}% of ${activeTimer.targetMinutes}m target)`
                  : `Pomodoro Sprint (${pomodoroPercent}% Complete)`
                : "Active Session Clock"}
            </p>
          </div>
        </div>

        {/* Real-time Focus Split Telemetry */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 w-full max-w-xl">
          {/* True Net Focus */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Net Focus</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-zinc-100 tabular-nums">
              {formatSecondsToTimer(netFocusSeconds)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">True deep work</p>
          </div>

          {/* Efficiency Ratio */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-300 text-xs font-semibold mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Focus Ratio</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-zinc-100 tabular-nums">
              {focusRatioPercent}%
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Flow efficiency</p>
          </div>

          {/* Mind Pings Lost */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-semibold mb-1">
              <Brain className="w-3.5 h-3.5" />
              <span>Distractions</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-zinc-100 tabular-nums">
              {totalDistractionMinutes}m
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">{thoughtsCount} stray pings</p>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 mt-7 w-full max-w-sm">
          {activeTimer.isRunning ? (
            <button
              onClick={pauseSession}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-zinc-700"
            >
              <Pause className="w-4 h-4 text-amber-400" />
              <span>Pause Focus</span>
            </button>
          ) : (
            <button
              onClick={resumeSession}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4 fill-zinc-950" />
              <span>Resume Focus</span>
            </button>
          )}

          <button
            onClick={onEndSessionClick}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Square className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Complete & Debrief</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 font-mono mt-3">
          Shortcut: <span className="text-zinc-400 bg-zinc-800/80 px-1 py-0.5 rounded border border-zinc-700">Space</span> toggle timer &bull; <span className="text-zinc-400 bg-zinc-800/80 px-1 py-0.5 rounded border border-zinc-700">T</span> log thought
        </p>
      </div>

      {/* 1-Tap Mind Ping Quick Bar */}
      <div className="px-5 py-4 border-t border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-200">
              1-Tap Mind Ping (Subtract stray thoughts)
            </span>
          </div>

          <button
            onClick={() => setIsPingModalOpen(true)}
            className="text-[11px] text-emerald-400 hover:underline font-medium"
          >
            + Custom Log
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {quickCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                addThought(cat.label, cat.key, cat.minutes);
              }}
              className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all active:scale-95 flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs">{cat.icon}</span>
                <span className="text-xs font-medium text-zinc-300 truncate">{cat.label}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 font-semibold flex-shrink-0 ml-1">
                {cat.displayTime}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Logged in-session thoughts feed */}
      {thoughtsCount > 0 && (
        <div className="px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-950/60">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
            In-Session Stray Thoughts ({thoughtsCount})
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {activeSession.thoughts?.map((thought) => {
              const meta = CATEGORY_METADATA[thought.category] || CATEGORY_METADATA.other;
              return (
                <div
                  key={thought.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                >
                  <span>{meta.icon}</span>
                  <span>{thought.title || meta.label}</span>
                  <span className="text-rose-400 font-mono font-medium text-[10px]">
                    -{thought.approx_duration_minutes === 0.5 ? "30s" : `${thought.approx_duration_minutes}m`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Abandon Modal */}
      {showConfirmAbandon && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Discard Session?</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Are you sure you want to cancel this study session? Recorded minutes will not be saved.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setShowConfirmAbandon(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Keep Studying
              </button>
              <button
                onClick={() => {
                  abandonSession();
                  setShowConfirmAbandon(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Mind Ping Modal */}
      <MindPingLoggerModal
        isOpen={isPingModalOpen}
        onClose={() => setIsPingModalOpen(false)}
        onSubmit={(title, category, duration, notes) => {
          addThought(title, category, duration, notes);
        }}
      />
    </div>
  );
}
