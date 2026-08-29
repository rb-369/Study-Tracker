'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Flame,
  Brain,
  Minus,
  Maximize2,
  AlertCircle,
  Plus,
  Send
} from 'lucide-react';
import { ExtendedUserProfile, BuddySession } from '@/types/social';
import { ThoughtCategory } from '@/types';
import { formatSecondsToTimer } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { playPomodoroCompleteChime, playBreakCompleteChime } from '@/lib/sound';
import { useStudyStore } from '@/lib/store/useStudyStore';

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
  const { addThought, customQuickPings, endSession } = useStudyStore();
  const supabase = createClient();

  const [session, setSession] = useState<BuddySession | null>(existingSession || null);
  const [resolvedFriend, setResolvedFriend] = useState<ExtendedUserProfile | null>(propTargetFriend || null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [highFivesCount, setHighFivesCount] = useState<number>(existingSession?.high_fives || 0);
  
  // Real-time animation states
  const [showHighFiveBurst, setShowHighFiveBurst] = useState<boolean>(false);
  const [partnerPingNotice, setPartnerPingNotice] = useState<string | null>(null);
  const [myPingsCount, setMyPingsCount] = useState<number>(0);
  const [partnerPingsCount, setPartnerPingsCount] = useState<number>(0);
  
  // Quick Mind Ping input
  const [isPingDrawerOpen, setIsPingDrawerOpen] = useState<boolean>(false);
  const [customPingTitle, setCustomPingTitle] = useState<string>('');

  const duration = session?.duration_minutes || existingSession?.duration_minutes || targetMinutes;
  const targetSeconds = duration * 60;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const hasCompletedRef = useRef<boolean>(false);

  // Initialize or fetch canonical session
  useEffect(() => {
    if (!isOpen) return;

    // 1. Resolve friend profile if not passed directly
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
            if (data) setResolvedFriend(data as ExtendedUserProfile);
          });
      }
    } else if (propTargetFriend) {
      setResolvedFriend(propTargetFriend);
    }

    // 2. Set or start session with timestamp
    if (existingSession) {
      setSession(existingSession);
      setHighFivesCount(existingSession.high_fives || 0);
      if (currentUser.id === existingSession.initiator_id) {
        setMyPingsCount(existingSession.initiator_pings || 0);
        setPartnerPingsCount(existingSession.buddy_pings || 0);
      } else {
        setMyPingsCount(existingSession.buddy_pings || 0);
        setPartnerPingsCount(existingSession.initiator_pings || 0);
      }
    } else if (propTargetFriend) {
      const now = new Date().toISOString();
      const initialSession: BuddySession = {
        id: 'buddy_' + Date.now(),
        initiator_id: currentUser.id,
        buddy_id: propTargetFriend.id,
        subject_name: subjectName,
        topic: topic,
        duration_minutes: targetMinutes,
        status: 'active',
        start_time: now,
        initiator_pings: 0,
        buddy_pings: 0,
        high_fives: 0,
        created_at: now,
        initiator: currentUser,
        buddy: propTargetFriend,
      };
      setSession(initialSession);
    }
  }, [isOpen, existingSession, propTargetFriend, currentUser, subjectName, topic, targetMinutes, supabase]);

  // Zero-Drift Canonical Timer based on session.start_time
  useEffect(() => {
    if (!isOpen || !session || isPaused) return;

    const calculateElapsed = () => {
      if (!session.start_time) {
        setElapsedSeconds((prev) => prev + 1);
        return;
      }
      const startMs = new Date(session.start_time).getTime();
      const nowMs = Date.now();
      const exactSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(exactSeconds);

      // Check sprint completion
      if (exactSeconds >= targetSeconds && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        playPomodoroCompleteChime();
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isOpen, session, isPaused, targetSeconds]);

  // Realtime WebSocket Channel for Live High-Fives, Mind Pings, and Pause sync
  useEffect(() => {
    if (!isOpen || !session) return;

    const channelId = `buddy_realtime_${session.id}`;
    const channel = supabase.channel(channelId, {
      config: { broadcast: { self: false } },
    });

    // 1. Broadcast listener for instant high-fives and mind pings
    channel
      .on('broadcast', { event: 'high_five' }, (payload) => {
        setHighFivesCount((prev) => prev + 1);
        setShowHighFiveBurst(true);
        setTimeout(() => setShowHighFiveBurst(false), 2000);
      })
      .on('broadcast', { event: 'mind_ping' }, (payload) => {
        setPartnerPingsCount((prev) => prev + 1);
        const pName = resolvedFriend?.full_name?.split(' ')[0] || 'Your buddy';
        setPartnerPingNotice(`${pName} logged a mind ping (${payload.payload?.category || 'thought'}) • Refocusing!`);
        setTimeout(() => setPartnerPingNotice(null), 4000);
      })
      .on('broadcast', { event: 'toggle_pause' }, (payload) => {
        setIsPaused(payload.payload?.isPaused ?? false);
      })
      .subscribe();

    // 2. Fast Polling fallback for high-fives and session status across devices
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('buddy_sessions')
          .select('high_fives, initiator_pings, buddy_pings, status')
          .eq('id', session.id)
          .single();

        if (data) {
          if (data.high_fives > highFivesCount) {
            setHighFivesCount(data.high_fives);
          }
          if (currentUser.id === session.initiator_id) {
            setPartnerPingsCount(data.buddy_pings || 0);
          } else {
            setPartnerPingsCount(data.initiator_pings || 0);
          }
        }
      } catch {}
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [isOpen, session, supabase, highFivesCount, currentUser.id, resolvedFriend]);

  // Send High-Five with instant broadcast and Supabase update
  const handleSendHighFive = async () => {
    const newCount = highFivesCount + 1;
    setHighFivesCount(newCount);
    setShowHighFiveBurst(true);
    setTimeout(() => setShowHighFiveBurst(false), 2000);

    // Broadcast to partner
    if (session) {
      const channelId = `buddy_realtime_${session.id}`;
      supabase.channel(channelId).send({
        type: 'broadcast',
        event: 'high_five',
        payload: { senderId: currentUser.id },
      });

      // Update in Supabase
      try {
        await supabase
          .from('buddy_sessions')
          .update({ high_fives: newCount })
          .eq('id', session.id);
      } catch (err) {
        console.error('Failed to sync high-five:', err);
      }
    }
  };

  // Log Mind Ping inside buddy session
  const handleLogMindPing = async (title: string, category: ThoughtCategory = 'other') => {
    const newMyPings = myPingsCount + 1;
    setMyPingsCount(newMyPings);
    setIsPingDrawerOpen(false);
    setCustomPingTitle('');

    // Save to global study store
    addThought(title, category, 2);

    // Broadcast to buddy
    if (session) {
      const channelId = `buddy_realtime_${session.id}`;
      supabase.channel(channelId).send({
        type: 'broadcast',
        event: 'mind_ping',
        payload: { category: category.replace('_', ' ') },
      });

      // Update ping counter in Supabase
      const isInitiator = currentUser.id === session.initiator_id;
      try {
        await supabase
          .from('buddy_sessions')
          .update(
            isInitiator
              ? { initiator_pings: newMyPings }
              : { buddy_pings: newMyPings }
          )
          .eq('id', session.id);
      } catch {}
    }
  };

  // Toggle Pause Sync
  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    if (session) {
      const channelId = `buddy_realtime_${session.id}`;
      supabase.channel(channelId).send({
        type: 'broadcast',
        event: 'toggle_pause',
        payload: { isPaused: nextPaused },
      });
    }
  };

  // Complete and Finish Sprint
  const handleFinishSprint = async () => {
    if (session) {
      try {
        await supabase
          .from('buddy_sessions')
          .update({ status: 'completed' })
          .eq('id', session.id);
      } catch {}
    }
    onClose();
  };

  if (!isOpen) return null;

  const friendName = resolvedFriend?.full_name || resolvedFriend?.handle || 'Study Buddy';
  const friendFirstName = friendName.split(' ')[0];
  const friendInitial = resolvedFriend?.full_name?.charAt(0) || resolvedFriend?.handle?.charAt(1) || 'B';
  const currentUserInitial = currentUser?.full_name?.charAt(0) || 'U';

  // -------------------------------------------------------------
  // Minimized Floating HUD Widget
  // -------------------------------------------------------------
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 animate-slide-up">
        <div className="p-3.5 rounded-2xl bg-zinc-900/95 border border-teal-500/50 shadow-[0_0_25px_rgba(20,184,166,0.3)] backdrop-blur-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400 flex items-center justify-center text-teal-300 font-bold text-xs">
            {currentUserInitial}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span className="font-mono text-teal-400">{formatSecondsToTimer(remainingSeconds)}</span>
              <span className="text-[10px] text-zinc-400 font-normal">with {friendFirstName}</span>
            </div>
            <span className="text-[10px] text-zinc-500 block truncate max-w-[120px]">{topic}</span>
          </div>

          <button
            onClick={handleSendHighFive}
            className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all active:scale-95"
            title="Send High-Five"
          >
            <HandMetal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Expand Full View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Full Synchronized 1-on-1 Modal
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center">
        
        {/* Celebration Floating Burst */}
        {showHighFiveBurst && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center animate-bounce-short">
            <div className="p-4 rounded-3xl bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] backdrop-blur-md text-amber-300 flex items-center gap-2">
              <span className="text-3xl">✋</span>
              <span className="text-sm font-black text-white uppercase tracking-wider">High-Five Synced!</span>
              <span className="text-3xl">🎉</span>
            </div>
          </div>
        )}

        {/* Partner Ping Notification Toast */}
        {partnerPingNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[90%] p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 animate-slide-up shadow-lg">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>{partnerPingNotice}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>1-on-1 Study-Buddy Sync</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  LIVE SYNC
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Shared accountability with <span className="text-zinc-200 font-semibold">{friendName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Minimize to Floating Pill"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Partner Avatars & Sync Center */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-6 sm:gap-12 select-none mb-4">
            
            {/* Current User Card */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <span className="text-xl sm:text-2xl font-bold text-teal-300">
                  {currentUserInitial}
                </span>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>
              <span className="text-xs font-bold text-zinc-200 mt-2">You</span>
              <span className="text-[11px] text-zinc-400 font-mono">{subjectName}</span>
              <span className="text-[10px] text-teal-400/90 mt-0.5 font-mono">{myPingsCount} pings logged</span>
            </div>

            {/* Sync Pulse Core */}
            <div className="flex flex-col items-center justify-center">
              <div className={`p-3 rounded-full border transition-all ${
                isPaused 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                  : 'bg-zinc-800/80 border-zinc-700 text-indigo-400 animate-pulse'
              }`}>
                {isPaused ? <Pause className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <span className="text-[10px] font-mono mt-1 uppercase tracking-wider text-indigo-400 font-bold">
                {isPaused ? 'Paused' : 'Synced'}
              </span>
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
              <span className="text-[11px] text-zinc-400 font-mono">In Focus</span>
              <span className="text-[10px] text-indigo-400/90 mt-0.5 font-mono">{partnerPingsCount} pings logged</span>
            </div>
          </div>

          {/* Synchronized Giant Digital Timer */}
          <div className={`font-mono text-5xl sm:text-6xl font-black tracking-tight tabular-nums drop-shadow-md transition-colors ${
            isPaused ? 'text-amber-400/80' : 'text-white'
          }`}>
            {formatSecondsToTimer(remainingSeconds)}
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {targetSeconds > 0 ? Math.floor((elapsedSeconds / targetSeconds) * 100) : 0}% of synchronized {duration}m target • &ldquo;{topic}&rdquo;
          </p>

          {/* Pause/Resume & Quick Control Bar */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleTogglePause}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                isPaused 
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume Sprint' : 'Pause Sprint'}</span>
            </button>

            <button
              onClick={() => setIsPingDrawerOpen(!isPingDrawerOpen)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Log Mind Ping</span>
            </button>
          </div>
        </div>

        {/* Mind Ping Quick Logger Drawer */}
        {isPingDrawerOpen && (
          <div className="mb-4 p-4 rounded-2xl bg-zinc-950/80 border border-purple-500/30 text-left animate-slide-up space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>Log Stray Thought (1-Tap Distraction Isolation)</span>
              </span>
              <button
                onClick={() => setIsPingDrawerOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            {/* Quick Ping Chips */}
            <div className="flex flex-wrap gap-1.5">
              {(customQuickPings || []).slice(0, 6).map((qp) => (
                <button
                  key={qp.id}
                  onClick={() => handleLogMindPing(qp.title, qp.category)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-purple-500/20 text-zinc-300 hover:text-purple-200 border border-zinc-800 hover:border-purple-500/40 text-[11px] font-medium transition-all active:scale-95"
                >
                  {qp.title}
                </button>
              ))}
            </div>

            {/* Custom ping input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customPingTitle}
                onChange={(e) => setCustomPingTitle(e.target.value)}
                placeholder="Or type what distracted you..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPingTitle.trim()) {
                    handleLogMindPing(customPingTitle.trim(), 'other');
                  }
                }}
              />
              <button
                onClick={() => customPingTitle.trim() && handleLogMindPing(customPingTitle.trim(), 'other')}
                className="p-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* High-Five Reaction Bar */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/90 flex items-center justify-between">
          <div className="text-left text-xs">
            <span className="text-zinc-400">High-Fives Exchanged:</span>{' '}
            <span className="font-bold text-amber-400 font-mono text-sm ml-1">{highFivesCount}</span>
          </div>

          <button
            onClick={handleSendHighFive}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-500/25"
          >
            <HandMetal className="w-4 h-4" />
            <span>Send High-Five 👋</span>
          </button>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-zinc-800 text-xs">
          <button
            onClick={() => setIsMinimized(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
          >
            Minimize Sync View
          </button>

          <button
            onClick={handleFinishSprint}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all active:scale-95"
          >
            Finish & Log Session
          </button>
        </div>
      </div>
    </div>
  );
}
