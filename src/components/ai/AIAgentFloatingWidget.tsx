"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, 
  X, 
  Sparkles, 
  Maximize2, 
  ChevronDown
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { MentorChatThread } from "./MentorChatThread";
import { useMentorChatStore } from "@/lib/store/useMentorChatStore";

const LOCAL_STORAGE_KEY_WIDGET_DISMISSED = "studyflow_ai_widget_dismissed";

export function AIAgentFloatingWidget() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    activeSession: activeChat,
    createNewChat,
    updateChatMessages,
  } = useMentorChatStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already on the dedicated /mentor page, don't show the floating widget
  const isOnMentorPage = pathname === "/mentor";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WIDGET_DISMISSED);
      if (saved === "true") {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsOpen(false);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_WIDGET_DISMISSED, "true");
    } catch {}
  };

  const handleRestore = () => {
    setIsDismissed(false);
    setIsOpen(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_WIDGET_DISMISSED, "false");
    } catch {}
  };

  if (isOnMentorPage) return null;

  // If dismissed by user (especially on mobile), show a tiny minimal restore tab on the right edge
  if (isDismissed) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-24 right-2 sm:bottom-6 sm:right-2 z-40 p-2 rounded-l-xl bg-zinc-900/95 hover:bg-zinc-800 border-l border-t border-b border-zinc-700/80 text-emerald-400 shadow-2xl transition-all hover:pr-3 group"
        title="Open AI Mentor"
      >
        <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {/* Expanded Quick Chat Drawer */}
      {isOpen && (
        <div className="w-[92vw] sm:w-96 h-[500px] max-h-[72vh] mb-3 rounded-2xl bg-[#0f0f13] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
          {/* Drawer Header */}
          <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                  StudyFlow AI Mentor
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </span>
                <span className="text-[10px] text-zinc-400 block font-mono">Cognitive & Focus Coach</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/mentor");
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                title="Open Dedicated Fullscreen Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Minimize Drawer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                title="Dismiss Widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Thread */}
          <div className="flex-1 overflow-hidden">
            <MentorChatThread
              isMiniWidget={true}
              activeChat={activeChat}
              onUpdateChatMessages={updateChatMessages}
              onNewChat={createNewChat}
              onOpenFullscreen={() => {
                setIsOpen(false);
                router.push("/mentor");
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Action Button (Evernote-style luminous FAB) */}
      {!isOpen && (
        <div className="relative group flex items-center">
          {/* Dismiss 'X' Button on the trigger */}
          <button
            onClick={handleDismiss}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
            title="Dismiss AI Widget"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Main Floating Bubble */}
          <button
            onClick={() => setIsOpen(true)}
            className="h-12 w-12 sm:w-auto sm:px-4 rounded-full bg-zinc-900/90 hover:bg-zinc-850 border border-emerald-500/40 hover:border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center sm:gap-2.5 transition-all duration-200 active:scale-95 group backdrop-blur-xl"
            title="Open AI Mentor"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-emerald-500/25 animate-ping opacity-75" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center text-zinc-950 font-bold shadow-md group-hover:scale-105 transition-transform">
                <Brain className="w-4 h-4 text-zinc-950" />
              </div>
            </div>

            <div className="text-left pr-1 hidden sm:block">
              <div className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                <span>AI Mentor</span>
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">Cognitive Coach</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
