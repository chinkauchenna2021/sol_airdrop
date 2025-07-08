// prisma/seed.ts - REPLACE your existing seed file with this
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'


async function main() {
  console.log('🌱 Starting database seed...')

  try {
    // Create/update system configurations (preserving your existing ones + adding new)
    const configs = [
      // Existing configs
      { key: 'claimsEnabled', value: true, description: 'Enable/disable claims globally' },
      { key: 'minClaimAmount', value: 100, description: 'Minimum points required to claim' },
      { key: 'claimRate', value: 0.001, description: 'Conversion rate from points to tokens' },
      { key: 'pointsPerLike', value: 10, description: 'Points awarded for liking a tweet' },
      { key: 'pointsPerRetweet', value: 20, description: 'Points awarded for retweeting' },
      { key: 'pointsPerComment', value: 15, description: 'Points awarded for commenting' },
      { key: 'pointsPerFollow', value: 50, description: 'Points awarded for following' },
      { key: 'pointsPerReferral', value: 100, description: 'Points awarded for successful referral' },
      { key: 'dailyCheckInPoints', value: 5, description: 'Points awarded for daily check-in' },
      
      // NEW: Activity-based token allocation configs (your main requirement)
      { key: 'highActivityTokens', value: 4000, description: 'Tokens for high activity users (1000+ followers)' },
      { key: 'mediumActivityTokens', value: 3500, description: 'Tokens for medium activity users (500+ followers)' },
      { key: 'lowActivityTokens', value: 3000, description: 'Tokens for low activity users' },
      
      // NEW: Activity thresholds
      { key: 'highActivityThreshold', value: 1000, description: 'Follower count for high activity' },
      { key: 'mediumActivityThreshold', value: 500, description: 'Follower count for medium activity' },
      
      // NEW: Platform settings
      { key: 'maintenanceMode', value: false, description: 'Enable maintenance mode' },
      { key: 'registrationEnabled', value: true, description: 'Allow new user registration' },
      { key: 'twitterTrackingEnabled', value: true, description: 'Enable Twitter tracking' },
      { key: 'airdropEnabled', value: true, description: 'Enable airdrop functionality' },
    ]

    console.log('📝 Creating/updating system configurations...')
    for (const config of configs) {
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
        },
      })
    }

    // Create default tasks (preserving existing structure)
    const existingTasks = await prisma.task.findMany()
    
    if (existingTasks.length === 0) {
      console.log('🎯 Creating default tasks...')
      
      const tasks = [
        {
          name: 'Follow on Twitter',
          description: 'Follow our official Twitter account',
          type: 'SOCIAL_TWITTER',
          points: 50,
          requirements: { action: 'follow', targetId: '@SolanaAirdrop' },
        },
        {
          name: 'Daily Check-in',
          description: 'Visit the platform daily to earn points',
          type: 'DAILY_CHECK_IN',
          points: 5,
          requirements: { frequency: 'daily' },
        },
        {
          name: 'Connect Wallet',
          description: 'Connect your Solana wallet to the platform',
          type: 'WALLET_CONNECT',
          points: 25,
          requirements: { action: 'connect' },
        },
        {
          name: 'Refer a Friend',
          description: 'Invite friends to join the platform',
          type: 'REFERRAL',
          points: 100,
          requirements: { action: 'refer', minReferrals: 1 },
        },
        // NEW: Enhanced Twitter tasks
        {
          name: 'Like Announcement Tweet',
          description: 'Like our platform announcement',
          type: 'SOCIAL_TWITTER',
          points: 10,
          requirements: { action: 'like', tweetId: 'announcement_tweet' },
        },
        {
          name: 'Retweet with Comment',
          description: 'Retweet our announcement with your thoughts',
          type: 'SOCIAL_TWITTER', 
          points: 25,
          requirements: { action: 'retweet', tweetId: 'announcement_tweet', requireComment: true },
        },
      ]

      for (const task of tasks) {
        try {
          await prisma.task.create({
            data: task as any,
          })
        } catch (error) {
          console.log(`Task "${task.name}" might already exist, skipping...`)
        }
      }
    } else {
      console.log(`✅ Found ${existingTasks.length} existing tasks, skipping task creation`)
    }

    // Create achievements if Achievement table exists
    try {
      const existingAchievements = await prisma.achievement.findMany()
      
      if (existingAchievements.length === 0) {
        console.log('🏆 Creating achievements...')
        
        const achievements = [
          {
            name: 'First Steps',
            description: 'Complete your first task',
            icon: '👋',
            requirements: { tasksCompleted: 1 },
            points: 25,
          },
          {
            name: 'Twitter Pioneer', 
            description: 'Connect your Twitter account',
            icon: '🐦',
            requirements: { twitterConnected: true },
            points: 50,
          },
          {
            name: 'Point Collector',
            description: 'Earn your first 100 points',
            icon: '💎',
            requirements: { totalPoints: 100 },
            points: 50,
          },
          {
            name: 'Social Butterfly',
            description: 'Complete 10 Twitter engagements',
            icon: '🦋',
            requirements: { twitterEngagements: 10 },
            points: 100,
          },
          {
            name: 'Streak Master',
            description: 'Maintain a 7-day check-in streak',
            icon: '🔥',
            requirements: { checkInStreak: 7 },
            points: 150,
          },
          {
            name: 'High Activity User',
            description: 'Achieve high activity status (1000+ followers)',
            icon: '⭐',
            requirements: { twitterFollowers: 1000 },
            points: 500,
            isSecret: true,
          },
        ]

        for (const achievement of achievements) {
          await prisma.achievement.create({
            data: achievement,
          })
        }
      }
    } catch (error) {
      console.log('Achievement table not found, skipping achievements creation')
    }

    // Create demo data only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Creating demo users for testing...')
      
      const existingDemoUser = await prisma.user.findFirst({
        where: { walletAddress: { contains: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' } }
      })

      if (!existingDemoUser) {
        const demoUsers = [
          {
            walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
            isAdmin: true,
            totalPoints: 1500,
            level: 2,
            twitterUsername: 'demo_admin',
            twitterFollowers: 1500,
            twitterActivity: 'HIGH',
          },
          {
            walletAddress: '8VzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWN', 
            totalPoints: 750,
            level: 1,
            twitterUsername: 'demo_user_medium',
            twitterFollowers: 750,
            twitterActivity: 'MEDIUM',
          },
          {
            walletAddress: '7UzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWO',
            totalPoints: 300,
            level: 1,
            twitterUsername: 'demo_user_low',
            twitterFollowers: 300,
            twitterActivity: 'LOW',
          },
        ]

        for (const user of demoUsers) {
          try {
            await prisma.user.create({
              data: user as any,
            })
          } catch (error) {
            console.log(`Demo user already exists, skipping...`)
          }
        }
      }
    }

    console.log('✅ Database seeded successfully!')
    
    // Show summary
    const [configCount, taskCount] = await Promise.all([
      prisma.systemConfig.count(),
      prisma.task.count(),
    ])
    
    console.log('📊 Summary:')
    console.log(`   - ${configCount} system configurations`)
    console.log(`   - ${taskCount} tasks`)
    console.log('   - Activity-based token allocation: HIGH(4000) | MEDIUM(3500) | LOW(3000)')
    
  } catch (error) {
    console.error('❌ Seed error:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })