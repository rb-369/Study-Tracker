import { Subject, StudySession, UserProfile, ExamGoal } from "@/types";

export const INITIAL_PROFILE: UserProfile = {
  id: "guest-user",
  email: "guest@studyflow.local",
  full_name: "Guest Scholar",
  avatar_url: undefined,
  target_daily_minutes: 120,
  created_at: new Date().toISOString(),
};

// Start clean: 0 dummy subjects, 0 dummy sessions, 0 dummy goals for every user
export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_SESSIONS: StudySession[] = [];
export const INITIAL_GOALS: ExamGoal[] = [];
