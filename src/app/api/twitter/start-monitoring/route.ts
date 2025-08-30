// import { NextRequest, NextResponse } from 'next/server'
// import { getSession } from '@/lib/auth'
// import { startMonitoringForUser } from '@/lib/twitter-monitor-enhanced'
// import prisma from '@/lib/prisma'

// export async function POST(req: NextRequest) {
//   try {
//     const session = await getSession(req)
    
//     if (!session) {
//       return NextResponse.json(
//         { error: 'Authentication required' },
//         { status: 401 }
//       )
//     }

//     const { userId } = await req.json()

//     if (!userId) {
//       return NextResponse.json(
//         { error: 'User ID required' },
//         { status: 400 }
//       )
//     }

//     // Verify user access
//     if (session.user.id !== userId && !session.user.isAdmin) {
//       return NextResponse.json(
//         { error: 'Access denied' },
//         { status: 403 }
//       )
//     }

//     // Check if user has Twitter connected
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { twitterId: true, twitterUsername: true }
//     })

//     if (!user?.twitterId) {
//       return NextResponse.json(
//         { error: 'Twitter account not connected' },
//         { status: 400 }
//       )
//     }

//     // Start monitoring
//     const success = await startMonitoringForUser(userId)

//     if (success) {
//       return NextResponse.json({
//         success: true,
//         message: 'Twitter monitoring started successfully',
//         userId,
//         username: user.twitterUsername
//       })
//     } else {
//       return NextResponse.json(
//         { error: 'Failed to start monitoring' },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error('❌ Error starting Twitter monitoring:', error)
//     return NextResponse.json(
//       { error: 'Failed to start monitoring' },
//       { status: 500 }
//     )
//   }
// }




// app/api/twitter/start-monitoring/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TwitterEngagementTracker } from "@/lib/twitter-sdk/twitter-engagement";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Start monitoring by tracking current engagements
    const engagements = await TwitterEngagementTracker.trackUserEngagement(userId);
    
    return NextResponse.json({
      success: true,
      engagementsTracked: engagements.length,
      message: "Twitter monitoring started successfully"
    });
  } catch (error) {
    console.error("Error starting Twitter monitoring:", error);
    return NextResponse.json(
      { error: "Failed to start Twitter monitoring" },
      { status: 500 }
    );
  }
}