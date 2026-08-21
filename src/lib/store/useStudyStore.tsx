"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Subject, StudySession, Thought, ThoughtCategory, UserProfile, AIDebrief, SessionType } from "@/types";
import { INITIAL_SUBJECTS, INITIAL_SESSIONS } from "./seedData";
import { calculateFocusScore } from "@/lib/analytics/metrics";
import { createClient } from "@/lib/supabase/client";
import { generateUUID } from "@/lib/utils";

interface ActiveTimerState {
  type: SessionType;
  targetMinutes: number;
  elapsedSeconds: number;
  isRunning: boolean;
  startTime: number | null;
}

interface StudyContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subjects: Subject[];
  sessions: StudySession[];
  activeSession: StudySession | null;
  activeTimer: ActiveTimerState;
  netFocusSeconds: number;
  currentFocusRatio: number;
  currentLongestStreakSeconds: number;
  // Actions
  startSession: (subjectId: string, topic: string, type: SessionType, targetMinutes?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  addThought: (title: string, category: ThoughtCategory, approxDurationMinutes: number, notes?: string) => void;
  endSession: (sessionNotes?: string) => Promise<AIDebrief | null>;
  abandonSession: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  createSubject: (
    nameOrObj: string | { name: string; color?: string; icon?: string; target_weekly_hours?: number },
    color?: string,
    icon?: string,
    targetWeeklyHours?: number
  ) => Promise<Subject>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: () => void;
  signOut: () => Promise<void>;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USER = "studyflow_user";
const LOCAL_STORAGE_KEY_SUBJECTS = "studyflow_subjects";
const LOCAL_STORAGE_KEY_SESSIONS = "studyflow_sessions";
const LOCAL_STORAGE_KEY_ACTIVE = "studyflow_active_session";
const LOCAL_STORAGE_KEY_TIMER = "studyflow_active_timer";

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);

  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>({
    type: "stopwatch",
    targetMinutes: 25,
    elapsedSeconds: 0,
    isRunning: false,
    startTime: null,
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Helper to recover active session & timer from localStorage with exact elapsed calculation
  const restoreActiveSessionFromStorage = () => {
    if (typeof window === "undefined") return;
    try {
      const savedActive = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE);
      const savedTimer = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);

      if (savedActive) {
        const active: StudySession = JSON.parse(savedActive);
        setActiveSession(active);

        if (savedTimer) {
          const parsedTimer = JSON.parse(savedTimer);
          let calculatedElapsed = parsedTimer.elapsedSeconds || 0;

          // If timer was running when page refreshed, add elapsed seconds since last timestamp
          if (parsedTimer.isRunning && parsedTimer.lastUpdatedTimestamp) {
            const secondsSinceLastTick = Math.max(
              0,
              Math.floor((Date.now() - parsedTimer.lastUpdatedTimestamp) / 1000)
            );
            calculatedElapsed += secondsSinceLastTick;
          }

          setActiveTimer({
            type: parsedTimer.type || active.session_type || "stopwatch",
            targetMinutes: parsedTimer.targetMinutes || 25,
            elapsedSeconds: calculatedElapsed,
            isRunning: parsedTimer.isRunning ?? true,
            startTime: parsedTimer.startTime || new Date(active.start_time).getTime(),
          });
        } else {
          const elapsed = Math.max(0, Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000));
          setActiveTimer({
            type: active.session_type || "stopwatch",
            targetMinutes: 25,
            elapsedSeconds: elapsed,
            isRunning: true,
            startTime: new Date(active.start_time).getTime(),
          });
        }
      }
    } catch (e) {
      console.error("Error restoring active session from storage:", e);
    }
  };

  // Initialize Auth & Data
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const uProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Learner",
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            target_daily_minutes: 180,
            created_at: session.user.created_at || new Date().toISOString(),
          };
          setUser(uProfile);
          setIsAuthenticated(true);
          await loadSupabaseData(session.user.id);
          restoreActiveSessionFromStorage();
        } else {
          // Check local storage for demo / guest session
          const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
          const savedSubjects = localStorage.getItem(LOCAL_STORAGE_KEY_SUBJECTS);
          const savedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);

          if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            setSubjects(savedSubjects ? JSON.parse(savedSubjects) : INITIAL_SUBJECTS);
            setSessions(savedSessions ? JSON.parse(savedSessions) : INITIAL_SESSIONS);
            restoreActiveSessionFromStorage();
          }
        }
      } catch (err) {
        console.warn("Supabase auth check fallback:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const uProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || "Learner",
          avatar_url: session.user.user_metadata?.avatar_url,
          target_daily_minutes: 180,
          created_at: session.user.created_at || new Date().toISOString(),
        };
        setUser(uProfile);
        setIsAuthenticated(true);
        await loadSupabaseData(session.user.id);
        restoreActiveSessionFromStorage();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setSubjects([]);
        setSessions([]);
        setActiveSession(null);
        setActiveTimer({
          type: "stopwatch",
          targetMinutes: 25,
          elapsedSeconds: 0,
          isRunning: false,
          startTime: null,
        });
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
        localStorage.removeItem(LOCAL_STORAGE_KEY_SUBJECTS);
        localStorage.removeItem(LOCAL_STORAGE_KEY_SESSIONS);
        localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
        localStorage.removeItem(LOCAL_STORAGE_KEY_TIMER);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Cloud data from Supabase
  const loadSupabaseData = async (userId: string) => {
    try {
      const { data: subjData, error: subjErr } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (subjErr) {
        console.error("Error loading subjects from Supabase:", subjErr);
      }

      if (subjData && subjData.length > 0) {
        setSubjects(subjData);
        localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECTS, JSON.stringify(subjData));
      } else {
        // Check local storage backup
        const savedSubjects = localStorage.getItem(LOCAL_STORAGE_KEY_SUBJECTS);
        if (savedSubjects) {
          const parsed = JSON.parse(savedSubjects);
          if (parsed && parsed.length > 0) {
            setSubjects(parsed);
            // Sync local subjects to Supabase in background
            for (const s of parsed) {
              supabase.from('subjects').upsert({
                id: s.id.length === 36 ? s.id : generateUUID(),
                user_id: userId,
                name: s.name,
                color: s.color,
                icon: s.icon,
                target_weekly_hours: s.target_weekly_hours,
              }).then();
            }
          } else {
            setSubjects([]);
          }
        } else {
          setSubjects([]);
        }
      }

      let fetchedSessions: StudySession[] = [];

      // 1. Fetch sessions from Supabase
      const { data: sessData, error: sessErr } = await supabase
        .from('study_sessions')
        .select('*, thoughts(*), subject:subjects(*)')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (sessErr) {
        console.warn("Joined sessions fetch warning, attempting fallback:", sessErr);
        const { data: fallbackSess } = await supabase
          .from('study_sessions')
          .select('*, subject:subjects(*)')
          .eq('user_id', userId)
          .order('start_time', { ascending: false });
        if (fallbackSess) {
          fetchedSessions = fallbackSess;
        }
      } else if (sessData) {
        fetchedSessions = sessData;
      }

      // 2. Fetch thoughts table directly and attach to ensure no lost mind pings
      try {
        const { data: allThoughts, error: thoughtsErr } = await supabase
          .from('thoughts')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: true });

        if (!thoughtsErr && allThoughts && allThoughts.length > 0) {
          const thoughtsBySession = new Map<string, Thought[]>();
          allThoughts.forEach((t: any) => {
            if (!thoughtsBySession.has(t.session_id)) {
              thoughtsBySession.set(t.session_id, []);
            }
            thoughtsBySession.get(t.session_id)!.push(t);
          });

          fetchedSessions = fetchedSessions.map((s) => {
            const joinedThoughts = s.thoughts && s.thoughts.length > 0 ? s.thoughts : [];
            const debriefThoughts = s.ai_debrief?.loggedThoughts && s.ai_debrief.loggedThoughts.length > 0 ? s.ai_debrief.loggedThoughts : [];
            const directThoughts = thoughtsBySession.get(s.id) || [];
            const finalThoughts = joinedThoughts.length > 0 ? joinedThoughts : (debriefThoughts.length > 0 ? debriefThoughts : directThoughts);
            return {
              ...s,
              thoughts: finalThoughts,
            };
          });
        } else {
          fetchedSessions = fetchedSessions.map((s) => {
            const joinedThoughts = s.thoughts && s.thoughts.length > 0 ? s.thoughts : [];
            const debriefThoughts = s.ai_debrief?.loggedThoughts && s.ai_debrief.loggedThoughts.length > 0 ? s.ai_debrief.loggedThoughts : [];
            return {
              ...s,
              thoughts: joinedThoughts.length > 0 ? joinedThoughts : debriefThoughts,
            };
          });
        }
      } catch (tErr) {
        console.warn("Direct thoughts query fallback:", tErr);
      }

      if (fetchedSessions.length > 0) {
        // Merge with local storage sessions so any locally recorded thoughts are preserved
        setSessions((prev) => {
          const savedLocal = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS) : null;
          const localSessions: StudySession[] = prev.length > 0 ? prev : (savedLocal ? JSON.parse(savedLocal) : []);
          
          const merged = fetchedSessions.map((remoteSess) => {
            const localMatch = localSessions.find((p) => p.id === remoteSess.id);
            const remoteThoughts = remoteSess.thoughts || [];
            const localThoughts = localMatch?.thoughts || [];

            // If remote has 0 thoughts but local recorded thoughts, keep local thoughts!
            if (remoteThoughts.length === 0 && localThoughts.length > 0) {
              return { ...remoteSess, thoughts: localThoughts };
            }
            return remoteSess;
          });

          localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify(merged));
          return merged;
        });
      } else {
        const savedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
        if (savedSessions) {
          const parsed = JSON.parse(savedSessions);
          if (parsed && parsed.length > 0) {
            setSessions(parsed);
          } else {
            setSessions([]);
          }
        } else {
          setSessions([]);
        }
      }
    } catch (e) {
      console.error("Error loading Supabase data:", e);
      const savedSubjects = localStorage.getItem(LOCAL_STORAGE_KEY_SUBJECTS);
      if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
      const savedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
      if (savedSessions) setSessions(JSON.parse(savedSessions));
    }
  };

  // Sync subjects & sessions to local storage
  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    }
  }, [subjects]);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Sync active session and timer state continuously to localStorage
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, JSON.stringify(activeSession));
      localStorage.setItem(
        LOCAL_STORAGE_KEY_TIMER,
        JSON.stringify({
          ...activeTimer,
          lastUpdatedTimestamp: Date.now(),
        })
      );
    }
  }, [activeSession, activeTimer]);

  // Timer Tick Engine
  useEffect(() => {
    if (activeTimer.isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          const updated = {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1,
          };
          if (activeSession) {
            localStorage.setItem(
              LOCAL_STORAGE_KEY_TIMER,
              JSON.stringify({
                ...updated,
                lastUpdatedTimestamp: Date.now(),
              })
            );
          }
          return updated;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer.isRunning, activeSession]);

  // Compute live net focus time & focus ratio
  const totalThoughtSeconds = (activeSession?.thoughts || []).reduce(
    (acc, t) => acc + (t.approx_duration_minutes || 0) * 60,
    0
  );
  const netFocusSeconds = Math.max(0, activeTimer.elapsedSeconds - totalThoughtSeconds);
  const currentFocusRatio = activeTimer.elapsedSeconds > 0 
    ? netFocusSeconds / activeTimer.elapsedSeconds 
    : 1;

  // Compute longest uninterrupted streak in active session
  let currentLongestStreakSeconds = activeTimer.elapsedSeconds;
  if (activeSession?.thoughts && activeSession.thoughts.length > 0) {
    const sortedPings = [...activeSession.thoughts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const sessionStart = new Date(activeSession.start_time).getTime();
    let prevTime = sessionStart;
    let maxGap = 0;

    sortedPings.forEach((p) => {
      const pTime = new Date(p.timestamp).getTime();
      const gapSec = Math.max(0, Math.floor((pTime - prevTime) / 1000));
      if (gapSec > maxGap) maxGap = gapSec;
      prevTime = pTime + ((p.approx_duration_minutes || 0) * 60 * 1000);
    });

    const nowTimestamp = activeTimer.isRunning 
      ? Date.now() 
      : sessionStart + (activeTimer.elapsedSeconds * 1000);
    const finalGap = Math.max(0, Math.floor((nowTimestamp - prevTime) / 1000));
    if (finalGap > maxGap) maxGap = finalGap;
    currentLongestStreakSeconds = Math.min(activeTimer.elapsedSeconds, Math.max(0, maxGap));
  }

  // --- ACTIONS ---

  const signInWithGoogle = async () => {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback` 
      : '/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error("Google Auth error:", error);
      throw error;
    }
  };

  const signInAsDemoUser = () => {
    const demoUser: UserProfile = {
      id: "guest-user",
      email: "guest@studyflow.local",
      full_name: "Guest Scholar",
      avatar_url: undefined,
      target_daily_minutes: 120,
      created_at: new Date().toISOString(),
    };
    setUser(demoUser);
    setIsAuthenticated(true);
    setSubjects([]);
    setSessions([]);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(demoUser));
    localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECTS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify([]));
    document.cookie = "studyflow_demo_user=true; path=/; max-age=604800";
    restoreActiveSessionFromStorage();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setActiveSession(null);
    setActiveTimer({
      type: "stopwatch",
      targetMinutes: 25,
      elapsedSeconds: 0,
      isRunning: false,
      startTime: null,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SUBJECTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SESSIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TIMER);
    document.cookie = "studyflow_demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  const startSession = (
    subjectId: string,
    topic: string,
    type: SessionType,
    targetMinutes: number = 25
  ) => {
    const subject = subjects.find((s) => s.id === subjectId) || {
      id: subjectId && subjectId.length === 36 ? subjectId : generateUUID(),
      user_id: user?.id || "user",
      name: "General Study",
      color: "#10b981",
      icon: "BookOpen",
      target_weekly_hours: 10,
      created_at: new Date().toISOString(),
    };

    const newSession: StudySession = {
      id: generateUUID(),
      user_id: user?.id || "user",
      subject_id: subject.id,
      topic: topic.trim() || "Deep Study Block",
      start_time: new Date().toISOString(),
      end_time: null,
      gross_duration_seconds: 0,
      net_focus_seconds: 0,
      status: "active",
      session_type: type,
      focus_score: 100,
      thoughts: [],
      created_at: new Date().toISOString(),
      subject,
    };

    const initialTimerState: ActiveTimerState = {
      type,
      targetMinutes,
      elapsedSeconds: 0,
      isRunning: true,
      startTime: Date.now(),
    };

    setActiveSession(newSession);
    setActiveTimer(initialTimerState);

    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, JSON.stringify(newSession));
    localStorage.setItem(
      LOCAL_STORAGE_KEY_TIMER,
      JSON.stringify({
        ...initialTimerState,
        lastUpdatedTimestamp: Date.now(),
      })
    );
  };

  const pauseSession = () => {
    setActiveTimer((prev) => {
      const updated = { ...prev, isRunning: false };
      localStorage.setItem(
        LOCAL_STORAGE_KEY_TIMER,
        JSON.stringify({
          ...updated,
          lastUpdatedTimestamp: Date.now(),
        })
      );
      return updated;
    });
  };

  const resumeSession = () => {
    setActiveTimer((prev) => {
      const updated = { ...prev, isRunning: true };
      localStorage.setItem(
        LOCAL_STORAGE_KEY_TIMER,
        JSON.stringify({
          ...updated,
          lastUpdatedTimestamp: Date.now(),
        })
      );
      return updated;
    });
  };

  const addThought = (
    title: string,
    category: ThoughtCategory,
    approxDurationMinutes: number,
    notes?: string
  ) => {
    if (!activeSession) return;

    const newThought: Thought = {
      id: generateUUID(),
      session_id: activeSession.id,
      user_id: user?.id || "user",
      title: title.trim(),
      category,
      approx_duration_minutes: approxDurationMinutes,
      timestamp: new Date().toISOString(),
      notes,
      created_at: new Date().toISOString(),
    };

    const updatedSession: StudySession = {
      ...activeSession,
      thoughts: [...(activeSession.thoughts || []), newThought],
    };

    setActiveSession(updatedSession);
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, JSON.stringify(updatedSession));
  };

  const endSession = async (sessionNotes?: string): Promise<AIDebrief | null> => {
    if (!activeSession) return null;

    const endTime = new Date().toISOString();
    const grossDuration = activeTimer.elapsedSeconds;
    const thoughtMins = (activeSession.thoughts || []).reduce(
      (acc, t) => acc + (t.approx_duration_minutes || 0),
      0
    );
    const netFocus = Math.max(0, grossDuration - Math.round(thoughtMins * 60));
    const score = calculateFocusScore(grossDuration, netFocus, activeSession.thoughts);

    // Call AI Debrief Server Route
    let debrief: AIDebrief | null = null;
    try {
      const res = await fetch("/api/ai/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeSession.topic,
          subjectName: activeSession.subject?.name || "General",
          grossSeconds: grossDuration,
          netFocusSeconds: netFocus,
          focusScore: score,
          thoughts: activeSession.thoughts || [],
          sessionNotes: sessionNotes || "",
        }),
      });

      if (res.ok) {
        debrief = await res.json();
      }
    } catch (e) {
      console.warn("AI Debrief fetch fallback to local heuristic:", e);
    }

    if (!debrief) {
      // Heuristic AI Debrief fallback
      const ratio = grossDuration > 0 ? netFocus / grossDuration : 1;
      debrief = {
        focusScore: score,
        flowStateRating: ratio > 0.88 ? "Deep Flow" : ratio > 0.75 ? "High Focus" : "Moderate",
        summary: `Completed ${Math.round(grossDuration / 60)} minutes with ${Math.round((netFocus / 60))}m of pure focus.`,
        primaryDistractionDiagnosis: (activeSession.thoughts && activeSession.thoughts.length > 0)
          ? `Noticed ${activeSession.thoughts.length} mind pings, mostly around ${(activeSession.thoughts[0]?.category || 'thoughts').replace('_', ' ')}.`
          : "Zero stray thoughts captured! Pristine deep work session.",
        actionableTips: [
          "Take a 5-10 minute visual rest before moving to your next study block.",
          "Keep logging thoughts instantly to maintain awareness of context switching.",
        ],
        recommendedBreakMinutes: grossDuration > 3600 ? 15 : 5,
        nextSessionTopicSuggestion: `Continue with ${activeSession.topic}`,
      };
    }

    const enrichedDebrief: AIDebrief = {
      ...debrief,
      loggedThoughts: activeSession.thoughts || [],
    };

    const completedSession: StudySession = {
      ...activeSession,
      end_time: endTime,
      gross_duration_seconds: grossDuration,
      net_focus_seconds: netFocus,
      status: "completed",
      session_notes: sessionNotes,
      focus_score: score,
      ai_debrief: enrichedDebrief,
    };

    // Save locally
    setSessions((prev) => [completedSession, ...prev]);
    setActiveSession(null);
    setActiveTimer({
      type: "stopwatch",
      targetMinutes: 25,
      elapsedSeconds: 0,
      isRunning: false,
      startTime: null,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TIMER);

    // Save to Supabase if authenticated
    if (user && !user.id.startsWith("demo-") && !user.id.startsWith("guest-")) {
      try {
        const { error: sessErr } = await supabase.from("study_sessions").insert({
          id: completedSession.id,
          user_id: user.id,
          subject_id: completedSession.subject_id,
          topic: completedSession.topic,
          start_time: completedSession.start_time,
          end_time: completedSession.end_time,
          gross_duration_seconds: completedSession.gross_duration_seconds,
          net_focus_seconds: completedSession.net_focus_seconds,
          status: "completed",
          session_type: completedSession.session_type,
          focus_score: completedSession.focus_score,
          ai_debrief: completedSession.ai_debrief,
        });

        if (sessErr) {
          console.error("Supabase study_sessions insert error:", sessErr);
        }

        // Insert thoughts
        if (completedSession.thoughts && completedSession.thoughts.length > 0) {
          const { error: thoughtErr } = await supabase.from("thoughts").insert(
            completedSession.thoughts.map((t) => ({
              id: t.id,
              session_id: completedSession.id,
              user_id: user.id,
              title: t.title,
              category: t.category,
              approx_duration_minutes: t.approx_duration_minutes,
              timestamp: t.timestamp,
              notes: t.notes,
            }))
          );
          if (thoughtErr) {
            console.error("Supabase thoughts insert error:", thoughtErr);
          }
        }
      } catch (err) {
        console.error("Failed to sync session to Supabase:", err);
      }
    }

    return debrief;
  };

  const abandonSession = () => {
    setActiveSession(null);
    setActiveTimer({
      type: "stopwatch",
      targetMinutes: 25,
      elapsedSeconds: 0,
      isRunning: false,
      startTime: null,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TIMER);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(updated));
      return updated;
    });

    if (user && !user.id.startsWith("demo-") && !user.id.startsWith("guest-")) {
      try {
        await supabase
          .from("profiles")
          .update({
            target_daily_minutes: updates.target_daily_minutes,
            full_name: updates.full_name,
            avatar_url: updates.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (err) {
        console.error("Failed to update profile in Supabase:", err);
      }
    }
  };

  const createSubject = async (
    nameOrObj: string | { name: string; color?: string; icon?: string; target_weekly_hours?: number },
    color: string = "#10b981",
    icon: string = "BookOpen",
    targetWeeklyHours: number = 10
  ): Promise<Subject> => {
    let finalName = "";
    let finalColor = color;
    let finalIcon = icon;
    let finalTarget = targetWeeklyHours;

    if (typeof nameOrObj === "object") {
      finalName = nameOrObj.name;
      if (nameOrObj.color) finalColor = nameOrObj.color;
      if (nameOrObj.icon) finalIcon = nameOrObj.icon;
      if (nameOrObj.target_weekly_hours) finalTarget = nameOrObj.target_weekly_hours;
    } else {
      finalName = nameOrObj;
    }

    const subjectId = generateUUID();

    const newSubject: Subject = {
      id: subjectId,
      user_id: user?.id || "user",
      name: finalName.trim(),
      color: finalColor,
      icon: finalIcon,
      target_weekly_hours: finalTarget,
      created_at: new Date().toISOString(),
    };

    setSubjects((prev) => {
      const updated = [...prev, newSubject];
      localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECTS, JSON.stringify(updated));
      return updated;
    });

    if (user && !user.id.startsWith("demo-") && !user.id.startsWith("guest-")) {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            id: subjectId,
            user_id: user.id,
            name: newSubject.name,
            color: newSubject.color,
            icon: newSubject.icon,
            target_weekly_hours: newSubject.target_weekly_hours,
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase create subject error:", error);
        } else if (data) {
          setSubjects((prev) => {
            const mapped = prev.map((s) => (s.id === subjectId ? data : s));
            localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECTS, JSON.stringify(mapped));
            return mapped;
          });
          return data;
        }
      } catch (e) {
        console.error("Supabase create subject exception:", e);
      }
    }

    return newSubject;
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    setSubjects((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECTS, JSON.stringify(updated));
      return updated;
    });

    if (user && !user.id.startsWith("demo-") && !user.id.startsWith("guest-")) {
      try {
        await supabase.from("subjects").update(updates).eq("id", id);
      } catch (e) {
        console.error("Supabase update subject error:", e);
      }
    }
  };

  const deleteSubject = async (id: string) => {
    setSubjects((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECTS, JSON.stringify(updated));
      return updated;
    });

    if (user && !user.id.startsWith("demo-") && !user.id.startsWith("guest-")) {
      try {
        await supabase.from("subjects").delete().eq("id", id);
      } catch (e) {
        console.error("Supabase delete subject error:", e);
      }
    }
  };

  return (
    <StudyContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        subjects,
        sessions,
        activeSession,
        activeTimer,
        netFocusSeconds,
        currentFocusRatio,
        currentLongestStreakSeconds,
        startSession,
        pauseSession,
        resumeSession,
        addThought,
        endSession,
        abandonSession,
        updateUserProfile,
        createSubject,
        updateSubject,
        deleteSubject,
        signInWithGoogle,
        signInAsDemoUser,
        signOut,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyStore() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudyStore must be used within a StudyProvider");
  }
  return context;
}
