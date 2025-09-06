// lib/twitter-engagement-service.ts
import { TwitterApi } from 'twitter-api-v2';
import { EngagementType } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

export interface EngagementEvent {
  type: EngagementType;
  tweetId?: string;
  userId: string;
  timestamp: Date;
  engagementData: any;
  tokensAwarded: number;
}

export class TwitterEngagementService {
  /**
   * Track user's Twitter engagements and award tokens
   */
  static async trackUserEngagement(userId: string) {
    // Get user and Twitter account details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twitterId: true, 
        twitterUsername: true,
        twitterFollowers: true,
        totalTokens: true,
        totalEarnedTokens: true
      }
    });

    if (!user?.twitterId) {
      throw new Error("User not connected to Twitter");
    }

    // Get Twitter access token from Account model
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "twitter"
      }
    });

    if (!account?.access_token) {
      throw new Error("Twitter access token not found");
    }

    // Initialize Twitter client
    const client = new TwitterApi(account.access_token);

    // Fetch recent engagements
    const [likes, tweets, following] = await Promise.all([
      this.fetchRecentLikes(client, user.twitterId),
      this.fetchRecentTweets(client, user.twitterId),
      this.fetchRecentFollowing(client, user.twitterId)
    ]);

    // Process engagements and award tokens
    const engagements = await this.processEngagements(userId, likes, tweets, following);

    // Update user stats and activity level
    await this.updateUserStats(userId, engagements);

    return {
      success: true,
      engagementsTracked: engagements.length,
      tokensAwarded: engagements.reduce((sum, e) => sum + e.tokensAwarded, 0)
    };
  }

  /**
   * Fetch user's recent likes (last 24 hours)
   */
  private static async fetchRecentLikes(client: TwitterApi, twitterId: string) {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const likes = await client.v2.userLikedTweets(twitterId, {
        max_results: 100,
        "tweet.fields": ["created_at", "public_metrics"]
      });
      
      // Filter results to only include likes from the last 24 hours
      return (likes.data.data || []).filter(like => {
        const likeDate = new Date(like.created_at as any);
        return likeDate >= twentyFourHoursAgo;
      });
    } catch (error) {
      console.error("Error fetching likes:", error);
      return [];
    }
  }

  /**
   * Fetch user's recent tweets (last 24 hours)
   */
  private static async fetchRecentTweets(client: TwitterApi, twitterId: string) {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tweets = await client.v2.userTimeline(twitterId, {
        max_results: 100,
        "tweet.fields": ["created_at", "public_metrics", "referenced_tweets"]
      });
      
      // Filter results to only include tweets from the last 24 hours
      return (tweets.data.data || []).filter(tweet => {
        const tweetDate = new Date(tweet.created_at as any);
        return tweetDate >= twentyFourHoursAgo;
      });
    } catch (error) {
      console.error("Error fetching tweets:", error);
      return [];
    }
  }

  /**
   * Fetch user's recent follows (last 24 hours)
   */
  private static async fetchRecentFollowing(client: TwitterApi, twitterId: string) {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const following = await client.v2.following(twitterId, {
        max_results: 100,
        "user.fields": ["created_at"]
      });
      
      // Filter results to only include follows from the last 24 hours
      return (following?.data || []).filter((user:any) => {
        const followDate = new Date(user.created_at);
        return followDate >= twentyFourHoursAgo;
      });
    } catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  }

  /**
   * Process engagements and award tokens
   */
  private static async processEngagements(
    userId: string, 
    likes: any[], 
    tweets: any[], 
    following: any[]
  ): Promise<EngagementEvent[]> {
    const engagements: EngagementEvent[] = [];

    // Process likes
    for (const like of likes) {
      const existing = await prisma.twitterEngagement.findUnique({
        where: {
          userId_tweetId_engagementType: {
            userId,
            tweetId: like.id,
            engagementType: 'LIKE'
          }
        }
      });

      if (!existing) {
        const engagement: EngagementEvent = {
          type: 'LIKE',
          tweetId: like.id,
          userId,
          timestamp: new Date(like.created_at),
          engagementData: like,
          tokensAwarded: 0.5 // 0.5 tokens per like
        };

        engagements.push(engagement);
        await this.saveEngagement(engagement);
      }
    }

    // Process tweets for retweets, comments, and quotes
    for (const tweet of tweets) {
      // Check for retweets
      if (tweet.referenced_tweets?.some((ref: any) => ref.type === 'retweeted')) {
        const retweetedTweetId = tweet.referenced_tweets.find((ref: any) => ref.type === 'retweeted').id;
        
        const existing = await prisma.twitterEngagement.findUnique({
          where: {
            userId_tweetId_engagementType: {
              userId,
              tweetId: retweetedTweetId,
              engagementType: 'RETWEET'
            }
          }
        });

        if (!existing) {
          const engagement: EngagementEvent = {
            type: 'RETWEET',
            tweetId: retweetedTweetId,
            userId,
            timestamp: new Date(tweet.created_at),
            engagementData: tweet,
            tokensAwarded: 1.0 // 1.0 token per retweet
          };

          engagements.push(engagement);
          await this.saveEngagement(engagement);
        }
      }

      // Check for replies (comments)
      if (tweet.referenced_tweets?.some((ref: any) => ref.type === 'replied_to')) {
        const repliedToTweetId = tweet.referenced_tweets.find((ref: any) => ref.type === 'replied_to').id;
        
        const existing = await prisma.twitterEngagement.findUnique({
          where: {
            userId_tweetId_engagementType: {
              userId,
              tweetId: repliedToTweetId,
              engagementType: 'COMMENT'
            }
          }
        });

        if (!existing) {
          const engagement: EngagementEvent = {
            type: 'COMMENT',
            tweetId: repliedToTweetId,
            userId,
            timestamp: new Date(tweet.created_at),
            engagementData: tweet,
            tokensAwarded: 0.8 // 0.8 tokens per comment
          };

          engagements.push(engagement);
          await this.saveEngagement(engagement);
        }
      }

      // Check for quotes
      if (tweet.referenced_tweets?.some((ref: any) => ref.type === 'quoted')) {
        const quotedTweetId = tweet.referenced_tweets.find((ref: any) => ref.type === 'quoted').id;
        
        const existing = await prisma.twitterEngagement.findUnique({
          where: {
            userId_tweetId_engagementType: {
              userId,
              tweetId: quotedTweetId,
              engagementType: 'QUOTE'
            }
          }
        });

        if (!existing) {
          const engagement: EngagementEvent = {
            type: 'QUOTE',
            tweetId: quotedTweetId,
            userId,
            timestamp: new Date(tweet.created_at),
            engagementData: tweet,
            tokensAwarded: 1.2 // 1.2 tokens per quote
          };

          engagements.push(engagement);
          await this.saveEngagement(engagement);
        }
      }
    }

    // Process follows
    for (const follow of following) {
      const existing = await prisma.twitterEngagement.findUnique({
        where: {
          userId_tweetId_engagementType: {
            userId,
            tweetId: follow.id, // Using user ID as tweetId for follows
            engagementType: 'FOLLOW'
          }
        }
      });

      if (!existing) {
        const engagement: EngagementEvent = {
          type: 'FOLLOW',
          tweetId: follow.id,
          userId,
          timestamp: new Date(follow.created_at),
          engagementData: follow,
          tokensAwarded: 2.0 // 2.0 tokens per follow
        };

        engagements.push(engagement);
        await this.saveEngagement(engagement);
      }
    }

    return engagements;
  }

  /**
   * Save engagement to database and award tokens
   */
  private static async saveEngagement(engagement: EngagementEvent) {
    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Save engagement record
      await tx.twitterEngagement.create({
        data: {
          userId: engagement.userId,
          engagementType: engagement.type,
          tweetId: engagement.tweetId || '',
          tokens: engagement.tokensAwarded,
          verified: true,
          createdAt: engagement.timestamp
        }
      });

      // Update user's token balance
      await tx.user.update({
        where: { id: engagement.userId },
        data: {
          totalTokens: { increment: engagement.tokensAwarded },
          totalEarnedTokens: { increment: engagement.tokensAwarded },
          lastActivity: new Date()
        }
      });

      // Record in point history
      await tx.pointHistory.create({
        data: {
          userId: engagement.userId,
          tokens: engagement.tokensAwarded,
          type: "TOKENS",
          action: `TWITTER_${engagement.type}`,
          description: `Twitter ${engagement.type.toLowerCase()} engagement`,
          metadata: {
            tweetId: engagement.tweetId,
            engagementType: engagement.type,
            timestamp: engagement.timestamp.toISOString()
          }
        }
      });
    });
  }

  /**
   * Update user's Twitter activity level based on recent engagements
   */
  private static async updateUserStats(userId: string, engagements: EngagementEvent[]) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate engagement metrics
    const todayEngagements = engagements.filter(e => e.timestamp >= todayStart).length;
    const weeklyEngagements = engagements.filter(e => e.timestamp >= weekStart).length;
    
    // Determine activity level based on engagement frequency
    let twitterActivity: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (todayEngagements >= 10) twitterActivity = "HIGH";
    else if (todayEngagements >= 5) twitterActivity = "MEDIUM";
    
    // Update user activity stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterActivity,
      }
    });
    
    // Update analytics for today
    await this.updateDailyAnalytics(todayStart, engagements);
  }

  /**
   * Update daily analytics record
   */
  private static async updateDailyAnalytics(date: Date, engagements: EngagementEvent[]) {
    try {
      // Find or create today's analytics record
      const todayAnalytics = await prisma.analytics.findFirst({
        where: {
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          }
        }
      });

      const totalTokens = engagements.reduce((sum, e) => sum + e.tokensAwarded, 0);

      if (todayAnalytics) {
        // Update existing record
        await prisma.analytics.update({
          where: { id: todayAnalytics.id },
          data: {
            totalEngagements: { increment: engagements.length },
            totalTokens: { increment: totalTokens }
          }
        });
      } else {
        // Create new record
        await prisma.analytics.create({
          data: {
            date,
            totalEngagements: engagements.length,
            totalTokens
          }
        });
      }
    } catch (error) {
      console.error("Error updating analytics:", error);
    }
  }

  /**
   * Get user's Twitter engagement statistics
   */
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
      select: { 
        twitterActivity: true, 
        totalTokens: true, 
        totalEarnedTokens: true,
        twitterFollowers: true
      }
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
      twitterFollowers: user?.twitterFollowers || 0,
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