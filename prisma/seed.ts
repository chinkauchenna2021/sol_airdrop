// prisma/seed.ts
import {PrismaClient} from '../src/app/generated/prisma'
import { 
  TwitterActivity, 
  NotificationType, 
  EngagementType, 
  TaskType, 
  ClaimStatus, 
  PaymentMethod 
} from '../src/app/generated/prisma'


const prisma = new PrismaClient


async function main() {
  console.log('🌱 Starting database seed...')

  try {
    // 1. System Configuration
    console.log('📝 Creating system configurations...')
    const systemConfigs = [
      // Core claim settings
      { key: 'claimsEnabled', value: true, description: 'Enable/disable claims globally' },
      { key: 'minClaimAmount', value: 100, description: 'Minimum points required to claim' },
      { key: 'claimRate', value: 0.001, description: 'Conversion rate from points to tokens' },
      { key: 'claimFeePercentage', value: 2.5, description: 'Fee percentage for claims' },
      
      // Points system
      { key: 'pointsPerLike', value: 10, description: 'Points awarded for liking a tweet' },
      { key: 'pointsPerRetweet', value: 20, description: 'Points awarded for retweeting' },
      { key: 'pointsPerComment', value: 15, description: 'Points awarded for commenting' },
      { key: 'pointsPerQuote', value: 25, description: 'Points awarded for quote tweeting' },
      { key: 'pointsPerFollow', value: 50, description: 'Points awarded for following' },
      { key: 'pointsPerReferral', value: 100, description: 'Points awarded for successful referral' },
      { key: 'dailyCheckInPoints', value: 5, description: 'Points awarded for daily check-in' },
      
      // Activity-based token allocation
      { key: 'highActivityTokens', value: 4000, description: 'Tokens for high activity users (1000+ followers)' },
      { key: 'mediumActivityTokens', value: 3500, description: 'Tokens for medium activity users (500+ followers)' },
      { key: 'lowActivityTokens', value: 3000, description: 'Tokens for low activity users' },
      
      // Activity thresholds
      { key: 'highActivityThreshold', value: 1000, description: 'Follower count for high activity' },
      { key: 'mediumActivityThreshold', value: 500, description: 'Follower count for medium activity' },
      
      // Platform settings
      { key: 'maintenanceMode', value: false, description: 'Enable maintenance mode' },
      { key: 'registrationEnabled', value: true, description: 'Allow new user registration' },
      { key: 'twitterTrackingEnabled', value: true, description: 'Enable Twitter tracking' },
      { key: 'airdropEnabled', value: true, description: 'Enable airdrop functionality' },
      
      // Referral settings
      { key: 'maxReferrals', value: 50, description: 'Maximum referrals per user' },
      { key: 'referralBonusMultiplier', value: 1.5, description: 'Bonus multiplier for referral points' },
      
      // Level system
      { key: 'pointsPerLevel', value: 1000, description: 'Points required per level increase' },
      { key: 'maxLevel', value: 100, description: 'Maximum user level' },
      
      // Streak bonuses
      { key: 'streakBonusEnabled', value: true, description: 'Enable streak bonus system' },
      { key: 'streakMultiplier', value: 0.1, description: 'Bonus multiplier per streak day' }
    ]

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { 
          value: config.value,
          description: config.description 
        },
        create: {
          key: config.key,
          value: config.value,
          description: config.description
        }
      })
    }

    // 2. Default Tasks
    console.log('🎯 Creating default tasks...')
    const defaultTasks = [
      {
        name: 'Connect Twitter Account',
        description: 'Link your Twitter account to start earning points',
        type: TaskType.SOCIAL_TWITTER,
        points: 50,
        requirements: { action: 'connect_twitter' },
        isActive: true
      },
      {
        name: 'Connect Wallet',
        description: 'Connect your Solana wallet to the platform',
        type: TaskType.WALLET_CONNECT,
        points: 25,
        requirements: { action: 'connect_wallet' },
        isActive: true
      },
      {
        name: 'Daily Check-in',
        description: 'Visit the platform daily to earn points and maintain your streak',
        type: TaskType.DAILY_CHECK_IN,
        points: 5,
        requirements: { frequency: 'daily' },
        isActive: true
      },
      {
        name: 'Follow Official Account',
        description: 'Follow our official Twitter account @SolanaAirdrop',
        type: TaskType.SOCIAL_TWITTER,
        points: 50,
        requirements: { 
          action: 'follow', 
          targetId: '@SolanaAirdrop',
          verificationRequired: true 
        },
        isActive: true
      },
      {
        name: 'Like Announcement Tweet',
        description: 'Like our platform announcement tweet',
        type: TaskType.SOCIAL_TWITTER,
        points: 10,
        requirements: { 
          action: 'like', 
          tweetId: 'announcement_tweet_id',
          verificationRequired: true 
        },
        isActive: true
      },
      {
        name: 'Retweet Announcement',
        description: 'Retweet our announcement to spread the word',
        type: TaskType.SOCIAL_TWITTER,
        points: 20,
        requirements: { 
          action: 'retweet', 
          tweetId: 'announcement_tweet_id',
          verificationRequired: true 
        },
        isActive: true
      },
      {
        name: 'Quote Tweet with Comment',
        description: 'Quote tweet our announcement with your thoughts',
        type: TaskType.SOCIAL_TWITTER,
        points: 30,
        requirements: { 
          action: 'quote', 
          tweetId: 'announcement_tweet_id',
          requireComment: true,
          verificationRequired: true 
        },
        isActive: true
      },
      {
        name: 'Refer a Friend',
        description: 'Invite friends to join the platform using your referral code',
        type: TaskType.REFERRAL,
        points: 100,
        requirements: { 
          action: 'refer', 
          minReferrals: 1,
          referralMustComplete: true 
        },
        isActive: true
      },
      {
        name: 'Join Discord',
        description: 'Join our Discord community',
        type: TaskType.SOCIAL_DISCORD,
        points: 25,
        requirements: { 
          action: 'join_discord',
          serverId: 'discord_server_id' 
        },
        isActive: true
      },
      {
        name: 'Complete Profile',
        description: 'Fill out your complete user profile',
        type: TaskType.CUSTOM,
        points: 15,
        requirements: { 
          action: 'complete_profile',
          requiredFields: ['email', 'twitterUsername'] 
        },
        isActive: true
      }
    ]

    for (const task of defaultTasks) {
      await prisma.task.upsert({
        where: { 
          id: crypto.randomUUID()
        },
        update: {
          description: task.description,
          points: task.points,
          requirements: task.requirements,
          isActive: task.isActive
        },
        create: task
      })
    }

    // 3. Achievements
    console.log('🏆 Creating achievements...')
    const achievements = [
      {
        name: 'Welcome Aboard',
        description: 'Complete your first task on the platform',
        icon: '👋',
        requirements: { tasksCompleted: 1 },
        points: 25,
        isSecret: false
      },
      {
        name: 'Twitter Connected',
        description: 'Successfully connect your Twitter account',
        icon: '🐦',
        requirements: { twitterConnected: true },
        points: 50,
        isSecret: false
      },
      {
        name: 'Wallet Master',
        description: 'Connect your Solana wallet',
        icon: '💰',
        requirements: { walletConnected: true },
        points: 25,
        isSecret: false
      },
      {
        name: 'Point Collector',
        description: 'Earn your first 100 points',
        icon: '💎',
        requirements: { totalPoints: 100 },
        points: 50,
        isSecret: false
      },
      {
        name: 'Social Butterfly',
        description: 'Complete 10 Twitter engagements',
        icon: '🦋',
        requirements: { twitterEngagements: 10 },
        points: 100,
        isSecret: false
      },
      {
        name: 'Streak Starter',
        description: 'Maintain a 3-day check-in streak',
        icon: '🔥',
        requirements: { checkInStreak: 3 },
        points: 75,
        isSecret: false
      },
      {
        name: 'Streak Master',
        description: 'Maintain a 7-day check-in streak',
        icon: '🚀',
        requirements: { checkInStreak: 7 },
        points: 150,
        isSecret: false
      },
      {
        name: 'Streak Legend',
        description: 'Maintain a 30-day check-in streak',
        icon: '👑',
        requirements: { checkInStreak: 30 },
        points: 500,
        isSecret: false
      },
      {
        name: 'Referral Champion',
        description: 'Successfully refer 5 friends',
        icon: '🤝',
        requirements: { successfulReferrals: 5 },
        points: 250,
        isSecret: false
      },
      {
        name: 'High Activity Influencer',
        description: 'Achieve high activity status (1000+ followers)',
        icon: '⭐',
        requirements: { 
          twitterFollowers: 1000,
          twitterActivity: 'HIGH' 
        },
        points: 500,
        isSecret: true
      },
      {
        name: 'Point Millionaire',
        description: 'Accumulate 10,000 points',
        icon: '💸',
        requirements: { totalPoints: 10000 },
        points: 1000,
        isSecret: true
      },
      {
        name: 'Level 10 Master',
        description: 'Reach level 10',
        icon: '🏅',
        requirements: { level: 10 },
        points: 300,
        isSecret: false
      },
      {
        name: 'Early Adopter',
        description: 'One of the first 100 users to join',
        icon: '🌟',
        requirements: { 
          userId: 100,
          registrationRank: 100 
        },
        points: 200,
        isSecret: true
      }
    ]

    for (const achievement of achievements) {
      await prisma.achievement.upsert({
        where: { id: crypto.randomUUID()},
        update: {
          description: achievement.description,
          icon: achievement.icon,
          requirements: achievement.requirements,
          points: achievement.points,
          isSecret: achievement.isSecret
        },
        create: achievement
      })
    }

    // 4. Demo Users (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Creating demo users for testing...')
      
      const demoUsers = [
        {
          walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          twitterId: '1234567890',
          twitterUsername: 'demo_admin',
          twitterName: 'Demo Admin',
          twitterImage: 'https://via.placeholder.com/400x400',
          twitterFollowers: 1500,
          twitterActivity: TwitterActivity.HIGH,
          level: 3,
          streak: 15,
          lastCheckIn: new Date(),
          email: 'admin@demo.com',
          totalPoints: 2500,
          rank: 1,
          isAdmin: true,
          isActive: true
        },
        {
          walletAddress: '8VzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWN',
          twitterId: '1234567891',
          twitterUsername: 'demo_user_medium',
          twitterName: 'Demo User Medium',
          twitterImage: 'https://via.placeholder.com/400x400',
          twitterFollowers: 750,
          twitterActivity: TwitterActivity.MEDIUM,
          level: 2,
          streak: 7,
          lastCheckIn: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          email: 'medium@demo.com',
          totalPoints: 1200,
          rank: 2,
          isAdmin: false,
          isActive: true
        },
        {
          walletAddress: '7UzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWO',
          twitterId: '1234567892',
          twitterUsername: 'demo_user_low',
          twitterName: 'Demo User Low',
          twitterImage: 'https://via.placeholder.com/400x400',
          twitterFollowers: 300,
          twitterActivity: TwitterActivity.LOW,
          level: 1,
          streak: 3,
          lastCheckIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          email: 'low@demo.com',
          totalPoints: 450,
          rank: 3,
          isAdmin: false,
          isActive: true
        }
      ]

      for (const userData of demoUsers) {
        const user = await prisma.user.upsert({
          where: { walletAddress: userData.walletAddress },
          update: userData,
          create: userData
        })

        // Create some sample engagements for demo users
        if (userData.twitterUsername !== 'demo_admin') {
          await prisma.twitterEngagement.createMany({
            data: [
              {
                userId: user.id,
                tweetId: 'demo_tweet_1',
                engagementType: EngagementType.LIKE,
                points: 10,
                verified: true
              },
              {
                userId: user.id,
                tweetId: 'demo_tweet_2',
                engagementType: EngagementType.RETWEET,
                points: 20,
                verified: true
              },
              {
                userId: user.id,
                tweetId: 'demo_tweet_3',
                engagementType: EngagementType.COMMENT,
                points: 15,
                verified: true
              }
            ],
            skipDuplicates: true
          })

          // Create sample point history
          await prisma.pointHistory.createMany({
            data: [
              {
                userId: user.id,
                points: 50,
                action: 'TWITTER_CONNECT',
                description: 'Connected Twitter account'
              },
              {
                userId: user.id,
                points: 25,
                action: 'WALLET_CONNECT',
                description: 'Connected Solana wallet'
              },
              {
                userId: user.id,
                points: 10,
                action: 'TWITTER_LIKE',
                description: 'Liked announcement tweet'
              }
            ]
          })

          // Create sample notifications
          await prisma.notification.createMany({
            data: [
              {
                userId: user.id,
                title: 'Welcome to the Platform!',
                message: 'Thanks for joining our airdrop platform. Start completing tasks to earn points!',
                type: NotificationType.SUCCESS,
                read: false
              },
              {
                userId: user.id,
                title: 'Achievement Unlocked!',
                message: 'You\'ve unlocked the "Welcome Aboard" achievement!',
                type: NotificationType.ACHIEVEMENT,
                read: false
              }
            ]
          })
        }
      }

      // Create demo referral relationships
      const users = await prisma.user.findMany()
      if (users.length >= 2) {
        await prisma.referral.upsert({
          where: { referredId: users[1].id },
          update: {},
          create: {
            referrerId: users[0].id,
            referredId: users[1].id,
            points: 100,
            completed: true
          }
        })
      }
    }

    // 5. Sample Analytics Data
    console.log('📊 Creating sample analytics...')
    const today = new Date()
    const analyticsData = []
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      analyticsData.push({
        date,
        totalUsers: Math.floor(Math.random() * 1000) + 100 + i * 10,
        activeUsers: Math.floor(Math.random() * 500) + 50 + i * 5,
        totalClaims: Math.floor(Math.random() * 50) + i,
        totalPoints: Math.floor(Math.random() * 100000) + 10000 + i * 1000,
        totalEngagements: Math.floor(Math.random() * 1000) + 100 + i * 20,
        metadata: {
          dailyGrowth: Math.random() * 5,
          topEngagementType: ['LIKE', 'RETWEET', 'COMMENT'][Math.floor(Math.random() * 3)]
        }
      })
    }

    for (const data of analyticsData) {
      await prisma.analytics.upsert({
        where: { 
          id: crypto.randomUUID()
        },
        update: data,
        create: data
      })
    }

    console.log('✅ Database seeded successfully!')
    
    // Display summary
    const summary = await Promise.all([
      prisma.systemConfig.count(),
      prisma.task.count(),
      prisma.achievement.count(),
      prisma.user.count(),
      prisma.analytics.count()
    ])
    
    console.log('\n📊 Seed Summary:')
    console.log(`   • ${summary[0]} system configurations`)
    console.log(`   • ${summary[1]} tasks created`)
    console.log(`   • ${summary[2]} achievements available`)
    console.log(`   • ${summary[3]} demo users created`)
    console.log(`   • ${summary[4]} analytics records`)
    console.log('\n🎯 Activity-based token allocation:')
    console.log('   • HIGH activity (1000+ followers): 4000 tokens')
    console.log('   • MEDIUM activity (500+ followers): 3500 tokens')
    console.log('   • LOW activity (<500 followers): 3000 tokens')
    console.log('\n🚀 Your platform is ready to go!')

  } catch (error) {
    console.error('❌ Seed error:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  })