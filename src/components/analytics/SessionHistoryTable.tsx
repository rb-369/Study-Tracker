"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Calendar, Clock, Brain, ChevronRight, Zap, BookOpen } from "lucide-react";
import { StudySession, Subject } from "@/types";
import { formatMinutesToDisplay } from "@/lib/utils";
import { SessionDetailsModal } from "./SessionDetailsModal";

interface SessionHistoryTableProps {
  sessions: StudySession[];
  subjects: Subject[];
}

export function SessionHistoryTable({ sessions, subjects }: SessionHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "longest" | "score">("newest");
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(8);

  const completedSessions = useMemo(() => {
    return sessions.filter((s) => s.status === "completed" && s.gross_duration_seconds > 0);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    let list = completedSessions.filter((s) => {
      // Subject filter
      if (selectedSubjectId !== "all" && s.subject_id !== selectedSubjectId) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const topicMatch = s.topic?.toLowerCase().includes(q);
        const subjMatch = s.subject?.name?.toLowerCase().includes(q);
        const notesMatch = s.session_notes?.toLowerCase().includes(q);
        if (!topicMatch && !subjMatch && !notesMatch) return false;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "longest") {
        return b.net_focus_seconds - a.net_focus_seconds;
      }
      if (sortBy === "score") {
        return (b.focus_score || 0) - (a.focus_score || 0);
      }
      // default newest
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
    });

    return list;
  }, [completedSessions, selectedSubjectId, searchQuery, sortBy]);

  const displayedList = filteredSessions.slice(0, visibleLimit);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-zinc-800 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Session Logs & Focus Timeline</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {completedSessions.length} total blocks recorded ({filteredSessions.length} matching filters)
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search topic or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-1.5 pl-8 pr-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-48"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="py-1.5 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1.5 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="longest">Longest Focus</option>
            <option value="score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Table / List */}
      {filteredSessions.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 space-y-1">
          <p>No study sessions match the selected filters.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedSubjectId("all");
            }}
            className="text-emerald-400 hover:underline font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedList.map((session) => {
            const grossMins = Math.round(session.gross_duration_seconds / 60);
            const netMins = Math.round(session.net_focus_seconds / 60);
            const ratio = session.gross_duration_seconds > 0
              ? Math.round((session.net_focus_seconds / session.gross_duration_seconds) * 100)
              : 100;
            const thoughtsCount = session.thoughts?.length || 0;
            const startDate = new Date(session.start_time);
            const dateStr = startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const timeStr = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="p-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                {/* Left: Subject & Topic */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.subject?.color || "#10b981" }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                        {session.subject?.name || "General Study"}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {dateStr} • {timeStr}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                      {session.topic}
                    </h4>
                  </div>
                </div>

                {/* Right: Telemetry pill & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-xs">
                  {/* Time split */}
                  <div className="text-right font-mono">
                    <div className="text-zinc-100 font-bold">
                      {formatMinutesToDisplay(netMins)} <span className="text-[10px] text-zinc-500 font-normal">net</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {grossMins}m clock ({ratio}%)
                    </div>
                  </div>

                  {/* Thoughts count */}
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Brain className="w-3 h-3" />
                    <span>{thoughtsCount}</span>
                  </div>

                  {/* Focus Score badge */}
                  <div className="flex items-center gap-1 font-mono font-bold text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                    <Zap className="w-3 h-3" />
                    <span>{session.focus_score || ratio}</span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {filteredSessions.length > visibleLimit && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setVisibleLimit((prev) => prev + 10)}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Show More Sessions ({filteredSessions.length - visibleLimit} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Session Details Modal Inspector */}
      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
