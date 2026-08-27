"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MentorChatSession, MentorChatMessage } from "@/types";
import { generateUUID } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useStudyStore } from "@/lib/store/useStudyStore";

const LOCAL_STORAGE_KEY_CHATS = "studyflow_mentor_chats";
const LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID = "studyflow_mentor_active_chat_id";

export const INITIAL_WELCOME_MESSAGE: MentorChatMessage = {
  id: "welcome-init",
  role: "assistant",
  content: `### 👋 Hey there! I'm your StudyFlow AI Cognitive Mentor.

I analyze your focus telemetry, diagnose distraction loops, search evidence-based learning science, and help you reach **Deep Flow State**.

*Ask me anything about your study patterns, exam strategies, or focus resets!*`,
  timestamp: new Date().toISOString(),
};

export function useMentorChatStore() {
  const { user } = useStudyStore();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [sessions, setSessions] = useState<MentorChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const activeChatIdRef = useRef<string | null>(null);
  activeChatIdRef.current = activeChatId;

  // 1. Load chats from Supabase (if logged in) or LocalStorage fallback
  useEffect(() => {
    let isMounted = true;

    async function loadChats() {
      // Step A: Load from local cache first for instant UI response
      let localSessions: MentorChatSession[] = [];
      let savedActiveId: string | null = null;

      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CHATS);
          savedActiveId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID);
          if (saved) {
            localSessions = JSON.parse(saved);
          }
        } catch {}
      }

      // Step B: If logged into Supabase, query cloud database
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("mentor_chats")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

          if (!error && data && data.length > 0) {
            const dbSessions: MentorChatSession[] = data.map((row: any) => ({
              id: row.id,
              title: row.title || "Conversation",
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              messages: Array.isArray(row.messages) ? row.messages : [],
            }));

            if (isMounted) {
              setSessions(dbSessions);
              const validActive = dbSessions.find((s) => s.id === savedActiveId);
              const targetActiveId = validActive ? validActive.id : dbSessions[0].id;
              setActiveChatId(targetActiveId);
              setIsLoaded(true);

              // Cache to local
              if (typeof window !== "undefined") {
                localStorage.setItem(LOCAL_STORAGE_KEY_CHATS, JSON.stringify(dbSessions));
                localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID, targetActiveId);
              }
              return;
            }
          }
        } catch (dbError) {
          console.warn("Supabase mentor_chats load error (using local cache):", dbError);
        }
      }

      // Step C: Fallback to local sessions
      if (isMounted) {
        if (localSessions.length > 0) {
          setSessions(localSessions);
          const validActive = localSessions.find((s) => s.id === savedActiveId);
          setActiveChatId(validActive ? validActive.id : localSessions[0].id);
        } else {
          // Initialize first default chat
          const initialId = generateUUID();
          const defaultChat: MentorChatSession = {
            id: initialId,
            title: "New Conversation",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [INITIAL_WELCOME_MESSAGE],
          };
          setSessions([defaultChat]);
          setActiveChatId(initialId);

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY_CHATS, JSON.stringify([defaultChat]));
            localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID, initialId);
          }
        }
        setIsLoaded(true);
      }
    }

    loadChats();

    return () => {
      isMounted = false;
    };
  }, [user?.id, supabase]);

  // Persist locally
  const persistSessions = useCallback(
    async (updatedSessions: MentorChatSession[], newActiveId?: string | null) => {
      setSessions(updatedSessions);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_CHATS, JSON.stringify(updatedSessions));
          if (newActiveId !== undefined) {
            setActiveChatId(newActiveId);
            if (newActiveId) {
              localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID, newActiveId);
            }
          }
        } catch (e) {
          console.warn("Failed to persist mentor chat history locally:", e);
        }
      }
    },
    []
  );

  // Create a brand new chat session (saves in Supabase DB & LocalStorage)
  const createNewChat = useCallback(async () => {
    const newId = generateUUID();
    const now = new Date().toISOString();
    const newSession: MentorChatSession = {
      id: newId,
      title: "New Conversation",
      createdAt: now,
      updatedAt: now,
      messages: [INITIAL_WELCOME_MESSAGE],
    };

    const updated = [newSession, ...sessions];
    await persistSessions(updated, newId);

    // Sync to Supabase DB if authenticated
    if (user?.id) {
      try {
        await supabase.from("mentor_chats").insert({
          id: newId,
          user_id: user.id,
          title: newSession.title,
          messages: newSession.messages,
          created_at: now,
          updated_at: now,
        });
      } catch (err) {
        console.warn("Failed to insert new chat in Supabase:", err);
      }
    }

    return newSession;
  }, [sessions, persistSessions, user?.id, supabase]);

  // Select an existing chat
  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID, id);
    }
  }, []);

  // Delete a chat session (from Supabase DB & LocalStorage)
  const deleteChat = useCallback(
    async (id: string) => {
      const remaining = sessions.filter((s) => s.id !== id);

      if (remaining.length === 0) {
        const newId = generateUUID();
        const freshChat: MentorChatSession = {
          id: newId,
          title: "New Conversation",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [INITIAL_WELCOME_MESSAGE],
        };
        await persistSessions([freshChat], newId);
      } else {
        const nextActive = activeChatIdRef.current === id ? remaining[0].id : activeChatIdRef.current;
        await persistSessions(remaining, nextActive);
      }

      // Sync delete to Supabase DB
      if (user?.id) {
        try {
          await supabase.from("mentor_chats").delete().eq("id", id).eq("user_id", user.id);
        } catch (err) {
          console.warn("Failed to delete chat in Supabase:", err);
        }
      }
    },
    [sessions, persistSessions, user?.id, supabase]
  );

  // Update messages in active chat & save to DB
  const updateChatMessages = useCallback(
    async (chatId: string, messages: MentorChatMessage[]) => {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const now = new Date().toISOString();

      let targetTitle = "Conversation";

      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id === chatId) {
            let title = s.title;
            if (title === "New Conversation" && firstUserMsg?.content) {
              title = firstUserMsg.content.slice(0, 36).trim() + (firstUserMsg.content.length > 36 ? "..." : "");
            }
            targetTitle = title;
            return {
              ...s,
              title,
              messages,
              updatedAt: now,
            };
          }
          return s;
        });

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_CHATS, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });

      // Sync to Supabase DB if user is authenticated
      if (user?.id) {
        try {
          await supabase
            .from("mentor_chats")
            .upsert({
              id: chatId,
              user_id: user.id,
              title: targetTitle,
              messages,
              updated_at: now,
            });
        } catch (err) {
          console.warn("Failed to update chat in Supabase:", err);
        }
      }
    },
    [user?.id, supabase]
  );

  // Rename a chat session
  const renameChat = useCallback(
    async (id: string, newTitle: string) => {
      const cleanTitle = newTitle.trim() || "Conversation";
      const now = new Date().toISOString();

      const updated = sessions.map((s) => (s.id === id ? { ...s, title: cleanTitle, updatedAt: now } : s));
      await persistSessions(updated);

      if (user?.id) {
        try {
          await supabase
            .from("mentor_chats")
            .update({ title: cleanTitle, updated_at: now })
            .eq("id", id)
            .eq("user_id", user.id);
        } catch (err) {
          console.warn("Failed to rename chat in Supabase:", err);
        }
      }
    },
    [sessions, persistSessions, user?.id, supabase]
  );

  const activeSession = sessions.find((s) => s.id === activeChatId) || sessions[0] || null;

  return {
    sessions,
    activeChatId,
    activeSession,
    isLoaded,
    createNewChat,
    selectChat,
    deleteChat,
    updateChatMessages,
    renameChat,
  };
}
