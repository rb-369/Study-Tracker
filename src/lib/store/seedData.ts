import { Subject, StudySession, UserProfile, ExamGoal, Thought, AIDebrief } from "@/types";

export const INITIAL_PROFILE: UserProfile = {
  id: "guest-user",
  email: "guest@studyflow.local",
  full_name: "Guest Scholar",
  avatar_url: undefined,
  target_daily_minutes: 120,
  created_at: new Date().toISOString(),
};

// Start clean fallbacks
export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_SESSIONS: StudySession[] = [];
export const INITIAL_GOALS: ExamGoal[] = [];

/**
 * Creates dynamic UTC ISO timestamps relative to now.
 * This guarantees that sessions from "today" always match today's date
 * regardless of what day or month the evaluator runs the application.
 */
function createSessionTime(daysAgo: number, utcHour: number, utcMinute: number, durationMinutes: number) {
  const baseTime = new Date();
  baseTime.setUTCDate(baseTime.getUTCDate() - daysAgo);
  baseTime.setUTCHours(utcHour, utcMinute, 0, 0);
  const start_time = baseTime.toISOString();
  const end_time = new Date(baseTime.getTime() + durationMinutes * 60 * 1000).toISOString();
  return { start_time, end_time };
}

/**
 * Generates 14 realistic completed study sessions across 3 academic subjects
 * with realistic mind pings, focus scores, circadian hour distributions, and AI debriefs.
 */
