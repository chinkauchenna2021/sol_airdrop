import { NextRequest, NextResponse } from 'next/server'
import { authenticateWallet } from '@/lib/auth'
import { validateSolanaAddress } from '@/lib/solana'
import prisma from '@/lib/prisma'


export async function POST(req: NextRequest) {
  console.log('🚀 Wallet auth endpoint called')
  
  try {
    let body;
    try {
      body = await req.json()
      console.log('📦 Request body parsed:', { 
        walletAddress: body?.walletAddress,
        hasReferralCode: !!body?.referralCode 
      })
    } catch (error) {
      console.error('❌ Failed to parse request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { walletAddress, referralCode } = body

    // Validate wallet address
    console.log('🔍 Validating wallet address:', walletAddress)
    if (!walletAddress) {
      console.log('❌ No wallet address provided')
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!validateSolanaAddress(walletAddress)) {
      console.log('❌ Invalid Solana address format')
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    })

    // Authenticate wallet
    console.log('🔐 Calling authenticateWallet...')
    const { user, token } = await authenticateWallet(walletAddress)

    // Process referral if this is a new user and referral code is provided
    if (!existingUser && referralCode) {
      console.log('🔗 Processing referral for new user...')
      try {
        const referralResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/referrals/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode,
            newUserId: user.id
          })
        })

        if (referralResponse.ok) {
          console.log('✅ Referral processed successfully')
        }
      } catch (referralError) {
        console.error('❌ Referral processing failed:', referralError)
        // Don't fail the wallet connection if referral processing fails
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin,
        totalPoints: user.totalPoints,
        twitterUsername: user.twitterUsername,
        referralCode: user.referralCode,
      },
      message: 'Wallet connected successfully'
    })

    // Set auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response

  } catch (error) {
    console.error('❌ Wallet auth route error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}