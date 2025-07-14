// import { NextRequest, NextResponse } from 'next/server'
// import { getSession } from '@/lib/auth'
// import { TwitterApi } from 'twitter-api-v2'

// const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`

// export async function GET(req: NextRequest) {
//   const session = await getSession(req)
  
//   if (!session) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   try {
//     // Create Twitter client
//     const client = new TwitterApi({
//       appKey: process.env.TWITTER_API_KEY!,
//       appSecret: process.env.TWITTER_API_SECRET!,
//       accessToken: process.env.TWITTER_ACCESS_TOKEN_KEY,
//       accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
//     })

//     // Generate OAuth tokens
//     const authLink = await client.generateAuthLink(CALLBACK_URL, {
//       linkMode: 'authorize',
//     })

//     console.log(authLink , client)

//     // Store OAuth tokens in session/cache for callback
//     // In production, use Redis or similar
//     const response = NextResponse.json({
//       authUrl: authLink.url,
//     })

//     // Set OAuth tokens as secure cookies
//     response.cookies.set('twitter_oauth_token', authLink.oauth_token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 60 * 15, // 15 minutes
//     })

//     response.cookies.set('twitter_oauth_token_secret', authLink.oauth_token_secret, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 60 * 15,
//     })

//     response.cookies.set('twitter_auth_user_id', session.user.id, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 60 * 15,
//     })

//     return response
//   } catch (error) {
//     console.error('Twitter auth error:', error)
//     return NextResponse.json(
//       { error: 'Failed to generate auth URL' },
//       { status: 500 }
//     )
//   }
// }


import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { twitterAuth } from '@/lib/twitter-auth'

export async function GET(req: NextRequest) {
  try {
    console.log('🐦 Twitter auth initiated')
    console.log('📍 Request URL:', req.url)
    console.log('🍪 All cookies:', req.cookies.getAll())
    
    // Check for auth token specifically
    const authToken = req.cookies.get('auth-token')
    console.log('🔑 Auth token present:', !!authToken?.value)
    if (authToken?.value) {
      console.log('🔑 Auth token preview:', authToken.value.substring(0, 20) + '...')
    }

    // ENHANCED: More detailed session debugging
    const session = await getSession(req)
    
    if (!session) {
      console.log('❌ No session found - details:')
      console.log('   - Auth token exists:', !!authToken?.value)
      console.log('   - Token length:', authToken?.value?.length || 0)
      
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please connect your wallet first',
          debug: {
            hasAuthToken: !!authToken?.value,
            tokenLength: authToken?.value?.length || 0,
            allCookies: req.cookies.getAll().map(c => c.name)
          }
        },
        { status: 401 }
      )
    }

    console.log('✅ Session found for user:', session.user.id)
    console.log('👤 User details:', {
      id: session.user.id,
      wallet: session.user.walletAddress,
      isAdmin: session.user.isAdmin
    })

    const { authUrl, state } = await twitterAuth.generateAuthUrl(session.user.id)

    const response = NextResponse.json({
      authUrl,
      success: true,
      user: session.user
    })

    // Store state in secure cookie
    response.cookies.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/'
    })

    console.log('🔗 Auth URL generated successfully')
    return response

  } catch (error) {
    console.error('❌ Twitter auth error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initiate Twitter authentication',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}