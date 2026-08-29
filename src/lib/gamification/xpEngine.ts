import { XPSource, UserRankTier } from '@/types/gamification';
import { createClient } from '@/lib/supabase/client';

export const DAILY_DURATION_XP_CAP = 600; // Soft cap per local calendar day

export const RANK_TIERS: UserRankTier[] = [
  {
    name: 'Novice Learner',
    minLevel: 1,
    badge: '🌱',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    name: 'Apprentice of Focus',
    minLevel: 6,
    badge: '⚡',
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Deep Work Practitioner',
    minLevel: 11,
    badge: '🧠',
    color: '#8b5cf6',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Flow State Master',
    minLevel: 21,
    badge: '🔥',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Grandmaster of Mind',
    minLevel: 36,
    badge: '👑',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-500',
  },
];

export function getRankTierForLevel(level: number): UserRankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (level >= RANK_TIERS[i].minLevel) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export function calculateLevelFromXP(totalXP: number): number {
  if (totalXP <= 0) return 1;
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

export function calculateXPForNextLevel(currentLevel: number): { currentLevelXP: number; nextLevelXP: number } {
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 50;
  const nextLevelXP = Math.pow(currentLevel, 2) * 50;
  return { currentLevelXP, nextLevelXP };
}

/**
 * Calculates Calibrated XP for a completed study session with honest metacognition rewards
 */
export interface SessionXPCalculation {
  totalEarnedXP: number;
  durationXP: number;
  reflectionBonus: number;
  focusRatioBonus: number;
  isDailyCapped: boolean;
}

export function calculateSessionXP(
  netFocusSeconds: number,
  grossDurationSeconds: number,
  hasReflectionDebrief: boolean,
  thoughtsLoggedCount: number,
  userTodayDurationXP: number = 0
): SessionXPCalculation {
  const netMinutes = Math.floor(netFocusSeconds / 60);
  
  // 1. Duration XP: +10 XP per 10 mins
  let rawDurationXP = Math.floor(netMinutes / 10) * 10;
  let durationXP = rawDurationXP;
  let isDailyCapped = false;

  if (userTodayDurationXP + rawDurationXP > DAILY_DURATION_XP_CAP) {
    durationXP = Math.max(0, DAILY_DURATION_XP_CAP - userTodayDurationXP);
    isDailyCapped = true;
  }

  // 2. Metacognitive Reflection Bonus (+15 XP for logging reflection/pings honestly)
  const reflectionBonus = hasReflectionDebrief ? 15 : 0;

  // 3. Focus Ratio Bonus (+20 XP if net focus ratio >= 80%)
  const focusRatio = grossDurationSeconds > 0 ? netFocusSeconds / grossDurationSeconds : 0;
  const focusRatioBonus = (focusRatio >= 0.80 && netMinutes >= 20) ? 20 : 0;

  const totalEarnedXP = durationXP + reflectionBonus + focusRatioBonus;

  return {
    totalEarnedXP,
    durationXP,
    reflectionBonus,
    focusRatioBonus,
    isDailyCapped,
  };
}

/**
 * Records earned XP into user profile and logs to user_xp_logs
 */
export async function awardUserXP(
  userId: string,
  amount: number,
  source: XPSource,
  userTimezone: string = 'UTC'
): Promise<{ newLevel: number; newXP: number } | null> {
  if (amount <= 0 || !userId || userId.startsWith('demo-') || userId.startsWith('guest-')) {
    return null;
  }

  const supabase = createClient();
  try {
    const localDate = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });

    // 1. Insert XP log
    await supabase.from('user_xp_logs').insert({
      user_id: userId,
      amount,
      source,
      local_date: localDate,
    });

    // 2. Fetch and update profile XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (profile) {
      const newXP = (profile.xp || 0) + amount;
      const newLevel = calculateLevelFromXP(newXP);

      await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
        })
        .eq('id', userId);

      return { newLevel, newXP };
    }
  } catch (err) {
    console.error('Error awarding XP:', err);
  }

  return null;
}
