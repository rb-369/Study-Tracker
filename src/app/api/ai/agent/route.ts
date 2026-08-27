import { NextRequest } from "next/server";
import { runStudyFlowAgent, AgentChatMessage } from "@/lib/ai/langGraphAgent";
import { StudySession } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: AgentChatMessage[] = body.messages || [];
    const allSessions: StudySession[] = body.allSessions || [];
    const activeSessionContext = body.activeSessionContext;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await runStudyFlowAgent(
            {
              messages,
              allSessions,
              activeSessionContext,
            },
            (chunk) => {
              if (chunk.event) {
                const eventPayload = `data: ${JSON.stringify({ event: chunk.event })}\n\n`;
                controller.enqueue(encoder.encode(eventPayload));
              }
              if (chunk.content) {
                const contentPayload = `data: ${JSON.stringify({ text: chunk.content })}\n\n`;
                controller.enqueue(encoder.encode(contentPayload));
              }
            }
          );

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (streamError) {
          console.error("Agent streaming error:", streamError);
          const errorPayload = `data: ${JSON.stringify({ error: "Failed to generate AI response" })}\n\n`;
          controller.enqueue(encoder.encode(errorPayload));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API /api/ai/agent handler error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
