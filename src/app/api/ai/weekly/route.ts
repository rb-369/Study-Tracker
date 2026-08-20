import { NextResponse } from "next/server";
import { generateWeeklyReportWithLLM } from "@/lib/ai/aiClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionsCount = 5,
      totalGrossHours = 6.5,
      totalNetHours = 5.8,
      overallFocusRatio = 0.89,
      topDistractions = [],
      subjectAllocation = [],
    } = body;

    const report = await generateWeeklyReportWithLLM({
      sessionsCount,
      totalGrossHours,
      totalNetHours,
      overallFocusRatio,
      topDistractions,
      subjectAllocation,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("AI Weekly Report API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly report" },
      { status: 500 }
    );
  }
}
