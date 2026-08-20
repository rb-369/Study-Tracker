import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ThoughtCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSecondsToTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatMinutesToDisplay(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

export function formatHoursDecimal(minutes: number): string {
  const hours = minutes / 60;
  return hours.toFixed(1);
}

export const CATEGORY_METADATA: Record<ThoughtCategory, { label: string; icon: string; badgeClass: string; bgClass: string }> = {
  phone_social: {
    label: "Phone / Social Media",
    icon: "Smartphone",
    badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    bgClass: "#f43f5e",
  },
  hunger_snack: {
    label: "Snack / Hunger",
    icon: "Utensils",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    bgClass: "#f97316",
  },
  random_idea: {
    label: "Random Thought / Idea",
    icon: "Lightbulb",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    bgClass: "#f59e0b",
  },
  anxiety_stress: {
    label: "Stress / Overwhelm",
    icon: "AlertCircle",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    bgClass: "#a855f7",
  },
  urgent_chore: {
    label: "Urgent Chore / Errand",
    icon: "CheckSquare",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    bgClass: "#3b82f6",
  },
  other: {
    label: "Other Distraction",
    icon: "MoreHorizontal",
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    bgClass: "#64748b",
  },
};

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
