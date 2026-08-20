import { NextResponse } from "next/server";
import { generateAIDebriefWithLLM } from "@/lib/ai/aiClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic = "General Study",
      subjectName = "Subject",
      grossSeconds = 1800,
      netFocusSeconds = 1600,
      focusScore = 85,
      thoughts = [],
      sessionNotes = "",
    } = body;

    const debrief = await generateAIDebriefWithLLM({
      topic,
      subjectName,
      grossSeconds,
      netFocusSeconds,
      focusScore,
      thoughts,
      sessionNotes,
    });

    return NextResponse.json(debrief);
  } catch (error) {
    console.error("AI Debrief API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI debrief" },
      { status: 500 }
    );
  }
}
