// app/api/auth/sync-user-enhanced/route.ts - Updated for Token-Based Rewards
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth-enhanced'
import prisma from '@/lib/prisma'
import { AnyARecord } from 'dns'

interface TwitterData {
  id: string
  username: string
  name: string
  image?: string
  followers_count?: number
  following_count?: number
  tweet_count?: number
  verified?: boolean
  description?: string
  location?: string
  created_at?: string
}

interface BetterAuthUser {
  id: string
  email?: string
  name?: string
  image?: string
  emailVerified?: boolean
  [key: string]: any
}

// Token rewards based on Twitter activity level
const TOKEN_REWARDS = {
  WELCOME_BONUS: 100.0,
  TWITTER_CONNECT: 50.0,
  ACTIVITY_BONUSES: {
    HIGH: 100.0,    // 4000 tokens as per enum comment
    MEDIUM: 75.0,   // 3500 tokens as per enum comment  
    LOW: 50.0       // 3000 tokens as per enum comment
  }
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, betterAuthUser, twitterData } = await req.json()

    // Validate required data
    if (!walletAddress || !betterAuthUser || !twitterData) {
      return NextResponse.json(
        { error: 'Missing required data: walletAddress, betterAuthUser, or twitterData' },
        { status: 400 }
      )
    }

    // Verify better-auth session
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session || session?.user.id !== betterAuthUser.id) {
      return NextResponse.json(
        { error: 'Invalid or expired Twitter session' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting enhanced user sync with token rewards...')
    console.log('📋 Wallet:', walletAddress)
    console.log('🐦 Twitter:', twitterData.username)

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already exists
      let user = await tx.user.findUnique({
        where: { walletAddress },
        include: {
          engagements: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
          referrals: true,
          pointHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      let isNewUser = false
      let wasTwitterAlreadyConnected = false
      let tokensAwarded = 0

      if (!user) {
        // Create new user
        console.log('🆕 Creating new user...')
        isNewUser = true

        // Calculate activity level based on Twitter metrics
        const activityLevel = calculateActivityLevel(
          twitterData.followers_count || 0,
          twitterData.following_count || 0,
          twitterData.tweet_count || 0,
          new Date(twitterData.created_at || Date.now()),
          twitterData.verified || false
        )

        user = await tx.user.create({
          data: {
            walletAddress,
            twitterId: twitterData.id,
            twitterUsername: twitterData.username,
            twitterName: twitterData.name,
            twitterImage: twitterData.image,
            twitterFollowers: twitterData.followers_count || 0,
            twitterActivity: activityLevel,
            email: betterAuthUser.email,
            totalPoints: 0,
            totalTokens: 0, // Will be updated with token bonuses
            level: 1,
            streak: 0,
            referralCode: generateReferralCode(),
          },
          include: {
            engagements: true,
            referrals: true,
            pointHistory: true,
          },
        })

        console.log('✅ New user created with ID:', user.id)
      } else {
        // Update existing user
        console.log('🔄 Updating existing user...')
        wasTwitterAlreadyConnected = !!user.twitterId

        // Calculate new activity level
        const activityLevel = calculateActivityLevel(
          twitterData.followers_count || 0,
          twitterData.following_count || 0,
          twitterData.tweet_count || 0,
          new Date(twitterData.created_at || Date.now()),
          twitterData.verified || false
        )

        user = await tx.user.update({
          where: { id: user.id },
          data: {
            twitterId: twitterData.id,
            twitterUsername: twitterData.username,
            twitterName: twitterData.name,
            twitterImage: twitterData.image,
            twitterFollowers: twitterData.followers_count || user.twitterFollowers || 0,
            twitterActivity: activityLevel,
            email: betterAuthUser.email || user.email,
          },
          include: {
            engagements: true,
            referrals: true,
            pointHistory: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        })

        console.log('✅ User updated with Twitter data')
      }

      // Award token bonuses
      if (isNewUser) {
        // Welcome bonus - tokens
        await tx.pointHistory.create({
          data: {
            userId: user.id,
            points: 0,
            tokens: TOKEN_REWARDS.WELCOME_BONUS,
            type: 'TOKENS',
            action: 'WELCOME_BONUS',
            description: 'Welcome to the platform',
            metadata: {
              source: 'better-auth',
              twitterUsername: twitterData.username,
              tokenAmount: TOKEN_REWARDS.WELCOME_BONUS
            },
          },
        })
        tokensAwarded += TOKEN_REWARDS.WELCOME_BONUS

        // Twitter connection bonus - tokens
        await tx.pointHistory.create({
          data: {
            userId: user.id,
            points: 0,
            tokens: TOKEN_REWARDS.TWITTER_CONNECT,
            type: 'TOKENS',
            action: 'TWITTER_CONNECT',
            description: 'Connected Twitter account',
            metadata: {
              twitterId: twitterData.id,
              twitterUsername: twitterData.username,
              followers: twitterData.followers_count || 0,
              tokenAmount: TOKEN_REWARDS.TWITTER_CONNECT
            },
          },
        })
        tokensAwarded += TOKEN_REWARDS.TWITTER_CONNECT

        // Activity level bonus - tokens
        const activityBonus = TOKEN_REWARDS.ACTIVITY_BONUSES[user.twitterActivity!]
        if (activityBonus > 0) {
          await tx.pointHistory.create({
            data: {
              userId: user.id,
              points: 0,
              tokens: activityBonus,
              type: 'TOKENS',
              action: 'ACTIVITY_BONUS',
              description: `${user.twitterActivity} activity level bonus`,
              metadata: {
                activityLevel: user.twitterActivity,
                followers: twitterData.followers_count || 0,
                tokenAmount: activityBonus
              },
            },
          })
          tokensAwarded += activityBonus
        }

        // Update total tokens
        await tx.user.update({
          where: { id: user.id },
          data: { 
            totalTokens: tokensAwarded,
            totalEarnedTokens: tokensAwarded 
          },
        })

      } else if (!wasTwitterAlreadyConnected) {
        // First-time Twitter connection for existing user - tokens
        await tx.pointHistory.create({
          data: {
            userId: user.id,
            points: 0,
            tokens: TOKEN_REWARDS.TWITTER_CONNECT,
            type: 'TOKENS',
            action: 'TWITTER_CONNECT',
            description: 'Connected Twitter account',
            metadata: {
              twitterId: twitterData.id,
              twitterUsername: twitterData.username,
              followers: twitterData.followers_count || 0,
              tokenAmount: TOKEN_REWARDS.TWITTER_CONNECT
            },
          },
        })
        tokensAwarded = TOKEN_REWARDS.TWITTER_CONNECT

        await tx.user.update({
          where: { id: user.id },
          data: { 
            totalTokens: { increment: tokensAwarded },
            totalEarnedTokens: { increment: tokensAwarded }
          },
        })
      }

      // Store better-auth user data for session enhancement
      await tx.systemConfig.upsert({
        where: { key: `better_auth_user_${user.id}` },
        update: {
          value: {
            betterAuthId: betterAuthUser.id,
            email: betterAuthUser.email,
            emailVerified: betterAuthUser.emailVerified,
            syncedAt: new Date().toISOString(),
          },
        },
        create: {
          key: `better_auth_user_${user.id}`,
          value: {
            betterAuthId: betterAuthUser.id,
            email: betterAuthUser.email,
            emailVerified: betterAuthUser.emailVerified,
            syncedAt: new Date().toISOString(),
          },
          description: 'Better-auth user mapping',
        },
      })

      // Calculate user rank based on total tokens
      const rank = await tx.user.count({
        where: { totalTokens: { gt: user.totalTokens + tokensAwarded } },
      }) + 1

      // Return updated user data
      const finalUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          engagements: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          },
          pointHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          referrals: true,
        },
      })

      return {
        user: finalUser,
        isNewUser,
        tokensAwarded,
        rank,
        wasTwitterAlreadyConnected,
      }
    })

    // Setup monitoring for new Twitter connections
    if (result.isNewUser || !result.wasTwitterAlreadyConnected) {
      await setupTwitterMonitoring(result?.user?.id as any, twitterData)
    }

    // Clean up pending Twitter data
    await prisma.systemConfig.deleteMany({
      where: { key: `pending_twitter_data_${betterAuthUser.id}` }
    }).catch(console.error)

    console.log('✅ Enhanced user sync completed with token rewards')

    return NextResponse.json({
      success: true,
      user: {
        id: result?.user?.id,
        walletAddress: result?.user?.walletAddress,
        twitterId: result?.user?.twitterId,
        twitterUsername: result?.user?.twitterUsername,
        twitterName: result?.user?.twitterName,
        twitterImage: result?.user?.twitterImage,
        twitterFollowers: result?.user?.twitterFollowers,
        twitterActivity: result?.user?.twitterActivity,
        totalPoints: result?.user?.totalPoints,
        totalTokens: result?.user?.totalTokens, // Current claimable token balance
        totalEarnedTokens: result?.user?.totalEarnedTokens, // Lifetime earned tokens
        level: Math.floor(Number(result?.user?.totalPoints) / 1000) + 1,
        rank: result.rank,
        streak: result?.user?.streak,
        referralCode: result?.user?.referralCode,
        isAdmin: result?.user?.isAdmin,
      },
      newUser: result.isNewUser,
      awarded: result.tokensAwarded,
      awardType: 'TOKENS',
      firstTimeTwitterConnection: !result.wasTwitterAlreadyConnected,
      engagementStats: {
        totalEngagements: result?.user?.engagements.length,
        recentActivity: result?.user?.pointHistory.slice(0, 3),
      },
    })

  } catch (error) {
    console.error('❌ Enhanced user sync error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to sync user data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Helper Functions
function calculateActivityLevel(
  followers: number,
  following: number,
  tweets: number,
  createdAt: Date,
  verified: boolean
): 'HIGH' | 'MEDIUM' | 'LOW' {
  let score = 0

  // Follower scoring (0-30 points)
  if (followers >= 10000) score += 30
  else if (followers >= 5000) score += 25
  else if (followers >= 1000) score += 20
  else if (followers >= 500) score += 15
  else if (followers >= 100) score += 10
  else if (followers >= 50) score += 5

  // Following ratio (0-15 points)
  const ratio = following > 0 ? followers / following : followers
  if (ratio >= 2) score += 15
  else if (ratio >= 1) score += 10
  else if (ratio >= 0.5) score += 5

  // Tweet count (0-20 points)
  if (tweets >= 10000) score += 20
  else if (tweets >= 5000) score += 15
  else if (tweets >= 1000) score += 10
  else if (tweets >= 500) score += 5

  // Account age (0-20 points)
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (ageInDays >= 365) score += 20
  else if (ageInDays >= 180) score += 15
  else if (ageInDays >= 90) score += 10
  else if (ageInDays >= 30) score += 5

  // Verified bonus (10 points)
  if (verified) score += 10

  // Determine tier based on your enum values
  if (score >= 70) return 'HIGH'    // 4000 tokens
  if (score >= 40) return 'MEDIUM'  // 3500 tokens
  return 'LOW'                      // 3000 tokens
}

function generateReferralCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

async function setupTwitterMonitoring(userId: string, twitterData: TwitterData) {
  try {
    console.log('📊 Setting up Twitter monitoring for user:', userId)

    // Create monitoring configuration
    await prisma.systemConfig.upsert({
      where: { key: `twitter_monitoring_${userId}` },
      update: {
        value: {
          enabled: true,
          userId,
          twitterId: twitterData.id,
          username: twitterData.username,
          lastCheck: new Date().toISOString(),
          checkInterval: 3600000, // 1 hour
          engagementTracking: true,
          activityScoring: true,
          rewardType: 'TOKENS', // Award tokens for engagements
          baselineFollowers: twitterData.followers_count || 0,
          setupDate: new Date().toISOString(),
        },
      },
      create: {
        key: `twitter_monitoring_${userId}`,
        value: {
          enabled: true,
          userId,
          twitterId: twitterData.id,
          username: twitterData.username,
          lastCheck: new Date().toISOString(),
          checkInterval: 3600000,
          engagementTracking: true,
          activityScoring: true,
          rewardType: 'TOKENS',
          baselineFollowers: twitterData.followers_count || 0,
          setupDate: new Date().toISOString(),
        },
        description: 'Twitter monitoring configuration with token rewards',
      },
    })

    console.log('✅ Twitter monitoring setup completed')
  } catch (error) {
    console.error('❌ Error setting up Twitter monitoring:', error)
  }
}