"use client";

import React, { useState } from "react";
import { X, Play, Clock, Sparkles, BookOpen, Layers, Plus } from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { SessionType } from "@/types";

interface SessionStartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POMODORO_PRESETS = [25, 50, 90];

export function SessionStartModal({ isOpen, onClose }: SessionStartModalProps) {
  const { subjects, startSession } = useStudyStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ""
  );
  const [topic, setTopic] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("stopwatch");
  const [targetMinutes, setTargetMinutes] = useState<number>(25);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
    
    startSession(
      selectedSubjectId || subjects[0]?.id || "sub-1",
      topic.trim() || "Deep Work Focus Block",
      sessionType,
      targetMinutes
    );

    // Reset & close
    setTopic("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-7 border border-focus/30 shadow-2xl relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-focus/15 border border-focus/30 flex items-center justify-center text-focus">
              <Play className="w-5 h-5 fill-focus text-focus" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Start Study Session</h2>
              <p className="text-xs text-slate-400">Select subject and configure your focus block</p>
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
          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Subject
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {subjects.map((sub) => {
                const isSelected = selectedSubjectId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? "bg-focus/15 border-focus text-white font-semibold shadow-sm"
                        : "bg-surface-elevated/40 border-border text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="text-xs truncate">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Specific Topic / Goal
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Chapter 4 Thermodynamics, LeetCode Trees, SVD Proofs..."
              className="w-full py-2.5 px-3.5 rounded-xl bg-surface-subtle border border-border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-focus transition-colors"
              autoFocus
            />
          </div>

          {/* Timer Mode Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Timer Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSessionType("stopwatch")}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  sessionType === "stopwatch"
                    ? "bg-focus/20 border-focus text-focus font-bold"
                    : "bg-surface-elevated/40 border-border text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Stopwatch (Count-Up)</span>
              </button>

              <button
                type="button"
                onClick={() => setSessionType("pomodoro")}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  sessionType === "pomodoro"
                    ? "bg-focus/20 border-focus text-focus font-bold"
                    : "bg-surface-elevated/40 border-border text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Target / Pomodoro</span>
              </button>
            </div>
          </div>

          {/* Pomodoro Duration Presets */}
          {sessionType === "pomodoro" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Focus Interval
              </label>
              <div className="flex items-center gap-2">
                {POMODORO_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTargetMinutes(mins)}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                      targetMinutes === mins
                        ? "bg-focus text-slate-950 border-focus font-bold"
                        : "bg-surface-elevated/40 border-border text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-focus to-focus-dark hover:opacity-95 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-focus/20 active:scale-[0.98] flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Enter Flow State</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
