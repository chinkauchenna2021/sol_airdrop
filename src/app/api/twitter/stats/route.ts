import { NextRequest, NextResponse } from "next/server";
import { TwitterEngagementService } from "@/lib/next-auth/twitter-engagement-services";
import { getSession } from "@/lib/next-auth/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user's Twitter engagement statistics
    const stats = await TwitterEngagementService.getUserEngagementStats(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error fetching Twitter stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Twitter statistics" },
      { status: 500 }
    );
  }
}