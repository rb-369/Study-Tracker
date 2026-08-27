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
  BookOpen,
  ArrowUpRight,
  Terminal,
  ShieldAlert
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolEvents?: {
    tool?: "tavily_search" | "qdrant_memory";
    details?: string;
    source?: string;
  }[];
}

interface MentorChatThreadProps {
  isMiniWidget?: boolean;
  onOpenFullscreen?: () => void;
}

const STARTER_PROMPTS = [
  { icon: "⚡", title: "Beat afternoon brain fog", prompt: "I'm feeling mental fatigue and afternoon brain fog. What is a 5-minute neuroscience-backed reset protocol to restore deep focus?" },
  { icon: "📊", title: "Analyze my distraction triggers", prompt: "Based on my logged study history, what are my top distraction patterns and how can I optimize my Net Focus Ratio?" },
  { icon: "🎯", title: "3-day high-intensity exam plan", prompt: "Help me design a 3-day deep work sprint plan for upcoming exams using active recall and interleaving." },
  { icon: "🔬", title: "Active recall vs Spaced repetition", prompt: "Can you search and explain the most effective way to combine active recall testing with spaced repetition intervals?" },
];

export function MentorChatThread({ isMiniWidget = false, onOpenFullscreen }: MentorChatThreadProps) {
  const { sessions, activeSession, activeTimer, netFocusSeconds } = useStudyStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `### 👋 Hey there! I'm your StudyFlow AI Cognitive Mentor.

I analyze your focus telemetry, diagnose distraction loops, search evidence-based learning science, and help you reach **Deep Flow State**.

*Ask me anything about your study patterns, exam strategies, or focus resets!*`,
      timestamp: new Date().toISOString(),
    },
  ]);
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

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      },
    ];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setCurrentToolStatus("Analyzing query & context...");

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
          allSessions: sessions.slice(0, 30),
          activeSessionContext: activeContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent API returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;

        // Initialize bot placeholder
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            toolEvents: [],
          },
        ]);

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;

          if (value) {
            const rawChunk = decoder.decode(value, { stream: true });
            const lines = rawChunk.split("\n").filter((l) => l.trim().startsWith("data: "));

            for (const line of lines) {
              const jsonStr = line.replace(/^data: /, "").trim();
              if (jsonStr === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(jsonStr);

                if (parsed.event) {
                  const ev = parsed.event;
                  if (ev.type === "tool_start") {
                    setCurrentToolStatus(ev.details || "Consulting knowledge...");
                    toolEventsAccumulator.push({ tool: ev.tool, details: ev.details });
                  } else if (ev.type === "tool_end") {
                    setCurrentToolStatus(null);
                    const last = toolEventsAccumulator[toolEventsAccumulator.length - 1];
                    if (last) {
                      last.details = ev.details;
                      last.source = ev.source;
                    }
                  } else if (ev.type === "model_selected") {
                    setCurrentToolStatus(null);
                  }
                }

                if (parsed.text) {
                  assistantContent += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId
                        ? { ...msg, content: assistantContent, toolEvents: [...toolEventsAccumulator] }
                        : msg
                    )
                  );
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat streaming error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "⚠️ I encountered a temporary connection issue. Please try again or rephrase your question.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentToolStatus(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "✨ Conversation reset. What would you like to explore or optimize next?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className={`flex flex-col h-full ${isMiniWidget ? "text-xs" : "text-sm"}`}>
      {/* Header bar (in mini widget mode) */}
      {isMiniWidget && (
        <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-zinc-200 text-xs">StudyFlow AI Mentor</span>
          </div>
          {onOpenFullscreen && (
            <button
              onClick={onOpenFullscreen}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5 hover:underline"
            >
              <span>Fullscreen</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 leading-relaxed transition-all ${
                  isUser
                    ? "bg-emerald-500 text-zinc-950 font-medium rounded-tr-sm shadow-md"
                    : "bg-[#141418] border border-zinc-800/90 text-zinc-200 rounded-tl-sm shadow-xl"
                }`}
              >
                {/* Tool Badges on Assistant Messages */}
                {!isUser && msg.toolEvents && msg.toolEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-zinc-800/80">
                    {msg.toolEvents.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/60 text-[10px] font-mono text-zinc-400"
                      >
                        {t.tool === "tavily_search" ? (
                          <Globe className="w-2.5 h-2.5 text-teal-400" />
                        ) : (
                          <Database className="w-2.5 h-2.5 text-indigo-400" />
                        )}
                        <span className="truncate max-w-[200px]">{t.details || t.tool}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Content Render with simple markdown formatting */}
                <div className="prose prose-invert prose-xs max-w-none break-words space-y-2">
                  {msg.content ? (
                    msg.content.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={idx} className="text-sm font-bold text-emerald-400 mt-2 mb-1">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 ml-1 text-zinc-300">
                            <span className="text-emerald-400/80 mt-1 text-[8px]">&bull;</span>
                            <span>{renderFormattedInline(line.replace(/^[-*]\s+/, ""))}</span>
                          </div>
                        );
                      }
                      if (/^\d+\.\s/.test(line)) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 ml-1 text-zinc-300">
                            <span className="font-mono text-[10px] text-emerald-400 font-bold mt-0.5">
                              {line.match(/^\d+\./)?.[0]}
                            </span>
                            <span>{renderFormattedInline(line.replace(/^\d+\.\s+/, ""))}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className={`${line.trim() === "" ? "h-1" : ""}`}>
                          {renderFormattedInline(line)}
                        </p>
                      );
                    })
                  ) : (
                    <span className="inline-flex items-center gap-1 text-zinc-500 font-mono text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Synthesizing cognitive advice...
                    </span>
                  )}
                </div>

                {/* Bottom action bar */}
                {!isUser && msg.content && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-zinc-300 flex items-center gap-1 transition-colors p-1"
                      title="Copy response"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live tool status banner during streaming */}
        {currentToolStatus && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-400 animate-pulse w-fit">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentToolStatus}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompt Chips (only if conversation has 1 message) */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/30">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
            Suggested Prompts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {STARTER_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.prompt)}
                className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all flex items-center gap-2 group text-xs text-zinc-300"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="truncate group-hover:text-emerald-300 font-medium">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <div className="p-3 sm:p-4 border-t border-zinc-800/90 bg-[#101014]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center gap-2"
        >
          <textarea
            ref={inputRef}
            rows={isMiniWidget ? 1 : 2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask your AI Mentor about focus, study plans, or past performance..."
            className="flex-1 py-2.5 pl-3.5 pr-10 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500/70 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none transition-colors"
          />

          <div className="flex items-center gap-1">
            {messages.length > 2 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-zinc-950 transition-all font-bold shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 font-mono">
          <span>Powered by LangGraph & OpenRouter Free Tier</span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to render bold (`**`), code (`` ` ``), and italics in simple markdown lines
 */
function renderFormattedInline(text: string): React.ReactNode {
  // Simple regex parser for bold **text** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="text-zinc-100 font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
