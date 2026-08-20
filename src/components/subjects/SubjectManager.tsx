"use client";

import React, { useState } from "react";
import { Plus, BookOpen, Clock, Trash2, Edit3, Check, X, Target } from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Subject } from "@/types";

const COLOR_OPTIONS = [
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

export function SubjectManager() {
  const { subjects, sessions, createSubject, updateSubject, deleteSubject } = useStudyStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [targetHours, setTargetHours] = useState<number>(5);

  const handleOpenCreate = () => {
    setName("");
    setColor(COLOR_OPTIONS[0]);
    setTargetHours(5);
    setIsCreating(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createSubject(name.trim(), color, "BookOpen", targetHours);
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.name.trim()) return;
    await updateSubject(editingSubject.id, {
      name: editingSubject.name.trim(),
      color: editingSubject.color,
      target_weekly_hours: editingSubject.target_weekly_hours,
    });
    setEditingSubject(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Subjects & Syllabus Goals
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize coursework, track weekly hour targets, and inspect focus allocation
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-focus hover:bg-focus-light text-slate-950 text-xs font-bold transition-all shadow-lg shadow-focus/20 flex items-center gap-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((sub) => {
          // Calculate total net focus hours for this subject
          const subjectSessions = sessions.filter((s) => s.subject_id === sub.id && s.status === "completed");
          const totalNetMinutes = subjectSessions.reduce((acc, s) => acc + Math.round(s.net_focus_seconds / 60), 0);
          const totalGrossMinutes = subjectSessions.reduce((acc, s) => acc + Math.round(s.gross_duration_seconds / 60), 0);
          const netHours = (totalNetMinutes / 60).toFixed(1);
          const target = sub.target_weekly_hours || 5;
          const progressPercent = Math.min(100, Math.round(((totalNetMinutes / 60) / target) * 100));

          return (
            <div
              key={sub.id}
              className="p-5 rounded-2xl glass-card border border-border hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-4 ring-white/10"
                      style={{ backgroundColor: sub.color }}
                    />
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {sub.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingSubject(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                      title="Edit subject"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSubject(sub.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target Progress Ribbon */}
                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-focus" />
                      Weekly Target:
                    </span>
                    <span className="font-mono font-bold text-white">
                      {netHours} / {target} hrs ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: sub.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Subject Footer Stats */}
              <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-slate-400">
                <span>{subjectSessions.length} total blocks</span>
                <span className="font-mono text-slate-300">
                  {Math.round(totalGrossMinutes / 60)} gross hrs logged
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Subject Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-focus/30 shadow-2xl relative animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <h3 className="text-base font-bold text-white">Add Subject</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Quantum Mechanics, Machine Learning..."
                  className="w-full py-2 px-3 rounded-xl bg-surface-subtle border border-border text-sm text-white focus:outline-none focus:border-focus"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Subject Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        color === c ? "scale-110 border-white" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Weekly Goal (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={targetHours}
                  onChange={(e) => setTargetHours(parseInt(e.target.value) || 5)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-subtle border border-border text-sm text-white focus:outline-none focus:border-focus"
                />
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-focus hover:bg-focus-light text-slate-950 text-xs font-bold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-border shadow-2xl relative animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <h3 className="text-base font-bold text-white">Edit Subject</h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-subtle border border-border text-sm text-white focus:outline-none focus:border-focus"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Subject Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingSubject({ ...editingSubject, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        editingSubject.color === c ? "scale-110 border-white" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Weekly Goal (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editingSubject.target_weekly_hours}
                  onChange={(e) => setEditingSubject({ ...editingSubject, target_weekly_hours: parseInt(e.target.value) || 5 })}
                  className="w-full py-2 px-3 rounded-xl bg-surface-subtle border border-border text-sm text-white focus:outline-none focus:border-focus"
                />
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-focus hover:bg-focus-light text-slate-950 text-xs font-bold"
                >
                  Update Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
