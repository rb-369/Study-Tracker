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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800/80 px-3 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors",
              isActive ? "text-emerald-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-zinc-500")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
