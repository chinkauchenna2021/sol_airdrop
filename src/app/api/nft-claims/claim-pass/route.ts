// /api/nft-claims/claim-pass/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { transferNftWithSolCheck, getSolAmountForUsd } from '@/utils'
import   prisma   from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { walletAddress, feeAmount } = await req.json()

    if (!walletAddress || !feeAmount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Check if NFT pass claiming is enabled
    const claimingEnabled = await prisma.systemConfig.findUnique({
      where: { key: 'claimingEnabled' }
    })

    if (!claimingEnabled?.value || Boolean(claimingEnabled.value) === false) {
      return NextResponse.json({ error: 'NFT pass claiming is disabled' }, { status: 403 })
    }

    // Get current airdrop season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: { status: 'ACTIVE' }
    })

    if (!currentSeason) {
      return NextResponse.json({ error: 'No active airdrop season' }, { status: 400 })
    }

    // Verify the fee amount is correct ($4 worth of SOL)
    const { solAmount } = await getSolAmountForUsd(4)
    
    if (Math.abs(feeAmount - solAmount) > 0.001) {
      return NextResponse.json({ error: 'Incorrect fee amount' }, { status: 400 })
    }

    // Create connection
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed')
    
    // Get admin wallet
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      return NextResponse.json({ error: 'Admin wallet not configured' }, { status: 500 })
    }

    const adminWallet = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(adminPrivateKey))
    )

    const userWallet = new PublicKey(walletAddress)

    // Transfer NFT pass with SOL fee check
    const signature = await transferNftWithSolCheck(
      userWallet,
      connection,
      adminWallet
    )

    if (!signature) {
      return NextResponse.json({ 
        error: 'Failed to transfer NFT pass or insufficient SOL balance' 
      }, { status: 400 })
    }

    // Record the NFT pass claim
    await prisma.claim.create({
      data: {
        userId: session.user.id,
        type: 'NFT_PASS',
        amount: 1,
        status: 'COMPLETED',
        transactionHash: signature,
        feesPaid: feeAmount,
        metadata: {
          walletAddress,
          nftMint: process.env.NEXT_PUBLIC_NFT_MINT_ADDRESS,
          feeUSD: 4,
          timestamp: new Date().toISOString()
        }
      }
    })

    // Record NFT holding
    await prisma.userNftHolding.create({
      data: {
        userId: session.user.id,
        mintAddress: process.env.NEXT_PUBLIC_NFT_MINT_ADDRESS!,
        tokenAccount: signature, // Using signature as temporary token account
        amount: 1,
        metadata: {
          claimType: 'NFT_PASS',
          feeUSD: 4
        }
      }
    })

    return NextResponse.json({
      success: true,
      signature,
      message: 'NFT pass claimed successfully'
    })

  } catch (error: any) {
    console.error('NFT pass claim error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to claim NFT pass' },
      { status: 500 }
    )
  }
}