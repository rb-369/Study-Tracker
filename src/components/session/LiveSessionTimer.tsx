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
  Bell,
  Coffee,
  RotateCcw,
  FastForward,
  ChevronRight,
  Flame
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { formatSecondsToTimer, formatMinutesToDisplay, CATEGORY_METADATA } from "@/lib/utils";
import { MindPingLoggerModal } from "./MindPingLoggerModal";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/sound";
import { BreakType } from "@/types";

interface LiveSessionTimerProps {
  onEndSessionClick: () => void;
}

export function LiveSessionTimer({ onEndSessionClick }: LiveSessionTimerProps) {
  const {
    activeSession,
    activeTimer,
    pauseSession,
    resumeSession,
    startBreak,
    pauseBreak,
    resumeBreak,
    endBreak,
    skipBreak,
    startNextPomodoroSprint,
    addThought,
    customQuickPings,
    abandonSession,
    netFocusSeconds,
    currentFocusRatio,
    goals,
  } = useStudyStore();

  const [isPingModalOpen, setIsPingModalOpen] = useState(false);
  const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "info" | "warn" | "success" } | null>(null);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const handleToggleNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

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
        if (activeTimer.breakState?.isBreakActive) {
          if (activeTimer.breakState.isBreakRunning) {
            pauseBreak();
          } else {
            resumeBreak();
          }
        } else {
          if (activeTimer.isRunning) {
            pauseSession();
          } else {
            resumeSession();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTimer.isRunning, activeTimer.breakState, pauseSession, resumeSession, pauseBreak, resumeBreak, isPingModalOpen, showConfirmAbandon]);

  if (!activeSession) return null;

  const linkedGoal = activeSession.goal || (activeSession.goal_id ? goals.find((g) => g.id === activeSession.goal_id) : undefined);

  const isPomodoro = activeTimer.type === "pomodoro";
  const pomodoroTargetSeconds = (activeTimer.targetMinutes || 25) * 60;
  const currentElapsed = activeTimer.elapsedSeconds;
  const isPomodoroTargetReached = isPomodoro && currentElapsed >= pomodoroTargetSeconds;
  const pomodoroRemainingSeconds = Math.max(0, pomodoroTargetSeconds - currentElapsed);
  const pomodoroPercent = Math.min(100, Math.round((currentElapsed / pomodoroTargetSeconds) * 100));

  // Break State Calculations
  const isBreakActive = !!activeTimer.breakState?.isBreakActive;
  const breakTargetSeconds = (activeTimer.breakState?.breakTargetMinutes || 5) * 60;
  const breakElapsedSeconds = activeTimer.breakState?.breakElapsedSeconds || 0;
  const breakRemainingSeconds = Math.max(0, breakTargetSeconds - breakElapsedSeconds);
  const isBreakCompleted = isBreakActive && breakElapsedSeconds >= breakTargetSeconds;
  const breakPercent = Math.min(100, Math.round((breakElapsedSeconds / breakTargetSeconds) * 100));

  // Total Gross Study Time Elapsed (across current sprint & prior Pomodoro completed sprints)
  const totalGrossStudySeconds = isPomodoro && activeTimer.pomodoroCyclesCompleted && activeTimer.pomodoroCyclesCompleted > 0
    ? (activeTimer.totalStudySeconds || 0) + currentElapsed
    : currentElapsed;

  // Total Distraction Time Deducted (strictly clamped to elapsed study time)
  const totalDistractionSeconds = (activeSession.thoughts || []).reduce(
    (acc, t) => acc + Math.round((t.approx_duration_minutes || 0) * 60),
    0
  );
  const safeDistractionSeconds = Math.min(totalDistractionSeconds, totalGrossStudySeconds);
  const displayDistractionText = safeDistractionSeconds < 60
    ? `${safeDistractionSeconds}s`
    : `${(safeDistractionSeconds / 60).toFixed(1).replace(/\.0$/, "")}m`;

  const remainingAvailableSeconds = Math.max(0, totalGrossStudySeconds - totalDistractionSeconds);

  // Cycle Telemetry
  const completedCycles = activeTimer.pomodoroCyclesCompleted || (isPomodoroTargetReached ? 1 : 0);
  const totalBreakMins = Math.round((activeTimer.totalBreakSeconds || 0) / 60);
  const totalStudyMins = Math.round(totalGrossStudySeconds / 60);

  const thoughtsCount = activeSession.thoughts?.length || 0;
  const focusRatioPercent = Math.round(currentFocusRatio * 100);

  const handleQuickPingClick = (ping: { title: string; category: any; minutes: number }) => {
    const reqSec = Math.round(ping.minutes * 60);
    if (totalGrossStudySeconds < 5) {
      addThought(ping.title, ping.category, ping.minutes);
      setToastMsg({
        text: `Thought noted! (0s deducted — study session just started)`,
        type: "info",
      });
    } else if (remainingAvailableSeconds <= 0) {
      addThought(ping.title, ping.category, ping.minutes);
      setToastMsg({
        text: `Thought noted! (0s deducted — distractions cannot exceed elapsed study time)`,
        type: "warn",
      });
    } else if (reqSec > remainingAvailableSeconds) {
      const cappedText = remainingAvailableSeconds < 60
        ? `${remainingAvailableSeconds}s`
        : `${(remainingAvailableSeconds / 60).toFixed(1)}m`;
      addThought(ping.title, ping.category, ping.minutes);
      setToastMsg({
        text: `Logged "${ping.title}" — deducted ${cappedText} (capped to elapsed study time)`,
        type: "warn",
      });
    } else {
      addThought(ping.title, ping.category, ping.minutes);
      setToastMsg({
        text: `Logged "${ping.title}" (-${ping.minutes === 0.5 ? "30s" : ping.minutes + "m"})`,
        type: "success",
      });
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#111114] border border-zinc-800/90 shadow-2xl overflow-hidden transition-all">
      {/* Header telemetry ribbon */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
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
              {isPomodoro && completedCycles > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-indigo-400" />
                  <span>{completedCycles} {completedCycles === 1 ? "Sprint" : "Sprints"} Done</span>
                </span>
              )}
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
            <span
              className={`w-2 h-2 rounded-full ${
                isBreakActive
                  ? activeTimer.breakState?.isBreakRunning
                    ? "bg-teal-400 animate-pulse"
                    : "bg-amber-400"
                  : activeTimer.isRunning
                  ? "bg-emerald-400 animate-pulse"
                  : activeTimer.isInitialReady
                  ? "bg-indigo-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-xs font-mono text-zinc-300">
              {isBreakActive
                ? activeTimer.breakState?.isBreakRunning
                  ? "BREAK RUNNING"
                  : "BREAK PAUSED"
                : activeTimer.isRunning
                ? "FLOW ACTIVE"
                : activeTimer.isInitialReady
                ? "READY TO START"
                : "PAUSED"}
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

      {/* Main Timer Body */}
      <div className="px-4 sm:px-8 py-8 sm:py-10 flex flex-col items-center justify-center">
        
        {/* ========================================================================= */}
        {/* VIEW 1: BREAK MODE ACTIVE                                                 */}
        {/* ========================================================================= */}
        {isBreakActive ? (
          <div className="w-full max-w-xl text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold">
              <Coffee className="w-3.5 h-3.5" />
              <span>{activeTimer.breakState?.breakType === "long" ? "15-Minute Long Break" : "5-Minute Rejuvenation Break"}</span>
            </div>

            {/* Break Countdown Clock */}
            <div className="select-none py-2">
              <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-black tracking-tight tabular-nums text-teal-300 drop-shadow-sm">
                {formatSecondsToTimer(breakRemainingSeconds)}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-2">
                {isBreakCompleted ? "Break Complete! Ready for next focus sprint." : `${breakPercent}% of break elapsed`}
              </p>
            </div>

            {/* Calming Rest Prompt */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
              🧘 Look 20 feet away, stretch your back, drink water. Your focus timer is safely on hold.
            </div>

            {/* Break Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto pt-2">
              {activeTimer.breakState?.isBreakRunning ? (
                <button
                  onClick={pauseBreak}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4 text-amber-400" />
                  <span>Pause Break</span>
                </button>
              ) : (
                <button
                  onClick={resumeBreak}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Resume Break</span>
                </button>
              )}

              <button
                onClick={startNextPomodoroSprint}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Start Next Sprint</span>
              </button>

              <button
                onClick={onEndSessionClick}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold border border-zinc-800 transition-all"
              >
                <span>End Session</span>
              </button>
            </div>
          </div>
        ) : isPomodoroTargetReached ? (
          /* ========================================================================= */
          /* VIEW 2: POMODORO SPRINT COMPLETE (PROMPT BREAK)                           */
          /* ========================================================================= */
          <div className="w-full max-w-xl text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-pulse">
              <CheckCircle className="w-4 h-4" />
              <span>Sprint #{completedCycles} Complete ({activeTimer.targetMinutes}m Target Reached!)</span>
            </div>

            <div className="select-none py-2">
              <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-black tracking-tight tabular-nums text-emerald-400">
                {formatSecondsToTimer(pomodoroTargetSeconds)}
              </div>
              <p className="text-xs uppercase tracking-widest text-zinc-400 font-mono mt-2">
                Focus Target Achieved &bull; Timer Paused
              </p>
            </div>

            {/* Break Choice Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mx-auto">
              <button
                onClick={() => startBreak(5, "short")}
                className="p-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-left font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <Coffee className="w-4 h-4" />
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="mt-3">
                  <div className="text-xs font-black">5m Short Break</div>
                  <p className="text-[10px] text-zinc-900/80 font-medium">Recommended recharge</p>
                </div>
              </button>

              <button
                onClick={() => startBreak(15, "long")}
                className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-left font-bold transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="mt-3">
                  <div className="text-xs font-black">15m Long Break</div>
                  <p className="text-[10px] text-indigo-200 font-medium">For deep cognitive rest</p>
                </div>
              </button>

              <button
                onClick={skipBreak}
                className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-zinc-300 font-semibold transition-all active:scale-[0.98] flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <FastForward className="w-4 h-4 text-zinc-400" />
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="mt-3">
                  <div className="text-xs font-bold text-zinc-200">Skip Break</div>
                  <p className="text-[10px] text-zinc-500">Jump to next sprint</p>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={onEndSessionClick}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline font-medium"
              >
                Or complete session now & view AI debrief
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 3: STANDARD FOCUS TIMER (STOPWATCH OR POMODORO COUNTDOWN)            */
          /* ========================================================================= */
          <div className="w-full text-center select-none space-y-2">
            {/* Digital Clock with Fluid Responsive Typography (f6 Mobile overflow fix) */}
            <div className="w-full flex items-center justify-center overflow-hidden px-2">
              <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-black tracking-tight tabular-nums text-white drop-shadow-sm leading-none max-w-full">
                {isPomodoro
                  ? formatSecondsToTimer(pomodoroRemainingSeconds)
                  : formatSecondsToTimer(currentElapsed)}
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-2">
              {activeTimer.isInitialReady && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-mono animate-pulse">
                  READY &bull; PRESS START WHEN SEATED
                </span>
              )}
              {!activeTimer.isInitialReady && (
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                  {isPomodoro
                    ? `Pomodoro Sprint (${pomodoroPercent}% of ${activeTimer.targetMinutes}m)`
                    : "Active Deep Work Clock"}
                </p>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-6 pt-2 w-full max-w-sm mx-auto">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseSession}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-zinc-700"
                >
                  <Pause className="w-4 h-4 text-amber-400" />
                  <span>Pause Focus</span>
                </button>
              ) : activeTimer.isInitialReady ? (
                <button
                  onClick={resumeSession}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Start Focus Block</span>
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
        )}

        {/* Real-time Focus Split Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-8 w-full max-w-2xl">
          {/* True Net Focus */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-[11px] font-semibold mb-0.5">
              <Zap className="w-3 h-3" />
              <span>Net Focus</span>
            </div>
            <div className="font-mono text-lg sm:text-xl font-bold text-zinc-100 tabular-nums">
              {formatSecondsToTimer(netFocusSeconds)}
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5">Deep cognition</p>
          </div>

          {/* Efficiency Ratio */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-zinc-300 text-[11px] font-semibold mb-0.5">
              <TrendingUp className="w-3 h-3 text-indigo-400" />
              <span>Focus Ratio</span>
            </div>
            <div className="font-mono text-lg sm:text-xl font-bold text-zinc-100 tabular-nums">
              {focusRatioPercent}%
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5">Purity score</p>
          </div>

          {/* Mind Pings Lost */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-rose-400 text-[11px] font-semibold mb-0.5">
              <Brain className="w-3 h-3" />
              <span>Distractions</span>
            </div>
            <div className="font-mono text-lg sm:text-xl font-bold text-zinc-100 tabular-nums">
              {displayDistractionText}
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5">{thoughtsCount} stray pings</p>
          </div>

          {/* Sprints / Break Time */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-teal-400 text-[11px] font-semibold mb-0.5">
              <Coffee className="w-3 h-3" />
              <span>Break Time</span>
            </div>
            <div className="font-mono text-lg sm:text-xl font-bold text-zinc-100 tabular-nums">
              {totalBreakMins}m
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5">{completedCycles} sprints completed</p>
          </div>
        </div>

        {/* Transient Ping Feedback Toast */}
        {toastMsg && (
          <div
            className={`mt-4 px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 animate-slide-up ${
              toastMsg.type === "warn"
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : toastMsg.type === "info"
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <Brain className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
        )}
      </div>

      {/* 1-Tap Mind Ping Quick Bar (f2 Custom Quick Pings + f5 Watertight Subtraction) */}
      <div className="px-4 sm:px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-200">
              1-Tap Mind Ping (Subtract stray thoughts)
            </span>
            {remainingAvailableSeconds <= 0 && totalGrossStudySeconds > 0 && (
              <span className="text-[10px] font-mono text-amber-400/90 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                0s deductible remaining
              </span>
            )}
          </div>

          <button
            onClick={() => setIsPingModalOpen(true)}
            className="text-[11px] text-emerald-400 hover:underline font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Custom Log</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {customQuickPings.map((ping) => (
            <button
              key={ping.id}
              onClick={() => handleQuickPingClick(ping)}
              className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all active:scale-95 flex items-center justify-between group"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs">{ping.icon || "💡"}</span>
                <span className="text-xs font-medium text-zinc-300 truncate group-hover:text-white">
                  {ping.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 font-semibold flex-shrink-0 ml-1">
                {ping.minutes === 0.5 ? "30s" : `+${ping.minutes}m`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Logged in-session thoughts feed */}
      {thoughtsCount > 0 && (
        <div className="px-4 sm:px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/60">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
            In-Session Stray Thoughts ({thoughtsCount})
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {activeSession.thoughts?.map((thought) => {
              const meta = CATEGORY_METADATA[thought.category] || CATEGORY_METADATA.other;
              const thoughtSec = Math.round((thought.approx_duration_minutes || 0) * 60);
              return (
                <div
                  key={thought.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                >
                  <span>{meta.icon}</span>
                  <span>{thought.title || meta.label}</span>
                  {thoughtSec <= 0 ? (
                    <span className="text-zinc-500 font-mono font-medium text-[10px]">0s (noted)</span>
                  ) : thoughtSec < 60 ? (
                    <span className="text-rose-400 font-mono font-medium text-[10px]">-{thoughtSec}s</span>
                  ) : (
                    <span className="text-rose-400 font-mono font-medium text-[10px]">
                      -{(thoughtSec / 60).toFixed(1).replace(/\.0$/, "")}m
                    </span>
                  )}
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
        onSubmit={(title, category, duration, notes, pinToQuickBar) => {
          handleQuickPingClick({ title, category, minutes: duration });
        }}
      />
    </div>
  );
}
