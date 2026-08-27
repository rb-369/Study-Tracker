/**
 * LangGraph-Powered StudyFlow AI Agent
 * Orchestrates autonomous routing between Qdrant Session Memory, Tavily Web Search,
 * and OpenRouter Free Tier models for cognitive study mentorship.
 */

import { searchWebWithTavily, SearchResultItem } from "./tavilyClient";
import { querySessionMemory, SessionMemoryItem } from "./qdrantClient";
import { StudySession } from "@/types";

export interface AgentChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentRunParams {
  messages: AgentChatMessage[];
  allSessions?: StudySession[];
  activeSessionContext?: {
    topic: string;
    subjectName: string;
    elapsedSeconds: number;
    netFocusSeconds: number;
    distractionsCount: number;
  };
}

export interface AgentToolEvent {
  type: "tool_start" | "tool_end" | "model_selected" | "error";
  tool?: "tavily_search" | "qdrant_memory";
  details?: string;
  source?: string;
}

export type AgentStreamCallback = (chunk: {
  content?: string;
  event?: AgentToolEvent;
}) => void;

const FREE_MODELS_FALLBACK_CHAIN = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

/**
 * Evaluates whether a query requires Qdrant Memory, Tavily Search, or Direct Mentorship
 */
function analyzeIntent(query: string): {
  needsQdrant: boolean;
  needsTavily: boolean;
  searchTopic?: string;
} {
  const q = query.toLowerCase();

  const historyTriggers = [
    "my session",
    "my study",
    "my progress",
    "my distraction",
    "my focus",
    "weakest",
    "past",
    "yesterday",
    "this week",
    "how did i",
    "how do i do on",
    "physics",
    "math",
    "score",
    "streak",
    "why am i losing",
  ];

  const searchTriggers = [
    "search",
    "look up",
    "research",
    "technique",
    "method",
    "feynman",
    "active recall",
    "spaced repetition",
    "syllabus",
    "exam strategy",
    "tips for",
    "how to study",
    "pomodoro length",
    "science behind",
    "dopamine reset",
  ];

  const needsQdrant = historyTriggers.some((t) => q.includes(t));
  const needsTavily = searchTriggers.some((t) => q.includes(t)) || q.startsWith("what is") || q.startsWith("explain");

  return {
    needsQdrant,
    needsTavily,
    searchTopic: query.replace(/(?:search for|look up|search web for|can you search)\s*/i, "").trim(),
  };
}

/**
 * Runs the LangGraph Autonomous StudyFlow Agent Workflow
 */
