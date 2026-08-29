'use client';

import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { submitModerationReport } from '@/lib/moderation/moderationService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  messageId?: string;
  messagePreview?: string;
}

const REPORT_REASONS = [
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Inappropriate or offensive content',
  'Spam or advertising',
  'Cheating or leaderboard gaming',
  'Other violation',
];

export function ReportModal({
  isOpen,
  onClose,
  reporterId,
  reportedUserId,
  reportedUserName,
  messageId,
  messagePreview,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultMsg(null);

    const res = await submitModerationReport(
      reporterId,
      reportedUserId,
      selectedReason,
      messageId,
      details
    );

    setIsSubmitting(false);

    if (res.success) {
      setResultMsg({
        text: res.autoQuarantined
          ? 'Report submitted. Message was automatically hidden for the room and the user has been blocked for you.'
          : 'Report received. The user has been blocked for you and our team will review the content.',
        success: true,
      });
      setTimeout(() => {
        onClose();
        setResultMsg(null);
        setDetails('');
      }, 2500);
    } else {
      setResultMsg({
        text: res.error || 'Failed to submit report. Please try again.',
        success: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Report Content or User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {resultMsg ? (
          <div className={`my-6 p-4 rounded-xl text-xs leading-relaxed flex items-start gap-3 ${
            resultMsg.success
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            {resultMsg.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <div>{resultMsg.text}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300 space-y-1">
              <div>
                <span className="text-zinc-500">Reporting User:</span>{' '}
                <span className="font-semibold text-zinc-200">{reportedUserName}</span>
              </div>
              {messagePreview && (
                <div>
                  <span className="text-zinc-500">Message:</span>{' '}
                  <span className="italic text-zinc-400">&ldquo;{messagePreview.slice(0, 80)}&rdquo;</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">Reason for report</label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-teal-500"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">Additional details (optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain what happened..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <div className="text-[11px] text-zinc-500 leading-relaxed">
              Submitting a report will automatically block this user for your account. Reports with multiple independent confirmations are auto-quarantined.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
