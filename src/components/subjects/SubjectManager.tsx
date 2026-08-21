"use client";

import React, { useState } from "react";
import { Plus, BookOpen, Clock, Trash2, Edit3, Check, X, Target, AlertTriangle } from "lucide-react";
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

interface SubjectManagerProps {
  onClose?: () => void;
}

export function SubjectManager({ onClose }: SubjectManagerProps) {
  const { subjects, sessions, createSubject, updateSubject, deleteSubject } = useStudyStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [targetHours, setTargetHours] = useState<number>(10);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0]);
  const [editTargetHours, setEditTargetHours] = useState<number>(10);

  const handleOpenCreate = () => {
    setName("");
    setColor(COLOR_OPTIONS[0]);
    setTargetHours(10);
    setIsCreating(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditColor(sub.color || COLOR_OPTIONS[0]);
    setEditTargetHours(sub.target_weekly_hours || 10);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createSubject({
      name: name.trim(),
      color,
      icon: "BookOpen",
      target_weekly_hours: targetHours,
    });
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim()) return;
    await updateSubject(editingSubject.id, {
      name: editName.trim(),
      color: editColor,
      target_weekly_hours: editTargetHours,
    });
    setEditingSubject(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingSubjectId) {
      await deleteSubject(deletingSubjectId);
      setDeletingSubjectId(null);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            Subjects & Weekly Targets
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organize coursework, track target hours, and inspect focus allocation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {subjects.length === 0 && !isCreating && (
        <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mx-auto">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-zinc-100">No Subjects Added Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Create subjects for your classes, courses, or projects (e.g. Computer Science, Calculus, Organic Chemistry) to track weekly progress.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            + Create First Subject
          </button>
        </div>
      )}

      {/* Create Subject Form Card */}
      {isCreating && (
        <form
          onSubmit={handleSaveCreate}
          className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 space-y-4 animate-slide-up"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-100">Add New Subject</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Subject Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Quantum Mechanics, Machine Learning..."
                className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Weekly Target (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetHours}
                onChange={(e) => setTargetHours(parseInt(e.target.value) || 1)}
                className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs disabled:opacity-50"
            >
              Save Subject
            </button>
          </div>
        </form>
      )}

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((sub) => {
          const subjectSessions = sessions.filter((s) => s.subject_id === sub.id && s.status === "completed");
          const totalNetMinutes = subjectSessions.reduce((acc, s) => acc + Math.round(s.net_focus_seconds / 60), 0);
          const netHours = (totalNetMinutes / 60).toFixed(1);
          const target = sub.target_weekly_hours || 10;
          const progressPercent = Math.min(100, Math.round(((totalNetMinutes / 60) / target) * 100));

          return (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.color || "#10b981" }}
                    />
                    <h3 className="text-sm font-bold text-zinc-100 truncate">
                      {sub.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Edit subject"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSubjectId(sub.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Weekly Target Progress</span>
                    <span className="font-mono text-zinc-300">
                      {netHours}h / {target}h ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: sub.color || "#10b981",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{subjectSessions.length} session{subjectSessions.length === 1 ? '' : 's'} logged</span>
                <span className="font-mono text-zinc-400 font-medium">
                  {totalNetMinutes}m net focus
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md rounded-2xl bg-[#121215] border border-zinc-800 p-6 shadow-2xl space-y-4 animate-slide-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Subject</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Weekly Goal (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editTargetHours}
                  onChange={(e) => setEditTargetHours(parseInt(e.target.value) || 1)}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        editColor === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editName.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {deletingSubjectId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Delete Subject?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to remove this subject? Past study session logs will be preserved with General subject tag.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeletingSubjectId(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e0e11] border border-zinc-800 p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
