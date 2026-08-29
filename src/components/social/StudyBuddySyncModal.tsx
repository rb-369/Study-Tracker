'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  X, 
  HandMetal, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Zap,
  Sparkles,
  Flame
} from 'lucide-react';
import { ExtendedUserProfile, BuddySession } from '@/types/social';
import { formatSecondsToTimer } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface StudyBuddySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ExtendedUserProfile;
  targetFriend?: ExtendedUserProfile;
  subjectName?: string;
  topic?: string;
  targetMinutes?: number;
  existingSession?: BuddySession | null;
}

export function StudyBuddySyncModal({
  isOpen,
  onClose,
  currentUser,
  targetFriend: propTargetFriend,
  subjectName = 'General Study',
  topic = 'Deep Work Sprint',
  targetMinutes = 25,
  existingSession,
}: StudyBuddySyncModalProps) {
  const [session, setSession] = useState<BuddySession | null>(existingSession || null);
  const [resolvedFriend, setResolvedFriend] = useState<ExtendedUserProfile | null>(propTargetFriend || null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [highFivesCount, setHighFivesCount] = useState<number>(existingSession?.high_fives || 0);
  const [highFiveAnimate, setHighFiveAnimate] = useState<boolean>(false);
  const [status, setStatus] = useState<'inviting' | 'active' | 'completed'>('active');

  const supabase = createClient();
  const duration = existingSession?.duration_minutes || targetMinutes;
  const targetSeconds = duration * 60;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  useEffect(() => {
    if (!isOpen) return;

    // Resolve friend profile if not passed directly
    if (!propTargetFriend && existingSession) {
      const otherUserId = existingSession.buddy_id === currentUser.id
        ? existingSession.initiator_id
        : existingSession.buddy_id;

      const attachedFriend = existingSession.buddy?.id === currentUser.id
        ? existingSession.initiator
        : existingSession.buddy;

      if (attachedFriend) {
        setResolvedFriend(attachedFriend);
      } else if (otherUserId) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single()
          .then(({ data }) => {
            if (data) {
              setResolvedFriend(data as ExtendedUserProfile);
            }
          });
      }
    } else if (propTargetFriend) {
      setResolvedFriend(propTargetFriend);
    }

    if (existingSession) {
      setSession(existingSession);
      setStatus('active');
    } else if (propTargetFriend) {
      const initialSession: BuddySession = {
        id: 'buddy_' + Date.now(),
        initiator_id: currentUser.id,
        buddy_id: propTargetFriend.id,
        subject_name: subjectName,
        topic: topic,
        duration_minutes: targetMinutes,
        status: 'active',
        start_time: new Date().toISOString(),
        initiator_pings: 0,
        buddy_pings: 0,
        high_fives: 0,
        created_at: new Date().toISOString(),
        initiator: currentUser,
        buddy: propTargetFriend,
      };

      setSession(initialSession);
      setStatus('active');
    }

    // Timer Interval
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, targetMinutes, subjectName, topic, currentUser, propTargetFriend, existingSession, supabase]);

  const handleSendHighFive = () => {
    setHighFivesCount((prev) => prev + 1);
    setHighFiveAnimate(true);
    setTimeout(() => setHighFiveAnimate(false), 1200);
  };

  if (!isOpen) return null;

  const friendName = resolvedFriend?.full_name || resolvedFriend?.handle || 'Study Buddy';
  const friendFirstName = friendName.split(' ')[0];
  const friendInitial = resolvedFriend?.full_name?.charAt(0) || resolvedFriend?.handle?.charAt(1) || 'B';
  const currentUserName = currentUser?.full_name || 'You';
  const currentUserInitial = currentUser?.full_name?.charAt(0) || 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>1-on-1 Study-Buddy Sync</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  LIVE SYNC
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Shared accountability with {friendName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Partner Avatars & Timer Ring */}
        <div className="py-8 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-6 sm:gap-12 select-none mb-6">
            
            {/* Current User Card */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <span className="text-xl sm:text-2xl font-bold text-teal-300">
                  {currentUserInitial}
                </span>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>
              <span className="text-xs font-bold text-zinc-200 mt-2">You</span>
              <span className="text-[11px] text-zinc-500 font-mono">{subjectName}</span>
            </div>

            {/* Sync Pulse Core */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 rounded-full bg-zinc-800/80 border border-zinc-700 text-indigo-400 animate-pulse">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-indigo-400 mt-1 uppercase tracking-wider">Synced</span>
            </div>

            {/* Target Friend Card */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-xl sm:text-2xl font-bold text-indigo-300">
                  {friendInitial}
                </span>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>
              <span className="text-xs font-bold text-zinc-200 mt-2">
                {friendFirstName}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">In Focus</span>
            </div>
          </div>

          {/* Synchronized Giant Digital Timer */}
          <div className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums drop-shadow-md">
            {formatSecondsToTimer(remainingSeconds)}
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {Math.floor((elapsedSeconds / targetSeconds) * 100)}% of synchronized {targetMinutes}m target
          </p>
        </div>

        {/* High-Five & Focus Nudge Reaction Bar */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/90 flex items-center justify-between">
          <div className="text-left text-xs">
            <span className="text-zinc-400">High-Fives Exchanged:</span>{' '}
            <span className="font-bold text-amber-400 font-mono">{highFivesCount}</span>
          </div>

          <button
            onClick={handleSendHighFive}
            className={`px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-500/20 ${
              highFiveAnimate ? 'scale-110 bg-amber-300' : ''
            }`}
          >
            <HandMetal className="w-4 h-4" />
            <span>Send High-Five 👋</span>
          </button>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
          >
            Minimize Sync View
          </button>
        </div>
      </div>
    </div>
  );
}
