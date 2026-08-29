'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Play, 
  Pause, 
  Flame, 
  Zap, 
  Trophy, 
  CheckCircle2, 
  Coffee,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStudyStore } from '@/lib/store/useStudyStore';
import { ExtendedUserProfile, LiveRoomPresence } from '@/types/social';
import { GroupChallenge } from '@/types/gamification';
import { RoomChat } from '@/components/social/RoomChat';
import { formatSecondsToTimer } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function StudyGroupRoomPage() {
  const params = useParams();
  const groupId = (params?.id as string) || 'default_room';
  const { user, activeSession, activeTimer, startSession, pauseSession, resumeSession } = useStudyStore();

  const [participants, setParticipants] = useState<LiveRoomPresence[]>([]);
  const [challenge, setChallenge] = useState<GroupChallenge>({
    id: 'ch_1',
    group_id: groupId,
    title: 'Weekly 100 Hours Deep Work Sprint',
    description: 'All members contribute net focus hours towards the group badge.',
    target_hours: 100,
    current_hours: 68.4,
    start_date: '2026-08-25',
    end_date: '2026-09-01',
    status: 'active',
    reward_xp: 150,
    created_at: new Date().toISOString(),
  });

  const currentUser: ExtendedUserProfile = (user as ExtendedUserProfile) || {
    id: 'demo_user',
    email: 'guest@studyflow.app',
    full_name: 'Guest Learner',
    handle: '@guest_learner',
    level: 5,
    xp: 650,
    privacy_mode: 'friends_only',
    age_verified: true,
    target_daily_minutes: 180,
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    // Setup initial mock participant presences
    setParticipants([
      {
        user_id: currentUser.id,
        handle: currentUser.handle || '@you',
        full_name: currentUser.full_name || 'You',
        is_studying: !!activeSession,
        subject_name: activeSession?.subject?.name || 'Calculus',
        topic: activeSession?.topic || 'Integration by Parts',
        remaining_seconds: 1420,
        is_on_break: activeTimer.breakState?.isBreakActive ?? false,
        last_active: new Date().toISOString(),
      },
      {
        user_id: 'p_2',
        handle: '@marcus_aero',
        full_name: 'Marcus Vance',
        is_studying: true,
        subject_name: 'Fluid Dynamics',
        topic: 'Navier-Stokes Equations',
        remaining_seconds: 860,
        is_on_break: false,
        last_active: new Date().toISOString(),
      },
      {
        user_id: 'p_3',
        handle: '@elena_ai',
        full_name: 'Elena Rostova',
        is_studying: true,
        subject_name: 'Machine Learning',
        topic: 'Backpropagation Derivations',
        remaining_seconds: 320,
        is_on_break: false,
        last_active: new Date().toISOString(),
      },
      {
        user_id: 'p_4',
        handle: '@devon_med',
        full_name: 'Devon Miller',
        is_studying: false,
        subject_name: 'Neuroscience',
        topic: 'Synaptic Plasticity',
        remaining_seconds: 0,
        is_on_break: true,
        last_active: new Date().toISOString(),
      },
    ]);
  }, [activeSession, activeTimer, currentUser]);

  const challengeProgressPct = Math.min(100, Math.round((challenge.current_hours / challenge.target_hours) * 100));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 pt-6 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/social"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>STEM Deep Work &amp; Olympiad</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                ROOM #STEM99
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Live Co-Working Canvas • {participants.length} Learners in Room
            </p>
          </div>
        </div>

        {/* Challenge Progress Mini-Card */}
        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-4 text-xs">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center justify-between gap-4">
              <span>{challenge.title}</span>
              <span className="text-amber-400 font-mono">{challengeProgressPct}%</span>
            </div>
            <div className="w-44 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-teal-400 rounded-full"
                style={{ width: `${challengeProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage (Live Desks) & Right (Moderated Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left 2 Cols: Live Participant Desks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>Active Co-Working Desks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Real-time Presence</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {participants.map((p) => (
              <div
                key={p.user_id}
                className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-4 shadow-lg hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full bg-zinc-800 border-2 border-teal-500/40 flex items-center justify-center font-bold text-teal-300 text-base shadow-sm">
                      {p.full_name.charAt(0)}
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                        p.is_on_break ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'
                      }`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{p.full_name}</span>
                        {p.user_id === currentUser.id && (
                          <span className="text-[10px] font-mono px-1 rounded bg-teal-500/20 text-teal-300">You</span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">{p.handle}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    p.is_on_break
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {p.is_on_break ? 'ON BREAK' : 'IN FOCUS'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                  <div className="text-xs font-bold text-zinc-200 truncate">{p.topic}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">{p.subject_name}</div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1 text-zinc-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{p.is_on_break ? 'Resting' : `${Math.floor(p.remaining_seconds! / 60)}m left`}</span>
                  </div>

                  <span className="text-[11px] text-zinc-500 font-mono">Focused</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Moderated Room Chat Widget */}
        <div className="h-[580px]">
          <RoomChat
            groupId={groupId}
            currentUser={currentUser}
            chatMode="open"
            isOwnerOrAdmin={true}
          />
        </div>

      </div>
    </main>
  );
}
