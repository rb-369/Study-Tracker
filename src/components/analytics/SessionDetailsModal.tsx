"use client";

import React from "react";
import { X, Clock, Zap, Brain, Sparkles, BookOpen, Calendar, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { StudySession } from "@/types";
import { CATEGORY_METADATA, formatMinutesToDisplay } from "@/lib/utils";
import { resolveSessionThoughts } from "@/lib/analytics/metrics";

interface SessionDetailsModalProps {
  session: StudySession | null;
  onClose: () => void;
}

export function SessionDetailsModal({ session, onClose }: SessionDetailsModalProps) {
  if (!session) return null;

  const grossMins = Math.round(session.gross_duration_seconds / 60);
  const netMins = Math.round(session.net_focus_seconds / 60);
  const { thoughts: activeThoughts, inferredCategory, inferredCount } = resolveSessionThoughts(session);
  const recordedThoughtMins = activeThoughts.reduce((acc, t) => acc + (t.approx_duration_minutes || 0), 0);
  const lostMins = Math.max(0, grossMins - netMins);
  const totalThoughtMins = Math.max(recordedThoughtMins, lostMins);
  const totalPingsCount = activeThoughts.length > 0 ? activeThoughts.length : inferredCount;
  const focusRatio = session.gross_duration_seconds > 0
    ? Math.round((session.net_focus_seconds / session.gross_duration_seconds) * 100)
    : 100;

  const startDate = new Date(session.start_time);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${
    session.end_time
      ? `- ${new Date(session.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : ""
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#121215] border border-zinc-800 p-6 shadow-2xl space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: session.subject?.color || "#10b981" }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {session.subject?.name || "General Study"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                {session.session_type.toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
              {session.topic}
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-400 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {formattedTime}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Metrics Ribbon */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <span className="text-[11px] text-zinc-500 block mb-1">Gross Clock</span>
            <span className="font-mono text-base sm:text-lg font-bold text-zinc-200">
              {formatMinutesToDisplay(grossMins)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <span className="text-[11px] text-emerald-400 block mb-1">Net Focus</span>
            <span className="font-mono text-base sm:text-lg font-bold text-white">
              {formatMinutesToDisplay(netMins)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <span className="text-[11px] text-zinc-400 block mb-1">Focus Score</span>
            <span className="font-mono text-base sm:text-lg font-bold text-emerald-400">
              {session.focus_score || focusRatio}/100
            </span>
          </div>
        </div>

        {/* Session Reflection Notes */}
        {session.session_notes && (
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Reflection Notes</span>
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{session.session_notes}&rdquo;
            </p>
          </div>
        )}

        {/* Mind Pings Logged */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span>Mind Pings & Attention Detours ({totalPingsCount})</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {totalThoughtMins}m total deducted
            </span>
          </div>

          {activeThoughts.length === 0 ? (
            lostMins > 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-center text-xs text-amber-400/80">
                ⚡ {inferredCount > 0 ? `${inferredCount} mind pings` : `~${lostMins}m`} recorded ({inferredCategory.replace('_', ' ')} & context switching).
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-center text-xs text-emerald-400/80">
                ✨ Pure uninterrupted focus — zero mind pings logged during this session!
              </div>
            )
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeThoughts.map((t, idx) => {
                const meta = CATEGORY_METADATA[t.category] || CATEGORY_METADATA.other;
                const pingTime = new Date(t.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="text-zinc-200 font-medium truncate">
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-zinc-400 text-[11px] flex-shrink-0">
                      <span>{pingTime}</span>
                      <span className="text-amber-400 font-bold">
                        -{t.approx_duration_minutes === 0.5 ? "30s" : `${t.approx_duration_minutes}m`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Debrief Section (if exists) */}
        {session.ai_debrief && (
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Cognitive Debrief</span>
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {session.ai_debrief.flowStateRating}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {session.ai_debrief.summary}
            </p>

            {session.ai_debrief.primaryDistractionDiagnosis && (
              <div className="text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                <strong>Attention Diagnosis:</strong> {session.ai_debrief.primaryDistractionDiagnosis}
              </div>
            )}

            {session.ai_debrief.actionableTips && session.ai_debrief.actionableTips.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Actionable Next Steps:
                </span>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {session.ai_debrief.actionableTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
