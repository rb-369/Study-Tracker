"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Brain, 
  Globe, 
  Database, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronRight, 
  Zap, 
  Plus, 
  BookOpen, 
  ArrowUpRight, 
  Terminal, 
  ShieldAlert,
  Trash2
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { MentorChatMessage, MentorChatSession } from "@/types";

interface MentorChatThreadProps {
  isMiniWidget?: boolean;
  onOpenFullscreen?: () => void;
  activeChat?: MentorChatSession | null;
  onUpdateChatMessages?: (chatId: string, messages: MentorChatMessage[]) => void;
  onNewChat?: () => void;
}

const STARTER_PROMPTS = [
  { icon: "⚡", title: "Beat afternoon brain fog", prompt: "I'm feeling mental fatigue and afternoon brain fog. What is a 5-minute neuroscience-backed reset protocol to restore deep focus?" },
  { icon: "📊", title: "Analyze my distraction triggers", prompt: "Based on my logged study history, what are my top distraction patterns and how can I optimize my Net Focus Ratio?" },
  { icon: "🎯", title: "3-day high-intensity exam plan", prompt: "Help me design a 3-day deep work sprint plan for upcoming exams using active recall and interleaving." },
  { icon: "🔬", title: "Active recall vs Spaced repetition", prompt: "Can you search and explain the most effective way to combine active recall testing with spaced repetition intervals?" },
];