export function generateRealisticDemoData(userId: string = "guest-user"): {
  subjects: Subject[];
  goals: ExamGoal[];
  sessions: StudySession[];
} {
  const goalId = "demo-goal-finals";

  const subjCalculus: Subject = {
    id: "demo-subj-calculus",
    user_id: userId,
    name: "Calculus & Linear Algebra",
    color: "#10b981", // Emerald
    icon: "TrendingUp",
    target_weekly_hours: 14,
    created_at: createSessionTime(7, 8, 0, 0).start_time,
  };

  const subjPhysics: Subject = {
    id: "demo-subj-physics",
    user_id: userId,
    name: "Physics (Electromagnetism & Waves)",
    color: "#06b6d4", // Cyan
    icon: "Zap",
    target_weekly_hours: 12,
    created_at: createSessionTime(7, 8, 0, 0).start_time,
  };

  const subjChemistry: Subject = {
    id: "demo-subj-chemistry",
    user_id: userId,
    name: "Organic Chemistry",
    color: "#8b5cf6", // Purple
    icon: "BookOpen",
    target_weekly_hours: 10,
    created_at: createSessionTime(7, 8, 0, 0).start_time,
  };

  const subjects: Subject[] = [subjCalculus, subjPhysics, subjChemistry];

  // Target exam date 21 days from now
  const targetExamDate = new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0];

  const goals: ExamGoal[] = [
    {
      id: goalId,
      user_id: userId,
      title: "Semester Final Exams Sprint",
      target_date: targetExamDate,
      target_total_hours: 45,
      color: "#10b981",
      icon: "Target",
      status: "active",
      subject_allocations: [
        { subject_id: subjCalculus.id, target_hours: 16 },
        { subject_id: subjPhysics.id, target_hours: 15 },
        { subject_id: subjChemistry.id, target_hours: 14 },
      ],
      notes: "Comprehensive mastery of core units, active problem solving, and spaced review.",
      created_at: createSessionTime(7, 8, 0, 0).start_time,
    },
  ];

  // Helper to build a session object
  const buildSession = (config: {
    id: string;
    subject: Subject;
    topic: string;
    daysAgo: number;
    hour: number;
    minute: number;
    durationMins: number;
    thoughts: { title: string; category: any; approxMinutes: number; minutesIntoSession: number }[];
    focusScore: number;
    flowRating: "Deep Flow" | "High Focus" | "Moderate";
    summary: string;
    diagnosis: string;
    actionableTips: string[];
    nextTopic: string;
    sessionNotes?: string;
  }): StudySession => {
    const time = createSessionTime(config.daysAgo, config.hour, config.minute, config.durationMins);
    const grossSeconds = config.durationMins * 60;
    const thoughtSeconds = config.thoughts.reduce((acc, t) => acc + Math.round(t.approxMinutes * 60), 0);
    const netSeconds = Math.max(0, grossSeconds - thoughtSeconds);

    const mappedThoughts: Thought[] = config.thoughts.map((t, idx) => {
      const thoughtDate = new Date(new Date(time.start_time).getTime() + t.minutesIntoSession * 60 * 1000);
      return {
        id: `${config.id}-thought-${idx + 1}`,
        session_id: config.id,
        user_id: userId,
        title: t.title,
        category: t.category,
        approx_duration_minutes: t.approxMinutes,
        timestamp: thoughtDate.toISOString(),
        created_at: thoughtDate.toISOString(),
      };
    });

    const debrief: AIDebrief = {
      focusScore: config.focusScore,
      flowStateRating: config.flowRating,
      summary: config.summary,
      primaryDistractionDiagnosis: config.diagnosis,
      actionableTips: config.actionableTips,
      recommendedBreakMinutes: config.durationMins >= 60 ? 15 : 5,
      nextSessionTopicSuggestion: config.nextTopic,
      loggedThoughts: mappedThoughts,
    };

    return {
      id: config.id,
      user_id: userId,
      subject_id: config.subject.id,
      goal_id: goalId,
      topic: config.topic,
      start_time: time.start_time,
      end_time: time.end_time,
      gross_duration_seconds: grossSeconds,
      net_focus_seconds: netSeconds,
      status: "completed",
      session_type: "pomodoro",
      focus_score: config.focusScore,
      pomodoro_cycles_completed: config.durationMins >= 50 ? 2 : 1,
      total_break_seconds: 300,
      session_notes: config.sessionNotes,
      ai_debrief: debrief,
      thoughts: mappedThoughts,
      created_at: time.start_time,
      subject: config.subject,
      goal: goals[0],
    };
  };

  const sessions: StudySession[] = [
    // 1. Today, 09:30 AM
    buildSession({
      id: "demo-sess-1",
      subject: subjCalculus,
      topic: "Integration by Parts & Trig Substitution",
      daysAgo: 0,
      hour: 9,
      minute: 30,
      durationMins: 45,
      thoughts: [
        {
          title: "Checked WhatsApp group message",
          category: "phone_social",
          approxMinutes: 2.5,
          minutesIntoSession: 18,
        },
      ],
      focusScore: 94,
      flowRating: "High Focus",
      summary: "High quality 45m Calculus block with 42.5m net focus (94% efficiency).",
      diagnosis: "Single 2.5m WhatsApp distraction handled without disrupting problem flow.",
      actionableTips: [
        "Keep phone in Do-Not-Disturb mode during calculus problem sets.",
        "Take a 5-minute visual break before your next block.",
      ],
      nextTopic: "Definite Integrals & Partial Fractions",
      sessionNotes: "Solved 5 challenging integral proofs. Clear progression on reduction formulas.",
    }),

    // 2. Today, 02:15 PM
    buildSession({
      id: "demo-sess-2",
      subject: subjPhysics,
      topic: "Faraday's Law of Induction & Lenz's Law",
      daysAgo: 0,
      hour: 14,
      minute: 15,
      durationMins: 35,
      thoughts: [],
      focusScore: 100,
      flowRating: "Deep Flow",
      summary: "Pristine 35m deep flow block on Physics with zero context switching.",
      diagnosis: "Zero stray thoughts captured! Pristine deep work flow.",
      actionableTips: [
        "Preserve this workspace stillness for upcoming electromagnetism sets.",
        "Hydrate before your evening session.",
      ],
      nextTopic: "Self-Inductance & RL Circuits",
      sessionNotes: "Derived induced EMF in a rotating loop. 100% flow throughout.",
    }),

    // 3. Yesterday, 10:00 AM
    buildSession({
      id: "demo-sess-3",
      subject: subjChemistry,
      topic: "Nucleophilic Substitution: SN1 vs SN2 Reaction Kinetics",
      daysAgo: 1,
      hour: 10,
      minute: 0,
      durationMins: 50,
      thoughts: [
        {
          title: "Coffee craving & snack",
          category: "hunger_snack",
          approxMinutes: 3,
          minutesIntoSession: 22,
        },
        {
          title: "Thought about dinner plans",
          category: "random_idea",
          approxMinutes: 2,
          minutesIntoSession: 38,
        },
      ],
      focusScore: 89,
      flowRating: "High Focus",
      summary: "Completed 50m of Organic Chemistry with 45m of pure focus (90% focus ratio).",
      diagnosis: "Mid-session hunger craving caused minor attention leak.",
      actionableTips: [
        "Have a bottle of water and light snack ready before starting chemistry blocks.",
        "Use active flashcards for reagent memorization.",
      ],
      nextTopic: "Elimination Reactions: E1 vs E2",
    }),

    // 4. Yesterday, 04:30 PM
    buildSession({
      id: "demo-sess-4",
      subject: subjCalculus,
      topic: "Eigenvalues, Eigenvectors & Diagonalization",
      daysAgo: 1,
      hour: 16,
      minute: 30,
      durationMins: 60,
      thoughts: [
        {
          title: "YouTube tutorial tab rabbit hole",
          category: "phone_social",
          approxMinutes: 4,
          minutesIntoSession: 28,
        },
      ],
      focusScore: 92,
      flowRating: "High Focus",
      summary: "Solid 60m session on Linear Algebra with 56m net focus.",
      diagnosis: "One 4-minute browser rabbit hole noted and recovered quickly.",
      actionableTips: [
        "Close unrelated browser tabs before starting mathematical proofs.",
        "Take a 10-minute walk after 60-minute blocks.",
      ],
      nextTopic: "Orthogonal Diagonalization & Symmetric Matrices",
    }),

    // 5. Yesterday, 08:30 PM
    buildSession({
      id: "demo-sess-5",
      subject: subjPhysics,
      topic: "Maxwell's Equations & Displacement Current",
      daysAgo: 1,
      hour: 20,
      minute: 30,
      durationMins: 40,
      thoughts: [],
      focusScore: 100,
      flowRating: "Deep Flow",
      summary: "Flawless 40m evening focus session with zero distractions logged.",
      diagnosis: "Immaculate focus during peak circadian evening window.",
      actionableTips: [
        "Evening 8-9 PM continues to be your highest cognitive efficiency window.",
        "Keep evening sessions single-tasked.",
      ],
      nextTopic: "Electromagnetic Energy Density & Poynting Vector",
    }),

    // 6. 2 Days Ago, 11:00 AM
    buildSession({
      id: "demo-sess-6",
      subject: subjChemistry,
      topic: "Electrophilic Aromatic Substitution (Benzene)",
      daysAgo: 2,
      hour: 11,
      minute: 0,
      durationMins: 55,
      thoughts: [
        {
          title: "Water refill & eye rest",
          category: "hunger_snack",
          approxMinutes: 3,
          minutesIntoSession: 30,
        },
      ],
      focusScore: 95,
      flowRating: "Deep Flow",
      summary: "55m completed with 52m of dedicated deep work on aromatic synthesis.",
      diagnosis: "Healthy restorative water break taken without dopamine derailment.",
      actionableTips: [
        "Great job offloading stray thoughts in 1-tap.",
        "Review Friedel-Crafts alkylation limitations.",
      ],
      nextTopic: "Directing Groups: Ortho/Para vs Meta",
    }),

    // 7. 2 Days Ago, 07:00 PM
    buildSession({
      id: "demo-sess-7",
      subject: subjCalculus,
      topic: "Taylor & Maclaurin Series Convergence Tests",
      daysAgo: 2,
      hour: 19,
      minute: 0,
      durationMins: 75,
      thoughts: [
        {
          title: "Instagram DM notification",
          category: "phone_social",
          approxMinutes: 3,
          minutesIntoSession: 25,
        },
        {
          title: "Worried about exam deadline pacing",
          category: "anxiety_stress",
          approxMinutes: 3,
          minutesIntoSession: 52,
        },
      ],
      focusScore: 88,
      flowRating: "High Focus",
      summary: "Intensive 75m problem block with 69m net focus (92% ratio).",
      diagnosis: "Exam anxiety spiked towards the end of the extended 75m sprint.",
      actionableTips: [
        "Cap single sprints at 60 minutes to prevent cognitive fatigue.",
        "Check off completed syllabus units to alleviate deadline stress.",
      ],
      nextTopic: "Power Series Radius of Convergence",
    }),

    // 8. 3 Days Ago, 09:15 AM
    buildSession({
      id: "demo-sess-8",
      subject: subjPhysics,
      topic: "Rotational Dynamics & Angular Momentum Conservation",
      daysAgo: 3,
      hour: 9,
      minute: 15,
      durationMins: 45,
      thoughts: [
        {
          title: "Replied to Discord study group",
          category: "phone_social",
          approxMinutes: 2.5,
          minutesIntoSession: 20,
        },
      ],
      focusScore: 93,
      flowRating: "High Focus",
      summary: "45m study session on rotational inertia with 42.5m net focus.",
      diagnosis: "Quick collaboration check noted and cleanly concluded.",
      actionableTips: [
        "Batch peer discord questions into break intervals.",
        "Practice torque equilibrium problems.",
      ],
      nextTopic: "Gyroscopic Precession & Moment of Inertia Tensors",
    }),

    // 9. 3 Days Ago, 03:00 PM
    buildSession({
      id: "demo-sess-9",
      subject: subjChemistry,
      topic: "Proton NMR Spectroscopy Peak Splitting",
      daysAgo: 3,
      hour: 15,
      minute: 0,
      durationMins: 30,
      thoughts: [],
      focusScore: 100,
      flowRating: "Deep Flow",
      summary: "Pristine 30m active recall session on NMR chemical shifts.",
      diagnosis: "Zero distractions logged! Pristine deep focus.",
      actionableTips: [
        "Short 30m sprints work very well for visual spectra analysis.",
        "Maintain single-tasking.",
      ],
      nextTopic: "Carbon-13 NMR & DEPT Spectroscopy",
    }),

    // 10. 4 Days Ago, 10:30 AM
    buildSession({
      id: "demo-sess-10",
      subject: subjCalculus,
      topic: "Vector Fields, Line Integrals & Green's Theorem",
      daysAgo: 4,
      hour: 10,
      minute: 30,
      durationMins: 60,
      thoughts: [
        {
          title: "Doorbell package delivery",
          category: "urgent_chore",
          approxMinutes: 2.5,
          minutesIntoSession: 21,
        },
        {
          title: "Browsed Reddit study tips",
          category: "phone_social",
          approxMinutes: 3.5,
          minutesIntoSession: 44,
        },
      ],
      focusScore: 87,
      flowRating: "Moderate",
      summary: "60m Vector Calculus session with 54m net focus (90% ratio).",
      diagnosis: "Context switches from household interruptions and web browsing.",
      actionableTips: [
        "Notify housemates when starting an intensive 60m focus block.",
        "Use website blockers during working memory hours.",
      ],
      nextTopic: "Surface Integrals & Stokes' Theorem",
    }),

    // 11. 4 Days Ago, 08:00 PM
    buildSession({
      id: "demo-sess-11",
      subject: subjPhysics,
      topic: "Wave Optics: Interference & Double-Slit Diffraction",
      daysAgo: 4,
      hour: 20,
      minute: 0,
      durationMins: 50,
      thoughts: [
        {
          title: "Snack & tea break",
          category: "hunger_snack",
          approxMinutes: 3,
          minutesIntoSession: 27,
        },
      ],
      focusScore: 94,
      flowRating: "Deep Flow",
      summary: "50m Optics session preserving 47m of true neural focus.",
      diagnosis: "Planned rejuvenation break kept flow state intact.",
      actionableTips: [
        "Great pacing on diffraction grating calculations.",
        "Schedule regular visual breaks.",
      ],
      nextTopic: "Single Slit Diffraction & Resolution Limits",
    }),

    // 12. 5 Days Ago, 02:00 PM
    buildSession({
      id: "demo-sess-12",
      subject: subjChemistry,
      topic: "Carbonyl Chemistry: Aldehydes & Ketones Addition",
      daysAgo: 5,
      hour: 14,
      minute: 0,
      durationMins: 40,
      thoughts: [
        {
          title: "Anxious about semester deadlines",
          category: "anxiety_stress",
          approxMinutes: 2.5,
          minutesIntoSession: 19,
        },
      ],
      focusScore: 91,
      flowRating: "High Focus",
      summary: "40m completed on nucleophilic carbonyl addition with 37.5m net focus.",
      diagnosis: "Transient deadline worry offloaded into mind ping log.",
      actionableTips: [
        "Offloading worries into mind pings preserves working memory capacity.",
        "Review Grignard reaction mechanisms.",
      ],
      nextTopic: "Acetal & Ketal Protection Groups",
    }),

    // 13. 5 Days Ago, 07:30 PM
    buildSession({
      id: "demo-sess-13",
      subject: subjCalculus,
      topic: "Lagrange Multipliers & Constrained Optimization",
      daysAgo: 5,
      hour: 19,
      minute: 30,
      durationMins: 65,
      thoughts: [
        {
          title: "Quick text notification",
          category: "phone_social",
          approxMinutes: 2,
          minutesIntoSession: 35,
        },
      ],
      focusScore: 96,
      flowRating: "Deep Flow",
      summary: "65m deep work on multivariable optimization with 63m pure focus.",
      diagnosis: "Excellent focus stamina and rapid context recovery.",
      actionableTips: [
        "High stamina block. Keep this evening focus routine.",
        "Take a restful screen-free evening recharge.",
      ],
      nextTopic: "Double & Triple Integrals in Cylindrical Coordinates",
    }),

    // 14. 6 Days Ago, 09:45 AM
    buildSession({
      id: "demo-sess-14",
      subject: subjPhysics,
      topic: "Electromagnetic Waves & Poynting Vector",
      daysAgo: 6,
      hour: 9,
      minute: 45,
      durationMins: 50,
      thoughts: [],
      focusScore: 100,
      flowRating: "Deep Flow",
      summary: "Pristine 50m session on EM radiation with zero distractions.",
      diagnosis: "Zero stray thoughts captured! Pristine deep work.",
      actionableTips: [
        "Morning study timing combined with deep work single-tasking.",
        "Keep up the consistent focus.",
      ],
      nextTopic: "Radiation Pressure & Momentum of Photons",
    }),
  ];

  return {
    subjects,
    goals,
    sessions,
  };
}
