// /api/nft-claims/pass-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Get required NFT passes from system config
    const requiredPassesConfig = await prisma.systemConfig.findUnique({
      where: { key: 'requiredNftPasses' }
    })

    const requiredPasses = requiredPassesConfig?.value ? 
      JSON.parse(requiredPassesConfig.value as any) : []

    // Check NFT ownership using the utility function
    const { checkNftOwnership } = await import('@/utils')
    
    const hasValidPass = await checkNftOwnership(
      wallet,
      requiredPasses,
      process.env.SOLANA_NETWORK || 'devnet'
    )

    // Get user's NFTs (simplified version)
    let passNFTs: any[] = []
    if (hasValidPass) {
      // In production, you'd fetch actual NFT metadata
      passNFTs = requiredPasses.map((mint: string) => ({
        mint,
        name: 'Access Pass NFT',
        symbol: 'PASS',
        image: '/nft-placeholder.png'
      }))
    }

    return NextResponse.json({
      hasValidPass,
      passNFTs,
      requiredPasses,
      isEligible: hasValidPass
    })

  } catch (error: any) {
    console.error('Get pass status error:', error)
    return NextResponse.json(
      { error: 'Failed to check NFT pass status' },
      { status: 500 }
    )
  }
}