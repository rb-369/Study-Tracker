"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Target, 
  Plus, 
  Trophy, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  FolderArchive
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalModal } from "@/components/goals/CreateGoalModal";
import { GoalDetailModal } from "@/components/goals/GoalDetailModal";
import { SessionStartModal } from "@/components/session/SessionStartModal";
import { SessionEndDebriefModal } from "@/components/session/SessionEndDebriefModal";
import { LiveSessionTimer } from "@/components/session/LiveSessionTimer";
import { SubjectManager } from "@/components/subjects/SubjectManager";
import { ExamGoal } from "@/types";
import { formatMinutesToDisplay } from "@/lib/utils";

export default function GoalsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, activeSession, goals, sessions, subjects } = useStudyStore();

  const [activeTab, setActiveTab] = useState<"active" | "completed" | "archived">("active");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ExamGoal | null>(null);
  const [detailGoal, setDetailGoal] = useState<ExamGoal | null>(null);
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false);
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [prefilledGoalId, setPrefilledGoalId] = useState<string | undefined>(undefined);
  const [prefilledSubjectId, setPrefilledSubjectId] = useState<string | undefined>(undefined);

  // Auth gate check
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/30 flex items-center justify-center bg-zinc-900 animate-pulse shadow-lg">
            <img
              src="/Study_flow_logo.png"
              alt="StudyFlow Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs font-mono text-zinc-500">Loading Exam Goals...</p>
        </div>
      </div>
    );
  }

  // Filter goals by tab
  const activeGoals = goals.filter((g) => g.status === "active" || !g.status);
  const completedGoals = goals.filter((g) => g.status === "completed");
  const archivedGoals = goals.filter((g) => g.status === "archived");

  const displayedGoals = 
    activeTab === "active" 
      ? activeGoals 
      : activeTab === "completed" 
      ? completedGoals 
      : archivedGoals;

  // Aggregate Metrics across active goals
  const totalGoalHours = activeGoals.reduce((acc, g) => acc + (g.target_total_hours || 0), 0);
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalGoalNetSeconds = completedSessions
    .filter((s) => s.goal_id && activeGoals.some((g) => g.id === s.goal_id))
    .reduce((acc, s) => acc + (s.net_focus_seconds || 0), 0);
  const totalGoalNetMinutes = Math.round(totalGoalNetSeconds / 60);

  // Next upcoming exam (only among goals with a deadline)
  const goalsWithDeadline = activeGoals.filter((g) => !!g.target_date);
  const sortedUpcoming = [...goalsWithDeadline].sort(
    (a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime()
  );
  const nextExam = sortedUpcoming[0];
  const nextExamDays = nextExam && nextExam.target_date
    ? Math.ceil((new Date(nextExam.target_date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
    : null;

  const handleStartSessionForGoal = (goalId: string, subjectId?: string) => {
    setPrefilledGoalId(goalId);
    setPrefilledSubjectId(subjectId);
    setIsStartSessionModalOpen(true);
  };

  const handleEditGoal = (goal: ExamGoal) => {
    setEditingGoal(goal);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Desktop Sidebar */}
      <Sidebar 
        onOpenNewSession={() => {
          setPrefilledGoalId(undefined);
          setPrefilledSubjectId(undefined);
          setIsStartSessionModalOpen(true);
        }}
        onOpenNewSubject={() => setIsSubjectModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar 
          onOpenNewSession={() => {
            setPrefilledGoalId(undefined);
            setPrefilledSubjectId(undefined);
            setIsStartSessionModalOpen(true);
          }}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* Active Live Timer Banner if running */}
          {activeSession && (
            <LiveSessionTimer onEndSessionClick={() => setIsDebriefModalOpen(true)} />
          )}

          {/* Page Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Target className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Exam & Goal Hub
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Organize multi-subject study campaigns for Final Exams, PT tests, and Practicals.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Exam Goal</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Exam Goals</span>
              </span>
              <p className="text-xl font-bold text-zinc-100 mt-2 font-mono">
                {activeGoals.length}
              </p>
              <span className="text-[11px] text-zinc-500">
                {completedGoals.length} milestones completed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Net Focused Logged</span>
              </span>
              <p className="text-xl font-bold text-teal-400 mt-2 font-mono">
                {formatMinutesToDisplay(totalGoalNetMinutes)}
              </p>
              <span className="text-[11px] text-zinc-500">
                across active exam targets
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Cumulative Target</span>
              </span>
              <p className="text-xl font-bold text-amber-300 mt-2 font-mono">
                {totalGoalHours} Hours
              </p>
              <span className="text-[11px] text-zinc-500">
                allocated across courses
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Next Upcoming Exam</span>
              </span>
              <p className="text-sm font-bold text-zinc-100 mt-2 truncate">
                {nextExam ? nextExam.title : "None Scheduled"}
              </p>
              <span className={`text-[11px] font-medium ${
                nextExamDays !== null && nextExamDays <= 3 
                  ? "text-amber-400" 
                  : "text-zinc-500"
              }`}>
                {nextExamDays !== null 
                  ? nextExamDays === 0 
                    ? "Exam is today!" 
                    : `${nextExamDays} days left` 
                  : "Create an exam to track countdown"}
              </span>
            </div>
          </div>

          {/* Status Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === "active"
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Goals ({activeGoals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === "completed"
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Completed ({completedGoals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("archived")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === "archived"
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-zinc-500" />
              <span>Archived ({archivedGoals.length})</span>
            </button>
          </div>

          {/* Goals Grid */}
          {displayedGoals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-zinc-100">
                  {activeTab === "active"
                    ? "No active exam goals yet"
                    : activeTab === "completed"
                    ? "No completed milestones yet"
                    : "No archived goals"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {activeTab === "active"
                    ? "Create goals like 'Final Exam Study' or 'PT-1 Prep' to group study sessions, allocate hours across subjects, and track countdowns."
                    : "When you finish an exam season or hit 100% of your targets, mark it completed to celebrate!"}
                </p>
              </div>
              {activeTab === "active" && (
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Your First Exam Goal</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  sessions={sessions}
                  subjects={subjects}
                  onStartSession={handleStartSessionForGoal}
                  onOpenDetails={(g) => setDetailGoal(g)}
                  onEdit={handleEditGoal}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGoal(null);
        }}
        initialGoal={editingGoal}
      />

      <GoalDetailModal
        isOpen={!!detailGoal}
        goal={detailGoal}
        onClose={() => setDetailGoal(null)}
        onStartSession={handleStartSessionForGoal}
        onEdit={handleEditGoal}
      />

      <SessionStartModal
        isOpen={isStartSessionModalOpen}
        onClose={() => setIsStartSessionModalOpen(false)}
        initialGoalId={prefilledGoalId}
        initialSubjectId={prefilledSubjectId}
      />

      <SessionEndDebriefModal
        isOpen={isDebriefModalOpen}
        onClose={() => setIsDebriefModalOpen(false)}
      />

      {isSubjectModalOpen && (
        <SubjectManager
          onClose={() => setIsSubjectModalOpen(false)}
        />
      )}

      <MobileNav 
        onOpenNewSession={() => {
          setPrefilledGoalId(undefined);
          setPrefilledSubjectId(undefined);
          setIsStartSessionModalOpen(true);
        }}
      />
    </div>
  );
}
