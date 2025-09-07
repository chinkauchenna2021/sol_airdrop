import { NextRequest, NextResponse } from "next/server";
import { TwitterEngagementService } from "@/lib/next-auth/twitter-engagement-services";
import { getSession } from "@/lib/next-auth/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      console.error("Twitter monitoring error: No session found");
      return NextResponse.json(
        { error: "Unauthorized", details: "No session found" },
        { status: 401 }
      );
    }
    
    console.log(`Starting Twitter monitoring for user: ${session.user.id}`);
    
    // Start monitoring and track user engagements
    const result = await TwitterEngagementService.trackUserEngagement(session.user.id);
    
    console.log(`Twitter monitoring completed for user: ${session.user.id}`, result);
    
    return NextResponse.json({
      ...result,
      message: "Twitter monitoring completed successfully"
    });
  } catch (error) {
    console.error("Error in Twitter monitoring:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to monitor Twitter activities",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}