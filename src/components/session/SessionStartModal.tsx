"use client";

import React, { useState } from "react";
import { X, Play, Clock, Plus, BookOpen, Sparkles, Target } from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { SessionType } from "@/types";

interface SessionStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoalId?: string;
  initialSubjectId?: string;
}

const POMODORO_PRESETS = [25, 45, 50, 90];
const SUBJECT_SUGGESTIONS = [
  { name: "Computer Science", color: "#10b981" },
  { name: "Mathematics", color: "#6366f1" },
  { name: "Physics", color: "#3b82f6" },
  { name: "General Study", color: "#f59e0b" },
];

export function SessionStartModal({
  isOpen,
  onClose,
  initialGoalId,
  initialSubjectId,
}: SessionStartModalProps) {
  const { subjects, goals, createSubject, startSession } = useStudyStore();

  const activeGoals = goals.filter((g) => g.status === "active" || !g.status);

  const [selectedGoalId, setSelectedGoalId] = useState<string>(initialGoalId || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ""
  );
  const [topic, setTopic] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("stopwatch");
  const [targetMinutes, setTargetMinutes] = useState<number>(25);

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialGoalId) setSelectedGoalId(initialGoalId);
      if (initialSubjectId) setSelectedSubjectId(initialSubjectId);
    }
  }, [isOpen, initialGoalId, initialSubjectId]);

  // Sync selectedSubjectId when subjects load
  React.useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Quick inline subject creation if subjects list is empty
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjColor, setNewSubjColor] = useState("#10b981");

  if (!isOpen) return null;

  const handleQuickAddSubject = async (name: string, color: string) => {
    try {
      const created = await createSubject({
        name,
        color,
        icon: "BookOpen",
        target_weekly_hours: 10,
      });
      setSelectedSubjectId(created.id);
      setIsCreatingInline(false);
      setNewSubjName("");
    } catch (e) {
      console.error("Error creating subject:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetSubjId = selectedSubjectId;

    // If user has no subject selected, handle gracefully
    if (!targetSubjId) {
      if (subjects.length > 0) {
        targetSubjId = subjects[0].id;
      } else {
        // Create default general subject
        try {
          const created = await createSubject({
            name: "General Study",
            color: "#10b981",
            icon: "BookOpen",
            target_weekly_hours: 10,
          });
          targetSubjId = created.id;
        } catch (e) {
          targetSubjId = "general";
        }
      }
    }

    startSession(
      targetSubjId,
      topic.trim() || "Deep Focus Block",
      sessionType,
      targetMinutes,
      selectedGoalId || undefined
    );

    setTopic("");
    setSelectedGoalId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#121215] border border-zinc-800 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Start Focus Session</h2>
              <p className="text-xs text-zinc-500">Configure your study block parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Exam / Goal Target Selection (Optional) */}
          {activeGoals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Exam / Milestone Target (Optional)
              </label>
              <div className="relative">
                <select
                  value={selectedGoalId}
                  onChange={(e) => {
                    const newGoalId = e.target.value;
                    setSelectedGoalId(newGoalId);
                    // If this goal has specific subject allocations, preselect the first one if current subject is not in it
                    if (newGoalId) {
                      const g = activeGoals.find((goal) => goal.id === newGoalId);
                      if (g && g.subject_allocations && g.subject_allocations.length > 0) {
                        const hasCurrent = g.subject_allocations.some((a) => a.subject_id === selectedSubjectId);
                        if (!hasCurrent) {
                          setSelectedSubjectId(g.subject_allocations[0].subject_id);
                        }
                      }
                    }
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="">None (Standalone Focus Block)</option>
                  {activeGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      🎯 {g.title} ({g.target_total_hours}h target &bull; {new Date(g.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Subject Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Subject / Course
              </label>
              {!isCreatingInline && (
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(true)}
                  className="text-[11px] text-emerald-400 hover:underline font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Subject</span>
                </button>
              )}
            </div>

            {isCreatingInline ? (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubjName}
                    onChange={(e) => setNewSubjName(e.target.value)}
                    placeholder="Subject Name (e.g. Organic Chemistry)"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <input
                    type="color"
                    value={newSubjColor}
                    onChange={(e) => setNewSubjColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Choose color"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingInline(false)}
                    className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newSubjName.trim()}
                    onClick={() => handleQuickAddSubject(newSubjName.trim(), newSubjColor)}
                    className="px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold disabled:opacity-50"
                  >
                    Save Subject
                  </button>
                </div>
              </div>
            ) : subjects.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs text-zinc-400 mb-2">
                  No subjects created yet. Pick a starter preset:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECT_SUGGESTIONS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => handleQuickAddSubject(s.name, s.color)}
                      className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs text-zinc-200 flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sub.color || "#10b981" }}
                      />
                      <span className="text-xs truncate">{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Specific Topic / Goal
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Chapter 4 Problem Set, System Design, LeetCode..."
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Timer Mode Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Timer Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSessionType("stopwatch")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  sessionType === "stopwatch"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Stopwatch (Count-Up)</span>
              </button>

              <button
                type="button"
                onClick={() => setSessionType("pomodoro")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  sessionType === "pomodoro"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pomodoro Target</span>
              </button>
            </div>
          </div>

          {/* Pomodoro Presets */}
          {sessionType === "pomodoro" && (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <span className="text-[11px] text-zinc-400 font-medium">Sprint Duration</span>
              <div className="flex items-center gap-2">
                {POMODORO_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTargetMinutes(mins)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                      targetMinutes === mins
                        ? "bg-emerald-500 text-zinc-950 font-bold"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Begin Focus Block</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
