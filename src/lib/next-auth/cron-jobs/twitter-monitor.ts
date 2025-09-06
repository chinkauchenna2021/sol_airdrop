// lib/cron-jobs/twitter-monitor.ts
import { TwitterEngagementService } from "@/lib/next-auth/twitter-engagement-services";
import prisma from "@/lib/prisma";

/**
 * Scheduled job to monitor Twitter activities for all active users
 * This should be run periodically (e.g., every hour)
 */
export async function monitorAllTwitterEngagements() {
  try {
    // Get all users with Twitter accounts
    const users = await prisma.user.findMany({
      where: {
        twitterId: { not: null },
        isActive: true
      },
      select: { id: true }
    });

    console.log(`Monitoring Twitter activities for ${users.length} users`);

    // Process each user
    const results = await Promise.allSettled(
      users.map(user => TwitterEngagementService.trackUserEngagement(user.id))
    );

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Twitter monitoring completed: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      totalUsers: users.length,
      successful,
      failed
    };
  } catch (error) {
    console.error("Error in Twitter monitoring job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}