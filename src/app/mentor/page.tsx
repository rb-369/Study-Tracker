"use client";

import React from "react";
import { 
  Brain, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Target, 
  Activity, 
  Database, 
  Globe, 
  Clock, 
  Flame, 
  ShieldCheck,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { formatMinutesToDisplay } from "@/lib/utils";
import { MentorChatThread } from "@/components/ai/MentorChatThread";
import Link from "next/link";

export default function MentorPage() {
  const { sessions, activeSession, subjects, goals, activeTimer } = useStudyStore();

  const completedSessions = sessions.filter((s) => s.gross_duration_seconds > 0);
  const totalGrossMinutes = completedSessions.reduce((acc, s) => acc + Math.round(s.gross_duration_seconds / 60), 0);
  const totalNetMinutes = completedSessions.reduce((acc, s) => acc + Math.round(s.net_focus_seconds / 60), 0);
  
  const avgFocusScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.focus_score, 0) / completedSessions.length)
    : 100;

  const totalDistractions = completedSessions.reduce((acc, s) => acc + (s.thoughts?.length || 0), 0);

  // Identify most frequent distraction trigger across sessions
  const distractionFrequency: Record<string, number> = {};
  completedSessions.forEach((s) => {
    (s.thoughts || []).forEach((t) => {
      distractionFrequency[t.category] = (distractionFrequency[t.category] || 0) + 1;
    });
  });

  const topDistractionCategory = Object.entries(distractionFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-[#0d0d11]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-sm">
              <Brain className="w-4 h-4" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-1.5">
              <span>StudyFlow AI Mentor</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                LangGraph Autonomous
              </span>
            </h1>
          </div>
        </div>

        {/* Integration Status Badges */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>Qdrant Memory</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <Globe className="w-3 h-3 text-teal-400" />
            <span>Tavily Search</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>OpenRouter Free</span>
          </div>
        </div>
      </header>

      {/* Main Dual-Panel Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Student Cognitive Telemetry & Health */}
        <div className="lg:col-span-4 space-y-4">
          {/* Main Telemetry Card */}
          <div className="p-5 rounded-2xl bg-[#121216] border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Cognitive Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Live Memory</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Avg Focus Score</span>
                </div>
                <div className="text-xl font-bold font-mono text-zinc-100">
                  {avgFocusScore}<span className="text-xs text-zinc-500">/100</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>Net Focus Time</span>
                </div>
                <div className="text-xl font-bold font-mono text-zinc-100">
                  {formatMinutesToDisplay(totalNetMinutes)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1 mb-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Total Pings</span>
                </div>
                <div className="text-xl font-bold font-mono text-zinc-100">
                  {totalDistractions}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3 text-indigo-400" />
                  <span>Top Trigger</span>
                </div>
                <div className="text-xs font-bold font-mono text-zinc-200 capitalize truncate mt-1">
                  {topDistractionCategory.replace("_", " ")}
                </div>
              </div>
            </div>

            {/* Live Active Session Banner (if running) */}
            {activeSession && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-300">Live Study Session</div>
                    <div className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                      {activeSession.subject?.name}: {activeSession.topic}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-zinc-200">
                  {Math.round(activeTimer.elapsedSeconds / 60)}m
                </div>
              </div>
            )}
          </div>

          {/* Cognitive Coaching Tips */}
          <div className="p-5 rounded-2xl bg-[#121216] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Core Mentorship Focus</span>
            </div>

            <ul className="text-xs text-zinc-400 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span><strong>Ultradian Rhythm:</strong> Work in 90-minute high-focus waves followed by 15-minute non-screen breaks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span><strong>Friction Inversion:</strong> Log intrusive thoughts in 1-Tap Mind Pings to free working memory without breaking flow.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span><strong>Interleaved Practice:</strong> Alternate between 2 subjects per day to stimulate synaptic plasticity.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Full-Height Interactive Mentor Chat Cockpit */}
        <div className="lg:col-span-8 h-[680px] sm:h-[720px] rounded-2xl bg-[#121216] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
          <MentorChatThread isMiniWidget={false} />
        </div>
      </div>
    </div>
  );
}
