"use client";

import React, { useState } from "react";
import { 
  X, 
  Target, 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle2, 
  Trophy, 
  TrendingUp, 
  Brain, 
  Plus, 
  Link as LinkIcon,
  Check,
  Edit2
} from "lucide-react";
import { ExamGoal, StudySession, Subject } from "@/types";
import { formatMinutesToDisplay } from "@/lib/utils";
import { useStudyStore } from "@/lib/store/useStudyStore";

interface GoalDetailModalProps {
  goal: ExamGoal | null;
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (goalId: string, subjectId?: string) => void;
  onEdit: (goal: ExamGoal) => void;
}

export function GoalDetailModal({
  goal,
  isOpen,
  onClose,
  onStartSession,
  onEdit,
}: GoalDetailModalProps) {
  const { sessions, subjects, linkSessionToGoal } = useStudyStore();
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "backfill">("overview");

  if (!isOpen || !goal) return null;

  // Filter linked completed sessions
  const goalSessions = sessions.filter(
    (s) => s.goal_id === goal.id && s.status === "completed"
  );

  // Unassigned sessions available for backfill
  const unassignedSessions = sessions.filter(
    (s) => (!s.goal_id || s.goal_id !== goal.id) && s.status === "completed"
  );

  const totalGrossSeconds = goalSessions.reduce((acc, s) => acc + (s.gross_duration_seconds || 0), 0);
  const totalNetSeconds = goalSessions.reduce((acc, s) => acc + (s.net_focus_seconds || 0), 0);
  const totalNetMinutes = Math.round(totalNetSeconds / 60);
  const targetMinutes = Math.max(1, Math.round(goal.target_total_hours * 60));
  const progressPercent = Math.min(100, Math.round((totalNetMinutes / targetMinutes) * 100));

  const totalThoughts = goalSessions.reduce((acc, s) => acc + (s.thoughts?.length || 0), 0);
  const focusRatio = totalGrossSeconds > 0 ? Math.round((totalNetSeconds / totalGrossSeconds) * 100) : 100;
  const avgFocusScore = goalSessions.length > 0
    ? Math.round(goalSessions.reduce((acc, s) => acc + (s.focus_score || 0), 0) / goalSessions.length)
    : 100;

  // Days left calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(goal.target_date);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-2xl my-8 rounded-2xl bg-[#121215] border border-zinc-800 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{
                backgroundColor: `${goal.color}15`,
                borderColor: `${goal.color}40`,
                color: goal.color,
              }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-100">{goal.title}</h2>
                {goal.status === "completed" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Completed
                  </span>
                )}
                {progressPercent >= 100 && goal.status === "active" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    Target Achieved
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    Exam Date:{" "}
                    {new Date(goal.target_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
                <span className="text-zinc-600">&bull;</span>
                <span className={diffDays < 0 ? "text-rose-400" : diffDays <= 3 ? "text-amber-400 font-semibold" : "text-zinc-400"}>
                  {diffDays < 0 ? `Passed ${Math.abs(diffDays)}d ago` : diffDays === 0 ? "Exam is Today!" : `${diffDays} days remaining`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(goal);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Edit Goal"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-zinc-800/60">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Overview & Targets
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "sessions"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Logged Sessions ({goalSessions.length})
          </button>
          <button
            onClick={() => setActiveTab("backfill")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "backfill"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Link Past Sessions ({unassignedSessions.length})
          </button>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-5 space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Net Focus Time</span>
                <p className="text-base font-bold text-emerald-400 mt-1 font-mono">
                  {formatMinutesToDisplay(totalNetMinutes)}
                </p>
                <span className="text-[10px] text-zinc-500">
                  of {goal.target_total_hours}h target
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Focus Ratio</span>
                <p className="text-base font-bold text-zinc-100 mt-1 font-mono">
                  {focusRatio}%
                </p>
                <span className="text-[10px] text-zinc-500">
                  true deep work
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Mind Pings</span>
                <p className="text-base font-bold text-amber-400 mt-1 font-mono">
                  {totalThoughts}
                </p>
                <span className="text-[10px] text-zinc-500">
                  distractions captured
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Avg Focus Score</span>
                <p className="text-base font-bold text-teal-400 mt-1 font-mono">
                  {avgFocusScore}/100
                </p>
                <span className="text-[10px] text-zinc-500">
                  session quality
                </span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Overall Exam Goal Progress</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {formatMinutesToDisplay(totalNetMinutes)} / {goal.target_total_hours}h ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Subject Allocations List */}
            {goal.subject_allocations && goal.subject_allocations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Subject Milestones
                </h3>
                <div className="space-y-2.5">
                  {goal.subject_allocations.map((alloc) => {
                    const sub = subjects.find((s) => s.id === alloc.subject_id);
                    const subName = sub ? sub.name : "Subject";
                    const subColor = sub ? sub.color : goal.color;

                    const subSessions = goalSessions.filter((s) => s.subject_id === alloc.subject_id);
                    const subNetMinutes = subSessions.reduce(
                      (acc, s) => acc + Math.round(s.net_focus_seconds / 60),
                      0
                    );
                    const subTargetMinutes = Math.max(1, Math.round(alloc.target_hours * 60));
                    const subPercent = Math.min(100, Math.round((subNetMinutes / subTargetMinutes) * 100));

                    return (
                      <div
                        key={alloc.subject_id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: subColor }}
                            />
                            <span className="font-semibold text-zinc-200">{subName}</span>
                            <span className="text-[11px] text-zinc-500">
                              ({subSessions.length} sessions)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-300">
                              {formatMinutesToDisplay(subNetMinutes)} / {alloc.target_hours}h
                            </span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              ({subPercent}%)
                            </span>
                            {goal.status === "active" && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onStartSession(goal.id, alloc.subject_id);
                                }}
                                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1 ml-1"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Study</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${subPercent}%`,
                              backgroundColor: subColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Goal Notes */}
            {goal.notes && (
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Strategy Notes
                </span>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap">{goal.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: SESSIONS */}
        {activeTab === "sessions" && (
          <div className="mt-5 space-y-3 max-h-96 overflow-y-auto pr-1">
            {goalSessions.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/30 rounded-xl border border-zinc-800/60">
                <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No sessions logged under this exam yet.</p>
                {goal.status === "active" && (
                  <button
                    onClick={() => {
                      onClose();
                      onStartSession(goal.id);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-zinc-950" />
                    <span>Start First Session</span>
                  </button>
                )}
              </div>
            ) : (
              goalSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sess.subject?.color || "#10b981" }}
                    />
                    <div className="truncate">
                      <p className="font-semibold text-zinc-200 truncate">{sess.topic}</p>
                      <span className="text-[11px] text-zinc-500">
                        {sess.subject?.name || "General"} &bull;{" "}
                        {new Date(sess.start_time).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-bold text-zinc-100 block">
                        {formatMinutesToDisplay(Math.round(sess.net_focus_seconds / 60))}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Score: {sess.focus_score}/100
                      </span>
                    </div>
                    <button
                      onClick={() => linkSessionToGoal(sess.id, null)}
                      className="px-2 py-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-[11px]"
                      title="Unlink from this goal"
                    >
                      Unlink
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: BACKFILL */}
        {activeTab === "backfill" && (
          <div className="mt-5 space-y-3 max-h-96 overflow-y-auto pr-1">
            <p className="text-xs text-zinc-400">
              Link existing focus sessions from your past history into <strong>{goal.title}</strong> to count their net focus time towards this exam:
            </p>

            {unassignedSessions.length === 0 ? (
              <div className="p-6 text-center bg-zinc-900/30 rounded-xl border border-zinc-800/60">
                <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">All your completed sessions are already assigned!</p>
              </div>
            ) : (
              unassignedSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sess.subject?.color || "#10b981" }}
                    />
                    <div className="truncate">
                      <p className="font-semibold text-zinc-200 truncate">{sess.topic}</p>
                      <span className="text-[11px] text-zinc-500">
                        {sess.subject?.name || "General"} &bull;{" "}
                        {new Date(sess.start_time).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-zinc-300 font-medium">
                      +{formatMinutesToDisplay(Math.round(sess.net_focus_seconds / 60))}
                    </span>
                    <button
                      onClick={() => linkSessionToGoal(sess.id, goal.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800"
          >
            Close
          </button>

          {goal.status === "active" && (
            <button
              onClick={() => {
                onClose();
                onStartSession(goal.id, goal.subject_allocations?.[0]?.subject_id);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Begin Session for this Exam</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
