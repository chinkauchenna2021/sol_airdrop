import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get the last 10 cron job runs from your analytics
    const recentRuns = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: "twitter_activity_"
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get user statistics
    const userCount = await prisma.user.count({
      where: {
        twitterId: { not: null },
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      twitterConnectedUsers: userCount,
      recentRuns: recentRuns.map(run => ({
        timestamp: run.createdAt,
        data: run.value
      }))
    });
  } catch (error) {
    console.error("Error fetching cron status:", error);
    return NextResponse.json(
      { error: "Failed to fetch cron status" },
      { status: 500 }
    );
  }
}