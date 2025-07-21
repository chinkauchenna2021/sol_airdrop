import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Get all achievements with user progress
    const achievements = await prisma.achievement.findMany({
      include: {
        userAchievements: {
          where: { userId },
          select: { unlockedAt: true, progress: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format achievements with user progress
    const formattedAchievements = achievements.map(achievement => {
      const userAchievement = achievement.userAchievements[0]
      return {
        id: achievement.id,
        title: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        unlocked: !!userAchievement,
        progress: userAchievement?.progress || 0,
        unlockedAt: userAchievement?.unlockedAt
      }
    })

    return NextResponse.json({ achievements: formattedAchievements })

  } catch (error) {
    console.error('Achievements fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}
