import { NextRequest, NextResponse } from "next/server";
import { monitorAllTwitterEngagements } from "@/lib/next-auth/cron-jobs/twitter-monitor";

// This endpoint should be protected and only called by your cron service
export async function GET(request: NextRequest) {
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  try {
    // Verify cron secret if needed
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await monitorAllTwitterEngagements();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in Twitter monitoring cron:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}