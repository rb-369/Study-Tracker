'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Zap, 
  Check, 
  X, 
  Clock, 
  Sparkles,
  Coffee
} from 'lucide-react';
import { BuddySession, ExtendedUserProfile } from '@/types/social';
import { createClient } from '@/lib/supabase/client';
import { useStudyStore } from '@/lib/store/useStudyStore';

interface IncomingBuddyInviteBannerProps {
  currentUser: ExtendedUserProfile | null;
  onAcceptInvite: (session: BuddySession) => void;
}

export function IncomingBuddyInviteBanner({
  currentUser,
  onAcceptInvite,
}: IncomingBuddyInviteBannerProps) {
  const { activeSession, activeTimer, subjects } = useStudyStore();
  const supabase = createClient();

  const [pendingInvite, setPendingInvite] = useState<BuddySession | null>(null);

  // Check whether current user is in a deep focus block vs on a break or idle
  const isInDeepFocus = activeSession !== null && !activeTimer.breakState?.isBreakActive;
  const isOnBreak = !!activeTimer.breakState?.isBreakActive;

  // Poll / Listen for incoming invites
  useEffect(() => {
    if (!currentUser || currentUser.id.startsWith('demo-') || currentUser.id.startsWith('guest-')) {
      return;
    }

    const fetchPending = async () => {
      try {
        const { data } = await supabase
          .from('buddy_sessions')
          .select(`
            *,
            initiator:profiles!buddy_sessions_initiator_id_fkey(*)
          `)
          .eq('buddy_id', currentUser.id)
          .in('status', ['inviting', 'pending_break'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setPendingInvite(data as BuddySession);
        }
      } catch {}
    };

    const enrichAndSetInvite = async (rawSession: BuddySession) => {
      if (!rawSession) return;
      if (rawSession.initiator) {
        setPendingInvite(rawSession);
        return;
      }

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', rawSession.initiator_id)
          .single();

        setPendingInvite({
          ...rawSession,
          initiator: prof || undefined,
        });
      } catch {
        setPendingInvite(rawSession);
      }
    };

    fetchPending();

    const channel = supabase
      .channel(`incoming_buddy_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_sessions',
          filter: `buddy_id=eq.${currentUser.id}`,
        },
        (payload) => {
          enrichAndSetInvite(payload.new as BuddySession);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buddy_sessions',
          filter: `buddy_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const updated = payload.new as BuddySession;
          if (updated.status !== 'inviting' && updated.status !== 'pending_break') {
            setPendingInvite(null);
          } else {
            enrichAndSetInvite(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase]);

  if (!pendingInvite) return null;

  // Distraction Shield: NEVER show banner if user is currently deep in focus
  if (isInDeepFocus) {
    return null;
  }

  const initiatorName = pendingInvite.initiator?.full_name || pendingInvite.initiator?.handle || 'A Study Friend';

  const handleAccept = async () => {
    try {
      await supabase
        .from('buddy_sessions')
        .update({
          status: 'active',
          start_time: new Date().toISOString(),
        })
        .eq('id', pendingInvite.id);

      onAcceptInvite({
        ...pendingInvite,
        status: 'active',
        start_time: new Date().toISOString(),
        buddy: currentUser || undefined,
        initiator: pendingInvite.initiator,
      });
      setPendingInvite(null);
    } catch (err) {
      console.error('Failed to accept buddy session:', err);
    }
  };

  const handleDecline = async () => {
    try {
      await supabase
        .from('buddy_sessions')
        .update({ status: 'declined' })
        .eq('id', pendingInvite.id);

      setPendingInvite(null);
    } catch (err) {
      console.error('Failed to decline buddy session:', err);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-lg animate-bounce-short">
      <div className="p-4 rounded-2xl bg-zinc-900/95 border border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.3)] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0">
            {isOnBreak ? <Coffee className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                Study Buddy Invite
                <Sparkles className="w-3 h-3 text-teal-400" />
              </span>
              {isOnBreak && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Break Oasis
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              <strong className="text-teal-300">{initiatorName}</strong> invited you to a{' '}
              <span className="font-semibold text-white">{pendingInvite.duration_minutes}m Sprint</span> on &ldquo;{pendingInvite.topic}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept & Sync</span>
          </button>

          <button
            onClick={handleDecline}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Decline"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
