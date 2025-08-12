// /app/api/claim/balance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      include: {
        claims: {
          where: { status: 'COMPLETED' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate claimable tokens (example: 1 point = 1 token)
    const totalClaimed = user.claims.reduce((sum, claim) => sum + claim.amount, 0)
    const claimableTokens = Math.max(0, user.totalPoints - totalClaimed)

    return NextResponse.json({
      totalPoints: user.totalPoints,
      claimableTokens,
      totalClaimed,
      claimMultiplier: 1.0 // Base multiplier, can be enhanced with NFT passes
    })

  } catch (error: any) {
    console.error('Balance fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}







// /app/api/nft-claims/pass-status/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { checkNftOwnership } from '@/utils/solana'

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const wallet = searchParams.get('wallet')

//     if (!wallet) {
//       return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
//     }

//     // Get NFT passes from database or config
//     const requiredPasses = [
//       // Add your NFT pass mint addresses here
//       // These would be the Connect Pass NFTs that provide benefits
//     ]

//     let hasValidPass = false
//     let passCount = 0
//     let multiplierBonus = 0

//     if (requiredPasses.length > 0) {
//       hasValidPass = await checkNftOwnership(wallet, requiredPasses, 'devnet')
//       if (hasValidPass) {
//         passCount = 1 // For simplicity, assume 1 pass. Could be enhanced to count multiple
//         multiplierBonus = 0.2 // 20% bonus
//       }
//     }

//     return NextResponse.json({
//       hasValidPass,
//       passCount,
//       requiredPasses,
//       multiplierBonus
//     })

//   } catch (error: any) {
//     console.error('NFT pass status error:', error)
//     return NextResponse.json(
//       { error: 'Failed to check NFT pass status' },
//       { status: 500 }
//     )
//   }
// }