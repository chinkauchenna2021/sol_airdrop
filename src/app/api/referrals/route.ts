// import { NextRequest, NextResponse } from 'next/server'
// import { getSession } from '@/lib/auth'
// import prisma from '@/lib/prisma'

// export async function GET(req: NextRequest) {
//   const session = await getSession(req)
  
//   if (!session) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//       select: {
//         id: true,
//         referralCode: true,
//         _count: {
//           select: {
//             referrals: {
//               where: { completed: true }
//             }
//           }
//         }
//       }
//     })

//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 })
//     }

//     // Get detailed referral data
//     const [referrals, totalEarned] = await Promise.all([
//       prisma.referral.findMany({
//         where: { referrerId: user.id },
//         include: {
//           referred: {
//             select: {
//               walletAddress: true,
//               twitterUsername: true,
//               isActive: true,
//               createdAt: true
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 10
//       }),
//       prisma.referral.aggregate({
//         where: { 
//           referrerId: user.id,
//           completed: true 
//         },
//         _sum: { points: true }
//       })
//     ])

//     const referralStats = {
//       totalReferrals: referrals.length,
//       activeReferrals: referrals.filter(r => r.completed && r.referred.isActive).length,
//       totalEarned: totalEarned._sum.points || 0,
//       recentReferrals: referrals.map(r => ({
//         id: r.id,
//         walletAddress: r.referred.walletAddress,
//         twitterUsername: r.referred.twitterUsername,
//         points: r.points,
//         completed: r.completed,
//         createdAt: r.createdAt.toISOString()
//       }))
//     }

//     return NextResponse.json({
//       referralCode: user.referralCode,
//       ...referralStats
//     })
//   } catch (error) {
//     console.error('Referral data error:', error)
//     return NextResponse.json(
//       { error: 'Failed to fetch referral data' },
//       { status: 500 }
//     )
//   }
// }




import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TOKENS_CONFIG, ACTIVITY_TYPES } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  const { referredUserId } = await req.json()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Verify the referred user exists
    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId }
    })

    if (!referredUser) {
      return NextResponse.json(
        { error: 'Referred user not found' },
        { status: 404 }
      )
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        referredId: referredUserId
      }
    })

    if (existingReferral) {
      return NextResponse.json(
        { error: 'User already referred' },
        { status: 400 }
      )
    }

    // CHANGED: Award tokens instead of points for referrals
    const tokenReward = TOKENS_CONFIG.REFERRAL

    // Process referral in a transaction
    await prisma.$transaction(async (tx) => {
      // Create referral record (UPDATED: Now stores tokens)
      await tx.referral.create({
        data: {
          referrerId: userId,
          referredId: referredUserId,
          tokens: tokenReward, // CHANGED: Now stores tokens instead of points
          completed: true,
        }
      })

      // Award referral tokens to referrer (CHANGED: Updates token balances)
      await tx.user.update({
        where: { id: userId },
        data: {
          totalTokens: { increment: tokenReward }, // CHANGED: Update token balance
          totalEarnedTokens: { increment: tokenReward } // Also update lifetime tokens
        }
      })

      // Record in activity history (UPDATED: Now tracks tokens)
      await tx.pointHistory.create({
        data: {
          userId,
          points: 0, // No points awarded
          tokens: tokenReward, // CHANGED: Track tokens instead
          type: ACTIVITY_TYPES.TOKENS, // CHANGED: Mark as token activity
          action: 'REFERRAL_BONUS',
          description: `Successful referral: +${tokenReward} tokens`,
          metadata: {
            referredUserId,
            referredUserWallet: referredUser.walletAddress,
            tokenReward
          }
        }
      })

      // OPTIONAL: Also award welcome bonus points to the referred user
      const welcomeBonusPoints = 100 // From POINTS_CONFIG.WELCOME_BONUS

      await tx.user.update({
        where: { id: referredUserId },
        data: {
          totalPoints: { increment: welcomeBonusPoints }
        }
      })

      await tx.pointHistory.create({
        data: {
          userId: referredUserId,
          points: welcomeBonusPoints,
          tokens: 0,
          type: ACTIVITY_TYPES.POINTS,
          action: 'WELCOME_BONUS',
          description: `Welcome bonus: +${welcomeBonusPoints} points`,
          metadata: {
            referrerId: userId,
            pointReward: welcomeBonusPoints
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      tokens: tokenReward, // CHANGED: Return tokens instead of points
      message: `Referral successful! You earned ${tokenReward} tokens!`
    })

  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}

// GET route to fetch referral stats
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Get referral statistics
    const [referrals, totalEarned] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: userId },
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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.referral.aggregate({
        where: { 
          referrerId: userId,
          completed: true 
        },
        _sum: { tokens: true } // CHANGED: Sum tokens instead of points
      })
    ])

    const activeReferrals = referrals.filter(r => r.completed && r.referred.isActive)

    return NextResponse.json({
      success: true,
      referrals: {
        totalReferrals: referrals.length,
        activeReferrals: activeReferrals.length,
        totalEarnedTokens: totalEarned._sum.tokens || 0, // CHANGED: Return tokens
        recentReferrals: referrals.slice(0, 10).map(r => ({
          id: r.id,
          walletAddress: r.referred.walletAddress,
          twitterUsername: r.referred.twitterUsername,
          tokens: r.tokens, // CHANGED: Return tokens instead of points
          completed: r.completed,
          createdAt: r.createdAt.toISOString()
        }))
      }
    })

  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    )
  }
}