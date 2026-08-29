import { createClient } from '@/lib/supabase/client';
import { ModerationReport, GroupMessage } from '@/types/social';

// Client-side rate limiting tracker stored in memory / localStorage
interface RateLimitBucket {
  timestamps: number[];
}

const STORAGE_KEY_RATE_LIMITS = 'studyflow_social_rate_limits_v1';
const STORAGE_KEY_STRIKES_PREFIX = 'studyflow_user_strikes_';

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

export function checkRateLimit(actionType: 'friend_request' | 'report' | 'chat'): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = getRateLimitBucket(actionType);

  let windowMs = 60 * 1000;
  let maxAllowed = 15;

  if (actionType === 'friend_request') {
    windowMs = 60 * 60 * 1000; // 1 hour
    maxAllowed = 10;
  } else if (actionType === 'report') {
    windowMs = 15 * 60 * 1000; // 15 min
    maxAllowed = 5;
  }

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

// Comprehensive Safety & Harassment Guardrails
const BLOCKED_WORDS = [
  'kill yourself',
  'kys',
  'die',
  'loser',
  'hate',
  'idiot',
  'stupid',
  'bitch',
  'fuck',
  'fucking',
  'shit',
  'asshole',
  'dick',
  'cunt',
  'bastard',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'retarded',
  'slut',
  'whore',
  'scam',
  'terrorist',
  'ugly',
  'fat',
  'worthless',
];

export interface ModerationViolation {
  isViolation: boolean;
  cleanContent: string;
  detectedWords: string[];
  reason?: string;
}

/**
 * Checks content against strict anti-harassment, anti-bullying, and anti-profanity guardrails.
 */
export function sanitizeMessageContent(content: string): ModerationViolation {
  let cleanContent = content;
  const detectedWords: string[] = [];
  const lower = content.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    // Check whole word or obvious substring match
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(lower) || lower.includes(word)) {
      detectedWords.push(word);
      cleanContent = cleanContent.replace(regex, '***');
    }
  }

  return {
    isViolation: detectedWords.length > 0,
    cleanContent,
    detectedWords,
    reason: detectedWords.length > 0 ? `Message contains prohibited language / harassment keywords: ${detectedWords.join(', ')}` : undefined,
  };
}

export interface UserChatPermission {
  canSend: boolean;
  isBanned: boolean;
  isMuted: boolean;
  strikeCount: number;
  remainingMuteSeconds: number;
  reason?: string;
}

/**
 * Checks if user is permitted to chat or is muted/banned due to moderation strikes.
 */
export function checkUserChatPermission(userId: string): UserChatPermission {
  if (typeof window === 'undefined') {
    return { canSend: true, isBanned: false, isMuted: false, strikeCount: 0, remainingMuteSeconds: 0 };
  }

  try {
    const key = `${STORAGE_KEY_STRIKES_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { canSend: true, isBanned: false, isMuted: false, strikeCount: 0, remainingMuteSeconds: 0 };
    }

    const data = JSON.parse(raw);
    const strikeCount = data.strikes || 0;
    const mutedUntil = data.mutedUntil || 0;
    const now = Date.now();

    // Strike 3+ = Permanent Ban from group messaging
    if (strikeCount >= 3) {
      return {
        canSend: false,
        isBanned: true,
        isMuted: true,
        strikeCount,
        remainingMuteSeconds: 0,
        reason: 'Your messaging access is suspended due to repeated violations of community safety guidelines.',
      };
    }

    // Strike 2 = 15-minute temporary cooldown
    if (mutedUntil > now) {
      const remainingSecs = Math.ceil((mutedUntil - now) / 1000);
      return {
        canSend: false,
        isBanned: false,
        isMuted: true,
        strikeCount,
        remainingMuteSeconds: remainingSecs,
        reason: `Temporary cooldown active for ${remainingSecs}s due to community guideline violation.`,
      };
    }

    return {
      canSend: true,
      isBanned: false,
      isMuted: false,
      strikeCount,
      remainingMuteSeconds: 0,
    };
  } catch {
    return { canSend: true, isBanned: false, isMuted: false, strikeCount: 0, remainingMuteSeconds: 0 };
  }
}

/**
 * Records a moderation strike against a user for toxic / profane behavior.
 */
export function recordModerationViolation(userId: string, reason: string): { newStrikeCount: number; isBanned: boolean; isMuted: boolean } {
  if (typeof window === 'undefined') return { newStrikeCount: 1, isBanned: false, isMuted: false };

  try {
    const key = `${STORAGE_KEY_STRIKES_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { strikes: 0, violations: [] };

    data.strikes = (data.strikes || 0) + 1;
    data.violations.push({ reason, timestamp: Date.now() });

    if (data.strikes === 2) {
      // 15 min mute
      data.mutedUntil = Date.now() + 15 * 60 * 1000;
    } else if (data.strikes >= 3) {
      data.isBanned = true;
    }

    localStorage.setItem(key, JSON.stringify(data));

    return {
      newStrikeCount: data.strikes,
      isBanned: data.strikes >= 3,
      isMuted: data.strikes >= 2,
    };
  } catch {
    return { newStrikeCount: 1, isBanned: false, isMuted: false };
  }
}

/**
 * Submits a moderation report against a user or message.
 */
export async function submitModerationReport(
  reporterIdOrReport: string | { reporter_id: string; reported_user_id: string; message_id?: string; reason: string; details?: string },
  reportedUserIdArg?: string,
  reasonArg?: string,
  messageIdArg?: string,
  detailsArg?: string
): Promise<{ success: boolean; autoQuarantined?: boolean; error?: string }> {
  const rate = checkRateLimit('report');
  if (!rate.allowed) {
    return { success: false, error: `Too many reports. Please wait ${rate.retryAfterSeconds}s.` };
  }

  let reporter_id: string;
  let reported_user_id: string;
  let reason: string;
  let message_id: string | undefined;
  let details: string | undefined;

  if (typeof reporterIdOrReport === 'object') {
    reporter_id = reporterIdOrReport.reporter_id;
    reported_user_id = reporterIdOrReport.reported_user_id;
    reason = reporterIdOrReport.reason;
    message_id = reporterIdOrReport.message_id;
    details = reporterIdOrReport.details;
  } else {
    reporter_id = reporterIdOrReport;
    reported_user_id = reportedUserIdArg || '';
    reason = reasonArg || 'harassment';
    message_id = messageIdArg;
    details = detailsArg;
  }

  const supabase = createClient();
  const { error } = await supabase.from('moderation_reports').insert({
    reporter_id,
    reported_user_id,
    message_id,
    reason,
    details,
    status: 'pending',
  });

  if (error) {
    console.error('Error submitting report:', error);
    return { success: false, error: error.message };
  }

  // Also auto-block the reported user for the reporter
  if (reported_user_id) {
    await blockUser(reporter_id, reported_user_id);
  }

  registerAction('report');
  return { success: true, autoQuarantined: true };
}

/**
 * Blocks a user locally and in the database.
 */
export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  return !error;
}
