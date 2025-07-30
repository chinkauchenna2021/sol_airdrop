// /api/admin/nft-management/stats/route.ts - System Statistics API
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import  prisma  from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get system statistics
    const [
      totalCollections,
      totalMinted,
      totalDistributions,
      totalClaims,
      activeUsers,
      pendingApprovals
    ] = await Promise.all([
      // Total NFT collections created
      prisma.nftCollection.count(),
      
      // Total NFTs minted (sum of all supplies)
      prisma.nftCollection.aggregate({
        _sum: { supply: true }
      }).then(result => result._sum.supply || 0),
      
      // Total distributed NFTs
      prisma.nftDistribution.aggregate({
        _sum: { recipientCount: true }
      }).then(result => result._sum.recipientCount || 0),
      
      // Total token claims completed
      prisma.claim.count({
        where: {
          type: 'NFT_TOKEN',
          status: 'COMPLETED'
        }
      }),
      
      // Active users (users with activity in last 30 days)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Pending approval requests
      prisma.nftClaimApproval.count({
        where: { approved: false }
      })
    ])

    return NextResponse.json({
      totalCollections,
      totalMinted,
      totalDistributed: totalDistributions,
      totalClaimed: totalClaims,
      activeUsers,
      pendingApprovals
    })

  } catch (error: any) {
    console.error('Get NFT management stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    )
  }
}