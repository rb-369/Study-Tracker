'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Flame, 
  Users, 
  Brain, 
  MoreHorizontal, 
  Target, 
  BarChart3, 
  BookOpen, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudyStore } from '@/lib/store/useStudyStore';

interface MobileNavProps {
  onOpenNewSession?: () => void;
}

export function MobileNav({ onOpenNewSession }: MobileNavProps) {
  const pathname = usePathname();
  const { isAuthenticated, signOut } = useStudyStore();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [pathname]);

  // Don't render on login or auth pages
  if (pathname === '/login' || pathname.startsWith('/auth')) {
    return null;
  }

  const primaryNavItems = [
    { label: 'Focus', href: '/', icon: Flame },
    { label: 'Social', href: '/social', icon: Users },
    { label: 'Mentor', href: '/mentor', icon: Brain },
  ];

  const moreMenuItems = [
    { label: 'Exam Goals', href: '/goals', icon: Target },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Subjects', href: '/subjects', icon: BookOpen },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isMoreActive = moreMenuItems.some((m) => m.href === pathname);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      
      {/* ========================================================================= */}
      {/* THE "MORE" POPUP MENU (Opens Upwards matching reference design) */}
      {/* ========================================================================= */}
      {isMoreMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-16 right-4 z-50 w-56 p-2 rounded-2xl bg-[#121215]/98 border border-zinc-800 shadow-[0_15px_45px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-slide-up text-left"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-2.5 pb-2 mb-1 border-b border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              More Pages
            </span>
            <Link
              href="/settings"
              onClick={() => setIsMoreMenuOpen(false)}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 flex items-center justify-center transition-transform active:scale-95 shadow-sm"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            {moreMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]",
                    isActive 
                      ? "bg-zinc-800 text-teal-300 font-bold shadow-sm" 
                      : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-teal-400" : "text-zinc-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAuthenticated && (
              <div className="pt-1 mt-1 border-t border-zinc-800/80">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-WIDTH BOTTOM NAVIGATION BAR (Edge-to-Edge OG Style) */}
      {/* ========================================================================= */}
      <nav className="bg-[#09090b]/95 backdrop-blur-2xl border-t border-zinc-800/80 px-4 py-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-xl text-[11px] transition-all duration-150 active:scale-95",
                isActive 
                  ? "text-teal-400 font-bold bg-teal-500/10 shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5", isActive ? "text-teal-400" : "text-zinc-400")} />
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* More ("...") Tab Button */}
        <button
          type="button"
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-xl text-[11px] transition-all duration-150 active:scale-95",
            isMoreMenuOpen || isMoreActive
              ? "text-teal-400 font-bold bg-teal-500/10 shadow-sm" 
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <MoreHorizontal className={cn("w-4.5 h-4.5", isMoreMenuOpen || isMoreActive ? "text-teal-400" : "text-zinc-400")} />
          <span className="tracking-tight">More</span>
        </button>
      </nav>

    </div>
  );
}
