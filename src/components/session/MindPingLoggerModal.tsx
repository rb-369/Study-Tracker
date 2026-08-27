"use client";

import React, { useState } from "react";
import { X, Sparkles, Brain, Clock, Pin } from "lucide-react";
import { ThoughtCategory } from "@/types";
import { CATEGORY_METADATA } from "@/lib/utils";
import { useStudyStore } from "@/lib/store/useStudyStore";

interface MindPingLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: ThoughtCategory, durationMinutes: number, notes?: string, pinToQuickBar?: boolean) => void;
}

const PRESET_TOPICS = [
  "Checked phone / WhatsApp",
  "Hungry / Got a snack",
  "Random idea occurred",
  "Worried about deadlines",
  "Checked social media",
  "Went to get water",
  "Urgent message reply",
  "Browser tab rabbit hole",
];

const DURATION_PRESETS = [0.5, 1, 2, 3, 5, 10, 15];

export function MindPingLoggerModal({ isOpen, onClose, onSubmit }: MindPingLoggerModalProps) {
  const { addCustomQuickPing } = useStudyStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ThoughtCategory>("phone_social");
  const [duration, setDuration] = useState<number>(2);
  const [customDuration, setCustomDuration] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [pinToQuickBar, setPinToQuickBar] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || CATEGORY_METADATA[category].label;
    const finalDuration = customDuration ? parseFloat(customDuration) || 2 : duration;
    
    if (pinToQuickBar) {
      addCustomQuickPing({
        title: finalTitle,
        category,
        minutes: Math.max(0.5, finalDuration),
        icon: category === "phone_social" ? "📱" : category === "hunger_snack" ? "☕" : category === "random_idea" ? "💡" : category === "anxiety_stress" ? "💭" : "⚡",
      });
    }

    onSubmit(finalTitle, category, Math.max(0.5, finalDuration), notes.trim() || undefined, pinToQuickBar);
    
    // Reset state
    setTitle("");
    setCategory("phone_social");
    setDuration(2);
    setCustomDuration("");
    setNotes("");
    setPinToQuickBar(false);
    onClose();
  };

  const handlePresetClick = (preset: string) => {
    setTitle(preset);
    if (preset.toLowerCase().includes("phone") || preset.toLowerCase().includes("whatsapp") || preset.toLowerCase().includes("social")) {
      setCategory("phone_social");
    } else if (preset.toLowerCase().includes("snack") || preset.toLowerCase().includes("hungry") || preset.toLowerCase().includes("water")) {
      setCategory("hunger_snack");
    } else if (preset.toLowerCase().includes("worried") || preset.toLowerCase().includes("deadline")) {
      setCategory("anxiety_stress");
    } else if (preset.toLowerCase().includes("idea") || preset.toLowerCase().includes("rabbit hole")) {
      setCategory("random_idea");
    } else {
      setCategory("urgent_chore");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg rounded-2xl bg-[#121215] border border-zinc-800 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Brain className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Log Mind Ping</h2>
              <p className="text-xs text-zinc-500">Capture stray thought & duration to isolate net focus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category Selector Pills */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Distraction Trigger
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_METADATA) as ThoughtCategory[]).map((cat) => {
                const meta = CATEGORY_METADATA[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span className="truncate">{meta.label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    title === preset
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Thought / Distraction Note
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Checked phone notification, hunger craving, random idea..."
              className="w-full py-2 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Approx Duration Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Duration Subtracted
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {customDuration ? `${customDuration}m` : duration === 0.5 ? "30s" : `${duration}m`}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDuration(d);
                    setCustomDuration("");
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                    duration === d && !customDuration
                      ? "bg-amber-500 text-zinc-950 border-amber-500 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {d === 0.5 ? "30s" : `${d}m`}
                </button>
              ))}
              <input
                type="number"
                min="0.5"
                max="60"
                step="0.5"
                placeholder="Mins"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="w-16 py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-center text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Pin to Quick Bar Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={pinToQuickBar}
                onChange={(e) => setPinToQuickBar(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Pin this distraction to 1-Tap Quick Bar</span>
              </div>
            </label>
          </div>

          {/* Action Buttons: Cancel and Submit */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              Log Mind Ping & Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
