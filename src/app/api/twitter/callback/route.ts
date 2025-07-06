import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const oauth_token = searchParams.get('oauth_token')
  const oauth_verifier = searchParams.get('oauth_verifier')
  
  // Get stored tokens from cookies
  const storedToken = req.cookies.get('twitter_oauth_token')?.value
  const storedTokenSecret = req.cookies.get('twitter_oauth_token_secret')?.value
  const userId = req.cookies.get('twitter_auth_user_id')?.value

  if (!oauth_token || !oauth_verifier || !storedToken || !storedTokenSecret || !userId) {
    return NextResponse.redirect(new URL('/dashboard?error=twitter_auth_failed', req.url))
  }

  if (oauth_token !== storedToken) {
    return NextResponse.redirect(new URL('/dashboard?error=invalid_token', req.url))
  }

  try {
    // Create client with temporary tokens
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: oauth_token,
      accessSecret: storedTokenSecret,
    })

    // Get permanent tokens
    const { client: loggedClient, accessToken, accessSecret } = await client.login(oauth_verifier)
    
    // Get user info
    const twitterUser = await loggedClient.v2.me({
      'user.fields': ['profile_image_url', 'username', 'name', 'id']
    })

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterId: twitterUser.data.id,
        twitterUsername: twitterUser.data.username,
        twitterName: twitterUser.data.name,
        twitterImage: twitterUser.data.profile_image_url,
      }
    })

    // Store access tokens securely (in production, encrypt these)
    await prisma.systemConfig.upsert({
      where: { key: `twitter_tokens_${userId}` },
      update: {
        value: {
          accessToken,
          accessSecret,
          userId: twitterUser.data.id,
        }
      },
      create: {
        key: `twitter_tokens_${userId}`,
        value: {
          accessToken,
          accessSecret,
          userId: twitterUser.data.id,
        },
        description: 'User Twitter access tokens'
      }
    })

    // Award points for connecting Twitter
    await prisma.pointHistory.create({
      data: {
        userId,
        points: 50,
        action: 'TWITTER_CONNECT',
        description: 'Connected Twitter account',
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: 50 }
      }
    })

    const response = NextResponse.redirect(new URL('/dashboard?twitter=connected', req.url))
    
    // Clear OAuth cookies
    response.cookies.delete('twitter_oauth_token')
    response.cookies.delete('twitter_oauth_token_secret')
    response.cookies.delete('twitter_auth_user_id')

    return response
  } catch (error) {
    console.error('Twitter callback error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=twitter_auth_failed', req.url))
  }
}