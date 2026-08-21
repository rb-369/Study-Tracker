export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type SessionType = 'stopwatch' | 'pomodoro';

export type ThoughtCategory = 
  | 'phone_social'
  | 'hunger_snack'
  | 'random_idea'
  | 'anxiety_stress'
  | 'urgent_chore'
  | 'other';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  target_daily_minutes: number;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  target_weekly_hours: number;
  created_at: string;
}

export interface Thought {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  category: ThoughtCategory;
  approx_duration_minutes: number;
  timestamp: string;
  notes?: string;
  created_at: string;
}

export interface AIDebrief {
  focusScore: number; // 0-100
  flowStateRating: 'Deep Flow' | 'High Focus' | 'Moderate' | 'Distracted' | 'Fragmented';
  summary: string;
  primaryDistractionDiagnosis: string;
  actionableTips: string[];
  recommendedBreakMinutes: number;
  nextSessionTopicSuggestion?: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string;
  topic: string;
  start_time: string;
  end_time: string | null;
  gross_duration_seconds: number;
  net_focus_seconds: number;
  status: SessionStatus;
  session_type: SessionType;
  session_notes?: string;
  focus_score: number;
  ai_debrief?: AIDebrief;
  thoughts?: Thought[];
  created_at: string;
  subject?: Subject;
}

export interface WeeklyAIReport {
  weekStarting: string;
  totalGrossHours: number;
  totalNetHours: number;
  overallFocusRatio: number;
  peakFocusDay: string;
  peakFocusHour: string;
  topDistractionCategory: string;
  flowStateAchievementPercentage: number;
  executiveSummary: string;
  strengths: string[];
  growthAreas: string[];
  strategicRecommendations: string[];
}

export type AnalyticsTimeframe = '7d' | '14d' | '30d' | 'all';

export interface AnalyticsSummary {
  timeframe: AnalyticsTimeframe;
  totalGrossMinutes: number;
  totalNetMinutes: number;
  overallFocusRatio: number; // e.g. 0.88 for 88%
  completedSessionsCount: number;
  totalThoughtsLogged: number;
  avgSessionMinutes: number;
  longestDeepWorkStreakMinutes: number;
  currentStreakDays: number;
  pingsPerHour: number;
  avgPingDurationMinutes: number;
  avgFocusScore: number;
  flowStateDistribution: { rating: string; count: number; percentage: number; color: string }[];
  topThoughtTitles: { title: string; count: number; totalMinutes: number; category: ThoughtCategory }[];
  subjectWiseMinutes: { subjectId: string; subjectName: string; color: string; grossMinutes: number; netMinutes: number }[];
  categoryWiseDistractions: { category: ThoughtCategory; count: number; totalMinutes: number; label: string }[];
  dailyTrends: { date: string; displayDate: string; grossMinutes: number; netMinutes: number; focusRatio: number; focusScore: number }[];
  hourlyHeatmap: { hour: number; dayOfWeek: number; count: number; avgFocusRatio: number }[];
  comparison?: {
    priorNetMinutes: number;
    netMinutesGrowthPct: number;
    priorFocusRatio: number;
    focusRatioDeltaPct: number;
  };
}

