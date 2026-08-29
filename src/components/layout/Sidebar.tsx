"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Flame, 
  BarChart3, 
  BookOpen, 
  Settings, 
  LogOut, 
  Play, 
  Plus, 
  Target, 
  Brain, 
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { cn } from "@/lib/utils";
import { UserLevelBadge } from "@/components/gamification/UserLevelBadge";

interface SidebarProps {
  onOpenNewSession?: () => void;
  onOpenNewSubject?: () => void;
}

const LOCAL_STORAGE_SIDEBAR_COLLAPSED = "studyflow_sidebar_collapsed";

export function Sidebar({ onOpenNewSession, onOpenNewSubject }: SidebarProps) {
  const pathname = usePathname();
  const { user, activeSession, subjects, signOut } = useStudyStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_COLLAPSED);
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LOCAL_STORAGE_SIDEBAR_COLLAPSED, String(next));
      } catch {}
      return next;
    });
  };

  const navItems = [
    { label: "Focus Console", href: "/", icon: Flame },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Social & Groups", href: "/social", icon: Users },
    { label: "AI Mentor", href: "/mentor", icon: Brain },
    { label: "Exam Goals", href: "/goals", icon: Target },
    { label: "Subjects", href: "/subjects", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col border-r border-zinc-800/80 bg-[#0c0c0e] h-screen sticky top-0 z-30 select-none transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header & Toggle Button */}
      <div className={cn(
        "py-4 border-b border-zinc-800/80 flex items-center justify-between transition-all",
        isCollapsed ? "px-3 justify-center flex-col gap-2" : "px-4"
      )}>
        <Link href="/" className="flex items-center gap-2.5 group overflow-hidden">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/25 flex items-center justify-center bg-zinc-900 group-hover:scale-105 transition-transform duration-200 shadow-sm flex-shrink-0">
            <img
              src="/Study_flow_logo.png"
              alt="StudyFlow Logo"
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-zinc-100">StudyFlow</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Deep Work Engine</p>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800/80 transition-all active:scale-95 shadow-sm"
          title={isCollapsed ? "Expand Sidebar (Desktop)" : "Collapse Sidebar (Desktop)"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-zinc-400 hover:text-zinc-200" />
          )}
        </button>
      </div>

      {/* Main Action Area */}
      <div className={cn("pb-2", isCollapsed ? "p-2" : "p-3.5")}>
        {activeSession ? (
          <Link
            href="/"
            className={cn(
              "rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 transition-all flex items-center text-xs font-semibold",
              isCollapsed ? "p-2.5 justify-center" : "w-full py-2.5 px-3 justify-between"
            )}
            title="Active Flow Block"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              {!isCollapsed && <span className="truncate">Active Flow Block</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                Open
              </span>
            )}
          </Link>
        ) : (
          <button
            onClick={onOpenNewSession}
            className={cn(
              "rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center shadow-sm",
              isCollapsed ? "p-2.5 w-full" : "w-full py-2.5 px-3 gap-2"
            )}
            title="Start Focus Session"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-950 flex-shrink-0" />
            {!isCollapsed && <span>Start Focus Session</span>}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={cn("flex-1 space-y-1 overflow-y-auto", isCollapsed ? "px-2 py-2" : "px-3 py-2")}>
        {!isCollapsed && (
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            Navigation
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl text-xs font-medium transition-all duration-150 relative group",
                isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2",
                isActive
                  ? "bg-zinc-800/90 text-zinc-100 font-semibold border border-zinc-700/60 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-emerald-400" : "text-zinc-400")} />
              {!isCollapsed && <span>{item.label}</span>}
              
              {/* Floating Tooltip in Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Subjects Quick List in Sidebar (When Expanded) */}
        {!isCollapsed && (
          <div className="pt-4">
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
                <div className="px-2.5 py-2.5 rounded-lg border border-dashed border-zinc-800/80 text-center">
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
                subjects.slice(0, 4).map((s) => (
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
        )}
      </nav>

      {/* User Level Badge & Profile */}
      <div className={cn("border-t border-zinc-800/80 space-y-2", isCollapsed ? "p-2" : "p-3")}>
        {!isCollapsed ? (
          <>
            <UserLevelBadge level={user?.level || 1} xp={user?.xp || 0} />
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link href="/settings" className="p-1 rounded-full border border-zinc-800 hover:border-zinc-700" title={user?.full_name || "Profile"}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
              )}
            </Link>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
