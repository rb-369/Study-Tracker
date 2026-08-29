'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Globe, 
  Plus, 
  Hash, 
  Zap, 
  Flame, 
  Check, 
  EyeOff, 
  Eye, 
  ChevronRight,
  Search,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { useStudyStore } from '@/lib/store/useStudyStore';
import { ExtendedUserProfile, StudyGroup, PrivacyMode, BuddySession } from '@/types/social';
import { FriendsList } from '@/components/social/FriendsList';
import { IncomingBuddyInviteBanner } from '@/components/social/IncomingBuddyInviteBanner';
import { StudyBuddySyncModal } from '@/components/social/StudyBuddySyncModal';
import { MobileNav } from '@/components/layout/MobileNav';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Tab = 'friends' | 'groups' | 'privacy';

export default function SocialHubPage() {
  const { user, updateUserProfile } = useStudyStore();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);
  const [activeBuddySession, setActiveBuddySession] = useState<BuddySession | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  // New Group Form State
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isGroupPublic, setIsGroupPublic] = useState(false);
  const [chatMode, setChatMode] = useState<'open' | 'reactions_only'>('open');

  // Age Gate Confirmation State
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

  const supabase = createClient();

  const currentUser: ExtendedUserProfile = (user as ExtendedUserProfile) || {
    id: 'demo_user',
    email: 'guest@studyflow.app',
    full_name: 'Guest Learner',
    handle: '@guest_learner',
    level: 5,
    xp: 650,
    privacy_mode: 'friends_only',
    age_verified: false,
    target_daily_minutes: 180,
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    if (user && user.age_verified === false) {
      setShowAgeGate(true);
    }
  }, [user]);

  // Load Study Groups
  const loadGroups = async () => {
    const { data } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setGroups(data);
    } else {
      // Mock starter groups
      setGroups([
        {
          id: 'grp_stem_deepwork',
          creator_id: 'sys',
          name: 'STEM Deep Work & Olympiad',
          description: 'Physics, Mathematics & Engineering daily focus sprints.',
          invite_code: 'STEM99',
          is_public: true,
          chat_mode: 'open',
          color: '#10b981',
          icon: 'Brain',
          created_at: new Date().toISOString(),
          members_count: 34,
          active_studying_count: 8,
        },
        {
          id: 'grp_med_prep',
          creator_id: 'sys',
          name: 'Pre-Med & Biology Flow',
          description: 'Anatomy, Organic Chem, and Flashcard recall together.',
          invite_code: 'MED202',
          is_public: true,
          chat_mode: 'reactions_only',
          color: '#6366f1',
          icon: 'Flame',
          created_at: new Date().toISOString(),
          members_count: 22,
          active_studying_count: 5,
        },
      ]);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGroup: StudyGroup = {
      id: 'grp_' + Date.now(),
      creator_id: currentUser.id,
      name: groupName,
      description: groupDesc,
      invite_code: code,
      is_public: isGroupPublic,
      chat_mode: chatMode,
      color: '#10b981',
      icon: 'Users',
      created_at: new Date().toISOString(),
      members_count: 1,
      active_studying_count: 1,
    };

    setGroups((prev) => [newGroup, ...prev]);
    setIsCreateGroupOpen(false);
    setGroupName('');
    setGroupDesc('');

    try {
      await supabase.from('study_groups').insert({
        creator_id: currentUser.id,
        name: newGroup.name,
        description: newGroup.description,
        invite_code: newGroup.invite_code,
        is_public: newGroup.is_public,
        chat_mode: newGroup.chat_mode,
      });
    } catch {}
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) return;

    const found = groups.find((g) => g.invite_code === code);
    if (found) {
      setJoinStatus(`Joined "${found.name}" successfully!`);
      setTimeout(() => {
        setIsJoinCodeOpen(false);
        setInviteCodeInput('');
        setJoinStatus(null);
      }, 1500);
    } else {
      setJoinStatus('Invalid invite code. Please check and try again.');
    }
  };

  const handlePrivacyChange = async (mode: PrivacyMode) => {
    await updateUserProfile({ privacy_mode: mode });
  };

  const handleConfirmAgeGate = async () => {
    await updateUserProfile({ age_verified: true });
    setShowAgeGate(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 pt-8 px-4 sm:px-6 max-w-6xl mx-auto">
      
      {/* Top Banner with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm"
            title="Back to Focus Console"
          >
            <ArrowLeft className="w-5 h-5 text-teal-400" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                Social Study Hub & Tribes
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Accountability circles, 1-on-1 buddy timers & live co-working rooms
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends & Buddy Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'groups'
                ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Study Groups</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy & Safety</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="mt-8">
        {activeTab === 'friends' && (
          <FriendsList currentUser={currentUser} />
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Study Groups & Co-Working Rooms</h2>
                <p className="text-xs text-zinc-400">Join virtual rooms with synchronized study timers and group challenges</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsJoinCodeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-all"
                >
                  Join with Code
                </button>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Group</span>
                </button>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{group.name}</h3>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Code: <strong className="text-teal-300">{group.invite_code}</strong>
                          </span>
                        </div>
                      </div>

                      {group.chat_mode === 'reactions_only' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono">
                          Reactions Only
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/25 font-mono">
                          Open Chat
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                      {group.description || 'Virtual focus space for dedicated learners.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/70 text-xs">
                    <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                      <span>{group.members_count || 1} Members</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {group.active_studying_count || 1} Studying Now
                      </span>
                    </div>

                    <Link
                      href={`/social/groups/${group.id}`}
                      className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>Enter Room</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="max-w-2xl bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span>Privacy & Presence Defaults</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                You control who sees your active study sessions and live focus status.
              </p>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => handlePrivacyChange('friends_only')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  currentUser.privacy_mode === 'friends_only'
                    ? 'bg-teal-500/10 border-teal-500/40 text-teal-200'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="p-2 rounded-lg bg-zinc-800 text-teal-400 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Friends Only (Recommended Default)</span>
                    {currentUser.privacy_mode === 'friends_only' && <Check className="w-4 h-4 text-teal-400" />}
                  </div>
                  <p className="text-zinc-400 mt-1 leading-relaxed">
                    Only accepted mutual friends can see your active topic, remaining time, and study streaks.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handlePrivacyChange('ghost')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  currentUser.privacy_mode === 'ghost'
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="p-2 rounded-lg bg-zinc-800 text-indigo-400 mt-0.5">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Ghost Mode (Invisible)</span>
                    {currentUser.privacy_mode === 'ghost' && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-zinc-400 mt-1 leading-relaxed">
                    Your focus timer runs in complete stealth. No friends or groups see your activity or presence.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handlePrivacyChange('public')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  currentUser.privacy_mode === 'public'
                    ? 'bg-teal-500/10 border-teal-500/40 text-teal-200'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="p-2 rounded-lg bg-zinc-800 text-amber-400 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Public in Joined Groups</span>
                    {currentUser.privacy_mode === 'public' && <Check className="w-4 h-4 text-teal-400" />}
                  </div>
                  <p className="text-zinc-400 mt-1 leading-relaxed">
                    Fellow members in your joined Study Groups can see when you are in a co-working room.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-xs">
            <h3 className="text-sm font-bold text-white mb-4">Create Study Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Calculus & Quantum Physics"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Description</label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Focus topics, meeting schedules..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Room Chat Mode</label>
                <select
                  value={chatMode}
                  onChange={(e) => setChatMode(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="open">Open Discussion Chat (Moderated)</option>
                  <option value="reactions_only">Focus Reactions Only (Zero chat distraction)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold shadow-md shadow-teal-500/20"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join with Invite Code Modal */}
      {isJoinCodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-xs">
            <h3 className="text-sm font-bold text-white mb-3">Join Group by Room Code</h3>
            {joinStatus && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 text-teal-300 rounded-xl mb-3 font-mono">
                {joinStatus}
              </div>
            )}
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="e.g. STEM99"
                  maxLength={6}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-center font-mono text-base tracking-widest text-teal-300 uppercase focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinCodeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold shadow-md shadow-teal-500/20"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Age & Safety Confirmation Gate */}
      {showAgeGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Student Safety & Community Affirmation</h3>
            <p className="text-zinc-400 leading-relaxed">
              StudyFlow is committed to providing a safe, focused environment for all learners. Please confirm you are 13 years of age or older and agree to maintain respectful, distraction-free study communication.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmAgeGate}
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-98"
              >
                I Affirm (13+ and Agree)
              </button>
            </div>
          </div>
        </div>
      )}
      <MobileNav />
    </main>
  );
}
