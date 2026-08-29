"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, BarChart3, BookOpen, Settings, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onOpenNewSession?: () => void;
}

export function MobileNav({ onOpenNewSession }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Focus", href: "/", icon: Flame },
    { label: "Social", href: "/social", icon: Users },
    { label: "Goals", href: "/goals", icon: Target },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Subjects", href: "/subjects", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#09090b]/90 backdrop-blur-2xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[11px] transition-all duration-150 active:scale-95",
              isActive 
                ? "text-emerald-400 font-bold bg-emerald-500/10 shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-zinc-400")} />
            <span className="tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
