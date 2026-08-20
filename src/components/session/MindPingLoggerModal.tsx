"use client";

import React, { useState } from "react";
import { X, Sparkles, AlertCircle, Plus } from "lucide-react";
import { ThoughtCategory } from "@/types";
import { CATEGORY_METADATA } from "@/lib/utils";

interface MindPingLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: ThoughtCategory, durationMinutes: number, notes?: string) => void;
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

const DURATION_PRESETS = [1, 2, 3, 5, 10, 15];

export function MindPingLoggerModal({ isOpen, onClose, onSubmit }: MindPingLoggerModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ThoughtCategory>("phone_social");
  const [duration, setDuration] = useState<number>(2);
  const [customDuration, setCustomDuration] = useState<string>("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || CATEGORY_METADATA[category].label;
    const finalDuration = customDuration ? parseFloat(customDuration) || 2 : duration;
    
    onSubmit(finalTitle, category, Math.max(0.5, finalDuration), notes.trim() || undefined);
    
    // Reset state
    setTitle("");
    setCategory("phone_social");
    setDuration(2);
    setCustomDuration("");
    setNotes("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-2xl glass-panel p-6 border border-amber-500/30 shadow-2xl relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Log Mind Ping</h2>
              <p className="text-xs text-slate-400">Capture stray thought & duration to isolate net focus time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category Selector Pills */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Distraction Category
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
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold shadow-sm"
                        : "bg-surface-elevated/40 border-border text-slate-400 hover:text-slate-200 hover:border-slate-700"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
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
                      ? "bg-focus/15 border-focus/40 text-focus"
                      : "bg-surface-elevated/30 border-border/70 text-slate-400 hover:text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              What took your attention?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Checked Twitter notification, Hunger craving..."
              className="w-full py-2 px-3 rounded-xl bg-surface-subtle border border-border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
              autoFocus
            />
          </div>

          {/* Approx Duration Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Approx Duration Lost
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {customDuration ? `${customDuration} mins` : `${duration} mins`}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
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
                      ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                      : "bg-surface-elevated/40 border-border text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {d}m
                </button>
              ))}
              <input
                type="number"
                min="0.5"
                max="60"
                step="0.5"
                placeholder="Custom"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="w-20 py-1.5 px-2 rounded-lg bg-surface-subtle border border-border text-xs text-center text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Optional Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Additional Reflection (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why did this happen? (e.g. brain felt tired, room was too warm)"
              className="w-full py-1.5 px-3 rounded-xl bg-surface-subtle border border-border text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              Log Mind Ping & Return to Flow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
