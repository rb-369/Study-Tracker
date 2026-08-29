import { createClient } from '@/lib/supabase/client';
import { ModerationReport, GroupMessage } from '@/types/social';

// Client-side rate limiting tracker stored in memory / localStorage
interface RateLimitBucket {
  timestamps: number[];
}

const STORAGE_KEY_RATE_LIMITS = 'studyflow_social_rate_limits_v1';

function getRateLimitBucket(key: string): RateLimitBucket {
  if (typeof window === 'undefined') return { timestamps: [] };
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY_RATE_LIMITS) || '{}');
    return data[key] || { timestamps: [] };
  } catch {
    return { timestamps: [] };
  }
}

function recordRateLimitAction(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY_RATE_LIMITS) || '{}');
    const bucket: RateLimitBucket = data[key] || { timestamps: [] };
    bucket.timestamps.push(Date.now());
    data[key] = bucket;
    localStorage.setItem(STORAGE_KEY_RATE_LIMITS, JSON.stringify(data));
  } catch {}
}

/**
 * Validates rate limit:
 * - Friend requests: max 5 per hour
 * - Reports: max 3 per 15 min
 * - Chat: max 12 per min
 */
export function checkRateLimit(actionType: 'friend_request' | 'report' | 'chat'): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = getRateLimitBucket(actionType);

  let windowMs = 60 * 1000;
  let maxAllowed = 12;

  if (actionType === 'friend_request') {
    windowMs = 60 * 60 * 1000; // 1 hour
    maxAllowed = 5;
  } else if (actionType === 'report') {
    windowMs = 15 * 60 * 1000; // 15 min
    maxAllowed = 3;
  }

  // Filter timestamps within window
  const validTimestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxAllowed) {
    const oldest = validTimestamps[0];
    const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  return { allowed: true };
}

export function registerAction(actionType: 'friend_request' | 'report' | 'chat'): void {
  recordRateLimitAction(actionType);
}

// Basic Profanity Regex & Keyword Filter
const BLOCKED_WORDS = [
  'kill yourself',
  'kys',
  'hate',
  'idiot',
  'stupid',
  'bitch',
  'fuck',
  'shit',
  'nigger',
  'faggot',
  'retard',
];

export function sanitizeMessageContent(content: string): { cleanContent: string; isFlagged: boolean } {
  let cleanContent = content;
  let isFlagged = false;

  const lower = content.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      isFlagged = true;
      const regex = new RegExp(word, 'gi');
      cleanContent = cleanContent.replace(regex, '***');
    }
  }

  return { cleanContent, isFlagged };
}

/**
 * Submits a moderation report with anti-brigading verification
 */
export async function submitModerationReport(
  reporterId: string,
  reportedUserId: string,
  reason: string,
  messageId?: string,
  details?: string
): Promise<{ success: boolean; error?: string; autoQuarantined?: boolean }> {
  const rateCheck = checkRateLimit('report');
  if (!rateCheck.allowed) {
    return { 
      success: false, 
      error: `Rate limit reached. Please wait ${rateCheck.retryAfterSeconds}s before submitting another report.` 
    };
  }

  registerAction('report');
  const supabase = createClient();

  try {
    // 1. Insert report
    const { error: repErr } = await supabase.from('moderation_reports').insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      message_id: messageId || null,
      reason,
      details: details || null,
      status: 'pending',
      is_verified_reporter: true,
    });

    if (repErr) throw repErr;

    // 2. Automatically block user locally for the reporter
    await blockUser(reporterId, reportedUserId);

    // 3. If reporting a specific message, update its report count
    let autoQuarantined = false;
    if (messageId) {
      const { data: msg } = await supabase
        .from('group_messages')
        .select('report_count')
        .eq('id', messageId)
        .single();

      const newCount = (msg?.report_count || 0) + 1;
      const shouldQuarantine = newCount >= 3; // 3-report threshold

      await supabase
        .from('group_messages')
        .update({
          report_count: newCount,
          is_flagged: shouldQuarantine,
        })
        .eq('id', messageId);

      if (shouldQuarantine) {
        autoQuarantined = true;
      }
    }

    return { success: true, autoQuarantined };
  } catch (err: any) {
    console.error('Error submitting report:', err);
    return { success: false, error: err.message || 'Failed to submit report' };
  }
}

/**
 * Request an appeal for an auto-quarantined message
 */
export async function requestMessageAppeal(messageId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('moderation_reports')
      .update({ appeal_status: 'requested' })
      .eq('message_id', messageId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Blocks a user, preventing all buddy pairing, presence, and chat interaction
 */
export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = createClient();
  try {
    // 1. Insert into user_blocks
    await supabase.from('user_blocks').upsert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    // 2. Remove friendship if exists
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${blockerId},friend_id.eq.${blockedId}),and(user_id.eq.${blockedId},friend_id.eq.${blockerId})`);

    // 3. Cancel any pending buddy session invites
    await supabase
      .from('buddy_sessions')
      .update({ status: 'declined' })
      .or(`and(initiator_id.eq.${blockerId},buddy_id.eq.${blockedId}),and(initiator_id.eq.${blockedId},buddy_id.eq.${blockerId})`);

    return true;
  } catch (err) {
    console.error('Error blocking user:', err);
    return false;
  }
}
