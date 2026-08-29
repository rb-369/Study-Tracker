'use client';

import React from 'react';
import { useStudyStore } from '@/lib/store/useStudyStore';
import { IncomingBuddyInviteBanner } from '@/components/social/IncomingBuddyInviteBanner';
import { StudyBuddySyncModal } from '@/components/social/StudyBuddySyncModal';
import { ExtendedUserProfile } from '@/types/social';

export function GlobalBuddySyncContainer() {
  const { 
    user, 
    activeBuddySession, 
    setActiveBuddySession,
    isBuddySyncMinimized,
    setIsBuddySyncMinimized,
  } = useStudyStore();

  if (!user) return null;

  const extendedUser: ExtendedUserProfile = {
    ...user,
    full_name: user.full_name || 'You',
    handle: user.handle || '@you',
    level: user.level || 1,
    xp: user.xp || 0,
    target_daily_minutes: user.target_daily_minutes || 180,
    created_at: user.created_at || new Date().toISOString(),
  };

  return (
    <>
      {/* Global Real-time Incoming Invite Banner */}
      <IncomingBuddyInviteBanner
        currentUser={extendedUser}
        onAcceptInvite={(session) => {
          setIsBuddySyncMinimized(false);
          setActiveBuddySession(session);
        }}
      />

      {/* Global Synchronized Study Buddy Modal & Floating HUD */}
      {activeBuddySession && (
        <StudyBuddySyncModal
          isOpen={true}
          onClose={() => {
            setActiveBuddySession(null);
            setIsBuddySyncMinimized(false);
          }}
          currentUser={extendedUser}
          targetFriend={
            activeBuddySession.buddy?.id === user.id
              ? activeBuddySession.initiator
              : activeBuddySession.buddy
          }
          existingSession={activeBuddySession}
          isMinimized={isBuddySyncMinimized}
          onToggleMinimize={(min) => setIsBuddySyncMinimized(min)}
        />
      )}
    </>
  );
}
