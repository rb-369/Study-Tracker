'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Flame, 
  Users, 
  Brain, 
  MoreHorizontal, 
  Sparkles, 
  Play, 
  Target, 
  BarChart3, 
  BookOpen, 
  Settings, 
  LogOut, 
  X,
  Zap,
  Gamepad2
} from 'lucide-react';
import { useStudyStore } from '@/lib/store/useStudyStore';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeSession, isAuthenticated, user, signOut } = useStudyStore();
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
  ];

  return (
    <div className="lg:hidden fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3 pointer-events-auto relative">
        
        {/* ========================================================================= */}
        {/* THE "MORE" POPUP MENU (Opens Upwards matching reference image) */}
        {/* ========================================================================= */}
        {isMoreMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute bottom-16 left-auto right-16 z-50 w-60 p-2.5 rounded-3xl bg-[#141417]/95 border border-zinc-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-slide-up text-left"
          >
            {/* Top Row: Floating Settings Gear */}
            <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-zinc-800/80">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Explore Menu
              </span>
              <Link
                href="/settings"
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 flex items-center justify-center transition-transform active:scale-95 shadow-md"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all active:scale-[0.98] ${
                      isActive 
                        ? 'bg-zinc-800 text-white shadow-sm' 
                        : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isAuthenticated && (
                <div className="pt-1.5 mt-1 border-t border-zinc-800/80">
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all active:scale-[0.98]"
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
        {/* MAIN DOCK CAPSULE (Left & Center) */}
        {/* ========================================================================= */}
        <nav className="flex-1 py-2 px-3 rounded-full bg-[#121215]/95 border border-zinc-800/90 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-center justify-around">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-3.5 py-1.5 rounded-2xl transition-all active:scale-95 ${
                  isActive
                    ? 'bg-zinc-800/90 text-teal-300 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-zinc-400'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold text-white' : 'text-zinc-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More (•••) Button */}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3.5 py-1.5 rounded-2xl transition-all active:scale-95 ${
              isMoreMenuOpen || moreMenuItems.some((m) => m.href === pathname)
                ? 'bg-zinc-800/90 text-teal-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${isMoreMenuOpen ? 'text-teal-400' : 'text-zinc-400'}`} />
            <span className={`text-[10px] font-medium ${isMoreMenuOpen ? 'font-bold text-white' : 'text-zinc-400'}`}>
              More
            </span>
          </button>
        </nav>

        {/* ========================================================================= */}
        {/* CIRCULAR FLOATING ACTION BUTTON (Right) */}
        {/* ========================================================================= */}
        <button
          type="button"
          onClick={() => {
            router.push('/');
          }}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white text-zinc-950 font-black shadow-[0_0_25px_rgba(255,255,255,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all flex-shrink-0"
          title={activeSession ? 'View Active Flow Block' : 'Start Focus Session'}
        >
          {activeSession ? (
            <div className="relative flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute" />
              <Flame className="w-6 h-6 text-emerald-600 relative" />
            </div>
          ) : (
            <Sparkles className="w-6 h-6 text-zinc-950 fill-zinc-950" />
          )}
        </button>

      </div>
    </div>
  );
}
