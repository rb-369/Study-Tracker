import { GroupChallenge } from '@/types/gamification';
import { createClient } from '@/lib/supabase/client';
import { awardUserXP } from './xpEngine';

/**
 * Calculates current progress for group challenges
 */
export function calculateChallengeProgress(challenge: GroupChallenge): {
  progressPercentage: number;
  remainingHours: number;
  isComplete: boolean;
} {
  const progressPercentage = Math.min(
    100,
    Math.round((challenge.current_hours / challenge.target_hours) * 100)
  );
  const remainingHours = Math.max(0, challenge.target_hours - challenge.current_hours);
  const isComplete = challenge.current_hours >= challenge.target_hours;

  return {
    progressPercentage,
    remainingHours,
    isComplete,
  };
}

/**
 * Contributes completed session hours to active group challenges and resolves completion
 */
export async function contributeSessionToGroupChallenges(
  userId: string,
  netFocusHours: number
): Promise<void> {
  if (netFocusHours <= 0 || !userId) return;

  const supabase = createClient();
  try {
    // 1. Find all groups the user belongs to
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (!memberships || memberships.length === 0) return;

    const groupIds = memberships.map((m) => m.group_id);

    // 2. Fetch active challenges for these groups
    const { data: challenges } = await supabase
      .from('group_challenges')
      .select('*')
      .in('group_id', groupIds)
      .eq('status', 'active');

    if (!challenges || challenges.length === 0) return;

    for (const ch of challenges) {
      const newHours = (ch.current_hours || 0) + netFocusHours;
      const isComplete = newHours >= ch.target_hours;

      await supabase
        .from('group_challenges')
        .update({
          current_hours: newHours,
          status: isComplete ? 'completed' : 'active',
        })
        .eq('id', ch.id);

      // If just completed, award group reward XP to contributing user
      if (isComplete) {
        await awardUserXP(userId, ch.reward_xp || 100, 'group_challenge');
      }
    }
  } catch (err) {
    console.error('Error contributing to group challenges:', err);
  }
}