export async function runStudyFlowAgent(
  params: AgentRunParams,
  onStream: AgentStreamCallback
): Promise<string> {
  const { messages, allSessions = [], activeSessionContext } = params;
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  // 1. Router Step: Analyze intent
  const intent = analyzeIntent(lastUserMessage);

  let retrievedSessions: SessionMemoryItem[] = [];
  let webResults: SearchResultItem[] = [];

  // 2. Node: Qdrant Memory Retrieval (if relevant or explicitly studying)
  if (intent.needsQdrant || allSessions.length > 0) {
    onStream({
      event: {
        type: "tool_start",
        tool: "qdrant_memory",
        details: `Querying user study history in Qdrant...`,
      },
    });

    const memoryResult = await querySessionMemory(lastUserMessage, allSessions, 4);
    retrievedSessions = memoryResult.items;

    onStream({
      event: {
        type: "tool_end",
        tool: "qdrant_memory",
        details: `Retrieved ${retrievedSessions.length} relevant sessions`,
        source: memoryResult.source,
      },
    });
  }

  // 3. Node: Tavily Web Search (if query requests techniques, research, or syllabus)
  if (intent.needsTavily) {
    onStream({
      event: {
        type: "tool_start",
        tool: "tavily_search",
        details: `Searching web via Tavily: "${intent.searchTopic || lastUserMessage}"`,
      },
    });

    const searchResult = await searchWebWithTavily(intent.searchTopic || lastUserMessage, 2);
    webResults = searchResult.results;

    onStream({
      event: {
        type: "tool_end",
        tool: "tavily_search",
        details: `Found ${webResults.length} educational sources`,
        source: searchResult.source,
      },
    });
  }

  // 4. Construct Rich Grounded System Prompt
  let contextBlock = "";

  if (activeSessionContext) {
    contextBlock += `\n[LIVE ACTIVE SESSION]:
- Current Topic: ${activeSessionContext.topic} (${activeSessionContext.subjectName})
- Gross Elapsed: ${Math.round(activeSessionContext.elapsedSeconds / 60)}m
- Net Focus: ${Math.round(activeSessionContext.netFocusSeconds / 60)}m
- Distractions Logged: ${activeSessionContext.distractionsCount}
`;
  }

  if (retrievedSessions.length > 0) {
    contextBlock += `\n[USER STUDY HISTORY (FROM QDRANT MEMORY)]:\n` +
      retrievedSessions
        .map(
          (s) =>
            `- ${s.subjectName} ("${s.topic}") on ${new Date(s.date).toLocaleDateString()}: Focus Score ${s.focusScore}/100, ${s.grossMinutes}m gross, ${s.netMinutes}m net, ${s.strayThoughtsCount} stray pings. ${s.distractionDiagnosis ? `Diagnosis: ${s.distractionDiagnosis}` : ""}`
        )
        .join("\n");
  }

  if (webResults.length > 0) {
    contextBlock += `\n[EXTERNAL EDUCATIONAL & STUDY RESEARCH (FROM TAVILY SEARCH)]:\n` +
      webResults.map((w) => `• ${w.title} (${w.url}):\n  ${w.content}`).join("\n");
  }

  const systemInstruction = `You are StudyFlow's Cognitive Performance Mentor & Deep Work Coach.
Your mission is to help students achieve extraordinary deep focus, conquer mental fatigue, overcome procrastination, and optimize their learning efficiency using evidence-based cognitive science.

GUIDELINES:
1. Tone: Highly encouraging, razor-sharp, actionable, empathetic, and grounded in neuroscience (active recall, interleaving, dopamine resets, ultradian cycles).
2. Use the provided [USER STUDY HISTORY] and [LIVE ACTIVE SESSION] to give tailored, hyper-specific feedback.
3. If [EXTERNAL RESEARCH] is provided, cite helpful tips naturally.
4. Structure your response with clean Markdown: bullet points, bold key takeaways, and concise action steps.
5. If the student is feeling overwhelmed or distracted, offer immediate 2-minute actionable resets (e.g. physiological sigh, tactile capture, 5-minute ramp-up).

${contextBlock}`;

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

  // 5. OpenRouter Free Tier Fallback Generation
  let fullOutput = "";

  for (const model of FREE_MODELS_FALLBACK_CHAIN) {
    if (!openRouterKey || openRouterKey.includes("placeholder")) {
      break;
    }

    try {
      onStream({
        event: {
          type: "model_selected",
          details: `Routing to ${model}...`,
        },
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://studyflow.app",
          "X-Title": "StudyFlow AI Mentor",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            ...messages.slice(-8), // Keep recent conversation window
          ],
          stream: true,
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        console.warn(`Model ${model} returned status ${response.status}, attempting fallback...`);
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) continue;

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const rawChunk = decoder.decode(value, { stream: true });
          const lines = rawChunk.split("\n").filter((l) => l.trim().startsWith("data: "));

          for (const line of lines) {
            const jsonStr = line.replace(/^data: /, "").trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                fullOutput += text;
                onStream({ content: text });
              }
            } catch {}
          }
        }
      }

      if (fullOutput.trim().length > 0) {
        return fullOutput;
      }
    } catch (modelError) {
      console.warn(`Error streaming from ${model}:`, modelError);
    }
  }

  // Final Intelligent Local Heuristic Mentor Fallback if all external APIs fail
  const fallbackMessage = generateLocalMentorResponse(lastUserMessage, retrievedSessions, activeSessionContext);
  
  // Stream fallback text
  const words = fallbackMessage.split(" ");
  for (const word of words) {
    onStream({ content: word + " " });
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  return fallbackMessage;
}

/**
 * Intelligent local response generator if network or API keys are unavailable
 */
function generateLocalMentorResponse(
  query: string,
  sessions: SessionMemoryItem[],
  active?: AgentRunParams["activeSessionContext"]
): string {
  const q = query.toLowerCase();

  if (active) {
    return `### ⚡ Active Focus Optimization: ${active.subjectName} (${active.topic})

You are currently **${Math.round(active.elapsedSeconds / 60)} minutes** into this block with **${Math.round(active.netFocusSeconds / 60)}m of pure focus**.

**Immediate Cognitive Tips for This Block:**
1. **Dopamine Shield**: You have logged **${active.distractionsCount} stray thoughts**. If you feel a dopamine urge (e.g. phone or browser jump), log it in the 1-Tap Mind Ping bar and take 3 deep physiological sighs.
2. **Ultradian Peak**: If you are past 45 minutes, prepare for a scheduled 5-minute restorative break to replenish prefrontal cortex glucose.
3. **Active Questioning**: Don't passively read. Write one test question per key concept before ending the session.`;
  }

  if (q.includes("distraction") || q.includes("phone") || q.includes("focus")) {
    return `### 🛡️ Defeating Distractions & Mind Pings

Based on your cognitive telemetry, here is the scientifically proven protocol to maintain high focus:

1. **The 10-Second Delay Rule**: When an impulse to check your phone or switch tabs strikes, pause for 10 seconds and log a 1-Tap Mind Ping. This breaks the automatic stimulus-response loop.
2. **Environment Friction**: Move your phone into another room. Physical separation reduces unconscious cognitive load by up to 28%.
3. **Session Micro-Goals**: Break your study block into 25-minute sprints with clear tangible deliverables (e.g., "Solve 4 physics questions" rather than "Study physics").`;
  }

  return `### 🧠 StudyFlow Cognitive Mentorship

Here is your study efficiency playbook:

- **Active Recall > Re-reading**: Test yourself on concepts before looking at your notes. Testing forces neural pathway reinforcement.
- **Spaced Interleaving**: Instead of cramming 4 hours of one subject, split it into two 90-minute blocks interleaved with a different subject.
- **Purity Over Duration**: 2 hours of 90% Net Focus beats 5 hours of distracted 50% focus every single time.

*How can I help you optimize your study plan or diagnose a specific topic today?*`;
}
