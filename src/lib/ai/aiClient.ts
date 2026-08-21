import { AIDebrief, Thought, WeeklyAIReport } from "@/types";

function extractJson<T>(rawText: string): T | null {
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch {}
  try {
    const cleaned = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
    return JSON.parse(cleaned);
  } catch {}
  try {
    const match = rawText.match(/(\{[\s\S]*\})/);
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch {}
  return null;
}

export async function generateAIDebriefWithLLM(params: {
  topic: string;
  subjectName: string;
  grossSeconds: number;
  netFocusSeconds: number;
  focusScore: number;
  thoughts: Thought[];
  sessionNotes: string;
}): Promise<AIDebrief> {
  const { topic, subjectName, grossSeconds, netFocusSeconds, focusScore, thoughts, sessionNotes } = params;
  const grossMinutes = Math.round(grossSeconds / 60);
  const netMinutes = Math.round(netFocusSeconds / 60);
  const focusRatio = grossSeconds > 0 ? (netFocusSeconds / grossSeconds) * 100 : 100;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are StudyFlow's expert Deep Work and Cognitive Performance Coach.
Analyze this study session and return a JSON object evaluating the user's focus, distraction patterns, and flow state.

SESSION DATA:
- Subject: ${subjectName}
- Topic: ${topic}
- Gross Clock Time: ${grossMinutes} minutes
- Net Focused Time: ${netMinutes} minutes
- Focus Ratio: ${focusRatio.toFixed(1)}%
- Focus Score: ${focusScore}/100
- Stray Thoughts ("Mind Pings") Logged during session:
${thoughts.length > 0 ? thoughts.map((t, idx) => `  ${idx + 1}. [${t.category}] "${t.title}" (~${t.approx_duration_minutes} min)`).join("\n") : "  None (Zero distractions logged)"}
- User Post-Session Reflection: ${sessionNotes || "None"}

OUTPUT FORMAT:
You MUST respond with valid JSON only, strictly matching this schema:
{
  "focusScore": ${focusScore},
  "flowStateRating": "Deep Flow" | "High Focus" | "Moderate" | "Distracted" | "Fragmented",
  "summary": "1-2 sentence high-impact summary of this session's cognitive performance.",
  "primaryDistractionDiagnosis": "Specific diagnosis of the main trigger/pattern causing mind pings (e.g. phone dopamine loops, hunger, cognitive fatigue), or a praise of immaculate focus.",
  "actionableTips": [
    "Tip 1: Practical physical or environmental adjustment for next session",
    "Tip 2: Cognitive technique to sustain flow or manage this specific distraction"
  ],
  "recommendedBreakMinutes": 5 to 15,
  "nextSessionTopicSuggestion": "Suggested logical next topic based on ${topic}"
}`;

  // 1. Try OpenRouter
  if (openRouterKey && !openRouterKey.includes("placeholder")) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://studyflow.ai",
          "X-Title": "StudyFlow AI Study Tracker",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "You are a concise, supportive, and scientifically grounded Deep Work & Focus AI Coach. Always return pure JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = extractJson<AIDebrief>(content);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn("OpenRouter API request failed, falling back to Gemini:", err);
    }
  }

  // 2. Fallback to Google Gemini API
  if (geminiKey && !geminiKey.includes("placeholder")) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\nReturn strictly JSON.` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = extractJson<AIDebrief>(content);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn("Gemini API request failed, falling back to heuristic engine:", err);
    }
  }

  // 3. Fallback to Deterministic Heuristic Engine
  const flowRating = focusRatio >= 90 ? "Deep Flow" : focusRatio >= 75 ? "High Focus" : focusRatio >= 60 ? "Moderate" : "Distracted";
  
  let primaryDiagnosis = "Zero stray thoughts captured! Pristine deep work flow.";
  if (thoughts.length > 0) {
    const topCat = thoughts[0].category.replace("_", " ");
    primaryDiagnosis = `Captured ${thoughts.length} mind ping${thoughts.length > 1 ? "s" : ""} primarily triggered by ${topCat}.`;
  }

  return {
    focusScore,
    flowStateRating: flowRating,
    summary: `Completed ${grossMinutes}m on ${topic} with ${netMinutes}m of pure focus (${focusRatio.toFixed(0)}% focus ratio).`,
    primaryDistractionDiagnosis: primaryDiagnosis,
    actionableTips: [
      thoughts.length > 0
        ? "Before starting your next block, write down any top-of-mind tasks on paper so your working memory stays clear."
        : "Keep your workspace clutter-free to preserve this deep flow rhythm.",
      grossMinutes > 60
        ? "Take a full 10-15 minute screen-free recharge walk before your next sprint."
        : "Maintain single-tasking discipline for the remaining syllabus units."
    ],
    recommendedBreakMinutes: grossMinutes > 60 ? 15 : 5,
    nextSessionTopicSuggestion: `Advanced problems & review of ${topic}`,
  };
}

