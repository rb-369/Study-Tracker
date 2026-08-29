export type BreakGameType = 'zen_breathwork' | 'memory_matrix' | 'stroop_clash' | 'speed_math';

export interface BreakGameScore {
  id: string;
  user_id: string;
  game_type: BreakGameType;
  score: number;
  accuracy: number;
  duration_seconds: number;
  created_at: string;
}

export type XPSource = 
  | 'focus_duration'
  | 'metacognitive_reflection'
  | 'focus_ratio_bonus'
  | 'break_game_completion'
  | 'daily_streak'
  | 'group_challenge';

export interface UserXPLog {
  id: string;
  user_id: string;
  amount: number;
  source: XPSource;
  local_date: string;
  created_at: string;
}

export interface UserRankTier {
  name: string;
  minLevel: number;
  badge: string;
  color: string;
  gradient: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'focus' | 'metacognition' | 'social' | 'games' | 'streak';
  unlockedAt?: string;
  progressPct?: number;
}

export interface GroupChallenge {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  target_hours: number;
  current_hours: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'expired';
  reward_xp: number;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  contributed_hours: number;
  created_at: string;
}
