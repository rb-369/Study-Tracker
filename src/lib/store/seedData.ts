import { Subject, StudySession, Thought, UserProfile } from "@/types";

export const INITIAL_PROFILE: UserProfile = {
  id: "demo-user-id",
  email: "learner@studyflow.ai",
  full_name: "Alex Vance",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  target_daily_minutes: 180,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: "sub-1",
    user_id: "demo-user-id",
    name: "Deep Learning & Neural Networks",
    color: "#10b981", // Emerald
    icon: "Cpu",
    target_weekly_hours: 12,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "sub-2",
    user_id: "demo-user-id",
    name: "Algorithms & Data Structures",
    color: "#6366f1", // Indigo
    icon: "Binary",
    target_weekly_hours: 8,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "sub-3",
    user_id: "demo-user-id",
    name: "Distributed Systems & Cloud",
    color: "#3b82f6", // Blue
    icon: "Server",
    target_weekly_hours: 6,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "sub-4",
    user_id: "demo-user-id",
    name: "Linear Algebra & Optimization",
    color: "#f59e0b", // Amber
    icon: "Sigma",
    target_weekly_hours: 5,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// Helper to generate past sessions over the last 7 days
function generatePastSessions(): StudySession[] {
  const now = Date.now();
  const oneHour = 3600 * 1000;
  const oneDay = 86400 * 1000;

  const sessions: StudySession[] = [
    {
      id: "sess-1",
      user_id: "demo-user-id",
      subject_id: "sub-1",
      topic: "Transformer Attention Mechanisms & QKV matrices",
      start_time: new Date(now - 1 * oneDay - 3 * oneHour).toISOString(),
      end_time: new Date(now - 1 * oneDay - 1.5 * oneHour).toISOString(),
      gross_duration_seconds: 5400, // 90 mins
      net_focus_seconds: 4800, // 80 mins
      status: "completed",
      session_type: "stopwatch",
      session_notes: "Derived scaled dot-product attention equation. Reached great flow after min 20.",
      focus_score: 91,
      ai_debrief: {
        focusScore: 91,
        flowStateRating: "Deep Flow",
        summary: "Excellent sustained attention with only 2 minor pings. High comprehension velocity achieved.",
        primaryDistractionDiagnosis: "Slight wandering thought around snack break at minute 45.",
        actionableTips: [
          "Keep pre-session hydration and light snack ready before starting 90-min blocks.",
          "Continue the practice of writing equations on paper before coding."
        ],
        recommendedBreakMinutes: 15,
        nextSessionTopicSuggestion: "Multi-Head Attention PyTorch implementation",
      },
      thoughts: [
        {
          id: "th-1",
          session_id: "sess-1",
          user_id: "demo-user-id",
          title: "Thought about getting green tea",
          category: "hunger_snack",
          approx_duration_minutes: 3,
          timestamp: new Date(now - 1 * oneDay - 2.5 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: "th-2",
          session_id: "sess-1",
          user_id: "demo-user-id",
          title: "Checked Discord ping for project reply",
          category: "phone_social",
          approx_duration_minutes: 7,
          timestamp: new Date(now - 1 * oneDay - 2.0 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date(now - 1 * oneDay).toISOString(),
      subject: INITIAL_SUBJECTS[0],
    },
    {
      id: "sess-2",
      user_id: "demo-user-id",
      subject_id: "sub-2",
      topic: "Segment Trees & Dynamic Range Queries",
      start_time: new Date(now - 2 * oneDay - 4 * oneHour).toISOString(),
      end_time: new Date(now - 2 * oneDay - 2.8 * oneHour).toISOString(),
      gross_duration_seconds: 4320, // 72 mins
      net_focus_seconds: 3720, // 62 mins
      status: "completed",
      session_type: "pomodoro",
      session_notes: "Solved 2 LeetCode Hard problems on lazy propagation.",
      focus_score: 87,
      ai_debrief: {
        focusScore: 87,
        flowStateRating: "High Focus",
        summary: "Solid problem-solving block. Distractions were isolated to notification checks.",
        primaryDistractionDiagnosis: "Phone notifications created 2 brief context switches.",
        actionableTips: [
          "Place phone across the room in Do Not Disturb during LeetCode sessions.",
          "Use a 5-minute cooldown between complex data structure problems."
        ],
        recommendedBreakMinutes: 10,
      },
      thoughts: [
        {
          id: "th-3",
          session_id: "sess-2",
          user_id: "demo-user-id",
          title: "Wanted to check YouTube solution shortcut",
          category: "phone_social",
          approx_duration_minutes: 6,
          timestamp: new Date(now - 2 * oneDay - 3.5 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: "th-4",
          session_id: "sess-2",
          user_id: "demo-user-id",
          title: "Worry about upcoming midterm schedule",
          category: "anxiety_stress",
          approx_duration_minutes: 4,
          timestamp: new Date(now - 2 * oneDay - 3.1 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date(now - 2 * oneDay).toISOString(),
      subject: INITIAL_SUBJECTS[1],
    },
    {
      id: "sess-3",
      user_id: "demo-user-id",
      subject_id: "sub-3",
      topic: "Raft Consensus Protocol & Leader Election",
      start_time: new Date(now - 3 * oneDay - 2 * oneHour).toISOString(),
      end_time: new Date(now - 3 * oneDay - 0.7 * oneHour).toISOString(),
      gross_duration_seconds: 4680, // 78 mins
      net_focus_seconds: 4380, // 73 mins
      status: "completed",
      session_type: "stopwatch",
      session_notes: "Read paper section 5 on log replication and safety invariants.",
      focus_score: 95,
      ai_debrief: {
        focusScore: 95,
        flowStateRating: "Deep Flow",
        summary: "Outstanding flow state! Net focus was 94% of total time. Deep conceptual immersion.",
        primaryDistractionDiagnosis: "Minimal friction; 1 fleeting thought about grocery list.",
        actionableTips: [
          "Evening study slots (7-9 PM) consistently yield your highest focus ratio.",
          "Keep this time blocked for your hardest subjects."
        ],
        recommendedBreakMinutes: 15,
      },
      thoughts: [
        {
          id: "th-5",
          session_id: "sess-3",
          user_id: "demo-user-id",
          title: "Remembered need to buy coffee beans",
          category: "urgent_chore",
          approx_duration_minutes: 5,
          timestamp: new Date(now - 3 * oneDay - 1.2 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        }
      ],
      created_at: new Date(now - 3 * oneDay).toISOString(),
      subject: INITIAL_SUBJECTS[2],
    },
    {
      id: "sess-4",
      user_id: "demo-user-id",
      subject_id: "sub-4",
      topic: "Eigenvalues, SVD & PCA Dimensionality Reduction",
      start_time: new Date(now - 4 * oneDay - 5 * oneHour).toISOString(),
      end_time: new Date(now - 4 * oneDay - 4 * oneHour).toISOString(),
      gross_duration_seconds: 3600, // 60 mins
      net_focus_seconds: 3120, // 52 mins
      status: "completed",
      session_type: "stopwatch",
      session_notes: "Geometric intuition of singular value decomposition.",
      focus_score: 86,
      ai_debrief: {
        focusScore: 86,
        flowStateRating: "High Focus",
        summary: "Good progress through dense math proofs with 87% Focus Ratio.",
        primaryDistractionDiagnosis: "Random browser tab rabbit hole on linear algebra visualization tools.",
        actionableTips: [
          "Bookmark visualization tools before starting study session to prevent browser rabbit holes."
        ],
        recommendedBreakMinutes: 10,
      },
      thoughts: [
        {
          id: "th-6",
          session_id: "sess-4",
          user_id: "demo-user-id",
          title: "Browsed 3Blue1Brown animations",
          category: "random_idea",
          approx_duration_minutes: 8,
          timestamp: new Date(now - 4 * oneDay - 4.4 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        }
      ],
      created_at: new Date(now - 4 * oneDay).toISOString(),
      subject: INITIAL_SUBJECTS[3],
    },
    {
      id: "sess-5",
      user_id: "demo-user-id",
      subject_id: "sub-1",
      topic: "Backpropagation Through Time & Gradient Clipping",
      start_time: new Date(now - 5 * oneDay - 3 * oneHour).toISOString(),
      end_time: new Date(now - 5 * oneDay - 1.5 * oneHour).toISOString(),
      gross_duration_seconds: 5400, // 90 mins
      net_focus_seconds: 4500, // 75 mins
      status: "completed",
      session_type: "stopwatch",
      session_notes: "Implemented custom LSTM cell and gradient clipping.",
      focus_score: 83,
      ai_debrief: {
        focusScore: 83,
        flowStateRating: "High Focus",
        summary: "Strong coding session despite fatigue near the end.",
        primaryDistractionDiagnosis: "Snack breaks and mental fatigue during the last 20 minutes.",
        actionableTips: [
          "Cap single coding sprints at 75 minutes to avoid diminishing returns from fatigue."
        ],
        recommendedBreakMinutes: 15,
      },
      thoughts: [
        {
          id: "th-7",
          session_id: "sess-5",
          user_id: "demo-user-id",
          title: "Snack break & kitchen wandering",
          category: "hunger_snack",
          approx_duration_minutes: 9,
          timestamp: new Date(now - 5 * oneDay - 2.1 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: "th-8",
          session_id: "sess-5",
          user_id: "demo-user-id",
          title: "Checked Twitter tech news",
          category: "phone_social",
          approx_duration_minutes: 6,
          timestamp: new Date(now - 5 * oneDay - 1.8 * oneHour).toISOString(),
          created_at: new Date().toISOString(),
        }
      ],
      created_at: new Date(now - 5 * oneDay).toISOString(),
      subject: INITIAL_SUBJECTS[0],
    }
  ];

  return sessions;
}

export const INITIAL_SESSIONS: StudySession[] = generatePastSessions();
