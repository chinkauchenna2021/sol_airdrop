import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, differenceInHours } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const today = startOfDay(new Date())

    // Check if already claimed today
    const todaysClaim = await prisma.dailyEarning.findFirst({
      where: {
        userId,
        claimedAt: { gte: today }
      }
    })

    // Calculate total earned
    const totalEarned = await prisma.dailyEarning.aggregate({
      where: { userId },
      _sum: { tokens: true }
    })

    // Calculate current streak
    let currentStreak = 0
    const recentClaims = await prisma.dailyEarning.findMany({
      where: { userId },
      orderBy: { claimedAt: 'desc' },
      take: 30
    })

    // Calculate streak logic
    if (recentClaims.length > 0) {
      const sortedClaims = recentClaims.sort((a, b) => 
        new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()
      )

      let streak = 0
      let currentDate = startOfDay(new Date())
      
      for (const claim of sortedClaims) {
        const claimDate = startOfDay(new Date(claim.claimedAt))
        const diffDays = Math.floor((currentDate.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === streak) {
          streak++
        } else if (diffDays === streak + 1 && !todaysClaim) {
          // Allow for today not being claimed yet
          streak++
        } else {
          break
        }
      }
      currentStreak = streak
    }

    const nextClaimIn = todaysClaim ? 24 - differenceInHours(new Date(), todaysClaim.claimedAt) : 0

    return NextResponse.json({
      canClaim: !todaysClaim,
      currentStreak,
      totalEarned: totalEarned._sum.tokens || 0,
      nextClaimIn: Math.max(0, nextClaimIn),
      lastClaim: todaysClaim?.claimedAt
    })

  } catch (error) {
    console.error('Error fetching earning status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}