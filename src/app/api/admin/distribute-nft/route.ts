// /api/admin/distribute-nft/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { mintAddress, userWallets, nftsPerUser } = await req.json()

    if (!mintAddress || !userWallets?.length || !nftsPerUser) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed')
    
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      return NextResponse.json({ error: 'Admin wallet not configured' }, { status: 500 })
    }

    const adminWalletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(adminPrivateKey))
    )

    // Import distribution function
    const { adminMintAndDistributeWorkflow } = await import('@/utils')

    // Convert wallet addresses to PublicKeys
    const userPublicKeys = userWallets.map((addr: string) => new PublicKey(addr))

    // Distribute NFTs
    const result = await adminMintAndDistributeWorkflow(
      connection,
      adminWalletKeypair,
      userPublicKeys,
      { name: 'Distribution', symbol: 'DIST', uri: 'temp' }, // Placeholder metadata
      nftsPerUser
    )

    // Log distribution results
    await prisma.nftDistribution.create({
      data: {
        mintAddress,
        distributedBy: session.user.id,
        recipientCount: userWallets.length,
        nftsPerUser,
        results: JSON.stringify(result.distributionResults),
        success: true
      }
    })

    return NextResponse.json({
      success: true,
      distributionResults: result.distributionResults,
      message: 'NFTs distributed successfully'
    })

  } catch (error: any) {
    console.error('Distribute NFT error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to distribute NFTs' },
      { status: 500 }
    )
  }
}

