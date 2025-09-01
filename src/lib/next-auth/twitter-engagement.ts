import { Client, auth } from "twitter-api-sdk";
import prisma from "@/lib/prisma";

export class TwitterEngagementTracker {
  static async getTwitterClient(userId: string) {
    // Get Twitter access token from Account model
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "twitter"
      }
    });

    if (!account || !account.access_token) {
      throw new Error("Twitter access token not found");
    }

    const authClient = new auth.OAuth2User({
      client_id: process.env.TWITTER_CLIENT_ID!,
      client_secret: process.env.TWITTER_CLIENT_SECRET!,
      callback: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
      scopes: ["tweet.read", "users.read", "offline.access", "like.read", "follows.read"],
    });

    authClient.token = {
      access_token: account.access_token,
      token_type: "bearer",
    };

    return new Client(authClient);
  }

  static async trackUserEngagement(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twitterId: true }
    });

    if (!user || !user.twitterId) {
      throw new Error("User not connected to Twitter");
    }

    const client = await this.getTwitterClient(userId);
    const engagements = [];

    try {
      // Get user's recent likes
      const likes = await client.tweets.usersIdLikedTweets(user.twitterId, {
        max_results: 50,
        "tweet.fields": ["created_at", "public_metrics", "author_id"]
      });

      // Get user's recent tweets
      const tweets = await client.tweets.usersIdTweets(user.twitterId, {
        max_results: 50,
        "tweet.fields": ["created_at", "public_metrics", "referenced_tweets", "author_id"]
      });

      // Process engagements
      engagements.push(...await this.processLikes(userId, likes.data || []));
      engagements.push(...await this.processTweets(userId, tweets.data || []));

      // Update user stats
      await this.updateUserStats(userId, engagements);

      return engagements;
    } catch (error) {
      console.error("Error tracking engagements:", error);
      throw error;
    }
  }

  private static async processLikes(userId: string, likes: any[]) {
    const engagements = [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const like of likes) {
      const likedAt = new Date(like.created_at);
      
      if (likedAt > twentyFourHoursAgo) {
        const existing = await prisma.twitterEngagement.findFirst({
          where: {
            userId,
            tweetId: like.id,
            engagementType: 'LIKE'
          }
        });

        if (!existing) {
          engagements.push({
            type: 'LIKE',
            tweetId: like.id,
            userId,
            timestamp: likedAt,
            tokensAwarded: 0.5
          });
        }
      }
    }

    return engagements;
  }

  private static async processTweets(userId: string, tweets: any[]) {
    const engagements = [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const tweet of tweets) {
      const tweetedAt = new Date(tweet.created_at);
      
      if (tweetedAt > twentyFourHoursAgo) {
        // Check for retweets
        if (tweet.referenced_tweets?.some((ref: any) => ref.type === 'retweeted')) {
          const retweetedTweetId = tweet.referenced_tweets.find((ref: any) => ref.type === 'retweeted').id;
          
          const existing = await prisma.twitterEngagement.findFirst({
            where: {
              userId,
              tweetId: retweetedTweetId,
              engagementType: 'RETWEET'
            }
          });

          if (!existing) {
            engagements.push({
              type: 'RETWEET',
              tweetId: retweetedTweetId,
              userId,
              timestamp: tweetedAt,
              tokensAwarded: 1.0
            });
          }
        }

        // Check for replies
        if (tweet.referenced_tweets?.some((ref: any) => ref.type === 'replied_to')) {
          const repliedToTweetId = tweet.referenced_tweets.find((ref: any) => ref.type === 'replied_to').id;
          
          const existing = await prisma.twitterEngagement.findFirst({
            where: {
              userId,
              tweetId: repliedToTweetId,
              engagementType: 'COMMENT'
            }
          });

          if (!existing) {
            engagements.push({
              type: 'COMMENT',
              tweetId: repliedToTweetId,
              userId,
              timestamp: tweetedAt,
              tokensAwarded: 0.8
            });
          }
        }
      }
    }

    return engagements;
  }

  private static async updateUserStats(userId: string, engagements: any[]) {
    // Save engagements and award tokens
    for (const engagement of engagements) {
      await prisma.twitterEngagement.create({
        data: {
          userId: engagement.userId,
          engagementType: engagement.type,
          tweetId: engagement.tweetId,
          tokens: engagement.tokensAwarded,
          verified: true,
          createdAt: engagement.timestamp
        }
      });

      // Update user token balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalTokens: { increment: engagement.tokensAwarded },
          totalEarnedTokens: { increment: engagement.tokensAwarded }
        }
      });

      // Record in point history
      await prisma.pointHistory.create({
        data: {
          userId: engagement.userId,
          tokens: engagement.tokensAwarded,
          type: "TOKENS",
          action: `TWITTER_${engagement.type}`,
          description: `Twitter ${engagement.type.toLowerCase()} engagement`,
        }
      });
    }

    // Update activity level
    const todayEngagements = engagements.filter(e => 
      new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    let twitterActivity: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (todayEngagements >= 20) twitterActivity = "HIGH";
    else if (todayEngagements >= 10) twitterActivity = "MEDIUM";

    await prisma.user.update({
      where: { id: userId },
      data: { twitterActivity }
    });
  }

  static async getUserEngagementStats(userId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month, total] = await Promise.all([
      prisma.twitterEngagement.count({
        where: { userId, createdAt: { gte: todayStart } }
      }),
      prisma.twitterEngagement.count({
        where: { userId, createdAt: { gte: weekStart } }
      }),
      prisma.twitterEngagement.count({
        where: { userId, createdAt: { gte: monthStart } }
      }),
      prisma.twitterEngagement.count({ where: { userId } })
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twitterActivity: true, totalTokens: true, totalEarnedTokens: true }
    });

    const breakdown = await prisma.twitterEngagement.groupBy({
      by: ['engagementType'],
      where: { userId },
      _count: { _all: true },
      _sum: { tokens: true }
    });

    const recentActivity = await prisma.twitterEngagement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      totalEngagements: total,
      todayEngagements: today,
      weeklyEngagements: week,
      monthlyEngagements: month,
      activityLevel: user?.twitterActivity || 'LOW',
      totalTokens: user?.totalTokens || 0,
      totalEarnedTokens: user?.totalEarnedTokens || 0,
      breakdown: breakdown.map(item => ({
        type: item.engagementType,
        count: item._count._all,
        tokens: item._sum.tokens || 0
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.engagementType,
        tokens: activity.tokens,
        createdAt: activity.createdAt.toISOString(),
        tweetId: activity.tweetId || ''
      }))
    };
  }
}