"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Target, 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  Check, 
  AlertCircle,
  Layers
} from "lucide-react";
import { ExamGoal, Subject, SubjectAllocation } from "@/types";
import { useStudyStore } from "@/lib/store/useStudyStore";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: ExamGoal | null;
}

const PRESET_TITLES = [
  "Final Exam Study",
  "PT-1 Exam Prep",
  "Practical Exam Prep",
  "Midterm Revision",
  "Semester Finals",
  "Competitive Exam Sprint",
];

const PRESET_COLORS = [
  "#10b981", // emerald
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#14b8a6", // teal
];

export function CreateGoalModal({
  isOpen,
  onClose,
  initialGoal,
}: CreateGoalModalProps) {
  const { subjects, createGoal, updateGoal } = useStudyStore();

  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetTotalHours, setTargetTotalHours] = useState(20);
  const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
  const [color, setColor] = useState("#10b981");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Default target date helper (+14 days)
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setTargetDate(initialGoal.target_date);
      setTargetTotalHours(initialGoal.target_total_hours);
      setAllocations(initialGoal.subject_allocations || []);
      setColor(initialGoal.color || "#10b981");
      setNotes(initialGoal.notes || "");
    } else {
      setTitle("");
      setTargetDate(getDefaultDate());
      setTargetTotalHours(20);
      setColor("#10b981");
      setNotes("");

      // Default subject allocations if user has subjects
      if (subjects.length > 0) {
        const defaultPerSubject = Math.max(
          2,
          Math.floor(20 / subjects.length)
        );
        setAllocations(
          subjects.map((s) => ({
            subject_id: s.id,
            target_hours: defaultPerSubject,
          }))
        );
      } else {
        setAllocations([]);
      }
    }
    setErrorMsg("");
  }, [initialGoal, isOpen, subjects]);

  if (!isOpen) return null;

  const handleSubjectToggle = (subjectId: string) => {
    const exists = allocations.some((a) => a.subject_id === subjectId);
    if (exists) {
      setAllocations(allocations.filter((a) => a.subject_id !== subjectId));
    } else {
      setAllocations([
        ...allocations,
        { subject_id: subjectId, target_hours: 5 },
      ]);
    }
  };

  const handleSubjectHoursChange = (subjectId: string, hours: number) => {
    setAllocations(
      allocations.map((a) =>
        a.subject_id === subjectId ? { ...a, target_hours: Math.max(1, hours) } : a
      )
    );
  };

  const allocatedSum = allocations.reduce((acc, a) => acc + (a.target_hours || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter an exam / goal title.");
      return;
    }
    if (!targetDate) {
      setErrorMsg("Please select a target exam deadline.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialGoal) {
        await updateGoal(initialGoal.id, {
          title: title.trim(),
          target_date: targetDate,
          target_total_hours: targetTotalHours,
          subject_allocations: allocations,
          color,
          notes: notes.trim() || undefined,
        });
      } else {
        await createGoal({
          title: title.trim(),
          target_date: targetDate,
          target_total_hours: targetTotalHours,
          subject_allocations: allocations,
          color,
          icon: "Target",
          status: "active",
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error("Error saving goal:", err);
      setErrorMsg("Failed to save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setShortcutDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setTargetDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-lg my-8 rounded-2xl bg-[#121215] border border-zinc-800 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                color: color,
              }}
            >
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {initialGoal ? "Edit Exam Goal" : "Create Exam / Milestone Goal"}
              </h2>
              <p className="text-xs text-zinc-500">
                Group study blocks and set target hours for exams
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Goal Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Goal / Exam Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final Exam Study, PT-1 Prep, Practical Exam"
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
            {/* Presets */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-zinc-500">Presets:</span>
              {PRESET_TITLES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Target Exam Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Exam / Deadline Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShortcutDate(7)}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium"
              >
                +1 Wk
              </button>
              <button
                type="button"
                onClick={() => setShortcutDate(14)}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium"
              >
                +2 Wk
              </button>
              <button
                type="button"
                onClick={() => setShortcutDate(30)}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium"
              >
                +1 Mo
              </button>
            </div>
          </div>

          {/* Total Target Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Target Focus Hours
              </label>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {targetTotalHours} Hours
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              step="5"
              value={targetTotalHours}
              onChange={(e) => setTargetTotalHours(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
              <span>5h</span>
              <span>40h</span>
              <span>80h</span>
              <span>150h</span>
            </div>
          </div>

          {/* Multi-Subject Allocations */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Included Subjects & Target Breakdown
              </label>
              <span className={`text-[11px] font-mono ${
                allocatedSum === targetTotalHours 
                  ? "text-emerald-400 font-medium" 
                  : "text-zinc-500"
              }`}>
                Allocated: {allocatedSum}h / {targetTotalHours}h
              </span>
            </div>

            {subjects.length === 0 ? (
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
                No subjects created yet. You can still create this goal, and assign subjects later!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isChecked = allocations.some((a) => a.subject_id === sub.id);
                  const currentAlloc = allocations.find((a) => a.subject_id === sub.id);

                  return (
                    <div
                      key={sub.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? "bg-zinc-900 border-zinc-700 text-zinc-100"
                          : "bg-zinc-950/40 border-zinc-800/80 text-zinc-500"
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSubjectToggle(sub.id)}
                          className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="text-xs font-medium truncate">
                          {sub.name}
                        </span>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={currentAlloc?.target_hours || 5}
                            onChange={(e) =>
                              handleSubjectHoursChange(
                                sub.id,
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className="w-14 py-1 px-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-center text-zinc-100 focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-[11px] text-zinc-400 font-mono">hrs</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center ${
                    color === c ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Notes / Strategy (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on scoring 85%+ on Chemistry, practice 2 problem sets daily..."
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* CTA Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Target className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{initialGoal ? "Update Goal" : "Save Exam Goal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
