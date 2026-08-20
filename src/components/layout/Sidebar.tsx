"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Flame, 
  BarChart3, 
  BookOpen, 
  Settings, 
  LogOut, 
  Sparkles,
  Play,
  CheckCircle2,
  Plus
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onOpenNewSession?: () => void;
  onOpenNewSubject?: () => void;
}

export function Sidebar({ onOpenNewSession, onOpenNewSubject }: SidebarProps) {
  const pathname = usePathname();
  const { user, activeSession, subjects, signOut } = useStudyStore();

  const navItems = [
    { label: "Focus Console", href: "/", icon: Flame },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Subjects & Goals", href: "/subjects", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800/80 bg-[#0c0c0e] h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-zinc-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-zinc-100">StudyFlow</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                AI
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Deep Work Engine</p>
          </div>
        </Link>
      </div>

      {/* Main Action Area */}
      <div className="p-3.5 pb-2">
        {activeSession ? (
          <Link
            href="/"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 transition-all flex items-center justify-between text-xs font-semibold"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="truncate">Active Flow Block</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
              Open
            </span>
          </Link>
        ) : (
          <button
            onClick={onOpenNewSession}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Start Focus Session</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-zinc-800/90 text-zinc-100 font-semibold border border-zinc-700/60 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-zinc-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Subjects Quick List in Sidebar */}
        <div className="pt-5">
          <div className="px-2 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            <span>Enrolled Subjects</span>
            {onOpenNewSubject && (
              <button
                onClick={onOpenNewSubject}
                className="text-zinc-400 hover:text-emerald-400 p-0.5"
                title="Add Subject"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1 mt-1">
            {subjects.length === 0 ? (
              <div className="px-2.5 py-3 rounded-lg border border-dashed border-zinc-800/80 text-center">
                <p className="text-[11px] text-zinc-500">No subjects yet</p>
                {onOpenNewSubject && (
                  <button
                    onClick={onOpenNewSubject}
                    className="mt-1 text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    + Add first subject
                  </button>
                )}
              </div>
            ) : (
              subjects.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-zinc-400 hover:bg-zinc-900/50"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.color || "#10b981" }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {s.target_weekly_hours}h/w
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center gap-2 overflow-hidden">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-7 h-7 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-semibold text-zinc-300">
                {user?.full_name?.charAt(0) || "U"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {user?.full_name || "Guest Scholar"}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {user?.email || "Local Mode"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
