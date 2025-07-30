// /api/admin/nfts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const nfts = await prisma.nftCollection.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        distributions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { distributions: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      nfts: nfts.map(nft => ({
        mintAddress: nft.mintAddress,
        name: nft.name,
        symbol: nft.symbol,
        supply: nft.supply,
        createdAt: nft.createdAt,
        distributionCount: nft._count.distributions,
        lastDistribution: nft.distributions[0] || null
      }))
    })

  } catch (error: any) {
    console.error('Get NFTs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NFT collections' },
      { status: 500 }
    )
  }
}
