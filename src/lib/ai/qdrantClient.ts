/**
 * Qdrant Cloud Client & Vector Memory for StudyFlow AI Agent
 * Indexes and retrieves past study sessions, AI debriefs, and distraction triggers.
 * Includes graceful fallback if Qdrant Cloud credentials are not configured.
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { StudySession } from "@/types";

export const QDRANT_COLLECTION_NAME = "studyflow_sessions";

export interface SessionMemoryItem {
  id: string;
  topic: string;
  subjectName: string;
  grossMinutes: number;
  netMinutes: number;
  focusScore: number;
  distractionDiagnosis?: string;
  strayThoughtsCount: number;
  date: string;
  relevanceScore?: number;
}

/**
 * Returns a QdrantClient instance if credentials exist
 */
export function getQdrantClient(): QdrantClient | null {
  const url = process.env.QDRANT_URL?.trim();
  const apiKey = process.env.QDRANT_API_KEY?.trim();

  if (!url || url.includes("placeholder")) {
    return null;
  }

  try {
    return new QdrantClient({
      url,
      apiKey: apiKey || undefined,
    });
  } catch (err) {
    console.warn("Failed to initialize QdrantClient:", err);
    return null;
  }
}

/**
 * Generates a simple dense vector representation for text search
 */
function createSimpleEmbedding(text: string, dimensions = 64): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const index = (code + i * 31) % dimensions;
    vector[index] = (vector[index] + (code / 255)) % 1;
  }
  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

/**
 * Index a list of study sessions into Qdrant Cloud
 */
export async function indexSessionsInQdrant(sessions: StudySession[]): Promise<boolean> {
  const client = getQdrantClient();
  if (!client || !sessions || sessions.length === 0) return false;

  try {
    // Ensure collection exists
    try {
      const collections = await client.getCollections();
      const exists = collections.collections.some((c) => c.name === QDRANT_COLLECTION_NAME);

      if (!exists) {
        await client.createCollection(QDRANT_COLLECTION_NAME, {
          vectors: {
            size: 64,
            distance: "Cosine",
          },
        });
      }
    } catch {}

    const points = sessions.map((s, index) => {
      const summaryText = `${s.subject?.name || "General"} - ${s.topic}: focus score ${s.focus_score}/100, ${Math.round(s.gross_duration_seconds / 60)}m gross, ${Math.round(s.net_focus_seconds / 60)}m net. Distractions: ${s.thoughts?.map((t) => t.title).join(", ") || "none"}. ${s.ai_debrief?.primaryDistractionDiagnosis || ""}`;
      
      return {
        id: typeof s.id === "string" && s.id.length >= 32 ? s.id : index + 1,
        vector: createSimpleEmbedding(summaryText, 64),
        payload: {
          sessionId: s.id,
          topic: s.topic,
          subjectName: s.subject?.name || "General",
          grossMinutes: Math.round(s.gross_duration_seconds / 60),
          netMinutes: Math.round(s.net_focus_seconds / 60),
          focusScore: s.focus_score,
          distractionDiagnosis: s.ai_debrief?.primaryDistractionDiagnosis || "",
          strayThoughtsCount: s.thoughts?.length || 0,
          date: s.start_time,
        },
      };
    });

    await client.upsert(QDRANT_COLLECTION_NAME, {
      wait: true,
      points,
    });

    return true;
  } catch (error) {
    console.warn("Qdrant indexSessions error, using local fallback:", error);
    return false;
  }
}

/**
 * Search relevant past sessions matching the user's query
 */
export async function querySessionMemory(
  query: string,
  allSessions: StudySession[] = [],
  limit = 4
): Promise<{ items: SessionMemoryItem[]; source: "qdrant" | "local_fallback" }> {
  const client = getQdrantClient();

  if (client) {
    try {
      // Auto-create or index collection if not present
      try {
        const collections = await client.getCollections();
        const exists = collections.collections.some((c) => c.name === QDRANT_COLLECTION_NAME);
        if (!exists) {
          if (allSessions.length > 0) {
            await indexSessionsInQdrant(allSessions);
          } else {
            await client.createCollection(QDRANT_COLLECTION_NAME, {
              vectors: { size: 64, distance: "Cosine" },
            });
          }
        }
      } catch {}

      const queryVector = createSimpleEmbedding(query, 64);
      let searchPoints: any[] = [];

      if (typeof (client as any).search === "function") {
        searchPoints = await (client as any).search(QDRANT_COLLECTION_NAME, {
          vector: queryVector,
          limit,
          with_payload: true,
        });
      } else if (typeof (client as any).query === "function") {
        const queryRes = await (client as any).query(QDRANT_COLLECTION_NAME, {
          query: queryVector,
          limit,
          with_payload: true,
        });
        searchPoints = queryRes?.points || queryRes || [];
      }

      if (searchPoints && searchPoints.length > 0) {
        return {
          items: searchPoints.map((res: any) => {
            const p = (res.payload || {}) as Record<string, any>;
            return {
              id: (p.sessionId as string) || String(res.id),
              topic: p.topic || "Study Session",
              subjectName: p.subjectName || "General",
              grossMinutes: p.grossMinutes || 0,
              netMinutes: p.netMinutes || 0,
              focusScore: p.focusScore || 0,
              distractionDiagnosis: p.distractionDiagnosis,
              strayThoughtsCount: p.strayThoughtsCount || 0,
              date: p.date || new Date().toISOString(),
              relevanceScore: res.score,
            };
          }),
          source: "qdrant",
        };
      }
    } catch (err) {
      console.warn("Qdrant search query failed, using local session filter:", err);
    }
  }

  // Graceful Local Fallback: Filter sessions by semantic relevance / keyword matching
  const queryLower = query.toLowerCase();
  const sortedSessions = [...allSessions]
    .filter((s) => s.gross_duration_seconds > 0)
    .sort((a, b) => {
      const aMatch =
        (a.topic.toLowerCase().includes(queryLower) ? 2 : 0) +
        ((a.subject?.name || "").toLowerCase().includes(queryLower) ? 2 : 0);
      const bMatch =
        (b.topic.toLowerCase().includes(queryLower) ? 2 : 0) +
        ((b.subject?.name || "").toLowerCase().includes(queryLower) ? 2 : 0);
      return bMatch - aMatch || new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
    })
    .slice(0, limit);

  return {
    items: sortedSessions.map((s) => ({
      id: s.id,
      topic: s.topic,
      subjectName: s.subject?.name || "General",
      grossMinutes: Math.round(s.gross_duration_seconds / 60),
      netMinutes: Math.round(s.net_focus_seconds / 60),
      focusScore: s.focus_score,
      distractionDiagnosis: s.ai_debrief?.primaryDistractionDiagnosis,
      strayThoughtsCount: s.thoughts?.length || 0,
      date: s.start_time,
    })),
    source: "local_fallback",
  };
}
