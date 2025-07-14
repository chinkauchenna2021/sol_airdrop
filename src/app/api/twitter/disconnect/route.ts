import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { twitterAuth } from '@/lib/twitter-auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const success = await twitterAuth.disconnectAccount(session.user.id)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Twitter account disconnected successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to disconnect Twitter account' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Twitter disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Twitter account' },
      { status: 500 }
    )
  }
}