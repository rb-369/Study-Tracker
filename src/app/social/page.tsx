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
  ArrowLeft,
  KeyRound,
  Crown,
  Share2
} from 'lucide-react';
import { useStudyStore } from '@/lib/store/useStudyStore';
import { ExtendedUserProfile, StudyGroup, PrivacyMode, GroupPrivacyType, ChatMode } from '@/types/social';
import { FriendsList } from '@/components/social/FriendsList';
import { IncomingBuddyInviteBanner } from '@/components/social/IncomingBuddyInviteBanner';
import { StudyBuddySyncModal } from '@/components/social/StudyBuddySyncModal';
import { MobileNav } from '@/components/layout/MobileNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Tab = 'friends' | 'groups' | 'privacy';

export default function SocialHubPage() {
  const router = useRouter();
  const { user, updateUserProfile } = useStudyStore();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Group Form State
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [privacyType, setPrivacyType] = useState<GroupPrivacyType>('code');
  const [chatMode, setChatMode] = useState<ChatMode>('open');
  const [selectedColor, setSelectedColor] = useState('#10b981');

  // Age Gate Confirmation State
  const [showAgeGate, setShowAgeGate] = useState(false);

  const supabase = createClient();

  const currentUser: ExtendedUserProfile = (user as ExtendedUserProfile) || {
    id: user?.id || 'demo_user',
    email: user?.email || 'guest@studyflow.app',
    full_name: user?.full_name || 'Scholar',
    handle: user?.handle || '@scholar',
    level: user?.level || 1,
    xp: user?.xp || 0,
    privacy_mode: 'friends_only',
    age_verified: true,
    target_daily_minutes: 180,
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    if (user && user.age_verified === false) {
      setShowAgeGate(true);
    }
  }, [user]);

  // Load Real Study Groups from Supabase
  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setGroups(data);
      } else {
        setGroups([]);
      }
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [currentUser.id]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || isCreating) return;
    setIsCreating(true);

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: newGroup, error: grpError } = await supabase
        .from('study_groups')
        .insert({
          creator_id: currentUser.id,
          name: groupName.trim(),
          description: groupDesc.trim() || null,
          invite_code: code,
          is_public: privacyType === 'public',
          privacy_type: privacyType,
          chat_mode: chatMode,
          color: selectedColor,
          icon: 'Users',
        })
        .select()
        .single();

      if (grpError) throw grpError;

      if (newGroup) {
        // Automatically insert creator as owner
        await supabase.from('group_members').insert({
          group_id: newGroup.id,
          user_id: currentUser.id,
          role: 'owner',
        });

        setIsCreateGroupOpen(false);
        setGroupName('');
        setGroupDesc('');
        setPrivacyType('code');
        await loadGroups();
        router.push(`/social/groups/${newGroup.id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error creating group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code || isJoining) return;
    setIsJoining(true);
    setJoinStatus(null);

    try {
      // Find group by invite code
      const { data: targetGroup, error: findError } = await supabase
        .from('study_groups')
        .select('*')
        .ilike('invite_code', code)
        .maybeSingle();

      if (findError || !targetGroup) {
        setJoinStatus('❌ No group found with this invite code. Check and try again.');
        setIsJoining(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', targetGroup.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!existingMember) {
        // Join group
        await supabase.from('group_members').insert({
          group_id: targetGroup.id,
          user_id: currentUser.id,
          role: 'member',
        });
      }

      setJoinStatus(`✅ Joined "${targetGroup.name}"! Entering room...`);
      setTimeout(() => {
        setIsJoinCodeOpen(false);
        setInviteCodeInput('');
        setJoinStatus(null);
        router.push(`/social/groups/${targetGroup.id}`);
      }, 1000);
    } catch (err: any) {
      setJoinStatus(`❌ Error joining group: ${err.message || 'Network error'}`);
    } finally {
      setIsJoining(false);
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
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
          <div className="mt-6">
            {activeTab === 'friends' && (
              <FriendsList currentUser={currentUser} />
            )}

            {activeTab === 'groups' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Study Groups & Tribes</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono font-normal">
                        WhatsApp-Style Admin & Doubts
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Co-working rooms, peer doubt solving, notes sharing & focus sync
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsJoinCodeOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                      <span>Join with Code</span>
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

                {/* Groups List */}
                {groups.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-4 max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">No Study Groups Yet</h3>
                      <p className="text-xs text-zinc-400">
                        Create a group for your classmates or enter a 6-character room code to join an existing group.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setIsCreateGroupOpen(true)}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold transition-all"
                      >
                        + Create Your First Group
                      </button>
                      <button
                        onClick={() => setIsJoinCodeOpen(true)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all"
                      >
                        Enter Room Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => {
                      const isOwner = group.creator_id === currentUser.id;
                      return (
                        <div
                          key={group.id}
                          className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="p-2.5 rounded-xl border flex items-center justify-center"
                                  style={{ 
                                    backgroundColor: `${group.color || '#10b981'}15`,
                                    borderColor: `${group.color || '#10b981'}40`,
                                    color: group.color || '#10b981'
                                  }}
                                >
                                  <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-white">{group.name}</h3>
                                    {isOwner && (
                                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        <Crown className="w-3 h-3 text-amber-400" />
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
                                    Code: <strong className="text-teal-300">{group.invite_code}</strong>
                                  </span>
                                </div>
                              </div>

                              {group.privacy_type === 'public' || group.is_public ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  Public
                                </span>
                              ) : group.privacy_type === 'private' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/25 font-mono flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  Private
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/25 font-mono flex items-center gap-1">
                                  <KeyRound className="w-3 h-3" />
                                  Code Access
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                              {group.description || 'Virtual focus space for dedicated learners.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/70 text-xs">
                            <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                              <span>Room: #{group.invite_code}</span>
                              {group.chat_mode === 'reactions_only' ? (
                                <span className="text-amber-400">Reactions Only</span>
                              ) : (
                                <span className="text-teal-400">Chat & Doubts</span>
                              )}
                            </div>

                            <Link
                              href={`/social/groups/${group.id}`}
                              className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <span>Enter Room</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                        <span>Friends Only (Recommended)</span>
                        {currentUser.privacy_mode === 'friends_only' && <Check className="w-4 h-4 text-teal-400" />}
                      </div>
                      <p className="text-zinc-400 mt-1 leading-relaxed">
                        Only confirmed study friends can see your live presence and invite you to synchronized sprints.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => handlePrivacyChange('ghost')}
                    className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      currentUser.privacy_mode === 'ghost'
                        ? 'bg-teal-500/10 border-teal-500/40 text-teal-200'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 mt-0.5">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Ghost Mode (Fully Private)</span>
                        {currentUser.privacy_mode === 'ghost' && <Check className="w-4 h-4 text-teal-400" />}
                      </div>
                      <p className="text-zinc-400 mt-1 leading-relaxed">
                        Never broadcast your timer or presence to anyone. Perfect for solo study marathons.
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
        </main>
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Create New Study Group</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                You will be Admin
              </span>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Organic Chemistry Sprint Club"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description</label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Daily goals, doubt discussions, shared exam tips..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Group Privacy Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrivacyType('code')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      privacyType === 'code'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                    <div className="text-[11px]">Code Access</div>
                    <div className="text-[9px] text-zinc-500 font-normal">Default</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacyType('public')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      privacyType === 'public'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Globe className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <div className="text-[11px]">Public</div>
                    <div className="text-[9px] text-zinc-500 font-normal">Open Hub</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacyType('private')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      privacyType === 'private'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Lock className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                    <div className="text-[11px]">Private</div>
                    <div className="text-[9px] text-zinc-500 font-normal">Invite Only</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Room Chat Mode</label>
                <select
                  value={chatMode}
                  onChange={(e) => setChatMode(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="open">💬 Open Discussion & Doubt Solving (Moderated)</option>
                  <option value="reactions_only">⚡ Focus Reactions Only (Silent Work)</option>
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
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold shadow-md shadow-teal-500/20"
                >
                  {isCreating ? 'Creating Group...' : 'Create & Launch Room'}
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
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-400" />
              <span>Join Group by Room Code</span>
            </h3>
            <p className="text-zinc-400 text-[11px] mb-4">
              Enter the 6-character room code shared by the group admin.
            </p>

            {joinStatus && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 text-teal-300 rounded-xl mb-3 text-xs">
                {joinStatus}
              </div>
            )}

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="e.g. PHY99X"
                  maxLength={6}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-center font-mono text-lg tracking-widest text-teal-300 uppercase focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinCodeOpen(false);
                    setJoinStatus(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !inviteCodeInput.trim()}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold shadow-md shadow-teal-500/20"
                >
                  {isJoining ? 'Joining...' : 'Join Group'}
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
    </div>
  );
}
