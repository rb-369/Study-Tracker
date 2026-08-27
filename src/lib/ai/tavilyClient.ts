/**
 * Tavily Web Search Client for StudyFlow AI Agent
 * Provides real-time educational, syllabus, and study technique retrieval.
 * Includes graceful zero-crash fallback if API key is not configured.
 */

import { tavily } from "@tavily/core";

export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface TavilySearchResponse {
  query: string;
  results: SearchResultItem[];
  source: "tavily" | "fallback";
}

export async function searchWebWithTavily(query: string, maxResults = 3): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();

  if (apiKey && !apiKey.includes("placeholder")) {
    try {
      const tvly = tavily({ apiKey });
      const response = await tvly.search(query, {
        searchDepth: "basic",
        maxResults,
        includeAnswer: true,
      });

      if (response.results && response.results.length > 0) {
        return {
          query,
          results: response.results.map((r) => ({
            title: r.title || "Study Resource",
            url: r.url || "",
            content: r.content || "",
            score: r.score,
          })),
          source: "tavily",
        };
      }
    } catch (error) {
      console.warn("Tavily API search error, falling back:", error);
    }
  }

  // Graceful fallback for study queries when Tavily key is absent
  return {
    query,
    results: [
      {
        title: `Curated Study Science: ${query}`,
        url: "https://hubermanlab.com/neural-network-learning-and-focus",
        content: `Cognitive neuroscience recommendations for "${query}": Utilize 90-minute ultradian rhythm cycles, active recall testing rather than passive re-reading, and deliberate spaced repetition with interleaved problem sets to maximize long-term synaptic consolidation.`,
      },
      {
        title: "Deep Work & Distraction Defense Protocol",
        url: "https://calnewport.com/deep-work",
        content: `Attention residue protocol: Mind pings and cognitive switches degrade focus purity. Schedule explicit dopamine reset intervals and maintain a tactile capture pad for stray intrusive thoughts.`,
      }
    ],
    source: "fallback",
  };
}
