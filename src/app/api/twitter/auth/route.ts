import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { TwitterApi } from 'twitter-api-v2'

const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Create Twitter client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
    })

    // Generate OAuth tokens
    const authLink = await client.generateAuthLink(CALLBACK_URL, {
      linkMode: 'authorize',
    })

    // Store OAuth tokens in session/cache for callback
    // In production, use Redis or similar
    const response = NextResponse.json({
      authUrl: authLink.url,
    })

    // Set OAuth tokens as secure cookies
    response.cookies.set('twitter_oauth_token', authLink.oauth_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
    })

    response.cookies.set('twitter_oauth_token_secret', authLink.oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
    })

    response.cookies.set('twitter_auth_user_id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
    })

    return response
  } catch (error) {
    console.error('Twitter auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}