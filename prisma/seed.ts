import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create system config
  const configs = [
    { key: 'claimsEnabled', value: true, description: 'Enable/disable claims globally' },
    { key: 'minClaimAmount', value: 100, description: 'Minimum points required to claim' },
    { key: 'claimRate', value: 0.001, description: 'Conversion rate from points to tokens' },
    { key: 'pointsPerLike', value: 10, description: 'Points awarded for liking a tweet' },
    { key: 'pointsPerRetweet', value: 20, description: 'Points awarded for retweeting' },
    { key: 'pointsPerComment', value: 15, description: 'Points awarded for commenting' },
    { key: 'pointsPerFollow', value: 50, description: 'Points awarded for following' },
    { key: 'pointsPerReferral', value: 100, description: 'Points awarded for successful referral' },
    { key: 'dailyCheckInPoints', value: 5, description: 'Points awarded for daily check-in' },
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    })
  }

  // Create default tasks
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
  ]

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: randomUUID() },
      update: {},
      create: task as any,
    })
  }

  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })