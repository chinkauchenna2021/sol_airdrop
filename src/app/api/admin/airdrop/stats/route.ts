import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    // Get current season info
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: {
        status: { in: ['ACTIVE', 'CLAIMING'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    let seasonStats = null
    if (currentSeason) {
      const claimed = await prisma.airdropClaim.aggregate({
        where: { seasonId: currentSeason.id },
        _sum: { tokens: true },
        _count: { id: true }
      })

      const totalAllocation = Number(currentSeason.totalAllocation)
      const claimedAmount = claimed._sum.tokens || 0
      const claimedPercentage = totalAllocation > 0 ? (claimedAmount / totalAllocation) * 100 : 0

      seasonStats = {
        id: currentSeason.id,
        name: currentSeason.name,
        status: currentSeason.status,
        totalAllocation,
        claimed: claimedAmount,
        claimedPercentage,
        totalClaims: claimed._count.id
      }
    }

    // Get tier distribution
    const tierDistribution = await Promise.all([
      prisma.user.count({ where: { twitterActivity: 'HIGH' } }),
      prisma.user.count({ where: { twitterActivity: 'MEDIUM' } }),
      prisma.user.count({ where: { twitterActivity: 'LOW' } })
    ]).then(([high, medium, low]) => [
      { tier: 'HIGH', users: high, tokens: 4500 },
      { tier: 'MEDIUM', users: medium, tokens: 4000 },
      { tier: 'LOW', users: low, tokens: 3000 }
    ])

    // Get recent claims
    const recentClaims = await prisma.airdropClaim.findMany({
      take: 10,
      orderBy: { claimedAt: 'desc' },
      include: {
        user: {
          select: {
            walletAddress: true,
            twitterUsername: true
          }
        }
      }
    })

    return NextResponse.json({
      currentSeason: seasonStats,
      tierDistribution,
      recentClaims: recentClaims.map(claim => ({
        id: claim.id,
        user: {
          walletAddress: claim.user.walletAddress,
          twitterUsername: claim.user.twitterUsername
        },
        tier: claim.tier,
        tokens: claim.tokens,
        claimedAt: claim.claimedAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error fetching airdrop stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}