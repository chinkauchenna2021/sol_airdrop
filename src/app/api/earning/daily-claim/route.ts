// import { NextRequest, NextResponse } from 'next/server'
// import { getSession } from '@/lib/auth'
// import prisma from '@/lib/prisma'
// import { startOfDay, subDays } from 'date-fns'
// import { ENHANCED_CONFIG } from '@/lib/constants'

// export async function POST(req: NextRequest) {
//   const session = await getSession(req)
  
//   if (!session) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   try {
//     const userId = session.user.id
//     const today = startOfDay(new Date())

//     // Check if already claimed today
//     const existingClaim = await prisma.dailyEarning.findFirst({
//       where: {
//         userId,
//         claimedAt: { gte: today }
//       }
//     })

//     if (existingClaim) {
//       return NextResponse.json(
//         { error: 'Already claimed today' },
//         { status: 400 }
//       )
//     }

//     // Calculate streak and bonus
//     const yesterdayStart = subDays(today, 1)
//     const yesterdayEnd = today
    
//     const yesterdayClaim = await prisma.dailyEarning.findFirst({
//       where: {
//         userId,
//         claimedAt: {
//           gte: yesterdayStart,
//           lt: yesterdayEnd
//         }
//       }
//     })

//     // Calculate current streak
//     let currentStreak = 1
//     if (yesterdayClaim) {
//       // Get all claims in the last 60 days to calculate streak
//       const recentClaims = await prisma.dailyEarning.findMany({
//         where: {
//           userId,
//           claimedAt: { gte: subDays(today, 60) }
//         },
//         orderBy: { claimedAt: 'desc' }
//       })

//       let streak = 1
//       let checkDate = subDays(today, 1)
      
//       for (const claim of recentClaims) {
//         const claimDate = startOfDay(new Date(claim.claimedAt))
//         if (claimDate.getTime() === checkDate.getTime()) {
//           streak++
//           checkDate = subDays(checkDate, 1)
//         } else {
//           break
//         }
//       }
      
//       currentStreak = streak
//     }

//     // Calculate bonus tokens for streaks
//     let bonusTokens = 0
//     if (currentStreak >= 30) {
//       bonusTokens = 15 // 30-day streak bonus
//     } else if (currentStreak >= 7) {
//       bonusTokens = 5 // 7-day streak bonus
//     }

//     const totalTokens = ENHANCED_CONFIG.DAILY_EARNING.LOGIN_REWARD + bonusTokens

//     // Create daily earning record
//     const dailyEarning = await prisma.dailyEarning.create({
//       data: {
//         userId,
//         tokens: totalTokens,
//         type: 'LOGIN_BONUS',
//         claimedAt: new Date(),
//       }
//     })

//     // Update user's total earned tokens and streak
//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         totalEarnedTokens: { increment: totalTokens },
//         lastLoginReward: new Date(),
//         streak: currentStreak,
//       }
//     })

//     return NextResponse.json({
//       success: true,
//       tokens: totalTokens,
//       baseReward: ENHANCED_CONFIG.DAILY_EARNING.LOGIN_REWARD,
//       bonusTokens,
//       currentStreak,
//       message: `Earned ${totalTokens} CONNECT tokens! ${bonusTokens > 0 ? `(+${bonusTokens} streak bonus)` : ''}`
//     })

//   } catch (error) {
//     console.error('Daily claim error:', error)
//     return NextResponse.json(
//       { error: 'Failed to process daily claim' },
//       { status: 500 }
//     )
//   }
// }




