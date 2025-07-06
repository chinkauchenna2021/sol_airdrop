import { NextRequest, NextResponse } from 'next/server'
import { authenticateWallet } from '@/lib/auth'
import { validateSolanaAddress } from '@/lib/solana'

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress || !validateSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    const { user, token } = await authenticateWallet(walletAddress)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin,
        totalPoints: user.totalPoints,
        twitterUsername: user.twitterUsername,
      },
      token,
    })
  } catch (error) {
    console.error('Wallet auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}