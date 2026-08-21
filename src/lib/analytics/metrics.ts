import { StudySession, AnalyticsSummary, AnalyticsTimeframe, ThoughtCategory, Thought } from "@/types";

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

export function computeAnalyticsSummary(
  sessions: StudySession[],
  timeframe: AnalyticsTimeframe = "7d"
): AnalyticsSummary {
  const allCompleted = sessions.filter(
    (s) => s.status === "completed" && s.gross_duration_seconds > 0
  );

  const now = new Date();
  let daysWindow = 7;
  if (timeframe === "14d") daysWindow = 14;
  else if (timeframe === "30d") daysWindow = 30;
  else if (timeframe === "all") daysWindow = 3650; // effectively all

  const cutoffTime = timeframe === "all" ? 0 : now.getTime() - daysWindow * 24 * 60 * 60 * 1000;
  const priorCutoffTime = timeframe === "all" ? 0 : now.getTime() - (daysWindow * 2) * 24 * 60 * 60 * 1000;

  const completed = allCompleted.filter(
    (s) => new Date(s.start_time).getTime() >= cutoffTime
  );

  const priorCompleted = allCompleted.filter((s) => {
    const t = new Date(s.start_time).getTime();
    return t >= priorCutoffTime && t < cutoffTime;
  });

  let totalGrossSeconds = 0;
  let totalNetSeconds = 0;
  let totalThoughtsCount = 0;
  let totalThoughtMinutes = 0;
  let totalFocusScoreSum = 0;
  let maxDeepWorkMinutes = 0;

  const subjectMap = new Map<string, { name: string; color: string; gross: number; net: number }>();
  const categoryMap = new Map<ThoughtCategory, { count: number; minutes: number }>();
  const thoughtTitleMap = new Map<string, { count: number; totalMinutes: number; category: ThoughtCategory }>();
  const dateMap = new Map<string, { gross: number; net: number; scoreSum: number; scoreCount: number }>();
  const hourMap = new Map<string, { count: number; totalFocusRatio: number }>();

  // Flow State rating buckets
  const flowBuckets = {
    deepFlow: 0,
    highFocus: 0,
    moderate: 0,
    distracted: 0,
  };

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

  // Initialize dates map for daily trend graph
  const trendDaysCount = timeframe === "all" ? Math.min(30, Math.max(7, daysWindow)) : daysWindow;
  for (let i = trendDaysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    dateMap.set(dateKey, { gross: 0, net: 0, scoreSum: 0, scoreCount: 0 });
  }

  completed.forEach((session) => {
    totalGrossSeconds += session.gross_duration_seconds;
    totalNetSeconds += session.net_focus_seconds;

    const sessionMinutes = Math.round(session.gross_duration_seconds / 60);
    const recordedThoughtMins = (session.thoughts || []).reduce(
      (acc, t) => acc + (t.approx_duration_minutes || 0),
      0
    );
    // Use true net focus recorded in session, falling back to subtraction
    const netMins = session.net_focus_seconds > 0
      ? Math.round(session.net_focus_seconds / 60)
      : Math.max(0, sessionMinutes - recordedThoughtMins);
    const lostMins = Math.max(0, sessionMinutes - netMins);
    const sessionScore = session.focus_score || calculateFocusScore(session.gross_duration_seconds, session.net_focus_seconds, session.thoughts);
    totalFocusScoreSum += sessionScore;

    // Flow State bucket distribution
    const ratio = session.gross_duration_seconds > 0
      ? session.net_focus_seconds / session.gross_duration_seconds
      : 1;

    if (ratio >= 0.9) flowBuckets.deepFlow += 1;
    else if (ratio >= 0.75) flowBuckets.highFocus += 1;
    else if (ratio >= 0.6) flowBuckets.moderate += 1;
    else flowBuckets.distracted += 1;

    // Calculate longest continuous uninterrupted focus interval within this session
    if (!session.thoughts || session.thoughts.length === 0) {
      if (sessionMinutes > maxDeepWorkMinutes) {
        maxDeepWorkMinutes = sessionMinutes;
      }
    } else {
      const sortedPings = [...session.thoughts].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const sessionStartTime = new Date(session.start_time).getTime();
      const sessionEndTime = session.end_time
        ? new Date(session.end_time).getTime()
        : sessionStartTime + session.gross_duration_seconds * 1000;

      let prevWindowEnd = sessionStartTime;
      sortedPings.forEach((p) => {
        const pingStart = new Date(p.timestamp).getTime();
        const gapMins = Math.max(0, Math.floor((pingStart - prevWindowEnd) / (1000 * 60)));
        if (gapMins > maxDeepWorkMinutes) {
          maxDeepWorkMinutes = gapMins;
        }
        prevWindowEnd = pingStart + ((p.approx_duration_minutes || 2) * 60 * 1000);
      });

      const finalGapMins = Math.max(0, Math.floor((sessionEndTime - prevWindowEnd) / (1000 * 60)));
      if (finalGapMins > maxDeepWorkMinutes) {
        maxDeepWorkMinutes = finalGapMins;
      }
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
    if (session.thoughts && session.thoughts.length > 0) {
      totalThoughtsCount += session.thoughts.length;
      session.thoughts.forEach((t) => {
        const cat = t.category || "other";
        const entry = categoryMap.get(cat) || { count: 0, minutes: 0 };
        entry.count += 1;
        const pingMins = t.approx_duration_minutes || 0;
        entry.minutes += pingMins;
        totalThoughtMinutes += pingMins;
        categoryMap.set(cat, entry);

        // Top thought titles
        const cleanTitle = (t.title || "Quick Ping").trim();
        if (cleanTitle) {
          const tEntry = thoughtTitleMap.get(cleanTitle) || {
            count: 0,
            totalMinutes: 0,
            category: cat,
          };
          tEntry.count += 1;
          tEntry.totalMinutes += pingMins;
          thoughtTitleMap.set(cleanTitle, tEntry);
        }
      });
    } else if (lostMins > 0) {
      // If individual thoughts are unpopulated from DB, capture the lost distraction time in 'other'
      const cat = "other";
      const entry = categoryMap.get(cat) || { count: 0, minutes: 0 };
      entry.minutes += lostMins;
      totalThoughtMinutes += lostMins;
      categoryMap.set(cat, entry);
    }

    // Daily trends
    const sessionDate = new Date(session.start_time).toISOString().split("T")[0];
    if (dateMap.has(sessionDate)) {
      const day = dateMap.get(sessionDate)!;
      day.gross += sessionMinutes;
      day.net += netMins;
      day.scoreSum += sessionScore;
      day.scoreCount += 1;
    } else {
      dateMap.set(sessionDate, {
        gross: sessionMinutes,
        net: netMins,
        scoreSum: sessionScore,
        scoreCount: 1,
      });
    }

    // Time of day heatmap
    const startDate = new Date(session.start_time);
    const hour = startDate.getHours();
    const dayOfWeek = startDate.getDay();
    const key = `${dayOfWeek}-${hour}`;

    const hourEntry = hourMap.get(key) || { count: 0, totalFocusRatio: 0 };
    hourEntry.count += 1;
    hourEntry.totalFocusRatio += ratio;
    hourMap.set(key, hourEntry);
  });

  const totalGrossMinutes = Math.round(totalGrossSeconds / 60);
  const totalNetMinutes = Math.round(totalNetSeconds / 60);
  const overallFocusRatio = totalGrossSeconds > 0 ? totalNetSeconds / totalGrossSeconds : 1;
  const avgFocusScore = completed.length > 0 ? Math.round(totalFocusScoreSum / completed.length) : 100;
  const totalNetHours = totalNetMinutes / 60;
  const pingsPerHour = totalNetHours > 0 ? Number((totalThoughtsCount / totalNetHours).toFixed(1)) : 0;
  const avgPingDurationMinutes = totalThoughtsCount > 0 ? Number((totalThoughtMinutes / totalThoughtsCount).toFixed(1)) : 0;

  // Flow state distribution array
  const totalFlowRated = completed.length || 1;
  const flowStateDistribution = [
    {
      rating: "Deep Flow (≥90%)",
      count: flowBuckets.deepFlow,
      percentage: Math.round((flowBuckets.deepFlow / totalFlowRated) * 100),
      color: "#10b981", // Emerald
    },
    {
      rating: "High Focus (75-89%)",
      count: flowBuckets.highFocus,
      percentage: Math.round((flowBuckets.highFocus / totalFlowRated) * 100),
      color: "#3b82f6", // Blue
    },
    {
      rating: "Moderate (60-74%)",
      count: flowBuckets.moderate,
      percentage: Math.round((flowBuckets.moderate / totalFlowRated) * 100),
      color: "#f59e0b", // Amber
    },
    {
      rating: "Distracted (<60%)",
      count: flowBuckets.distracted,
      percentage: Math.round((flowBuckets.distracted / totalFlowRated) * 100),
      color: "#f43f5e", // Rose
    },
  ];

  // Top thought titles list
  const topThoughtTitles = Array.from(thoughtTitleMap.entries())
    .map(([title, data]) => ({
      title,
      count: data.count,
      totalMinutes: data.totalMinutes,
      category: data.category,
    }))
    .sort((a, b) => b.count - a.count || b.totalMinutes - a.totalMinutes)
    .slice(0, 8);

  // Consecutive Days Streak Calculation (across all historical completed sessions)
  const allActiveDateSet = new Set<string>();
  allCompleted.forEach((s) => {
    const dStr = new Date(s.start_time).toISOString().split("T")[0];
    allActiveDateSet.add(dStr);
  });

  let currentStreakDays = 0;
  const todayDateStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = yesterday.toISOString().split("T")[0];

  const checkStartDate = allActiveDateSet.has(todayDateStr)
    ? new Date()
    : allActiveDateSet.has(yesterdayDateStr)
    ? yesterday
    : null;

  if (checkStartDate) {
    let checkDate = new Date(checkStartDate);
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (allActiveDateSet.has(dateStr)) {
        currentStreakDays += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

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
    label: cat.replace("_", " ").toUpperCase(),
  }));

  const dailyTrends = Array.from(dateMap.entries()).map(([dateStr, data]) => {
    const d = new Date(dateStr);
    const displayDate = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const ratio = data.gross > 0 ? data.net / data.gross : 0;
    const avgScore = data.scoreCount > 0 ? Math.round(data.scoreSum / data.scoreCount) : (ratio > 0 ? Math.round(ratio * 100) : 0);
    return {
      date: dateStr,
      displayDate,
      grossMinutes: data.gross,
      netMinutes: data.net,
      focusRatio: Number(ratio.toFixed(2)),
      focusScore: avgScore,
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

  // Prior Period Comparison (e.g. comparing last 7 days vs previous 7 days)
  let comparison: AnalyticsSummary["comparison"] = undefined;
  if (timeframe !== "all" && priorCompleted.length > 0) {
    const priorGross = priorCompleted.reduce((acc, s) => acc + s.gross_duration_seconds, 0);
    const priorNet = priorCompleted.reduce((acc, s) => acc + s.net_focus_seconds, 0);
    const priorNetMins = Math.round(priorNet / 60);
    const priorRatio = priorGross > 0 ? priorNet / priorGross : 1;

    const netMinutesGrowthPct = priorNetMins > 0
      ? Math.round(((totalNetMinutes - priorNetMins) / priorNetMins) * 100)
      : 100;
    const focusRatioDeltaPct = Number(((overallFocusRatio - priorRatio) * 100).toFixed(1));

    comparison = {
      priorNetMinutes: priorNetMins,
      netMinutesGrowthPct,
      priorFocusRatio: Number(priorRatio.toFixed(3)),
      focusRatioDeltaPct,
    };
  }

  return {
    timeframe,
    totalGrossMinutes,
    totalNetMinutes,
    overallFocusRatio: Number(overallFocusRatio.toFixed(3)),
    completedSessionsCount: completed.length,
    totalThoughtsLogged: totalThoughtsCount,
    avgSessionMinutes: completed.length > 0 ? Math.round(totalGrossMinutes / completed.length) : 0,
    longestDeepWorkStreakMinutes:
      maxDeepWorkMinutes > 0
        ? maxDeepWorkMinutes
        : completed.length > 0
        ? Math.round(totalNetMinutes / completed.length)
        : 0,
    currentStreakDays,
    pingsPerHour,
    avgPingDurationMinutes,
    avgFocusScore,
    flowStateDistribution,
    topThoughtTitles,
    subjectWiseMinutes,
    categoryWiseDistractions,
    dailyTrends,
    hourlyHeatmap,
    comparison,
  };
}
