"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  CheckCircle, 
  Sparkles, 
  Brain, 
  Zap, 
  Clock, 
  ArrowRight, 
  Coffee, 
  Lightbulb, 
  AlertTriangle,
  Flame,
  Check,
  Target
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { AIDebrief } from "@/types";
import { formatSecondsToTimer, formatMinutesToDisplay } from "@/lib/utils";

interface SessionEndDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionEndDebriefModal({ isOpen, onClose }: SessionEndDebriefModalProps) {
  const { activeSession, activeTimer, netFocusSeconds, currentFocusRatio, endSession } = useStudyStore();

  const [sessionNotes, setSessionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debriefResult, setDebriefResult] = useState<AIDebrief | null>(null);

  // Trigger confetti when debrief finishes
  useEffect(() => {
    if (debriefResult) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#6366f1", "#f59e0b", "#38bdf8"],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [debriefResult]);

  if (!isOpen && !debriefResult) return null;

  const handleCompleteSession = async () => {
    setIsSubmitting(true);
    try {
      const result = await endSession(sessionNotes);
      setDebriefResult(result);
    } catch (e) {
      console.error("Error completing session:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndClose = () => {
    setDebriefResult(null);
    setSessionNotes("");
    onClose();
  };

  const grossSeconds = activeTimer.elapsedSeconds;
  const thoughtsCount = activeSession?.thoughts?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl rounded-3xl glass-panel p-6 sm:p-8 border border-focus/40 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step 1: Pre-Submission Reflection Form */}
        {!debriefResult && (
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-border/80">
              <div className="w-12 h-12 rounded-2xl bg-focus/15 border border-focus/30 flex items-center justify-center text-focus">
                <CheckCircle className="w-6 h-6 text-focus" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Wrap Up Focus Block
                </h2>
                <p className="text-xs text-slate-400">
                  Ready to audit your gross vs. net study time & generate AI debrief
                </p>
              </div>
            </div>

            {/* Quick Session Overview Card */}
            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="p-3.5 rounded-2xl bg-surface-elevated/60 border border-border/80 text-center">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Gross Time</span>
                <span className="text-lg font-mono font-bold text-white">
                  {formatSecondsToTimer(grossSeconds)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-focus/15 border border-focus/30 text-center">
                <span className="text-[11px] text-focus font-semibold block mb-1">Net Focus</span>
                <span className="text-lg font-mono font-bold text-white">
                  {formatSecondsToTimer(netFocusSeconds)}
                </span>
                <span className="text-[10px] text-focus font-mono block mt-0.5">
                  {(currentFocusRatio * 100).toFixed(0)}% ratio
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center">
                <span className="text-[11px] text-amber-400 font-semibold block mb-1">Mind Pings</span>
                <span className="text-lg font-mono font-bold text-amber-300">
                  {thoughtsCount}
                </span>
              </div>
            </div>

            {/* Reflection Note Input */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Session Reflection & Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you accomplish? Any specific concepts that felt effortless or challenging?"
                rows={3}
                className="w-full py-2.5 px-3.5 rounded-xl bg-surface-subtle border border-border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-focus transition-colors resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Back to Session
              </button>
              <button
                type="button"
                onClick={handleCompleteSession}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-focus to-focus-dark hover:opacity-95 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-focus/25 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Analyzing Flow State...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete & Generate AI Debrief</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Rendered AI Debrief Breakdown */}
        {debriefResult && (
          <div className="space-y-5 animate-fade-in">
            {/* Header with Score & Rating */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-focus">
                    AI Cognitive Debrief
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-focus/15 text-focus border border-focus/30">
                    {debriefResult.flowStateRating}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Session Completed!
                </h2>
              </div>

              {/* Focus Score Ring Badge */}
              <div className="w-16 h-16 rounded-2xl bg-focus/15 border-2 border-focus/40 flex flex-col items-center justify-center shadow-lg shadow-focus/20">
                <span className="text-xl font-mono font-black text-white leading-none">
                  {debriefResult.focusScore}
                </span>
                <span className="text-[9px] uppercase font-mono text-focus font-bold mt-0.5">
                  Focus Score
                </span>
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-border">
              <p className="text-sm text-slate-200 leading-relaxed">
                {debriefResult.summary}
              </p>
            </div>

            {/* Primary Distraction Audit */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                  Distraction Audit & Root Cause
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {debriefResult.primaryDistractionDiagnosis}
                </p>
              </div>
            </div>

            {/* Actionable Cognitive Tips */}
            {debriefResult.actionableTips && debriefResult.actionableTips.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-focus" />
                  <span>Actionable Focus Directives</span>
                </h4>
                <div className="space-y-2">
                  {debriefResult.actionableTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-card border border-border/80 flex items-start gap-2.5 text-xs text-slate-200"
                    >
                      <Check className="w-4 h-4 text-focus flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Break Card */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Coffee className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-300 font-medium">
                  Recommended Cognitive Recharge Break
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30">
                {debriefResult.recommendedBreakMinutes || 10} minutes
              </span>
            </div>

            {/* Next Topic Suggestion */}
            {debriefResult.nextSessionTopicSuggestion && (
              <div className="p-3.5 rounded-xl bg-surface-card border border-border text-xs text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">Recommended Next Focus:</span>
                <span className="font-semibold text-focus">
                  {debriefResult.nextSessionTopicSuggestion}
                </span>
              </div>
            )}

            {/* Goal Milestone Credit Banner */}
            {activeSession?.goal && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-zinc-300 font-medium">
                    Credited to: <strong className="text-emerald-400">{activeSession.goal.title}</strong>
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  +{formatMinutesToDisplay(Math.round(netFocusSeconds / 60))} Net Focus
                </span>
              </div>
            )}

            {/* Finish Action */}
            <div className="pt-3 border-t border-border/80 flex items-center justify-end">
              <button
                type="button"
                onClick={handleFinishAndClose}
                className="px-6 py-2.5 rounded-xl bg-focus hover:bg-focus-light text-slate-950 text-xs font-bold transition-all shadow-lg shadow-focus/25 active:scale-[0.98] flex items-center gap-2"
              >
                <span>Save to History & Close</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
