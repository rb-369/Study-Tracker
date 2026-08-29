'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  ShieldAlert, 
  Zap, 
  HandMetal, 
  Clock, 
  Sparkles,
  Flame,
  MoreVertical,
  UserX
} from 'lucide-react';
import { ExtendedUserProfile, Friendship, FriendRequest } from '@/types/social';
import { createClient } from '@/lib/supabase/client';
import { checkRateLimit, registerAction, blockUser } from '@/lib/moderation/moderationService';
import { StudyBuddyInviteModal } from './StudyBuddyInviteModal';
import { BuddySession } from '@/types/social';
import { useStudyStore } from '@/lib/store/useStudyStore';

interface FriendsListProps {
  currentUser: ExtendedUserProfile;
}

export function FriendsList({ currentUser }: FriendsListProps) {
  const { setActiveBuddySession, setIsBuddySyncMinimized } = useStudyStore();
  const [friends, setFriends] = useState<ExtendedUserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addStatus, setAddStatus] = useState<{ text: string; success: boolean } | null>(null);
  const [invitingFriend, setInvitingFriend] = useState<ExtendedUserProfile | null>(null);
  const [highFiveToast, setHighFiveToast] = useState<string | null>(null);

  const supabase = createClient();

  // Load friends and requests
  const loadSocialData = async () => {
    // 1. Fetch Friendships
    const { data: fData } = await supabase
      .from('friendships')
      .select('friend_id, user_id')
      .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

    if (fData && fData.length > 0) {
      const friendIds = fData.map((f) => (f.user_id === currentUser.id ? f.friend_id : f.user_id));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profilesData) {
        setFriends(profilesData);
      }
    } else {
      // Demo mock friends if empty
      setFriends([
        {
          id: 'demo_f1',
          email: 'sarah@example.com',
          full_name: 'Sarah Chen',
          handle: '@sarah_focus',
          level: 14,
          xp: 2840,
          target_daily_minutes: 180,
          created_at: new Date().toISOString(),
          is_studying: true,
          active_subject_topic: 'Organic Chemistry • 18m left',
        },
        {
          id: 'demo_f2',
          email: 'alex@example.com',
          full_name: 'Alex Rivera',
          handle: '@alex_deepwork',
          level: 9,
          xp: 1420,
          target_daily_minutes: 120,
          created_at: new Date().toISOString(),
          is_studying: false,
          active_subject_topic: 'Break - Zen Breathwork',
        },
      ]);
    }

    // 2. Fetch Incoming Requests
    const { data: reqData } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', currentUser.id)
      .eq('status', 'pending');

    if (reqData) {
      setRequests(reqData);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, [currentUser.id]);

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStatus(null);

    const rateCheck = checkRateLimit('friend_request');
    if (!rateCheck.allowed) {
      setAddStatus({
        text: `Rate limit reached. Max 5 requests per hour. Please wait ${rateCheck.retryAfterSeconds}s.`,
        success: false,
      });
      return;
    }

    try {
      // Look up target profile
      const cleanHandle = searchQuery.trim().startsWith('@') ? searchQuery.trim() : `@${searchQuery.trim()}`;
      const { data: targetProfile, error: pErr } = await supabase
        .from('profiles')
        .select('id, handle')
        .or(`handle.eq.${cleanHandle},email.eq.${searchQuery.trim()}`)
        .maybeSingle();

      if (!targetProfile) {
        setAddStatus({ text: `No learner found with handle or email "${searchQuery}"`, success: false });
        return;
      }

      if (targetProfile.id === currentUser.id) {
        setAddStatus({ text: "You cannot add yourself as a friend.", success: false });
        return;
      }

      registerAction('friend_request');

      const { error: reqErr } = await supabase.from('friend_requests').insert({
        sender_id: currentUser.id,
        receiver_id: targetProfile.id,
        status: 'pending',
      });

      if (reqErr) throw reqErr;

      setAddStatus({ text: `Friend request sent to ${cleanHandle}!`, success: true });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSearchQuery('');
        setAddStatus(null);
      }, 1800);
    } catch (err: any) {
      setAddStatus({ text: err.message || 'Failed to send request', success: false });
    }
  };

  const handleAcceptRequest = async (reqId: string, senderId: string) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', reqId);
    await supabase.from('friendships').insert({ user_id: currentUser.id, friend_id: senderId });
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    loadSocialData();
  };

  const handleDeclineRequest = async (reqId: string) => {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', reqId);
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleBlockFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to block ${friendName}? This will remove your friendship and prevent all pairing requests.`)) {
      return;
    }
    await blockUser(currentUser.id, friendId);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const handleHighFiveFriend = (friendName: string) => {
    setHighFiveToast(`High-five sent to ${friendName}! 👋`);
    setTimeout(() => setHighFiveToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {highFiveToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-xl animate-bounce flex items-center gap-2">
          <HandMetal className="w-4 h-4" />
          <span>{highFiveToast}</span>
        </div>
      )}

      {/* Header & Add Friend Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            <span>Study Friends ({friends.length})</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Accountability partners & synchronized 1-on-1 focus
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Friend</span>
        </button>
      </div>

      {/* Pending Incoming Requests Banner */}
      {requests.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-3">
          <div className="text-xs font-bold text-indigo-300">
            Pending Friend Requests ({requests.length})
          </div>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-200 font-semibold font-mono">Learner #{r.sender_id.slice(0, 6)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptRequest(r.id, r.sender_id)}
                    className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors"
                    title="Accept"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(r.id)}
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Decline"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Cards Grid */}
      {friends.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No study buddies yet</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Add friends using their handle to study together with synchronized Pomodoros!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 text-sm">
                    {friend.full_name?.charAt(0) || 'F'}
                    {friend.is_studying && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{friend.full_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        Lvl {friend.level || 1}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {friend.handle || `@user_${friend.id.slice(0, 5)}`}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBlockFriend(friend.id, friend.full_name)}
                  className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                  title="Block User"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>

              {/* Live Status Pill */}
              <div className="px-3 py-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${friend.is_studying ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
                <span className="text-zinc-300 text-[11px] truncate">
                  {friend.active_subject_topic || (friend.is_studying ? 'Deep Work Session' : 'Currently Idle')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setInvitingFriend(friend)}
                  className="flex-1 py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  <span>Study Together</span>
                </button>

                <button
                  onClick={() => handleHighFiveFriend(friend.full_name)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Send High-Five"
                >
                  <HandMetal className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Friend Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-400" />
                <span>Add Study Buddy</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddStatus(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addStatus && (
              <div className={`mt-3 p-3 rounded-xl text-xs ${
                addStatus.success
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}>
                {addStatus.text}
              </div>
            )}

            <form onSubmit={handleSendFriendRequest} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Friend&apos;s Handle or Email
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="@username or email"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Rate limit: 5 friend requests per hour to prevent spam.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold shadow-md shadow-teal-500/20"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-on-1 Focus Invite Configuration Modal */}
      {invitingFriend && (
        <StudyBuddyInviteModal
          isOpen={!!invitingFriend}
          onClose={() => setInvitingFriend(null)}
          currentUser={currentUser}
          targetFriend={invitingFriend}
          onStartSynchronizedSession={(session) => {
            setInvitingFriend(null);
            setIsBuddySyncMinimized(false);
            setActiveBuddySession(session);
          }}
        />
      )}
    </div>
  );
}
