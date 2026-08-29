'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  X, 
  Zap, 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  Play, 
  BookOpen, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ExtendedUserProfile, BuddySession } from '@/types/social';
import { createClient } from '@/lib/supabase/client';
import { generateUUID } from '@/lib/utils';
import { useStudyStore } from '@/lib/store/useStudyStore';

interface StudyBuddyInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ExtendedUserProfile;
  targetFriend: ExtendedUserProfile;
  onStartSynchronizedSession: (session: BuddySession) => void;
}

export function StudyBuddyInviteModal({
  isOpen,
  onClose,
  currentUser,
  targetFriend,
  onStartSynchronizedSession,
}: StudyBuddyInviteModalProps) {
  const { subjects, startSession } = useStudyStore();
  const supabase = createClient();

  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [topic, setTopic] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentSession, setSentSession] = useState<BuddySession | null>(null);
  const [friendIsBusy, setFriendIsBusy] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSentSession(null);
      setIsSending(false);
      setFriendIsBusy(!!targetFriend.is_studying);
      if (subjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [isOpen, targetFriend, subjects, selectedSubjectId]);

  // Realtime subscription + Active Poller fallback: Listen for friend accepting or declining
  useEffect(() => {
    if (!sentSession || sentSession.status === 'active' || sentSession.status === 'declined') return;

    let isSubscribed = true;

    const handleSessionActivated = (updated: BuddySession) => {
      if (!isSubscribed) return;
      const fullSession: BuddySession = {
        ...updated,
        initiator: currentUser,
        buddy: targetFriend,
      };
      onStartSynchronizedSession(fullSession);
      onClose();
    };

    // 1. Fast Poller Fallback (every 1.5s) to guarantee instant trigger on mobile/LTE
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('buddy_sessions')
          .select('*')
          .eq('id', sentSession.id)
          .single();

        if (data && !error) {
          const fetched = data as BuddySession;
          if (fetched.status === 'active') {
            handleSessionActivated(fetched);
          } else if (fetched.status === 'declined') {
            setSentSession((prev) => prev ? { ...prev, status: 'declined' } : null);
          }
        }
      } catch {}
    }, 1500);

    // 2. Realtime WebSocket Channel
    const channel = supabase
      .channel(`buddy_session_watch_${sentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buddy_sessions',
          filter: `id=eq.${sentSession.id}`,
        },
        (payload) => {
          const updated = payload.new as BuddySession;
          if (updated.status === 'active') {
            handleSessionActivated(updated);
          } else if (updated.status === 'declined') {
            setSentSession((prev) => prev ? { ...prev, status: 'declined' } : null);
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [sentSession, supabase, onStartSynchronizedSession, onClose, currentUser, targetFriend]);

  if (!isOpen) return null;

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const subjectName = selectedSubject?.name || 'General Study';

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const isBusy = !!targetFriend.is_studying;
    setFriendIsBusy(isBusy);

    const newBuddySession: BuddySession = {
      id: generateUUID(),
      initiator_id: currentUser.id,
      buddy_id: targetFriend.id,
      subject_name: subjectName,
      topic: topic.trim() || `${subjectName} Focus`,
      duration_minutes: durationMinutes,
      status: isBusy ? 'pending_break' : 'inviting',
      start_time: null,
      initiator_pings: 0,
      buddy_pings: 0,
      high_fives: 0,
      created_at: new Date().toISOString(),
      initiator: currentUser,
      buddy: targetFriend,
    };

    try {
      if (!currentUser.id.startsWith('demo-') && !currentUser.id.startsWith('guest-')) {
        await supabase.from('buddy_sessions').insert({
          id: newBuddySession.id,
          initiator_id: newBuddySession.initiator_id,
          buddy_id: newBuddySession.buddy_id,
          subject_name: newBuddySession.subject_name,
          topic: newBuddySession.topic,
          duration_minutes: newBuddySession.duration_minutes,
          status: newBuddySession.status,
        });
      }
      setSentSession(newBuddySession);
    } catch (err) {
      console.error('Failed to create buddy invite:', err);
      // Local fallback for demo
      setSentSession(newBuddySession);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartSoloWhileWaiting = () => {
    if (selectedSubjectId) {
      startSession(
        selectedSubjectId,
        topic.trim() || `${subjectName} Sprint`,
        'pomodoro',
        durationMinutes
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!sentSession ? (
          /* Step 1: Configure & Send Focus Invite */
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
              <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Invite to Study Together</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Pair with <span className="text-teal-300 font-semibold">{targetFriend.full_name || targetFriend.handle}</span>
                </p>
              </div>
            </div>

            {/* Friend's Current Status Banner */}
            <div className={`mt-4 p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
              targetFriend.is_studying 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="relative flex items-center justify-center">
                <span className={`w-2.5 h-2.5 rounded-full ${targetFriend.is_studying ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              </div>
              <div className="flex-1 text-[11px] leading-relaxed">
                {targetFriend.is_studying ? (
                  <span>
                    <strong>Currently in Deep Focus:</strong> &ldquo;{targetFriend.active_subject_topic || 'Focus Sprint'}&rdquo;. Your invite will queue silently and appear during their next break!
                  </span>
                ) : (
                  <span>
                    <strong>Currently Idle / Available:</strong> {targetFriend.full_name || 'Friend'} is ready for a new focus sprint.
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="mt-4 space-y-4 text-xs">
              {/* Sprint Duration Selector */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Target Sprint Duration</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 45, 50].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-2.5 rounded-xl border font-bold transition-all text-xs ${
                        durationMinutes === mins
                          ? 'bg-teal-500 text-zinc-950 border-teal-400 shadow-md shadow-teal-500/20'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                  <span>Select Subject</span>
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-teal-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">
                  Topic / Goal for this sprint
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Chapter 4 Practice Problems"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full mt-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Invite...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Send Study Invite</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Invite Sent Feedback & Waiting State */
          <div className="py-3 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                Focus Invite Sent!
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                {durationMinutes}m sprint on <strong className="text-zinc-200">&ldquo;{sentSession.topic}&rdquo;</strong>
              </p>
            </div>

            {/* Smart Focus-Shield Notice */}
            {friendIsBusy ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-left text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Shield className="w-4 h-4" />
                  <span>Distraction Shield Active</span>
                </div>
                <p className="text-[11px] text-amber-200/90">
                  Request sent! <strong>{targetFriend.full_name || 'Your friend'}</strong> is currently in a study session and can see your request in their break so their focus is not broken.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-teal-400 animate-spin flex-shrink-0" />
                <span className="text-[11px]">
                  Waiting for <strong>{targetFriend.full_name}</strong> to accept your invite...
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleStartSoloWhileWaiting}
                className="w-full py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 text-teal-400" />
                <span>Start Solo Sprint While Waiting</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-xs transition-colors"
              >
                Close & Wait in Background
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
