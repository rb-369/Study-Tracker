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
  Play
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onOpenNewSession?: () => void;
}

export function Sidebar({ onOpenNewSession }: SidebarProps) {
  const pathname = usePathname();
  const { user, activeSession, signOut } = useStudyStore();

  const navItems = [
    { label: "Dashboard", href: "/", icon: Flame },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Subjects", href: "/subjects", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-surface-card/95 backdrop-blur-xl h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-border/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-focus/15 border border-focus/30 flex items-center justify-center text-focus group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-focus" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">StudyFlow</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-focus/10 text-focus border border-focus/25 font-semibold">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Deep Work & Mind Pings</p>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="px-4 pt-5 pb-2">
        {activeSession ? (
          <Link
            href="/"
            className="w-full py-2.5 px-3 rounded-xl bg-focus/15 border border-focus/30 text-focus hover:bg-focus/20 transition-all flex items-center justify-between text-sm font-medium animate-pulse"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-focus animate-ping" />
              <span className="truncate">Session Active</span>
            </div>
            <span className="text-xs font-mono bg-focus/20 px-2 py-0.5 rounded-md">
              View
            </span>
          </Link>
        ) : (
          <button
            onClick={onOpenNewSession}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-focus to-focus-dark text-slate-950 font-semibold hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-focus/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Focus Block</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-focus/10 text-focus border border-focus/20 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-focus" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-border/80">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated/50 border border-border/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover border border-focus/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                {user?.full_name?.charAt(0) || "U"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.full_name || "Guest Learner"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || "Local Mode"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
