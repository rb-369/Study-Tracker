"use client";

import React, { useState } from "react";
import { 
  Target, 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle2, 
  MoreVertical, 
  Trophy, 
  ChevronRight, 
  Archive, 
  Trash2,
  Edit2,
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { ExamGoal, StudySession, Subject } from "@/types";
import { formatMinutesToDisplay } from "@/lib/utils";
import { useStudyStore } from "@/lib/store/useStudyStore";

interface GoalCardProps {
  goal: ExamGoal;
  sessions: StudySession[];
  subjects: Subject[];
  onStartSession: (goalId: string, defaultSubjectId?: string) => void;
  onOpenDetails: (goal: ExamGoal) => void;
  onEdit: (goal: ExamGoal) => void;
}

export function GoalCard({
  goal,
  sessions,
  subjects,
  onStartSession,
  onOpenDetails,
  onEdit,
}: GoalCardProps) {
  const { completeGoal, archiveGoal, deleteGoal } = useStudyStore();
  const [showMenu, setShowMenu] = useState(false);

  // Compute goal-linked completed sessions
  const goalSessions = sessions.filter(
    (s) => s.goal_id === goal.id && s.status === "completed"
  );

  const totalNetMinutes = goalSessions.reduce(
    (acc, s) => acc + Math.round(s.net_focus_seconds / 60),
    0
  );
  const targetMinutes = Math.max(1, Math.round(goal.target_total_hours * 60));
  const progressPercent = Math.min(100, Math.round((totalNetMinutes / targetMinutes) * 100));
  const isCompletedMilestone = progressPercent >= 100;

  // Days left calculation (if deadline set)
  let diffDays: number | null = null;
  if (goal.target_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(goal.target_date);
    targetDate.setHours(0, 0, 0, 0);
    diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="relative rounded-2xl bg-[#121215] border border-zinc-800 hover:border-zinc-700/80 transition-all p-5 sm:p-6 flex flex-col justify-between group shadow-lg shadow-black/40">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{
                backgroundColor: `${goal.color}15`,
                borderColor: `${goal.color}40`,
                color: goal.color,
              }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 
                  onClick={() => onOpenDetails(goal)}
                  className="text-base font-bold text-zinc-100 hover:text-emerald-400 transition-colors truncate cursor-pointer"
                >
                  {goal.title}
                </h3>
                {goal.status === "completed" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )}
                {goal.status === "archived" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Archived
                  </span>
                )}
                {isCompletedMilestone && goal.status === "active" && (
                  <button
                    onClick={handleCelebrate}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition-colors"
                  >
                    <Trophy className="w-3 h-3 text-amber-400" />
                    100% Target Hit!
                  </button>
                )}
              </div>

              {/* Deadline countdown & meta */}
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                {goal.target_date && diffDays !== null ? (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        {new Date(goal.target_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </span>

                    <span className="text-zinc-600">&bull;</span>

                    <span className={`font-medium ${
                      diffDays < 0 
                        ? "text-rose-400" 
                        : diffDays <= 3 
                        ? "text-amber-400 font-semibold" 
                        : "text-zinc-400"
                    }`}>
                      {diffDays < 0 
                        ? `Passed ${Math.abs(diffDays)}d ago` 
                        : diffDays === 0 
                        ? "Exam is Today!" 
                        : `${diffDays} days remaining`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ongoing Track</span>
                    </span>
                    <span className="text-zinc-600">&bull;</span>
                    <span className="text-zinc-500">No deadline set</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Options Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-zinc-900 border border-zinc-800 p-1.5 shadow-2xl z-30 space-y-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenDetails(goal);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>View Details & History</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(goal);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Goal</span>
                  </button>

                  {goal.status === "active" && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        completeGoal(goal.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Complete</span>
                    </button>
                  )}

                  {goal.status !== "archived" && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        archiveGoal(goal.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm(`Are you sure you want to delete "${goal.title}"?`)) {
                        deleteGoal(goal.id);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overall Net Focus Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Net Focus Logged</span>
            </span>
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-zinc-100">
                {formatMinutesToDisplay(totalNetMinutes)}
              </span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400 font-medium">
                {goal.target_total_hours}h target
              </span>
              <span className="ml-1 text-emerald-400 font-bold">
                ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800/80 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Subject-Wise Allocations Breakdown */}
        {goal.subject_allocations && goal.subject_allocations.length > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-800/70 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
              Subject Target Breakdown
            </span>

            <div className="space-y-2">
              {goal.subject_allocations.map((alloc) => {
                const sub = subjects.find((s) => s.id === alloc.subject_id);
                const subName = sub ? sub.name : "Subject";
                const subColor = sub ? sub.color : goal.color;

                const subNetMinutes = goalSessions
                  .filter((s) => s.subject_id === alloc.subject_id)
                  .reduce((acc, s) => acc + Math.round(s.net_focus_seconds / 60), 0);

                const subTargetMinutes = Math.max(1, Math.round(alloc.target_hours * 60));
                const subPercent = Math.min(100, Math.round((subNetMinutes / subTargetMinutes) * 100));

                return (
                  <div key={alloc.subject_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: subColor }}
                        />
                        <span className="text-zinc-300 font-medium truncate">
                          {subName}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {formatMinutesToDisplay(subNetMinutes)} / {alloc.target_hours}h ({subPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
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
      </div>

      {/* Footer / Quick Session Starter */}
      <div className="mt-6 pt-4 border-t border-zinc-800/70 flex items-center justify-between gap-3">
        <button
          onClick={() => onOpenDetails(goal)}
          className="text-xs text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1 transition-colors"
        >
          <span>{goalSessions.length} sessions logged</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {goal.status === "active" && (
          <button
            onClick={() => onStartSession(goal.id, goal.subject_allocations?.[0]?.subject_id)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Study for this Exam</span>
          </button>
        )}
      </div>
    </div>
  );
}
