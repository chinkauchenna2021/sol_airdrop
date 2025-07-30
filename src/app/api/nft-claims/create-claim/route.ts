// /api/nft-claims/create-claim/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { userWallet, feeAmount, nftPassMints } = await req.json()

    // Validation
    if (!userWallet || !feeAmount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Create claim record
    const claim = await prisma.claim.create({
      data: {
        userId: session.user.id,
        type: 'NFT_TOKEN',
        amount: 0, // Will be updated after successful claim
        status: 'PENDING',
        metadata: JSON.stringify({
          userWallet,
          feeAmount,
          nftPassMints,
          claimType: 'NFT_TOKEN'
        })
      }
    })

    // Use the utility function to create the claim transaction
    const { claimAirdropWithChecks } = await import('@/utils')
    
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed')
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    
    if (!adminPrivateKey) {
      throw new Error('Admin wallet not configured')
    }

    const adminWallet = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(adminPrivateKey))
    )

    // Create the airdrop claim transaction
    const result = await claimAirdropWithChecks(
      new PublicKey(userWallet),
      connection,
      adminWallet,
      nftPassMints || [],
      process.env.SOLANA_NETWORK || 'devnet'
    )

    if (!result.success) {
      await prisma.claim.update({
        where: { id: claim.id },
        data: { 
          status: 'FAILED',
          metadata: JSON.stringify({
            ...JSON.parse(claim.metadata as string),
            error: result.message
          })
        }
      })
      
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      transaction: result.signature // This would be the serialized transaction in real implementation
    })

  } catch (error: any) {
    console.error('Create claim error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create claim' },
      { status: 500 }
    )
  }
}