"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Play, LogOut } from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";

interface NavbarProps {
  onOpenNewSession?: () => void;
}

export function Navbar({ onOpenNewSession }: NavbarProps) {
  const { user, activeSession, isAuthenticated, signOut } = useStudyStore();

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/25 flex items-center justify-center bg-zinc-900 shadow-sm">
          <img
            src="/Study_flow_logo.png"
            alt="StudyFlow Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-bold text-sm tracking-tight text-zinc-100">StudyFlow</span>
      </Link>

      <div className="flex items-center gap-2">
        {activeSession ? (
          <Link
            href="/"
            className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Active</span>
          </Link>
        ) : (
          <button
            onClick={onOpenNewSession}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold flex items-center gap-1 hover:bg-white active:scale-95 transition-all"
          >
            <Play className="w-3 h-3 fill-zinc-950" />
            <span>Start</span>
          </button>
        )}

        {isAuthenticated && user && (
          <Link href="/settings" className="p-1 rounded-full border border-zinc-800">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300">
                {user.full_name?.charAt(0) || "U"}
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
