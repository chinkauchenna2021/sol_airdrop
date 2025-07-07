// app/api/user/refresh-activity/route.ts - CREATE this new file
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { updateUserActivityLevel, updateTwitterFollowerCount } from '@/lib/twitter-enhanced'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Update Twitter follower count from API
    await updateTwitterFollowerCount(session.user.id)
    
    // Update activity level based on new data
    await updateUserActivityLevel(session.user.id)
    
    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twitterActivity: true,
        twitterFollowers: true,
        level: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Activity level updated successfully',
      data: {
        activityLevel: updatedUser?.twitterActivity || 'LOW',
        followers: updatedUser?.twitterFollowers || 0,
        level: updatedUser?.level || 1
      }
    })
  } catch (error) {
    console.error('Refresh activity error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh activity level' },
      { status: 500 }
    )
  }
}