// app/api/twitter/monitor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TwitterEngagementService } from "@/lib/next-auth/twitter-engagement-services";
import { getSession } from "@/lib/next-auth/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Start monitoring and track user engagements
    const result = await TwitterEngagementService.trackUserEngagement(session.user.id);
    
    return NextResponse.json({
      ...result,
      message: "Twitter monitoring completed successfully"
    });
  } catch (error) {
    console.error("Error in Twitter monitoring:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to monitor Twitter activities" },
      { status: 500 }
    );
  }
}