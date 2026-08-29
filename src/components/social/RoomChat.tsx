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
  Flame, 
  Coffee,
  HelpCircle,
  BookOpen,
  FileText,
  Paperclip,
  CheckCircle2,
  ExternalLink,
  Ban,
  Clock
} from 'lucide-react';
import { ExtendedUserProfile, GroupMessage, ChatMode, MessageTag } from '@/types/social';
import { createClient } from '@/lib/supabase/client';
import { 
  checkRateLimit, 
  registerAction, 
  sanitizeMessageContent, 
  checkUserChatPermission,
  recordModerationViolation
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
  { emoji: '🎯', text: 'Sprint goal reached' },
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
  const [activeTag, setActiveTag] = useState<MessageTag>('general');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesTitle, setNotesTitle] = useState('');
  const [notesUrl, setNotesUrl] = useState('');

  const [reportingMessage, setReportingMessage] = useState<GroupMessage | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  // Moderation state
  const [chatPermission, setChatPermission] = useState(() => checkUserChatPermission(currentUser.id));

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check chat permissions on mount and interval if muted
  useEffect(() => {
    const updatePerm = () => {
      const perm = checkUserChatPermission(currentUser.id);
      setChatPermission(perm);
    };
    updatePerm();
    const interval = setInterval(updatePerm, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Load chat messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data && !error) {
        setMessages(data);
      } else {
        setMessages([]);
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
          const newMsg = payload.new as GroupMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, customReaction?: string) => {
    if (e) e.preventDefault();

    const textToSend = customReaction || inputText.trim();
    if (!textToSend) return;

    // 1. Check User Chat Permission (Anti-Harassment Strikes)
    const perm = checkUserChatPermission(currentUser.id);
    if (!perm.canSend) {
      setChatPermission(perm);
      setToastError(perm.reason || 'Messaging privileges suspended.');
      return;
    }

    // 2. Rate Limiting Check
    const rateCheck = checkRateLimit('chat');
    if (!rateCheck.allowed) {
      setToastError(`Rate limit reached. Please wait ${rateCheck.retryAfterSeconds}s before sending another message.`);
      return;
    }

    // 3. Automated Safety Guardrails (Zero-Tolerance Profanity & Harassment Filter)
    const moderation = sanitizeMessageContent(textToSend);
    if (moderation.isViolation) {
      const violationRes = recordModerationViolation(
        currentUser.id,
        moderation.reason || 'Prohibited language or harassment detected'
      );
      
      const newPerm = checkUserChatPermission(currentUser.id);
      setChatPermission(newPerm);

      if (newPerm.isBanned) {
        setToastError('🚫 Prohibited language detected. Due to repeated violations, your messaging access has been suspended.');
      } else if (newPerm.isMuted) {
        setToastError(`⚠️ Message blocked. Community guideline strike #${violationRes.newStrikeCount}: You have been placed on a 15-minute cooldown.`);
      } else {
        setToastError(`⚠️ Message blocked: Swearing, harassment, or bullying is prohibited in study rooms (Strike 1/3).`);
      }
      return;
    }

    registerAction('chat');

    const msgPayload = {
      group_id: groupId,
      user_id: currentUser.id,
      content: moderation.cleanContent,
      message_type: customReaction ? 'reaction' : 'text',
      tag: customReaction ? 'general' : activeTag,
      attachment_title: notesTitle.trim() || null,
      attachment_url: notesUrl.trim() || null,
      is_flagged: false,
      report_count: 0,
    };

    // Optimistic UI update
    const optimisticMsg: GroupMessage = {
      id: 'opt_' + Date.now(),
      ...msgPayload,
      message_type: msgPayload.message_type as any,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setNotesTitle('');
    setNotesUrl('');
    setIsNotesModalOpen(false);
    setActiveTag('general');

    try {
      const { error } = await supabase.from('group_messages').insert(msgPayload);
      if (error) throw error;
    } catch (err: any) {
      console.error('Error sending message:', err);
      setToastError('Failed to deliver message.');
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
            Live Room Chat & Doubt Arena
          </span>
        </div>

        {chatMode === 'reactions_only' && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Focus Reactions Only
          </span>
        )}
      </div>

      {/* Toast Alert */}
      {toastError && (
        <div className="p-3 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{toastError}</span>
          </div>
          <button 
            onClick={() => setToastError(null)} 
            className="text-rose-400 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banned / Muted Warning Banner */}
      {!chatPermission.canSend && (
        <div className="p-3 bg-rose-950/70 border-b border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
          <Ban className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold">
              {chatPermission.isBanned ? 'Chat Privileges Suspended' : 'Temporary Chat Cooldown'}
            </div>
            <div className="text-[11px] text-rose-300">
              {chatPermission.reason || 'Violated anti-harassment/bullying guardrails.'}
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500 space-y-2">
            <BookOpen className="w-8 h-8 text-zinc-600" />
            <p className="text-xs font-medium text-zinc-400">Welcome to the Study Room!</p>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              Ask doubts, share notes, motivate your peers, or send focus check-ins. Keep it respectful!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            const isDoubt = msg.tag === 'doubt';
            const isSolution = msg.tag === 'solution';
            const isNotes = msg.tag === 'notes' || !!msg.attachment_url;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-1.5 transition-all ${
                    isMe
                      ? 'bg-teal-500/15 border border-teal-500/30 text-teal-100 rounded-br-none'
                      : isDoubt
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-bl-none'
                      : isSolution
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 rounded-bl-none'
                      : isNotes
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-100 rounded-bl-none'
                      : 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 rounded-bl-none'
                  }`}
                >
                  {/* Tag / Sender Header */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="font-bold text-zinc-300">
                      {isMe ? 'You' : `Scholar #${msg.user_id.substring(0, 4)}`}
                    </span>

                    {isDoubt && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        ❓ DOUBT
                      </span>
                    )}
                    {isSolution && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        💡 SOLUTION
                      </span>
                    )}
                    {isNotes && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        📝 NOTES
                      </span>
                    )}
                  </div>

                  {/* Attachment Card if present */}
                  {msg.attachment_title && (
                    <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="font-semibold text-zinc-100 truncate text-[11px]">
                          {msg.attachment_title}
                        </span>
                      </div>
                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-400 hover:text-teal-300 p-1 rounded hover:bg-zinc-800 flex items-center gap-1 font-bold text-[10px]"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>

                  <div className="flex items-center justify-between pt-1 text-[9px] text-zinc-500 font-mono">
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isMe && (
                      <button
                        onClick={() => setReportingMessage(msg)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Report inappropriate content"
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Reactions Quick Bar */}
      <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] text-zinc-500 font-mono mr-1 flex-shrink-0">Quick Focus:</span>
        {PRESET_FOCUS_REACTIONS.map((re, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(undefined, `${re.emoji} ${re.text}`)}
            disabled={!chatPermission.canSend}
            className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-40 text-xs text-zinc-300 transition-all flex-shrink-0 flex items-center gap-1 active:scale-95"
          >
            <span>{re.emoji}</span>
            <span className="text-[10px]">{re.text}</span>
          </button>
        ))}
      </div>

      {/* Message Composer */}
      {chatMode === 'open' ? (
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-2">
          {/* Tag Selector Chips */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTag('general')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTag === 'general'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              💬 General
            </button>
            <button
              type="button"
              onClick={() => setActiveTag('doubt')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTag === 'doubt'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800/60 text-amber-400 hover:text-amber-300'
              }`}
            >
              ❓ Ask Doubt
            </button>
            <button
              type="button"
              onClick={() => setActiveTag('solution')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTag === 'solution'
                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800/60 text-emerald-400 hover:text-emerald-300'
              }`}
            >
              💡 Share Solution
            </button>
            <button
              type="button"
              onClick={() => setIsNotesModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all flex items-center gap-1 ml-auto"
            >
              <Paperclip className="w-3 h-3" />
              <span>Share Notes / Link</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!chatPermission.canSend}
              placeholder={
                !chatPermission.canSend
                  ? 'Chat privileges suspended.'
                  : activeTag === 'doubt'
                  ? 'Type your doubt / question here...'
                  : activeTag === 'solution'
                  ? 'Type your explanation / solution...'
                  : 'Type a message to the study group...'
              }
              className="flex-1 bg-zinc-950 border border-zinc-800 disabled:opacity-40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !chatPermission.canSend}
              className="p-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-30 text-zinc-950 font-bold transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-center text-xs text-zinc-500">
          🔒 Text chat is disabled in this room to preserve zero-distraction focus. Use the Focus Reactions above.
        </div>
      )}

      {/* Share Notes Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-xs space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Share Notes or Resource Link</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Notes Title</label>
                <input
                  type="text"
                  value={notesTitle}
                  onChange={(e) => setNotesTitle(e.target.value)}
                  placeholder="e.g. Organic Chem Reaction Formulas (PDF)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Resource Link / URL</label>
                <input
                  type="url"
                  value={notesUrl}
                  onChange={(e) => setNotesUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or Notion link"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description / Summary</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Summary of what this document covers..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTag('notes');
                  handleSendMessage();
                }}
                disabled={!notesTitle.trim() || !inputText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-bold shadow-md"
              >
                Post Notes to Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportingMessage && (
        <ReportModal
          isOpen={true}
          reportedUserId={reportingMessage.user_id}
          reportedUserName={`Scholar #${reportingMessage.user_id.substring(0, 4)}`}
          reporterId={currentUser.id}
          messageId={reportingMessage.id}
          messagePreview={reportingMessage.content}
          onClose={() => setReportingMessage(null)}
        />
      )}
    </div>
  );
}
