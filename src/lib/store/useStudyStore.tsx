"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Subject, StudySession, Thought, ThoughtCategory, UserProfile, AIDebrief, SessionType } from "@/types";
import { INITIAL_PROFILE, INITIAL_SUBJECTS, INITIAL_SESSIONS } from "./seedData";
import { calculateFocusScore } from "@/lib/analytics/metrics";
import { createClient } from "@/lib/supabase/client";

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
        } else {
          // Check local storage for demo / guest session
          const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
          const savedSubjects = localStorage.getItem(LOCAL_STORAGE_KEY_SUBJECTS);
          const savedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
          const savedActive = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE);

          if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            setSubjects(savedSubjects ? JSON.parse(savedSubjects) : INITIAL_SUBJECTS);
            setSessions(savedSessions ? JSON.parse(savedSessions) : INITIAL_SESSIONS);
            if (savedActive) {
              const active = JSON.parse(savedActive);
              setActiveSession(active);
              const elapsed = Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000);
              setActiveTimer({
                type: active.session_type || "stopwatch",
                targetMinutes: 25,
                elapsedSeconds: Math.max(0, elapsed),
                isRunning: true,
                startTime: new Date(active.start_time).getTime(),
              });
            }
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
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setSubjects([]);
        setSessions([]);
        setActiveSession(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
        localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Cloud data from Supabase
  const loadSupabaseData = async (userId: string) => {
    try {
      const { data: subjData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (subjData) {
        setSubjects(subjData);
      } else {
        setSubjects([]);
      }

      const { data: sessData } = await supabase
        .from('study_sessions')
        .select('*, thoughts(*), subject:subjects(*)')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (sessData) {
        setSessions(sessData);
      } else {
        setSessions([]);
      }
    } catch (e) {
      console.error("Error loading Supabase data:", e);
      setSubjects([]);
      setSessions([]);
    }
  };

  // Sync to local storage for offline resilience
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

  // Timer Tick Engine
  useEffect(() => {
    if (activeTimer.isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer.isRunning]);

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
      const gapSec = Math.floor((pTime - prevTime) / 1000);
      if (gapSec > maxGap) maxGap = gapSec;
      prevTime = pTime + (p.approx_duration_minutes * 60 * 1000);
    });

    const finalGap = Math.floor((Date.now() - prevTime) / 1000);
    if (finalGap > maxGap) maxGap = finalGap;
    currentLongestStreakSeconds = Math.max(0, maxGap);
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
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
    document.cookie = "studyflow_demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  const startSession = (
    subjectId: string,
    topic: string,
    type: SessionType,
    targetMinutes: number = 25
  ) => {
    const subject = subjects.find((s) => s.id === subjectId) || {
      id: subjectId || "general",
      user_id: user?.id || "user",
      name: "General Study",
      color: "#10b981",
      icon: "BookOpen",
      target_weekly_hours: 10,
      created_at: new Date().toISOString(),
    };
    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
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

    setActiveSession(newSession);
    setActiveTimer({
      type,
      targetMinutes,
      elapsedSeconds: 0,
      isRunning: true,
      startTime: Date.now(),
    });

    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, JSON.stringify(newSession));
  };

  const pauseSession = () => {
    setActiveTimer((prev) => ({ ...prev, isRunning: false }));
  };

  const resumeSession = () => {
    setActiveTimer((prev) => ({ ...prev, isRunning: true }));
  };

  const addThought = (
    title: string,
    category: ThoughtCategory,
    approxDurationMinutes: number,
    notes?: string
  ) => {
    if (!activeSession) return;

    const newThought: Thought = {
      id: `th-${Date.now()}`,
      session_id: activeSession.id,
      user_id: user?.id || "demo-user-id",
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

    const completedSession: StudySession = {
      ...activeSession,
      end_time: endTime,
      gross_duration_seconds: grossDuration,
      net_focus_seconds: netFocus,
      status: "completed",
      session_notes: sessionNotes,
      focus_score: score,
      ai_debrief: debrief,
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

    // Save to Supabase if authenticated
    if (user && !user.id.startsWith("demo-")) {
      try {
        await supabase.from("study_sessions").insert({
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
          session_notes: sessionNotes,
          focus_score: score,
          ai_debrief: debrief,
        });

        if (completedSession.thoughts && completedSession.thoughts.length > 0) {
          await supabase.from("thoughts").insert(
            completedSession.thoughts.map((t) => ({
              session_id: completedSession.id,
              user_id: user.id,
              title: t.title,
              category: t.category,
              approx_duration_minutes: t.approx_duration_minutes,
              timestamp: t.timestamp,
              notes: t.notes,
            }))
          );
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

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      user_id: user?.id || "user",
      name: finalName.trim(),
      color: finalColor,
      icon: finalIcon,
      target_weekly_hours: finalTarget,
      created_at: new Date().toISOString(),
    };

    setSubjects((prev) => [...prev, newSubject]);

    if (user && !user.id.startsWith("demo-") && !user.id.startsWith("guest-")) {
      try {
        const { data } = await supabase.from("subjects").insert(newSubject).select().single();
        if (data) return data;
      } catch (e) {
        console.error("Supabase create subject error:", e);
      }
    }

    return newSubject;
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    if (user && !user.id.startsWith("demo-")) {
      try {
        await supabase.from("subjects").update(updates).eq("id", id);
      } catch (e) {
        console.error("Supabase update subject error:", e);
      }
    }
  };

  const deleteSubject = async (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (user && !user.id.startsWith("demo-")) {
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
