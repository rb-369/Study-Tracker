'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  ShieldAlert, 
  AlertTriangle, 
  Check, 
  Lock, 
  Sparkles, 
  HandMetal, 
  Flame, 
  Coffee,
  HelpCircle
} from 'lucide-react';
import { ExtendedUserProfile, GroupMessage, ChatMode } from '@/types/social';
import { createClient } from '@/lib/supabase/client';
import { 
  checkRateLimit, 
  registerAction, 
  sanitizeMessageContent, 
  requestMessageAppeal 
} from '@/lib/moderation/moderationService';
import { ReportModal } from './ReportModal';

interface RoomChatProps {
  groupId: string;
  currentUser: ExtendedUserProfile;
  chatMode?: ChatMode;
  isOwnerOrAdmin?: boolean;
}

const PRESET_FOCUS_REACTIONS = [
  { emoji: '🔥', text: 'In deep flow' },
  { emoji: '☕', text: 'Taking 5m break' },
  { emoji: '⚡', text: 'High focus zone' },
  { emoji: '👋', text: 'High-five team!' },
  { emoji: '🎯', text: 'Target reached' },
  { emoji: '🧠', text: 'Mind cleared' },
];

export function RoomChat({
  groupId,
  currentUser,
  chatMode = 'open',
  isOwnerOrAdmin = false,
}: RoomChatProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [reportingMessage, setReportingMessage] = useState<GroupMessage | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [appealSentId, setAppealSentId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  // Load chat messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(60);

      if (data && data.length > 0) {
        setMessages(data);
      } else {
        // Mock sample initial chat message
        setMessages([
          {
            id: 'msg_initial',
            group_id: groupId,
            user_id: 'system',
            content: 'Welcome to the Live Study Room! Stay focused and respect fellow learners.',
            message_type: 'system',
            is_flagged: false,
            report_count: 0,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    };

    loadMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`group_chat_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as GroupMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, customContent?: string, type: 'text' | 'reaction' = 'text') => {
    if (e) e.preventDefault();
    const rawContent = customContent || inputText.trim();
    if (!rawContent) return;

    // Rate Limit Check (12 msg / min)
    const rateCheck = checkRateLimit('chat');
    if (!rateCheck.allowed) {
      setToastError(`Slow down! Please wait ${rateCheck.retryAfterSeconds}s before chatting again.`);
      setTimeout(() => setToastError(null), 3000);
      return;
    }

    registerAction('chat');

    // Text Sanitization & Keyword filtering
    const { cleanContent, isFlagged } = sanitizeMessageContent(rawContent);

    const newMsg: GroupMessage = {
      id: 'temp_' + Date.now(),
      group_id: groupId,
      user_id: currentUser.id,
      content: cleanContent,
      message_type: type,
      is_flagged: isFlagged,
      report_count: 0,
      created_at: new Date().toISOString(),
      profile: currentUser,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    try {
      await supabase.from('group_messages').insert({
        group_id: groupId,
        user_id: currentUser.id,
        content: cleanContent,
        message_type: type,
        is_flagged: isFlagged,
      });
    } catch (err) {
      console.warn('Realtime chat fallback:', err);
    }
  };

  const handleAppeal = async (msgId: string) => {
    const ok = await requestMessageAppeal(msgId, currentUser.id);
    if (ok) {
      setAppealSentId(msgId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-white">Room Chat & Live Pings</span>
        </div>

        {chatMode === 'reactions_only' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
            <Lock className="w-3 h-3" />
            <span>REACTIONS ONLY</span>
          </span>
        )}
      </div>

      {/* Toast Error */}
      {toastError && (
        <div className="p-2 bg-rose-500/20 border-b border-rose-500/30 text-rose-300 text-[11px] text-center font-medium animate-pulse">
          {toastError}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.map((msg) => {
          const isMine = msg.user_id === currentUser.id;
          const isSystem = msg.message_type === 'system';
          const isQuarantined = msg.is_flagged || msg.report_count >= 3;

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-400 text-[11px] border border-zinc-700/60">
                  {msg.content}
                </span>
              </div>
            );
          }

          if (isQuarantined) {
            return (
              <div
                key={msg.id}
                className={`p-2.5 rounded-xl border text-[11px] ${
                  isMine
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 ml-auto max-w-[85%]'
                    : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500 italic'
                }`}
              >
                {isMine ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>Message hidden pending review.</span>
                    </span>
                    {appealSentId === msg.id ? (
                      <span className="text-[10px] text-emerald-400 font-bold">Appeal Sent</span>
                    ) : (
                      <button
                        onClick={() => handleAppeal(msg.id)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold underline"
                      >
                        Request Review
                      </button>
                    )}
                  </div>
                ) : (
                  <span>[Message quarantined by moderation review]</span>
                )}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-zinc-500 font-mono">
                <span>{isMine ? 'You' : msg.profile?.full_name || msg.profile?.handle || 'Learner'}</span>
              </div>

              <div className="flex items-center gap-1.5 max-w-[85%]">
                <div
                  className={`p-3 rounded-2xl leading-relaxed text-xs shadow-sm ${
                    isMine
                      ? 'bg-teal-500 text-zinc-950 font-medium rounded-tr-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/60'
                  }`}
                >
                  {msg.content}
                </div>

                {!isMine && (
                  <button
                    onClick={() => setReportingMessage(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                    title="Report Message"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Quick Focus Reactions Bar */}
      <div className="p-2 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto">
        {PRESET_FOCUS_REACTIONS.map((r, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(undefined, `${r.emoji} ${r.text}`, 'reaction')}
            className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium border border-zinc-700/60 whitespace-nowrap transition-all active:scale-95 flex items-center gap-1"
          >
            <span>{r.emoji}</span>
            <span className="hidden sm:inline">{r.text}</span>
          </button>
        ))}
      </div>

      {/* Text Input Area (if not locked to reactions only) */}
      {chatMode === 'open' ? (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a mindful message..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold transition-all disabled:opacity-40 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-center text-zinc-500 text-[11px] font-mono">
          🔒 Focus Reactions Mode active &bull; Use buttons above to send pings
        </div>
      )}

      {/* Safety Report Modal */}
      {reportingMessage && (
        <ReportModal
          isOpen={!!reportingMessage}
          onClose={() => setReportingMessage(null)}
          reporterId={currentUser.id}
          reportedUserId={reportingMessage.user_id}
          reportedUserName={reportingMessage.profile?.full_name || 'Learner'}
          messageId={reportingMessage.id}
          messagePreview={reportingMessage.content}
        />
      )}
    </div>
  );
}
