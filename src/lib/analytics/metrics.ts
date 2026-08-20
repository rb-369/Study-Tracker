import { StudySession, AnalyticsSummary, ThoughtCategory, Thought } from "@/types";

export function calculateFocusScore(
  grossSeconds: number,
  netSeconds: number,
  thoughts: Thought[] = []
): number {
  if (grossSeconds <= 60) return 100;

  const focusRatio = netSeconds / grossSeconds;
  let baseScore = focusRatio * 100;

  // Thought count penalty (minor friction penalty)
  const thoughtsPenalty = thoughts.length * 2.5;

  // Duration ratio bonus
  let bonus = 0;
  if (grossSeconds >= 1800 && focusRatio > 0.85) {
    bonus += 5; // Good sustained focus
  }
  if (grossSeconds >= 3600 && focusRatio > 0.9) {
    bonus += 5; // Exceptional deep work session
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(baseScore - thoughtsPenalty + bonus)));
  return finalScore;
}

export function computeAnalyticsSummary(sessions: StudySession[]): AnalyticsSummary {
  const completed = sessions.filter((s) => s.status === "completed" && s.gross_duration_seconds > 0);

  let totalGrossSeconds = 0;
  let totalNetSeconds = 0;
  let totalThoughtsCount = 0;
  let maxDeepWorkMinutes = 0;

  const subjectMap = new Map<string, { name: string; color: string; gross: number; net: number }>();
  const categoryMap = new Map<ThoughtCategory, { count: number; minutes: number }>();
  const dateMap = new Map<string, { gross: number; net: number }>();
  const hourMap = new Map<string, { count: number; totalFocusRatio: number }>();

  // Initialize categories
  const categories: ThoughtCategory[] = [
    "phone_social",
    "hunger_snack",
    "random_idea",
    "anxiety_stress",
    "urgent_chore",
    "other",
  ];
  categories.forEach((cat) => categoryMap.set(cat, { count: 0, minutes: 0 }));

  // Populate last 7 days keys
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    dateMap.set(dateKey, { gross: 0, net: 0 });
  }

  completed.forEach((session) => {
    totalGrossSeconds += session.gross_duration_seconds;
    totalNetSeconds += session.net_focus_seconds;

    const sessionMinutes = Math.round(session.gross_duration_seconds / 60);
    const thoughtMinutesSum = (session.thoughts || []).reduce(
      (acc, t) => acc + (t.approx_duration_minutes || 0),
      0
    );
    const netMins = Math.max(0, sessionMinutes - thoughtMinutesSum);

    if (session.thoughts && session.thoughts.length === 0 && sessionMinutes > maxDeepWorkMinutes) {
      maxDeepWorkMinutes = sessionMinutes;
    }

    // Subject breakdown
    const sId = session.subject_id;
    const sName = session.subject?.name || "General";
    const sColor = session.subject?.color || "#10b981";

    if (!subjectMap.has(sId)) {
      subjectMap.set(sId, { name: sName, color: sColor, gross: 0, net: 0 });
    }
    const subj = subjectMap.get(sId)!;
    subj.gross += sessionMinutes;
    subj.net += netMins;

    // Thoughts aggregation
    if (session.thoughts) {
      totalThoughtsCount += session.thoughts.length;
      session.thoughts.forEach((t) => {
        const cat = t.category || "other";
        const entry = categoryMap.get(cat) || { count: 0, minutes: 0 };
        entry.count += 1;
        entry.minutes += t.approx_duration_minutes || 0;
        categoryMap.set(cat, entry);
      });
    }

    // Daily trends
    const sessionDate = new Date(session.start_time).toISOString().split("T")[0];
    if (dateMap.has(sessionDate)) {
      const day = dateMap.get(sessionDate)!;
      day.gross += sessionMinutes;
      day.net += netMins;
    } else {
      dateMap.set(sessionDate, { gross: sessionMinutes, net: netMins });
    }

    // Time of day heatmap
    const startDate = new Date(session.start_time);
    const hour = startDate.getHours();
    const dayOfWeek = startDate.getDay();
    const key = `${dayOfWeek}-${hour}`;
    const ratio = session.gross_duration_seconds > 0 
      ? session.net_focus_seconds / session.gross_duration_seconds 
      : 1;

    const hourEntry = hourMap.get(key) || { count: 0, totalFocusRatio: 0 };
    hourEntry.count += 1;
    hourEntry.totalFocusRatio += ratio;
    hourMap.set(key, hourEntry);
  });

  const totalGrossMinutes = Math.round(totalGrossSeconds / 60);
  const totalNetMinutes = Math.round(totalNetSeconds / 60);
  const overallFocusRatio = totalGrossSeconds > 0 ? totalNetSeconds / totalGrossSeconds : 1;

  // Streak calculation
  const uniqueDatesWithStudy = Array.from(dateMap.entries())
    .filter(([_, data]) => data.gross > 0)
    .map(([date]) => date);
  const currentStreakDays = uniqueDatesWithStudy.length;

  const subjectWiseMinutes = Array.from(subjectMap.entries()).map(([id, data]) => ({
    subjectId: id,
    subjectName: data.name,
    color: data.color,
    grossMinutes: data.gross,
    netMinutes: data.net,
  }));

  const categoryWiseDistractions = Array.from(categoryMap.entries()).map(([cat, data]) => ({
    category: cat,
    count: data.count,
    totalMinutes: Math.round(data.minutes),
    label: cat.replace('_', ' ').toUpperCase(),
  }));

  const dailyTrends = Array.from(dateMap.entries()).map(([dateStr, data]) => {
    const d = new Date(dateStr);
    const displayDate = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const ratio = data.gross > 0 ? data.net / data.gross : 0;
    return {
      date: dateStr,
      displayDate,
      grossMinutes: data.gross,
      netMinutes: data.net,
      focusRatio: Number(ratio.toFixed(2)),
    };
  });

  // Hourly heatmap data for 7 days x 24 hours
  const hourlyHeatmap: { hour: number; dayOfWeek: number; count: number; avgFocusRatio: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let h = 0; h < 24; h++) {
      const key = `${day}-${h}`;
      const entry = hourMap.get(key);
      if (entry) {
        hourlyHeatmap.push({
          hour: h,
          dayOfWeek: day,
          count: entry.count,
          avgFocusRatio: entry.count > 0 ? entry.totalFocusRatio / entry.count : 1,
        });
      }
    }
  }

  return {
    totalGrossMinutes,
    totalNetMinutes,
    overallFocusRatio: Number(overallFocusRatio.toFixed(3)),
    completedSessionsCount: completed.length,
    totalThoughtsLogged: totalThoughtsCount,
    avgSessionMinutes: completed.length > 0 ? Math.round(totalGrossMinutes / completed.length) : 0,
    longestDeepWorkStreakMinutes: maxDeepWorkMinutes > 0 ? maxDeepWorkMinutes : 45,
    currentStreakDays,
    subjectWiseMinutes,
    categoryWiseDistractions,
    dailyTrends,
    hourlyHeatmap,
  };
}
