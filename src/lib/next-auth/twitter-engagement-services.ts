// lib/twitter-engagement-service.ts (updated with better error handling)
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
    console.log(`Starting Twitter engagement tracking for user: ${userId}`);
    
    try {
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
        console.error(`User ${userId} not connected to Twitter`);
        throw new Error("User not connected to Twitter");
      }

      console.log(`Found user ${userId} with Twitter ID: ${user.twitterId}`);

      // Get Twitter access token from Account model
      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          provider: "twitter"
        }
      });

      if (!account?.access_token) {
        console.error(`No Twitter access token found for user ${userId}`);
        throw new Error("Twitter access token not found");
      }

      console.log(`Found Twitter access token for user ${userId}`);

      // Initialize Twitter client
      const client = new TwitterApi(account.access_token);

      // Check if token is valid by making a simple API call
      try {
        await client.v2.me();
        console.log(`Twitter token is valid for user ${userId}`);
      } catch (tokenError) {
        console.error(`Invalid Twitter token for user ${userId}:`, tokenError);
        throw new Error("Invalid Twitter access token");
      }

      // Fetch recent engagements with better error handling
      console.log(`Fetching Twitter data for user ${userId}`);
      const [likes, tweets, following] = await Promise.allSettled([
        this.fetchRecentLikes(client, user.twitterId),
        this.fetchRecentTweets(client, user.twitterId),
        this.fetchRecentFollowing(client, user.twitterId)
      ]);

      // Extract results from PromiseSettledResult
      const likesData = likes.status === 'fulfilled' ? likes.value : [];
      const tweetsData = tweets.status === 'fulfilled' ? tweets.value : [];
      const followingData = following.status === 'fulfilled' ? following.value : [];

      // Log any errors
      if (likes.status === 'rejected') {
        console.error(`Error fetching likes for user ${userId}:`, likes.reason);
      }
      if (tweets.status === 'rejected') {
        console.error(`Error fetching tweets for user ${userId}:`, tweets.reason);
      }
      if (following.status === 'rejected') {
        console.error(`Error fetching following for user ${userId}:`, following.reason);
      }

      console.log(`Fetched data for user ${userId}: ${likesData.length} likes, ${tweetsData.length} tweets, ${followingData.length} following`);

      // Process engagements and award tokens
      const engagements = await this.processEngagements(userId, likesData, tweetsData, followingData);

      // Update user stats and activity level
      await this.updateUserStats(userId, engagements);

      const result = {
        success: true,
        engagementsTracked: engagements.length,
        tokensAwarded: engagements.reduce((sum, e) => sum + e.tokensAwarded, 0)
      };

      console.log(`Twitter engagement tracking completed for user ${userId}:`, result);
      return result;
    } catch (error) {
      console.error(`Error in Twitter engagement tracking for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch user's recent likes (last 24 hours)
   */
  private static async fetchRecentLikes(client: TwitterApi, twitterId: string) {
    try {
      console.log(`Fetching likes for Twitter ID: ${twitterId}`);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const likes = await client.v2.userLikedTweets(twitterId, {
        max_results: 100,
        "tweet.fields": ["created_at", "public_metrics"]
      });
      
      // Filter results to only include likes from the last 24 hours
      const filteredLikes = (likes.data.data || []).filter(like => {
        const likeDate = new Date(like.created_at as string);
        return likeDate >= twentyFourHoursAgo;
      });
      
      console.log(`Found ${filteredLikes.length} recent likes for Twitter ID: ${twitterId}`);
      return filteredLikes;
    } catch (error) {
      console.error(`Error fetching likes for Twitter ID ${twitterId}:`, error);
      return [];
    }
  }

  /**
   * Fetch user's recent tweets (last 24 hours)
   */
  private static async fetchRecentTweets(client: TwitterApi, twitterId: string) {
    try {
      console.log(`Fetching tweets for Twitter ID: ${twitterId}`);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tweets = await client.v2.userTimeline(twitterId, {
        max_results: 100,
        "tweet.fields": ["created_at", "public_metrics", "referenced_tweets"]
      });
      
      // Filter results to only include tweets from the last 24 hours
      const filteredTweets = (tweets.data.data || []).filter(tweet => {
        const tweetDate = new Date(tweet.created_at as string);
        return tweetDate >= twentyFourHoursAgo;
      });
      
      console.log(`Found ${filteredTweets.length} recent tweets for Twitter ID: ${twitterId}`);
      return filteredTweets;
    } catch (error) {
      console.error(`Error fetching tweets for Twitter ID ${twitterId}:`, error);
      return [];
    }
  }

  /**
   * Fetch user's recent follows (last 24 hours)
   */
  private static async fetchRecentFollowing(client: TwitterApi, twitterId: string) {
    try {
      console.log(`Fetching following for Twitter ID: ${twitterId}`);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const following = await client.v2.following(twitterId, {
        max_results: 100,
        "user.fields": ["created_at"]
      });
      
      // Filter results to only include follows from the last 24 hours
      const filteredFollowing = (following.data || []).filter((user) => {
        const followDate = new Date(user.created_at as string);
        return followDate >= twentyFourHoursAgo;
      });
      
      console.log(`Found ${filteredFollowing.length} recent follows for Twitter ID: ${twitterId}`);
      return filteredFollowing;
    } catch (error) {
      console.error(`Error fetching following for Twitter ID ${twitterId}:`, error);
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
    console.log(`Processing engagements for user: ${userId}`);
    const engagements: EngagementEvent[] = [];

    // Process likes
    for (const like of likes) {
      try {
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
      } catch (error) {
        console.error(`Error processing like for user ${userId}:`, error);
      }
    }

    // Process tweets for retweets, comments, and quotes
    for (const tweet of tweets) {
      try {
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
      } catch (error) {
        console.error(`Error processing tweet for user ${userId}:`, error);
      }
    }

    // Process follows
    for (const follow of following) {
      try {
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
      } catch (error) {
        console.error(`Error processing follow for user ${userId}:`, error);
      }
    }

    console.log(`Processed ${engagements.length} engagements for user: ${userId}`);
    return engagements;
  }

  /**
   * Save engagement to database and award tokens
   */
  private static async saveEngagement(engagement: EngagementEvent) {
    try {
      console.log(`Saving ${engagement.type} engagement for user: ${engagement.userId}`);
      
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
      
      console.log(`Successfully saved ${engagement.type} engagement for user: ${engagement.userId}`);
    } catch (error) {
      console.error(`Error saving ${engagement.type} engagement for user ${engagement.userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user's Twitter activity level based on recent engagements
   */
  private static async updateUserStats(userId: string, engagements: EngagementEvent[]) {
    try {
      console.log(`Updating user stats for user: ${userId}`);
      
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
      
      console.log(`Successfully updated user stats for user: ${userId}`);
    } catch (error) {
      console.error(`Error updating user stats for user ${userId}:`, error);
      throw error;
    }
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