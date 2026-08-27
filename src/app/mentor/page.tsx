"use client";

import React, { useState } from "react";
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
  Plus,
  MessageSquare,
  Trash2,
  Menu,
  X,
  History
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { useMentorChatStore } from "@/lib/store/useMentorChatStore";
import { formatMinutesToDisplay } from "@/lib/utils";
import { MentorChatThread } from "@/components/ai/MentorChatThread";
import Link from "next/link";

export default function MentorPage() {
  const { sessions, activeSession, activeTimer } = useStudyStore();
  const {
    sessions: chatSessions,
    activeChatId,
    activeSession: activeChat,
    isLoaded,
    createNewChat,
    selectChat,
    deleteChat,
    updateChatMessages,
  } = useMentorChatStore();

  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  const completedSessions = sessions.filter((s) => s.gross_duration_seconds > 0);
  const totalNetMinutes = completedSessions.reduce((acc, s) => acc + Math.round(s.net_focus_seconds / 60), 0);
  
  const avgFocusScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.focus_score, 0) / completedSessions.length)
    : 100;

  const totalDistractions = completedSessions.reduce((acc, s) => acc + (s.thoughts?.length || 0), 0);

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-[#0d0d11]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile History Drawer Toggle */}
          <button
            onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
            title="Toggle Chats"
          >
            {isHistorySidebarOpen ? <X className="w-4 h-4" /> : <History className="w-4 h-4" />}
          </button>

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
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>Qdrant Memory</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <Globe className="w-3 h-3 text-teal-400" />
            <span>Tavily Search</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>OpenRouter Free</span>
          </div>
        </div>
      </header>

      {/* Main Dual-Panel Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: ChatGPT / Gemini Style Chat History & Telemetry */}
        <div
          className={`lg:col-span-4 space-y-4 ${
            isHistorySidebarOpen ? "block fixed inset-x-3 top-16 bottom-3 z-40 bg-[#0c0c10] p-4 rounded-2xl border border-zinc-800 shadow-2xl overflow-y-auto" : "hidden lg:block"
          }`}
        >
          {/* New Chat Button */}
          <button
            onClick={() => {
              createNewChat();
              setIsHistorySidebarOpen(false);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-bold text-xs shadow-lg transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-950 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 uppercase tracking-wider">Chat</span>
          </button>

          {/* Chat History List */}
          <div className="p-4 rounded-2xl bg-[#121216] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chat History</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{chatSessions.length} chats</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    selectChat(chat.id);
                    setIsHistorySidebarOpen(false);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    chat.id === activeChatId
                      ? "bg-zinc-800/90 border border-emerald-500/40 text-emerald-300"
                      : "bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-800/60 text-zinc-300"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-semibold truncate group-hover:text-emerald-400 transition-colors">
                      {chat.title || "New Conversation"}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {new Date(chat.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })} • {chat.messages.length} messages
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-700/50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Telemetry Overview Card */}
          <div className="p-4 rounded-2xl bg-[#121216] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  Cognitive Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Live</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Avg Focus</span>
                </div>
                <div className="text-base font-bold font-mono text-zinc-100 mt-0.5">
                  {avgFocusScore}<span className="text-[10px] text-zinc-500">/100</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>Net Focus</span>
                </div>
                <div className="text-base font-bold font-mono text-zinc-100 mt-0.5">
                  {formatMinutesToDisplay(totalNetMinutes)}
                </div>
              </div>
            </div>

            {/* Live Active Session Banner (if running) */}
            {activeSession && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-300">Live Study Block</div>
                    <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
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
        </div>

        {/* Right Side: Full-Height Interactive Mentor Chat Cockpit */}
        <div className="lg:col-span-8 h-[650px] sm:h-[720px] rounded-2xl bg-[#121216] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
          <MentorChatThread
            isMiniWidget={false}
            activeChat={activeChat}
            onUpdateChatMessages={updateChatMessages}
            onNewChat={createNewChat}
          />
        </div>
      </div>
    </div>
  );
}