export function MentorChatThread({
  isMiniWidget = false,
  onOpenFullscreen,
  activeChat,
  onUpdateChatMessages,
  onNewChat,
}: MentorChatThreadProps) {
  const { sessions, activeSession, activeTimer, netFocusSeconds } = useStudyStore();
  
  // Local fallback state if no external store passed (e.g. standalone widget)
  const [internalMessages, setInternalMessages] = useState<MentorChatMessage[]>([
    {
      id: "welcome-init",
      role: "assistant",
      content: `### 👋 Hey there! I'm your StudyFlow AI Cognitive Mentor.

I analyze your focus telemetry, diagnose distraction loops, search evidence-based learning science, and help you reach **Deep Flow State**.

*Ask me anything about your study patterns, exam strategies, or focus resets!*`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const messages = activeChat?.messages || internalMessages;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [currentToolStatus, setCurrentToolStatus] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolStatus]);

  const handleSendMessage = async (overridePrompt?: string) => {
    const text = (overridePrompt || input).trim();
    if (!text || isLoading) return;

    const userMsgId = `usr-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;

    const newMessages: MentorChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update active chat state
    if (activeChat && onUpdateChatMessages) {
      onUpdateChatMessages(activeChat.id, newMessages);
    } else {
      setInternalMessages(newMessages);
    }

    setInput("");
    setIsLoading(true);
    setCurrentToolStatus("Analyzing query & telemetry...");

    // Prepare active session context if running
    const activeContext = activeSession
      ? {
          topic: activeSession.topic,
          subjectName: activeSession.subject?.name || "General",
          elapsedSeconds: activeTimer.elapsedSeconds,
          netFocusSeconds,
          distractionsCount: activeSession.thoughts?.length || 0,
        }
      : undefined;

    let assistantContent = "";
    const toolEventsAccumulator: { tool?: "tavily_search" | "qdrant_memory"; details?: string; source?: string }[] = [];

    try {
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          allSessions: sessions.slice(0, 40),
          activeSessionContext: activeContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent API returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream body");

      const decoder = new TextDecoder();
      let done = false;

      // Add placeholder bot message
      const initialStreamMessages: MentorChatMessage[] = [
        ...newMessages,
        {
          id: botMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
          toolEvents: [],
        },
      ];

      if (activeChat && onUpdateChatMessages) {
        onUpdateChatMessages(activeChat.id, initialStreamMessages);
      } else {
        setInternalMessages(initialStreamMessages);
      }

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const rawChunk = decoder.decode(value, { stream: true });
          const lines = rawChunk.split("\n").filter((l) => l.trim().startsWith("data: "));

          for (const line of lines) {
            const jsonStr = line.replace(/^data: /, "").trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);

              // Handle tool event telemetry badge
              if (data.event) {
                const ev = data.event;
                if (ev.type === "tool_start") {
                  setCurrentToolStatus(ev.details || "Accessing memory tool...");
                  toolEventsAccumulator.push({ tool: ev.tool, details: ev.details });
                } else if (ev.type === "tool_end") {
                  setCurrentToolStatus(null);
                  toolEventsAccumulator.push({ tool: ev.tool, details: ev.details, source: ev.source });
                } else if (ev.type === "model_selected") {
                  setCurrentToolStatus(null);
                }
              }

              // Handle content streaming chunk
              const chunkText = data.content || data.text;
              if (chunkText) {
                assistantContent += chunkText;
                const updatedStreamMessages = [
                  ...newMessages,
                  {
                    id: botMsgId,
                    role: "assistant" as const,
                    content: assistantContent,
                    timestamp: new Date().toISOString(),
                    toolEvents: [...toolEventsAccumulator],
                  },
                ];

                if (activeChat && onUpdateChatMessages) {
                  onUpdateChatMessages(activeChat.id, updatedStreamMessages);
                } else {
                  setInternalMessages(updatedStreamMessages);
                }
              }
            } catch (err) {
              console.warn("Error parsing stream chunk:", err);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Agent chat error:", error);
      const errorMessage = `⚠️ I encountered a temporary connection issue. Please check your internet or API key in settings.\n\n*Error: ${error?.message || "Unknown error"}*`;
      
      const errorStreamMessages = [
        ...newMessages,
        {
          id: botMsgId,
          role: "assistant" as const,
          content: errorMessage,
          timestamp: new Date().toISOString(),
        },
      ];

      if (activeChat && onUpdateChatMessages) {
        onUpdateChatMessages(activeChat.id, errorStreamMessages);
      } else {
        setInternalMessages(errorStreamMessages);
      }
    } finally {
      setIsLoading(false);
      setCurrentToolStatus(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c10] text-zinc-100 select-text">
      {/* Mini Widget Header */}
      {isMiniWidget && (
        <div className="px-3.5 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-zinc-200">StudyFlow AI</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onNewChat && (
              <button
                onClick={onNewChat}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-[11px] flex items-center gap-1"
                title="New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            {onOpenFullscreen && (
              <button
                onClick={onOpenFullscreen}
                className="p-1 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors text-[11px] flex items-center gap-1"
                title="Open Fullscreen Page"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 shadow-sm">
                <Brain className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[86%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-all shadow-md ${
                msg.role === "user"
                  ? "bg-emerald-600 text-zinc-950 font-medium rounded-tr-sm ml-4"
                  : "bg-[#14141a] border border-zinc-800 text-zinc-200 rounded-tl-sm space-y-2.5"
              }`}
            >
              {/* Tool Execution Badges */}
              {msg.toolEvents && msg.toolEvents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1 border-b border-zinc-800/80 mb-2">
                  {msg.toolEvents.map((te, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 border border-zinc-700/80 text-zinc-400"
                    >
                      {te.tool === "tavily_search" ? (
                        <Globe className="w-3 h-3 text-teal-400" />
                      ) : (
                        <Database className="w-3 h-3 text-indigo-400" />
                      )}
                      <span>{te.details || "Context Retrieved"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Body with clean formatting */}
              <div className="prose prose-invert prose-xs sm:prose-sm max-w-none break-words whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Message Footer / Copy */}
              {msg.role === "assistant" && msg.content.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-mono">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                    title="Copy to clipboard"
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Tool Execution Spinner Indicator */}
        {currentToolStatus && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 border border-emerald-500/20 text-xs text-emerald-400 font-mono w-fit animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{currentToolStatus}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompt Chips (shown if only 1 message or new chat) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="text-[11px] font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Suggested Focus Protocols:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sp.prompt)}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800/80 hover:border-emerald-500/30 text-left text-xs text-zinc-300 hover:text-zinc-100 transition-all flex items-start gap-2 group active:scale-[0.99]"
              >
                <span className="text-sm">{sp.icon}</span>
                <span className="truncate font-medium group-hover:text-emerald-400 transition-colors">
                  {sp.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Box */}
      <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-[#0e0e12]">
        <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all shadow-inner">
          <textarea
            ref={inputRef}
            rows={isMiniWidget ? 2 : 3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Mentor about focus, study plans, or past performance..."
            className="w-full bg-transparent px-3.5 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-zinc-800/40">
            <div className="text-[10px] text-zinc-400 font-mono hidden sm:block">
              Powered by LangGraph & OpenRouter Free Tier
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                Shift + Enter for new line
              </span>
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-zinc-950 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
                ) : (
                  <Send className="w-4 h-4 text-zinc-950" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
