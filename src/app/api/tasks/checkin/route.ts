import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'
import { POINTS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = startOfDay(new Date())

    // Check if already checked in today
    const existingCheckIn = await prisma.pointHistory.findFirst({
      where: {
        userId: session.user.id,
        action: 'DAILY_CHECK_IN',
        createdAt: { gte: today }
      }
    })

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'You have already checked in today' },
        { status: 400 }
      )
    }

    // Award check-in points
    await prisma.pointHistory.create({
      data: {
        userId: session.user.id,
        points: POINTS.DAILY_CHECK_IN,
        action: 'DAILY_CHECK_IN',
        description: 'Daily check-in bonus',
      }
    })

    // Update user's total points
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalPoints: { increment: POINTS.DAILY_CHECK_IN }
      }
    })

    // Check for streak bonus
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const yesterdayCheckIn = await prisma.pointHistory.findFirst({
      where: {
        userId: session.user.id,
        action: 'DAILY_CHECK_IN',
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    })

    let streakBonus = 0
    if (yesterdayCheckIn) {
      // Calculate streak length (simplified - in production, track in user model)
      const streakDays = await prisma.pointHistory.count({
        where: {
          userId: session.user.id,
          action: 'DAILY_CHECK_IN',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })

      if (streakDays >= 7) {
        streakBonus = 10 // Bonus for 7-day streak
        
        await prisma.pointHistory.create({
          data: {
            userId: session.user.id,
            points: streakBonus,
            action: 'STREAK_BONUS',
            description: '7-day streak bonus!',
          }
        })

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            totalPoints: { increment: streakBonus }
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      points: POINTS.DAILY_CHECK_IN,
      streakBonus,
      message: streakBonus > 0 
        ? `Daily check-in completed! +${POINTS.DAILY_CHECK_IN} points + ${streakBonus} streak bonus!`
        : `Daily check-in completed! +${POINTS.DAILY_CHECK_IN} points`
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    )
  }
}