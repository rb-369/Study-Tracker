"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Plus, Play, User as UserIcon } from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";

interface NavbarProps {
  onOpenNewSession?: () => void;
}

export function Navbar({ onOpenNewSession }: NavbarProps) {
  const { user, activeSession, isAuthenticated } = useStudyStore();

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full border-b border-border bg-surface-card/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-focus/15 border border-focus/30 flex items-center justify-center text-focus">
          <Sparkles className="w-4 h-4 text-focus" />
        </div>
        <span className="font-bold text-base tracking-tight text-white">StudyFlow</span>
      </Link>

      <div className="flex items-center gap-2">
        {activeSession ? (
          <Link
            href="/"
            className="px-2.5 py-1 rounded-full bg-focus/15 border border-focus/30 text-focus text-xs font-medium flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-focus animate-ping" />
            <span>Active</span>
          </Link>
        ) : (
          <button
            onClick={onOpenNewSession}
            className="px-3 py-1.5 rounded-lg bg-focus text-slate-950 text-xs font-semibold flex items-center gap-1 hover:opacity-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Study</span>
          </button>
        )}

        {isAuthenticated && user && (
          <Link href="/settings" className="p-1 rounded-full border border-border">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-300">
                {user.full_name?.charAt(0) || "U"}
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
