'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  X, 
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
  Send,
  Smartphone,
  Coffee,
  Lightbulb,
  CloudSun,
  Home,
  HelpCircle,
  MessageSquare,
  Lock,
  Smile,
  ShieldCheck,
  ChevronDown,
  Gamepad2,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import { ExtendedUserProfile, BuddySession, BuddyMessage, BuddyLivePresence } from '@/types/social';
import { ThoughtCategory, StudySession, Subject } from '@/types';
import { formatSecondsToTimer, generateUUID } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { playPomodoroCompleteChime, playBreakCompleteChime } from '@/lib/sound';
import { useStudyStore } from '@/lib/store/useStudyStore';
import { SpeedMathDuel } from '@/components/games/SpeedMathDuel';
import { awardUserXP } from '@/lib/gamification/xpEngine';

const CATEGORY_META: Record<ThoughtCategory, { label: string; icon: React.ReactNode; color: string }> = {
  phone_social: { label: 'Phone / Social', icon: <Smartphone className="w-3.5 h-3.5" />, color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' },
  hunger_snack: { label: 'Snack / Water', icon: <Coffee className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  random_idea: { label: 'Random Idea', icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  anxiety_stress: { label: 'Overthinking', icon: <CloudSun className="w-3.5 h-3.5" />, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  urgent_chore: { label: 'Urgent Chore', icon: <Home className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  other: { label: 'Other Distraction', icon: <HelpCircle className="w-3.5 h-3.5" />, color: 'text-zinc-400 bg-zinc-500/20 border-zinc-500/30' },
};

const MOTIVATION_CHIPS = [
  'Great sprint! 🔥',
  'Grabbing water ☕',
  'Ready for round 2? 💪',
  '100% focused sprint! 🎯',
  'Stretch time 🧘',
  'Proud of the deep work ✨',
];

interface StudyBuddySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ExtendedUserProfile;
  targetFriend?: ExtendedUserProfile;
  subjectName?: string;
  topic?: string;
  targetMinutes?: number;
  existingSession?: BuddySession | null;
  isMinimized?: boolean;
  onToggleMinimize?: (minimized: boolean) => void;
}

export function StudyBuddySyncModal({
  isOpen,
  onClose,
  currentUser,
  targetFriend: propTargetFriend,
  subjectName: propSubjectName = 'General Study',
  topic: propTopic = 'Deep Work Sprint',
  targetMinutes: propTargetMinutes = 25,
  existingSession,
  isMinimized: propIsMinimized,
  onToggleMinimize,
}: StudyBuddySyncModalProps) {
  const { 
    addThought, 
    customQuickPings,
    subjects,
  } = useStudyStore();
  const supabase = createClient();

  const [session, setSession] = useState<BuddySession | null>(existingSession || null);
  const [resolvedFriend, setResolvedFriend] = useState<ExtendedUserProfile | null>(propTargetFriend || null);
  
  // Independent Personal Timer & Subject Selection State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sub_general');
  const [mySubjectName, setMySubjectName] = useState<string>(subjects[0]?.name || propSubjectName);
  const [myTopic, setMyTopic] = useState<string>(propTopic);
  const [isEditingSubject, setIsEditingSubject] = useState<boolean>(false);

  const [myTargetMinutes, setMyTargetMinutes] = useState<number>(propTargetMinutes);
  const [myElapsedSeconds, setMyElapsedSeconds] = useState<number>(0);
  const [myIsPaused, setMyIsPaused] = useState<boolean>(false);
  const [myIsOnBreak, setMyIsOnBreak] = useState<boolean>(false);
  const [myPingsCount, setMyPingsCount] = useState<number>(0);
  const [sprintsCompletedToday, setSprintsCompletedToday] = useState<number>(1);
  const [synergyXPAwarded, setSynergyXPAwarded] = useState<number>(0);

  // Buddy's Live Independent Presence (Received via Realtime)
  const [buddyPresence, setBuddyPresence] = useState<BuddyLivePresence>({
    user_id: propTargetFriend?.id || existingSession?.buddy_id || '',
    full_name: propTargetFriend?.full_name || 'Study Buddy',
    handle: propTargetFriend?.handle || '@buddy',
    subject_name: existingSession?.subject_name || 'General Study',
    topic: existingSession?.topic || 'Deep Work Sprint',
    target_minutes: existingSession?.duration_minutes || 25,
    remaining_seconds: (existingSession?.duration_minutes || 25) * 60,
    is_paused: false,
    is_on_break: false,
    pings_count: 0,
    last_updated: new Date().toISOString(),
  });

  // Break Lounge State & 2-Player Game Mode
  const [messages, setMessages] = useState<BuddyMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'study' | 'break_chat'>('study');
  const [breakSubTab, setBreakSubTab] = useState<'chat' | 'math_duel'>('chat');
  const [shieldAlert, setShieldAlert] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // UI Drawer states & Refs
  const [localMinimized, setLocalMinimized] = useState<boolean>(false);
  const isMinimized = propIsMinimized ?? localMinimized;
  const setMinimized = (min: boolean) => {
    if (onToggleMinimize) onToggleMinimize(min);
    else setLocalMinimized(min);
  };

  const [isPingDrawerOpen, setIsPingDrawerOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ThoughtCategory>('phone_social');
  const [pingMinutes, setPingMinutes] = useState<number>(2);
  const [customPingTitle, setCustomPingTitle] = useState<string>('');
  const pingDrawerRef = useRef<HTMLDivElement | null>(null);

  const myTargetSeconds = myTargetMinutes * 60;
  const myRemainingSeconds = Math.max(0, myTargetSeconds - myElapsedSeconds);
  const hasCompletedRef = useRef<boolean>(false);

  // Auto-scroll when Mind Ping drawer opens on mobile
  useEffect(() => {
    if (isPingDrawerOpen && pingDrawerRef.current) {
      setTimeout(() => {
        pingDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isPingDrawerOpen]);

  // 1. Resolve Friend Profile & Sync Defaults
  useEffect(() => {
    if (!isOpen) return;

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

    if (existingSession) {
      setSession(existingSession);
    }
  }, [isOpen, existingSession, propTargetFriend, currentUser, supabase]);

  // Record completed / finished sprint to Analytics & Supabase
  const logSprintToAnalyticsAndDB = async (studiedSeconds: number) => {
    if (studiedSeconds < 30) return; // Ignore accidental micro-clicks
    const studiedMinutes = Math.max(1, Math.round(studiedSeconds / 60));
    const sessionId = generateUUID();
    const now = new Date().toISOString();

    const selectedSubjectObj = subjects.find((s) => s.id === selectedSubjectId) || {
      id: selectedSubjectId || 'sub_general',
      name: mySubjectName,
      color: '#14b8a6',
      icon: '📚',
      target_weekly_hours: 10,
      total_seconds: studiedSeconds,
      created_at: now,
    };

    const newSession: StudySession = {
      id: sessionId,
      user_id: currentUser.id,
      subject_id: selectedSubjectObj.id,
      subject: selectedSubjectObj as Subject,
      topic: myTopic || 'Deep Work Sprint',
      session_type: 'study_buddy',
      gross_duration_seconds: studiedSeconds,
      net_focus_seconds: studiedSeconds,
      status: 'completed',
      focus_score: 92,
      start_time: new Date(Date.now() - studiedSeconds * 1000).toISOString(),
      end_time: now,
      created_at: now,
      thoughts: [],
    };

    // 1. Award Synergy XP
    const synergyXP = 50 * sprintsCompletedToday;
    setSynergyXPAwarded((prev) => prev + synergyXP);
    await awardUserXP(currentUser.id, synergyXP, 'study_buddy_synergy', sessionId);

    // 2. Insert into Supabase study_sessions
    if (currentUser.id && !currentUser.id.startsWith('demo-') && !currentUser.id.startsWith('guest-')) {
      try {
        await supabase.from('study_sessions').insert({
          id: sessionId,
          user_id: currentUser.id,
          subject_id: selectedSubjectObj.id,
          topic: myTopic || 'Deep Work Sprint',
          session_type: 'study_buddy',
          gross_duration_seconds: studiedSeconds,
          net_focus_seconds: studiedSeconds,
          status: 'completed',
          focus_score: 92,
          start_time: newSession.start_time,
          end_time: newSession.end_time,
        });
      } catch (err) {
        console.error('Failed to log buddy session to database:', err);
      }
    }
  };

  // 2. Personal Timer Countdown Loop
  useEffect(() => {
    if (!isOpen || myIsPaused || myIsOnBreak) return;

    const timer = setInterval(() => {
      setMyElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= myTargetSeconds && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          playPomodoroCompleteChime();
          setMyIsOnBreak(true);
          setActiveTab('break_chat'); // Automatically open break lounge when sprint completes
          logSprintToAnalyticsAndDB(myTargetSeconds);
          setSprintsCompletedToday((s) => s + 1);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, myIsPaused, myIsOnBreak, myTargetSeconds, myTargetMinutes]);

  // 3. Realtime Presence & Break Messages
  useEffect(() => {
    if (!isOpen || !session) return;

    const channelId = `buddy_session_room_${session.id}`;
    const channel = supabase.channel(channelId, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'presence_sync' }, (payload) => {
        if (payload.payload) {
          setBuddyPresence(payload.payload as BuddyLivePresence);
        }
      })
      .on('broadcast', { event: 'break_message' }, (payload) => {
        if (payload.payload) {
          setMessages((prev) => [...prev, payload.payload as BuddyMessage]);
          if (myIsOnBreak || buddyPresence.is_on_break) {
            playBreakCompleteChime();
          }
        }
      })
      .subscribe();

    const presenceInterval = setInterval(() => {
      const myPresence: BuddyLivePresence = {
        user_id: currentUser.id,
        full_name: currentUser.full_name || 'You',
        handle: currentUser.handle || '@you',
        subject_name: mySubjectName,
        topic: myTopic,
        target_minutes: myTargetMinutes,
        remaining_seconds: myRemainingSeconds,
        is_paused: myIsPaused,
        is_on_break: myIsOnBreak,
        pings_count: myPingsCount,
        last_updated: new Date().toISOString(),
      };

      channel.send({
        type: 'broadcast',
        event: 'presence_sync',
        payload: myPresence,
      });
    }, 2000);

    // Fetch existing Break Messages
    supabase
      .from('buddy_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as BuddyMessage[]);
      });

    return () => {
      clearInterval(presenceInterval);
      supabase.removeChannel(channel);
    };
  }, [
    isOpen, 
    session, 
    supabase, 
    currentUser, 
    mySubjectName, 
    myTopic, 
    myTargetMinutes, 
    myRemainingSeconds, 
    myIsPaused, 
    myIsOnBreak, 
    myPingsCount,
    buddyPresence.is_on_break
  ]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Send Break Motivation Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || !session) return;

    setChatInput('');

    const newMsg: BuddyMessage = {
      id: 'msg_' + Date.now(),
      session_id: session.id,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name?.split(' ')[0] || 'You',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    const channelId = `buddy_session_room_${session.id}`;
    supabase.channel(channelId).send({
      type: 'broadcast',
      event: 'break_message',
      payload: newMsg,
    });

    try {
      await supabase.from('buddy_messages').insert({
        session_id: session.id,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name?.split(' ')[0] || 'You',
        content: text,
      });
    } catch {}
  };

  // Log Personal Mind Ping
  const handleLogMindPing = (title: string, category: ThoughtCategory, durationMins: number = 2) => {
    setMyPingsCount((prev) => prev + 1);
    setIsPingDrawerOpen(false);
    setCustomPingTitle('');
    addThought(title, category, durationMins);
  };

  // Toggle Personal Timer Pause
  const handleToggleMyPause = () => {
    setMyIsPaused(!myIsPaused);
  };

  // Take Break / Finish Sprint Early
  const handleTakeBreakEarly = () => {
    if (!myIsOnBreak) {
      logSprintToAnalyticsAndDB(myElapsedSeconds);
      setMyIsOnBreak(true);
      setActiveTab('break_chat');
    } else {
      setMyIsOnBreak(false);
      setActiveTab('study');
    }
  };

  // Start Next Sprint Round
  const handleStartNextSprint = () => {
    setMyElapsedSeconds(0);
    setMyIsPaused(false);
    setMyIsOnBreak(false);
    hasCompletedRef.current = false;
    setActiveTab('study');
  };

  // Complete and Close Session
  const handleFinishSession = async () => {
    if (!hasCompletedRef.current && myElapsedSeconds >= 30) {
      await logSprintToAnalyticsAndDB(myElapsedSeconds);
    }
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

  const friendName = resolvedFriend?.full_name || resolvedFriend?.handle || buddyPresence.full_name || 'Study Buddy';
  const friendFirstName = friendName.split(' ')[0];
  const friendInitial = resolvedFriend?.full_name?.charAt(0) || resolvedFriend?.handle?.charAt(1) || 'B';
  const currentUserInitial = currentUser?.full_name?.charAt(0) || 'U';

  const isBreakUnlocked = myIsOnBreak || buddyPresence.is_on_break || myRemainingSeconds === 0;

  // Handle Tab Switch with Strict Focus Shield
  const handleTabClick = (tab: 'study' | 'break_chat') => {
    if (tab === 'break_chat' && !isBreakUnlocked) {
      setShieldAlert('🛡️ Focus Shield Active: Break Lounge & Chat unlock when you complete your sprint or tap "Take Break".');
      setTimeout(() => setShieldAlert(null), 4000);
      return;
    }
    setActiveTab(tab);
  };

  // -------------------------------------------------------------
  // Minimized Floating HUD Widget
  // -------------------------------------------------------------
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 animate-slide-up">
        <div className="p-3.5 rounded-2xl bg-zinc-900/95 border border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.35)] backdrop-blur-xl flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400 flex items-center justify-center text-teal-300 font-bold text-xs">
            {currentUserInitial}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className={`font-mono ${myIsOnBreak ? 'text-amber-400' : (myIsPaused ? 'text-yellow-400' : 'text-teal-400')}`}>
                {myIsOnBreak ? '☕ On Break' : formatSecondsToTimer(myRemainingSeconds)}
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">
                • {friendFirstName}: {buddyPresence.is_on_break ? 'Break' : `${Math.floor(buddyPresence.remaining_seconds / 60)}m`}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 block truncate max-w-[140px]">{mySubjectName}</span>
          </div>

          <button
            onClick={() => setMinimized(false)}
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
  // Full Synchronized 1-on-1 Modal with Independent Subjects, Timers & Games
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center flex flex-col max-h-[92vh]">
        
        {/* Shield Toast Alert */}
        {shieldAlert && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[90%] p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 animate-slide-up shadow-2xl backdrop-blur-md">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{shieldAlert}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">1-on-1 Study-Buddy Sprint</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{sprintsCompletedToday} Sprints Today</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Co-working with <span className="text-zinc-200 font-semibold">{friendName}</span> &bull; <span className="text-teal-400 font-mono">+{50 * sprintsCompletedToday} Synergy XP</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMinimized(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Minimize to Floating Pill"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleFinishSession}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Close & Save"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Focus Arena vs Break Lounge */}
        <div className="flex items-center justify-center gap-2 my-4 p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 max-w-sm mx-auto">
          <button
            onClick={() => handleTabClick('study')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'study'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Dual Sprint Arena</span>
          </button>

          <button
            onClick={() => handleTabClick('break_chat')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'break_chat'
                ? 'bg-zinc-800 text-white shadow-sm'
                : (isBreakUnlocked ? 'text-amber-400 hover:text-amber-300 font-bold' : 'text-zinc-500 hover:text-zinc-400 opacity-60 cursor-pointer')
            }`}
          >
            {isBreakUnlocked ? <Coffee className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-500" />}
            <span>Break Lounge</span>
            {isBreakUnlocked && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DUAL SPRINT ARENA (Independent Timers & Subjects) */}
        {/* ========================================================================= */}
        {activeTab === 'study' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            
            {/* Dual Independent Desks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              
              {/* DESK 1: YOUR INDEPENDENT DESK */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-teal-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-lg shadow-teal-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-10 h-10 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 font-bold text-sm">
                      {currentUserInitial}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>You</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/20 text-teal-300 font-mono">YOUR TEMPO</span>
                      </div>
                      
                      {/* Subject Change Dropdown */}
                      <div className="flex items-center gap-1 mt-0.5">
                        {isEditingSubject ? (
                          <select
                            value={selectedSubjectId}
                            onChange={(e) => {
                              setSelectedSubjectId(e.target.value);
                              const found = subjects.find((s) => s.id === e.target.value);
                              if (found) setMySubjectName(found.name);
                              setIsEditingSubject(false);
                            }}
                            className="bg-zinc-900 border border-teal-500 text-teal-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                            autoFocus
                            onBlur={() => setIsEditingSubject(false)}
                          >
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditingSubject(true)}
                            className="text-[11px] text-zinc-300 hover:text-teal-300 font-mono flex items-center gap-0.5 underline decoration-dotted truncate max-w-[130px]"
                            title="Click to Change Your Subject"
                          >
                            <span>{mySubjectName}</span>
                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    myIsOnBreak 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : (myIsPaused ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                  }`}>
                    {myIsOnBreak ? 'ON BREAK' : (myIsPaused ? 'PAUSED' : 'IN FLOW')}
                  </span>
                </div>

                {/* Your Big Digital Timer */}
                <div className="text-center py-2">
                  <div className={`font-mono text-4xl sm:text-5xl font-black tracking-tight tabular-nums drop-shadow-md ${
                    myIsOnBreak ? 'text-amber-400' : (myIsPaused ? 'text-yellow-400/80' : 'text-white')
                  }`}>
                    {myIsOnBreak ? '00:00' : formatSecondsToTimer(myRemainingSeconds)}
                  </div>
                  
                  {/* Topic Edit */}
                  <input
                    type="text"
                    value={myTopic}
                    onChange={(e) => setMyTopic(e.target.value)}
                    placeholder="Topic..."
                    className="text-[11px] text-zinc-400 font-mono mt-1 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-teal-500 focus:outline-none w-4/5 mx-auto block"
                  />
                  <div className="text-[10px] text-teal-400/90 font-mono mt-0.5">
                    {myPingsCount} Mind Pings logged
                  </div>
                </div>

                {/* Your Action Controls */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/80">
                  <button
                    onClick={handleToggleMyPause}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                      myIsPaused
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    {myIsPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    <span>{myIsPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={() => setIsPingDrawerOpen(!isPingDrawerOpen)}
                    className="flex-1 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Brain className="w-3 h-3 text-purple-400" />
                    <span>Mind Ping</span>
                  </button>

                  <button
                    onClick={handleTakeBreakEarly}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                      myIsOnBreak
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                    title={myIsOnBreak ? 'Resume Focus Sprint' : 'Finish Sprint Early & Rest'}
                  >
                    <Coffee className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* DESK 2: BUDDY'S INDEPENDENT LIVE PRESENCE */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-indigo-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-lg shadow-indigo-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-10 h-10 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 font-bold text-sm">
                      {friendInitial}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{friendFirstName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-mono">BUDDY</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono block truncate max-w-[130px]">{buddyPresence.subject_name}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    buddyPresence.is_on_break 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : (buddyPresence.is_paused ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                  }`}>
                    {buddyPresence.is_on_break ? 'ON BREAK' : (buddyPresence.is_paused ? 'PAUSED' : 'IN FLOW')}
                  </span>
                </div>

                {/* Buddy's Live Digital Timer */}
                <div className="text-center py-2">
                  <div className={`font-mono text-4xl sm:text-5xl font-black tracking-tight tabular-nums drop-shadow-md ${
                    buddyPresence.is_on_break ? 'text-amber-400' : 'text-indigo-300'
                  }`}>
                    {buddyPresence.is_on_break ? '00:00' : formatSecondsToTimer(buddyPresence.remaining_seconds)}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-1 truncate max-w-[200px] mx-auto">
                    {buddyPresence.target_minutes}m Sprint &bull; &ldquo;{buddyPresence.topic}&rdquo;
                  </div>
                  <div className="text-[10px] text-indigo-400/90 font-mono mt-0.5">
                    Live accountability partner
                  </div>
                </div>

                {/* Buddy Presence Footer Status */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px]">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span>Real-time presence</span>
                  </span>
                  <span className="text-indigo-300 font-semibold font-mono">
                    {buddyPresence.is_on_break ? 'Taking break' : 'Focusing'}
                  </span>
                </div>
              </div>

            </div>

            {/* Mind Ping Drawer (With Mobile Auto-Scroll Ref) */}
            {isPingDrawerOpen && (
              <div ref={pingDrawerRef} className="p-4 rounded-2xl bg-zinc-950/95 border border-purple-500/40 text-left animate-slide-up space-y-3.5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span>Private Mind Ping (1-Tap Distraction Isolation)</span>
                  </span>
                  <button
                    onClick={() => setIsPingDrawerOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400">1. Category:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(Object.keys(CATEGORY_META) as ThoughtCategory[]).map((cat) => {
                      const meta = CATEGORY_META[cat];
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                            isSelected 
                              ? `${meta.color} font-bold ring-1 ring-white/20 shadow-md` 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {meta.icon}
                          <span className="truncate">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Lost Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400">2. Time Lost:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 5, 10].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setPingMinutes(mins)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                          pingMinutes === mins 
                            ? 'bg-purple-500 text-zinc-950 border-purple-400 shadow-sm' 
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Ping Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400">3. Quick 1-Tap Log:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(customQuickPings || []).slice(0, 5).map((qp) => (
                      <button
                        key={qp.id}
                        type="button"
                        onClick={() => handleLogMindPing(qp.title, qp.category, qp.minutes || 2)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-purple-500/20 text-zinc-300 hover:text-purple-200 border border-zinc-800 hover:border-purple-500/40 text-[11px] font-medium transition-all active:scale-95"
                      >
                        {qp.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom input */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                  <input
                    type="text"
                    value={customPingTitle}
                    onChange={(e) => setCustomPingTitle(e.target.value)}
                    placeholder="Or type stray thought..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customPingTitle.trim()) {
                        handleLogMindPing(customPingTitle.trim(), selectedCategory, pingMinutes);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const titleToLog = customPingTitle.trim() || CATEGORY_META[selectedCategory].label;
                      handleLogMindPing(titleToLog, selectedCategory, pingMinutes);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold text-xs transition-all active:scale-95 flex items-center gap-1"
                  >
                    <span>Log Ping</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* In-Focus Motivation & Break Prompt */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 flex items-center justify-between text-xs text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="text-zinc-300">
                  {isBreakUnlocked 
                    ? '🎉 Sprint complete! Break Lounge & Games are unlocked.' 
                    : '🛡️ Focus Shield Active • Chatting & games unlock when you take a break.'}
                </span>
              </div>
              <button
                onClick={handleTakeBreakEarly}
                className="text-amber-400 font-bold hover:underline whitespace-nowrap ml-2"
              >
                {myIsOnBreak ? 'Resume Sprint' : 'Take Break Early ☕'}
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BREAK LOUNGE & 2-PLAYER MATH DUEL */}
        {/* ========================================================================= */}
        {activeTab === 'break_chat' && (
          <div className="flex-1 flex flex-col overflow-hidden text-left space-y-3">
            
            {/* Break Lounge Header & Subtab Switcher */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBreakSubTab('chat')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    breakSubTab === 'chat'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-amber-200 hover:bg-amber-500/20'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Motivation Chat</span>
                </button>

                <button
                  onClick={() => setBreakSubTab('math_duel')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    breakSubTab === 'math_duel'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-amber-200 hover:bg-amber-500/20'
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Speed Math Duel ⚡</span>
                </button>
              </div>

              <button
                onClick={handleStartNextSprint}
                className="px-3.5 py-1 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
              >
                Start Next Sprint ▶
              </button>
            </div>

            {/* Subtab 1: Motivation Chat */}
            {breakSubTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-2.5">
                {/* Quick Motivation Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {MOTIVATION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendMessage(chip)}
                      className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-medium whitespace-nowrap transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>

                {/* Chat Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5 min-h-[200px]">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs py-6">
                      <Smile className="w-8 h-8 text-zinc-600 mb-2" />
                      <p className="font-semibold text-zinc-400">No break messages yet</p>
                      <p className="text-[11px] text-zinc-600">Send an encouraging cheer to celebrate your sprint!</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === currentUser.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono mb-0.5">
                            <span>{m.sender_name}</span>
                            <span>&bull;</span>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={`px-3.5 py-2 rounded-2xl text-xs max-w-[80%] break-words ${
                            isMe 
                              ? 'bg-teal-500 text-zinc-950 font-medium rounded-tr-none' 
                              : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700'
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Composer */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send encouragement or coordinate your next round..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-zinc-950 font-bold transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Subtab 2: Speed Math Duel Game */}
            {breakSubTab === 'math_duel' && (
              <div className="flex-1 overflow-y-auto pr-1">
                <SpeedMathDuel
                  sessionId={session?.id || 'duel_default'}
                  currentUser={currentUser}
                  targetFriend={resolvedFriend || undefined}
                />
              </div>
            )}

          </div>
        )}

        {/* Bottom Footer Controls */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-zinc-800 text-xs">
          <button
            onClick={() => setMinimized(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
          >
            Minimize View
          </button>

          <button
            onClick={handleFinishSession}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all active:scale-95"
          >
            Finish & Log Session
          </button>
        </div>

      </div>
    </div>
  );
}
