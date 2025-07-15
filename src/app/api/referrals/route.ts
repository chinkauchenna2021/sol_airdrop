import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        referralCode: true,
        _count: {
          select: {
            referrals: {
              where: { completed: true }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get detailed referral data
    const [referrals, totalEarned] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: user.id },
        include: {
          referred: {
            select: {
              walletAddress: true,
              twitterUsername: true,
              isActive: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.referral.aggregate({
        where: { 
          referrerId: user.id,
          completed: true 
        },
        _sum: { points: true }
      })
    ])

    const referralStats = {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.completed && r.referred.isActive).length,
      totalEarned: totalEarned._sum.points || 0,
      recentReferrals: referrals.map(r => ({
        id: r.id,
        walletAddress: r.referred.walletAddress,
        twitterUsername: r.referred.twitterUsername,
        points: r.points,
        completed: r.completed,
        createdAt: r.createdAt.toISOString()
      }))
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      ...referralStats
    })
  } catch (error) {
    console.error('Referral data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    )
  }
}