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
  Hash,
  Crown,
  Share2,
  Copy,
  Check,
  FileText,
  ExternalLink,
  Lock,
  Globe,
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  Settings,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useStudyStore } from '@/lib/store/useStudyStore';
import { ExtendedUserProfile, StudyGroup, GroupMember, GroupMessage, LiveRoomPresence } from '@/types/social';
import { RoomChat } from '@/components/social/RoomChat';
import { MobileNav } from '@/components/layout/MobileNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';

type RoomTab = 'chat' | 'notes' | 'coworking' | 'admin';

export default function StudyGroupRoomPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = (params?.id as string) || '';
  const { user, activeSession, activeTimer } = useStudyStore();

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [sharedNotes, setSharedNotes] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoomTab>('chat');
  const [isCopied, setIsCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Admin form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<'public' | 'code' | 'private'>('code');
  const [adminSaveStatus, setAdminSaveStatus] = useState<string | null>(null);

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

  const loadGroupDetails = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Group
      const { data: grpData, error: grpErr } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();

      if (grpData && !grpErr) {
        setGroup(grpData);
        setEditName(grpData.name);
        setEditDesc(grpData.description || '');
        setEditPrivacy(grpData.privacy_type || (grpData.is_public ? 'public' : 'code'));
      }

      // 2. Fetch Members
      const { data: memData } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId);

      if (memData) {
        setMembers(memData as any);
      }

      // 3. Fetch Shared Notes & Resources
      const { data: notesData } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .or('tag.eq.notes,attachment_url.neq.null')
        .order('created_at', { ascending: false });

      if (notesData) {
        setSharedNotes(notesData);
      }
    } catch (err) {
      console.error('Error loading group details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroupDetails();
    }
  }, [groupId, currentUser.id]);

  const isMember = members.some((m) => m.user_id === currentUser.id);
  const isOwner = group?.creator_id === currentUser.id || members.some((m) => m.user_id === currentUser.id && m.role === 'owner');

  const handleJoinGroup = async () => {
    if (isJoining || !group) return;
    setIsJoining(true);
    try {
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: currentUser.id,
        role: 'member',
      });
      await loadGroupDetails();
    } catch (err: any) {
      alert(err.message || 'Error joining group');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !isOwner) return;
    setAdminSaveStatus('Saving changes...');

    try {
      const { error } = await supabase
        .from('study_groups')
        .update({
          name: editName.trim(),
          description: editDesc.trim() || null,
          is_public: editPrivacy === 'public',
          privacy_type: editPrivacy,
        })
        .eq('id', group.id);

      if (error) throw error;
      setAdminSaveStatus('✅ Group settings updated!');
      await loadGroupDetails();
      setTimeout(() => setAdminSaveStatus(null), 2500);
    } catch (err: any) {
      setAdminSaveStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleRegenerateCode = async () => {
    if (!group || !isOwner) return;
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await supabase.from('study_groups').update({ invite_code: newCode }).eq('id', group.id);
      await loadGroupDetails();
    } catch (err: any) {
      alert('Failed to regenerate code: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#09090b] items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-400 animate-spin" />
          <span>Loading Study Room...</span>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen bg-[#09090b] flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
          <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <h2 className="text-base font-bold text-white">Study Group Not Found</h2>
          <p className="text-xs text-zinc-400 mt-1">This group may have been deleted or the code is incorrect.</p>
        </div>
        <Link href="/social" className="px-4 py-2 rounded-xl bg-teal-500 text-zinc-950 font-bold text-xs">
          Return to Social Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Top Header Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/social"
                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center justify-center active:scale-95 shadow-sm"
                  title="Back to Social Hub"
                >
                  <ArrowLeft className="w-5 h-5 text-teal-400" />
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                      {group.name}
                    </h1>
                    {isOwner && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {group.description || 'Virtual focus space for peer accountability & doubts'}
                  </p>
                </div>
              </div>

              {/* Room Code & Share Chips */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-teal-500/50 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-2"
                  title="Click to copy room code"
                >
                  <span className="text-zinc-500">Code:</span>
                  <strong className="text-teal-300 font-bold tracking-wider">{group.invite_code}</strong>
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </button>

                {!isMember && (
                  <button
                    onClick={handleJoinGroup}
                    disabled={isJoining}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs shadow-md shadow-teal-500/20 active:scale-95"
                  >
                    {isJoining ? 'Joining...' : 'Join Group'}
                  </button>
                )}
              </div>
            </div>

            {/* Room Navigation Tabs */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                }`}
              >
                <span>💬 Chat & Doubts</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                }`}
              >
                <span>📝 Shared Notes ({sharedNotes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('coworking')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'coworking'
                    ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                }`}
              >
                <span>⚡ Live Desks ({members.length})</span>
              </button>

              {isOwner && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ml-auto ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Admin Settings</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: Chat & Doubt Arena */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <RoomChat
                groupId={group.id}
                currentUser={currentUser}
                chatMode={group.chat_mode}
                isOwnerOrAdmin={isOwner}
              />
            </div>
          )}

          {/* TAB 2: Shared Notes & Resources Vault */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Shared Study Notes & Cheat Sheets</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    All reference documents, PDFs, and links shared in this group room.
                  </p>
                </div>
              </div>

              {sharedNotes.length === 0 ? (
                <div className="p-10 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-2">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-medium text-zinc-400">No notes shared in this group yet</p>
                  <p className="text-[11px] text-zinc-500">
                    Use the &quot;Share Notes / Link&quot; button in the room chat to pin reference materials here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sharedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{note.attachment_title || 'Study Resource'}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        {note.attachment_url && (
                          <a
                            href={note.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
                          >
                            <span>Open Resource</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Live Co-Working Desk */}
          {activeTab === 'coworking' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span>Live Group Study Desks</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  See what fellow group members are actively studying in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Current User Desk */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-teal-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                        {currentUser.full_name?.charAt(0) || 'Y'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">You ({currentUser.handle || '@you'})</div>
                        <div className="text-[10px] text-zinc-400">Level {currentUser.level}</div>
                      </div>
                    </div>

                    {activeSession ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    )}
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-950 text-xs font-mono">
                    {activeSession ? (
                      <div>
                        <div className="text-emerald-400 font-bold truncate">
                          {activeSession.subject?.name}: {activeSession.topic}
                        </div>
                        <div className="text-zinc-500 text-[10px]">
                          Focusing • {Math.round(activeTimer.elapsedSeconds / 60)}m elapsed
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-500">Currently Idle (Start a timer on Focus page)</div>
                    )}
                  </div>
                </div>

                {/* Other Members */}
                {members
                  .filter((m) => m.user_id !== currentUser.id)
                  .map((mem) => {
                    const prof = mem.profile;
                    return (
                      <div key={mem.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs">
                              {prof?.full_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-zinc-200">
                                {prof?.full_name || 'Scholar'}
                              </div>
                              <div className="text-[10px] text-zinc-500">{prof?.handle || '@scholar'}</div>
                            </div>
                          </div>

                          {mem.role === 'owner' && (
                            <span className="text-[10px] font-bold text-amber-400 font-mono">👑 Admin</span>
                          )}
                        </div>

                        <div className="p-2 rounded-lg bg-zinc-950 text-xs font-mono text-zinc-500">
                          Joined Member
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: Admin Settings (Owner Only) */}
          {activeTab === 'admin' && isOwner && (
            <div className="max-w-xl bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Group Admin Control Center</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Full Authority
                </span>
              </div>

              {adminSaveStatus && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 text-teal-300 text-xs rounded-xl font-mono">
                  {adminSaveStatus}
                </div>
              )}

              <form onSubmit={handleAdminSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Group Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">Group Privacy</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPrivacy('code')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        editPrivacy === 'code'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <KeyRound className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                      <div>Code Access</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditPrivacy('public')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        editPrivacy === 'public'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Globe className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      <div>Public</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditPrivacy('private')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        editPrivacy === 'private'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Lock className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                      <div>Private</div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    🔄 Regenerate Room Code
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
