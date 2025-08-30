// lib/twitter-engagement.ts
import { getTwitterClient } from "@/lib/twitter-sdk/twitter-client";
import prisma from "@/lib/prisma";

export interface EngagementEvent {
  type: 'LIKE' | 'RETWEET' | 'COMMENT' | 'QUOTE' | 'FOLLOW';
  tweetId?: string;
  userId: string;
  timestamp: Date;
  engagementData: any;
  tokensAwarded: number;
}

export class TwitterEngagementTracker {
  static async trackUserEngagement(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twitterId: true }
    });
    
    if (!user || !user.twitterId) {
      throw new Error("User not connected to Twitter");
    }
    
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
    
    const client = getTwitterClient(account.access_token);
    
    // Get user's recent likes
    const likes = await client.tweets.usersIdLikedTweets(user.twitterId, {
      max_results: 50,
      "tweet.fields": ["created_at", "public_metrics"]
    });
    
    // Get user's recent tweets (for comments/retweets)
    const tweets = await client.tweets.usersIdTweets(user.twitterId, {
      max_results: 50,
      "tweet.fields": ["created_at", "public_metrics", "referenced_tweets"]
    });
    
    // Process engagements and award tokens
    const engagements = await this.processEngagements(userId, likes, tweets);
    
    // Update user's engagement stats
    await this.updateUserStats(userId, engagements);
    
    return engagements;
  }
  
  private static async processEngagements(userId: string, likes: any, tweets: any) {
    const engagements: EngagementEvent[] = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Process likes
    for (const like of likes.data || []) {
      const likedAt = new Date(like.created_at);
      
      if (likedAt > twentyFourHoursAgo) {
        // Check if we've already recorded this engagement
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
            engagementData: like,
            tokensAwarded: 0.5 // 0.5 tokens per like
          });
        }
      }
    }
    
    // Process tweets for retweets and comments
    for (const tweet of tweets.data || []) {
      const tweetedAt = new Date(tweet.created_at);
      
      if (tweetedAt > twentyFourHoursAgo) {
        // Check if it's a retweet
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
              engagementData: tweet,
              tokensAwarded: 1.0 // 1.0 token per retweet
            });
          }
        }
        
        // Check if it's a reply (comment)
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
              engagementData: tweet,
              tokensAwarded: 0.8 // 0.8 tokens per comment
            });
          }
        }
      }
    }
    
    // Save engagements to database and award tokens
    for (const engagement of engagements) {
      await prisma.twitterEngagement.create({
        data: {
          userId: engagement.userId,
          engagementType: engagement.type,
          tweetId: engagement.tweetId as string,
          tokens: engagement.tokensAwarded,
          verified: true,
          createdAt: engagement.timestamp
        }
      });
      
      // Update user's token balance
      await prisma.user.update({
        where: { id: engagement.userId },
        data: {
          totalTokens: { increment: engagement.tokensAwarded },
          totalEarnedTokens: { increment: engagement.tokensAwarded }
        }
      });
      
      // Record in point history (even though it's tokens)
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
    
    return engagements;
  }
  
  private static async updateUserStats(userId: string, engagements: EngagementEvent[]) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate engagement metrics
    const todayEngagements = engagements.filter(e => e.timestamp >= todayStart).length;
    const weeklyEngagements = engagements.filter(e => e.timestamp >= weekStart).length;
    const monthlyEngagements = engagements.filter(e => e.timestamp >= monthStart).length;
    
    // Determine activity level based on your schema
    let twitterActivity: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (todayEngagements >= 20) twitterActivity = "HIGH";
    else if (todayEngagements >= 10) twitterActivity = "MEDIUM";
    
    // Update user activity stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterActivity,
      }
    });
    
    // Log the activity event
    await prisma.systemConfig.create({
      data: {
        key: `twitter_activity_${userId}_${now.getTime()}`,
        value: {
          type: "TWITTER_ACTIVITY_UPDATE",
          userId,
          todayEngagements,
          weeklyEngagements,
          monthlyEngagements,
          twitterActivity,
          timestamp: now.toISOString(),
        },
        description: "Twitter engagement activity update",
      },
    });
  }
  
  static async getUserEngagementStats(userId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [today, week, month, total] = await Promise.all([
      prisma.twitterEngagement.count({
        where: {
          userId,
          createdAt: { gte: todayStart }
        }
      }),
      prisma.twitterEngagement.count({
        where: {
          userId,
          createdAt: { gte: weekStart }
        }
      }),
      prisma.twitterEngagement.count({
        where: {
          userId,
          createdAt: { gte: monthStart }
        }
      }),
      prisma.twitterEngagement.count({
        where: { userId }
      })
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