import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, addHours } from 'date-fns'
import { POINTS_CONFIG, ACTIVITY_TYPES } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const today = startOfDay(new Date())

    // Check if already claimed today
    const existingClaim = await prisma.pointHistory.findFirst({
      where: {
        userId,
        action: 'DAILY_CHECK_IN',
        createdAt: { gte: today }
      }
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: 'You have already claimed your daily reward today' },
        { status: 400 }
      )
    }

    // Get user's current streak and calculate rewards
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, totalPoints: true, lastCheckIn: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate streak
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let newStreak = 1
    if (user.lastCheckIn) {
      const lastCheckin = startOfDay(user.lastCheckIn)
      if (lastCheckin.getTime() === yesterday.getTime()) {
        newStreak = user.streak + 1
      }
    }

    // Calculate rewards (POINTS only, no tokens)
    let pointsReward = POINTS_CONFIG.DAILY_CHECK_IN
    let streakBonus = 0
    
    // Add streak bonuses
    if (newStreak >= 30) {
      streakBonus = POINTS_CONFIG.STREAK_BONUS_30_DAYS
    } else if (newStreak >= 7) {
      streakBonus = POINTS_CONFIG.STREAK_BONUS_7_DAYS
    }

    const totalPoints = pointsReward + streakBonus

    // Process claim in transaction
    await prisma.$transaction(async (tx) => {
      // Update user points and streak
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: totalPoints }, // UNCHANGED: Still gives points
          streak: newStreak,
          lastCheckIn: new Date()
        }
      })

      // Record daily check-in points
      await tx.pointHistory.create({
        data: {
          userId,
          points: pointsReward, // UNCHANGED: Awards points
          tokens: 0, // No tokens from daily claims
          type: ACTIVITY_TYPES.POINTS, // Mark as points activity
          action: 'DAILY_CHECK_IN',
          description: `Daily check-in: +${pointsReward} points`,
          metadata: {
            pointsReward,
            streak: newStreak,
            isConsecutive: user.lastCheckIn ? true : false
          }
        }
      })

      // Record streak bonus if applicable
      if (streakBonus > 0) {
        await tx.pointHistory.create({
          data: {
            userId,
            points: streakBonus,
            tokens: 0,
            type: ACTIVITY_TYPES.POINTS,
            action: newStreak >= 30 ? 'STREAK_BONUS_30' : 'STREAK_BONUS_7',
            description: `${newStreak}-day streak bonus: +${streakBonus} points`,
            metadata: {
              streakBonus,
              streakDays: newStreak,
              bonusType: newStreak >= 30 ? '30_DAY' : '7_DAY'
            }
          }
        })
      }

      // Update DailyEarning record for tracking (UPDATED: Track points, not tokens)
      await tx.dailyEarning.create({
        data: {
          userId,
          points: totalPoints, // NEW: Track points earned
          tokens: 0, // No tokens from daily claims
          type: 'LOGIN_BONUS',
          rewardType: ACTIVITY_TYPES.POINTS, // NEW: Mark reward type
        }
      })
    })

    return NextResponse.json({
      success: true,
      points: totalPoints, // Return points earned
      breakdown: {
        dailyPoints: pointsReward,
        streakBonus: streakBonus,
        totalPoints: totalPoints
      },
      currentStreak: newStreak,
      nextClaimIn: 24, // Hours until next claim
      message: streakBonus > 0 
        ? `Daily check-in completed! +${pointsReward} points + ${streakBonus} streak bonus!`
        : `Daily check-in completed! +${pointsReward} points earned.`
    })

  } catch (error) {
    console.error('Daily claim error:', error)
    return NextResponse.json(
      { error: 'Failed to process daily claim' },
      { status: 500 }
    )
  }
}

// GET route to check daily claim status
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const today = startOfDay(new Date())

    // Check if claimed today
    const todayClaim = await prisma.pointHistory.findFirst({
      where: {
        userId,
        action: 'DAILY_CHECK_IN',
        createdAt: { gte: today }
      }
    })

    // Get user streak info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        streak: true, 
        lastCheckIn: true,
        totalPoints: true 
      }
    })

    // Calculate next claim time
    let nextClaimTime = null
    if (todayClaim) {
      nextClaimTime = addHours(today, 24).toISOString()
    }

    // Calculate potential rewards
    const baseReward = POINTS_CONFIG.DAILY_CHECK_IN
    let potentialStreakBonus = 0
    
    if (user?.streak && user.streak >= 29) {
      potentialStreakBonus = POINTS_CONFIG.STREAK_BONUS_30_DAYS
    } else if (user?.streak && user.streak >= 6) {
      potentialStreakBonus = POINTS_CONFIG.STREAK_BONUS_7_DAYS
    }

    return NextResponse.json({
      success: true,
      canClaim: !todayClaim,
      alreadyClaimed: !!todayClaim,
      currentStreak: user?.streak || 0,
      nextClaimTime,
      rewards: {
        basePoints: baseReward,
        streakBonus: potentialStreakBonus,
        totalPotential: baseReward + potentialStreakBonus
      }
    })

  } catch (error) {
    console.error('Daily claim status error:', error)
    return NextResponse.json(
      { error: 'Failed to check daily claim status' },
      { status: 500 }
    )
  }
}