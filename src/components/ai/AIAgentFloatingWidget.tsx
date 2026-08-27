"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, 
  X, 
  Sparkles, 
  MessageSquare, 
  Maximize2, 
  Minimize2,
  ChevronDown
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { MentorChatThread } from "./MentorChatThread";

const LOCAL_STORAGE_KEY_WIDGET_DISMISSED = "studyflow_ai_widget_dismissed";

export function AIAgentFloatingWidget() {
  const router = useRouter();
  const pathname = usePathname();

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
        className="fixed bottom-6 right-2 z-40 p-2 rounded-l-xl bg-zinc-900/90 hover:bg-zinc-800 border-l border-t border-b border-zinc-700/80 text-emerald-400 shadow-xl transition-all hover:pr-3 group"
        title="Open AI Mentor"
      >
        <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {/* Expanded Quick Chat Drawer */}
      {isOpen && (
        <div className="w-[92vw] sm:w-96 h-[500px] max-h-[75vh] mb-3 rounded-2xl bg-[#101014] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
          {/* Drawer Header */}
          <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-zinc-100">StudyFlow AI Mentor</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/mentor");
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                title="Open Dedicated Fullscreen Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Minimize Drawer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
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
              onOpenFullscreen={() => {
                setIsOpen(false);
                router.push("/mentor");
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Pill Button Trigger */}
      {!isOpen && (
        <div className="relative group flex items-center">
          {/* Dismiss 'X' Button on the trigger */}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
            title="Dismiss AI Widget"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Main Floating Bubble */}
          <button
            onClick={() => setIsOpen(true)}
            className="h-12 px-3.5 sm:px-4 rounded-full bg-[#121216] hover:bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500/60 shadow-xl flex items-center gap-2.5 transition-all active:scale-95 group"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-7 h-7 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-zinc-950 font-bold shadow-sm">
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
