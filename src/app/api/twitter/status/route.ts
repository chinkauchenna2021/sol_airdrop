import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { twitterAuth } from '@/lib/twitter-auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const isConnected = await twitterAuth.isConnected(session.user.id)

    let twitterProfile = null
    if (isConnected) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          twitterId: true,
          twitterUsername: true,
          twitterName: true,
          twitterImage: true,
          twitterFollowers: true,
          twitterActivity: true
        }
      })

      if (user?.twitterId) {
        twitterProfile = {
          id: user.twitterId,
          username: user.twitterUsername,
          name: user.twitterName,
          profileImage: user.twitterImage,
          followers: user.twitterFollowers,
          activityLevel: user.twitterActivity
        }
      }
    }

    return NextResponse.json({
      connected: isConnected,
      profile: twitterProfile
    })
  } catch (error) {
    console.error('Twitter status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check Twitter connection status' },
      { status: 500 }
    )
  }
}