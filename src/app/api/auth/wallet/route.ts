import { NextRequest, NextResponse } from 'next/server'
import { authenticateWallet } from '@/lib/auth'
import { validateSolanaAddress } from '@/lib/solana'

export async function POST(req: NextRequest) {
  console.log('🚀 Wallet auth endpoint called')
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json()
      console.log('📦 Request body parsed:', { walletAddress: body?.walletAddress })
    } catch (error) {
      console.error('❌ Failed to parse request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { walletAddress } = body

    // Validate wallet address
    console.log('🔍 Validating wallet address:', walletAddress)
    if (!walletAddress) {
      console.log('❌ No wallet address provided')
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (typeof walletAddress !== 'string') {
      console.log('❌ Wallet address is not a string:', typeof walletAddress)
      return NextResponse.json(
        { error: 'Wallet address must be a string' },
        { status: 400 }
      )
    }

    // Check Solana address validation
    let isValidAddress;
    try {
      isValidAddress = validateSolanaAddress(walletAddress)
      console.log('✅ Address validation result:', isValidAddress)
    } catch (error) {
      console.error('❌ Address validation error:', error)
      return NextResponse.json(
        { error: 'Address validation failed' },
        { status: 400 }
      )
    }

    if (!isValidAddress) {
      console.log('❌ Invalid Solana address format')
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Authenticate wallet
    console.log('🔐 Calling authenticateWallet...')
    let authResult;
    try {
      authResult = await authenticateWallet(walletAddress)
      console.log('✅ Authentication successful:', {
        userId: authResult.user.id,
        isNewUser: !authResult.user.createdAt,
        tokenLength: authResult.token.length
      })
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      )
    }

    const { user, token } = authResult

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin,
        totalPoints: user.totalPoints,
        twitterUsername: user.twitterUsername,
      },
      message: 'Wallet connected successfully'
    })

    // Set auth cookie
    console.log('🍪 Setting auth cookie...')
    try {
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })
      console.log('✅ Auth cookie set successfully')
    } catch (error) {
      console.error('❌ Failed to set cookie:', error)
    }

    return response

  } catch (error) {
    console.error('❌ Wallet auth route error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}