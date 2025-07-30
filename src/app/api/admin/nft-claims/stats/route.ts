import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import  prisma  from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [
      totalEligible,
      totalApproved,
      totalClaimed,
      totalDistributed,
      pendingApprovals,
      activeUsers
    ] = await Promise.all([
      // Users with minimum requirements met
      prisma.user.count({
        where: {
          AND: [
            { twitterId: { not: null } },
            { walletAddress: { not: '' } },
            { totalPoints: { gte: 100 } }
          ]
        }
      }),
      
      // Users approved for claiming
      prisma.nftClaimApproval.count({
        where: { approved: true }
      }),
      
      // Completed claims
      prisma.claim.count({
        where: {
          type: 'NFT_TOKEN',
          status: 'COMPLETED'
        }
      }),
      
      // Total tokens distributed via claims
      prisma.claim.aggregate({
        where: {
          type: 'NFT_TOKEN',
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }).then((result: { _sum: { amount: any } }) => result._sum.amount || 0),
      
      // Pending approvals
      prisma.nftClaimApproval.count({
        where: { approved: false }
      }),
      
      // Recently active users
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return NextResponse.json({
      totalEligible,
      totalApproved,
      totalClaimed,
      totalDistributed,
      pendingApprovals,
      activeUsers
    })

  } catch (error: any) {
    console.error('Get claim stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim statistics' },
      { status: 500 }
    )
  }
}