export async function generateWeeklyReportWithLLM(params: {
  sessionsCount: number;
  totalGrossHours: number;
  totalNetHours: number;
  overallFocusRatio: number;
  topDistractions: { category: string; count: number; totalMinutes: number }[];
  subjectAllocation: { name: string; hours: number }[];
}): Promise<WeeklyAIReport> {
  const {
    sessionsCount,
    totalGrossHours,
    totalNetHours,
    overallFocusRatio,
    topDistractions,
    subjectAllocation,
  } = params;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const focusPct = Math.round(overallFocusRatio * 100);

  const prompt = `You are StudyFlow's Executive Deep Work & Cognitive Performance Analyst.
Generate a comprehensive weekly study review based on the following real telemetry data:

WEEKLY TELEMETRY:
- Completed Study Sessions: ${sessionsCount}
- Gross Clock Time: ${totalGrossHours.toFixed(1)} hours
- Net Focused Deep Work: ${totalNetHours.toFixed(1)} hours
- Overall Focus Ratio: ${focusPct}%
- Top Distractions / Attention Leaks:
${topDistractions.length > 0 ? topDistractions.map((d, i) => `  ${i + 1}. ${d.category}: ${d.count} occurrences (${d.totalMinutes} mins lost)`).join("\n") : "  None recorded"}
- Subject Time Allocations:
${subjectAllocation.length > 0 ? subjectAllocation.map((s, i) => `  ${i + 1}. ${s.name}: ${s.hours} hours net focus`).join("\n") : "  General Study"}

OUTPUT FORMAT:
Respond with valid JSON only matching this schema:
{
  "weekStarting": "${new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}",
  "totalGrossHours": ${totalGrossHours},
  "totalNetHours": ${totalNetHours},
  "overallFocusRatio": ${overallFocusRatio},
  "peakFocusDay": "e.g. Wednesday & Saturday",
  "peakFocusHour": "e.g. 8:00 PM - 10:30 PM",
  "topDistractionCategory": "${topDistractions[0]?.category || 'Phone & Notifications'}",
  "flowStateAchievementPercentage": ${focusPct},
  "executiveSummary": "2-3 sentences summarizing weekly deep work volume, cognitive stamina, and pacing efficacy.",
  "strengths": [
    "Specific observed cognitive strength 1",
    "Specific observed cognitive strength 2",
    "Specific observed cognitive strength 3"
  ],
  "growthAreas": [
    "Specific attention leak / growth area 1",
    "Specific attention leak / growth area 2"
  ],
  "strategicRecommendations": [
    "Actionable protocol 1 for syllabus pacing and deep focus",
    "Actionable protocol 2 for distraction mitigation",
    "Actionable protocol 3 for circadian study timing"
  ]
}`;

  // 1. Try OpenRouter
  if (openRouterKey && !openRouterKey.includes("placeholder")) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://studyflow.ai",
          "X-Title": "StudyFlow AI Weekly Review",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "You are an executive Deep Work & Cognitive Performance Coach. Always return pure JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = extractJson<WeeklyAIReport>(content);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn("OpenRouter Weekly Report error, falling back:", err);
    }
  }

  // 2. Fallback to Gemini
  if (geminiKey && !geminiKey.includes("placeholder")) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\nReturn strictly JSON.` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = extractJson<WeeklyAIReport>(content);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn("Gemini Weekly Report error, falling back:", err);
    }
  }

  // 3. Dynamic Heuristic Synthesizer
  const topCatName = topDistractions[0]?.category || "Phone & Notifications";
  const primarySubj = subjectAllocation[0]?.name || "Core Subjects";

  return {
    weekStarting: new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    totalGrossHours,
    totalNetHours,
    overallFocusRatio,
    peakFocusDay: sessionsCount >= 3 ? "Mid-week & Weekend" : "Active Study Days",
    peakFocusHour: "7:00 PM - 9:30 PM",
    topDistractionCategory: topCatName,
    flowStateAchievementPercentage: focusPct,
    executiveSummary: `You logged ${totalGrossHours.toFixed(1)} gross study hours across ${sessionsCount} session${sessionsCount === 1 ? '' : 's'}, preserving ${totalNetHours.toFixed(1)} hours of true focused attention (${focusPct}% Focus Ratio).`,
    strengths: [
      `High consistency with ${sessionsCount} dedicated study blocks completed.`,
      `Resilience in maintaining deep flow state across study sessions.`,
      `Targeted devotion to ${primarySubj}.`
    ],
    growthAreas: [
      `Attention interruptions primarily triggered by ${topCatName}.`,
      `Need for structured 5-10 minute buffer intervals between multi-hour study sprints.`
    ],
    strategicRecommendations: [
      `Batch ${topCatName.toLowerCase()} checks strictly into designated 15-minute inter-session breaks.`,
      "Cap intensive problem-solving sessions at 75 minutes before taking an active physical break.",
      `Prioritize difficult ${primarySubj} topics during your peak cognitive energy windows.`
    ]
  };
}
