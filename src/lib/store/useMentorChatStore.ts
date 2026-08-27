"use client";

import { useState, useEffect, useCallback } from "react";
import { MentorChatSession, MentorChatMessage } from "@/types";
import { generateUUID } from "@/lib/utils";

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
  const [sessions, setSessions] = useState<MentorChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load chats from LocalStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CHATS);
      const savedActiveId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID);

      if (saved) {
        const parsed: MentorChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          const validActive = parsed.find((s) => s.id === savedActiveId);
          setActiveChatId(validActive ? validActive.id : parsed[0].id);
          setIsLoaded(true);
          return;
        }
      }

      // Initial Default Chat
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
      localStorage.setItem(LOCAL_STORAGE_KEY_CHATS, JSON.stringify([defaultChat]));
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID, initialId);
    } catch (e) {
      console.warn("Failed to load mentor chat history:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes to LocalStorage
  const persistSessions = useCallback((updatedSessions: MentorChatSession[], newActiveId?: string | null) => {
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
        console.warn("Failed to save mentor chat history:", e);
      }
    }
  }, []);

  // Create a brand new chat session (like ChatGPT "+ New Chat")
  const createNewChat = useCallback(() => {
    const newId = generateUUID();
    const newSession: MentorChatSession = {
      id: newId,
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [INITIAL_WELCOME_MESSAGE],
    };

    const updated = [newSession, ...sessions];
    persistSessions(updated, newId);
    return newSession;
  }, [sessions, persistSessions]);

  // Select an existing chat
  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_CHAT_ID, id);
    }
  }, []);

  // Delete a chat session
  const deleteChat = useCallback((id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      // If deleted last chat, create a fresh one
      const newId = generateUUID();
      const freshChat: MentorChatSession = {
        id: newId,
        title: "New Conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [INITIAL_WELCOME_MESSAGE],
      };
      persistSessions([freshChat], newId);
    } else {
      const nextActive = activeChatId === id ? remaining[0].id : activeChatId;
      persistSessions(remaining, nextActive);
    }
  }, [sessions, activeChatId, persistSessions]);

  // Update messages in active chat & auto-derive smart title from first user prompt
  const updateChatMessages = useCallback((chatId: string, messages: MentorChatMessage[]) => {
    const firstUserMsg = messages.find((m) => m.role === "user");

    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === chatId) {
          let title = s.title;
          if (title === "New Conversation" && firstUserMsg?.content) {
            title = firstUserMsg.content.slice(0, 32).trim() + (firstUserMsg.content.length > 32 ? "..." : "");
          }
          return {
            ...s,
            title,
            messages,
            updatedAt: new Date().toISOString(),
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
  }, []);

  // Rename a chat session
  const renameChat = useCallback((id: string, newTitle: string) => {
    const updated = sessions.map((s) => (s.id === id ? { ...s, title: newTitle.trim() || "Conversation" } : s));
    persistSessions(updated);
  }, [sessions, persistSessions]);

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
