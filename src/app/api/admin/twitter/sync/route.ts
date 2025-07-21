import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateUserActivityLevel } from '@/lib/twitter-enhanced'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  await requireAdmin(req)

  try {
    // Get all users with Twitter accounts
    const twitterUsers = await prisma.user.findMany({
      where: {
        twitterId: { not: null }
      },
      select: { id: true }
    })

    let updatedCount = 0
    
    // Update activity levels for all Twitter users
    for (const user of twitterUsers) {
      try {
        await updateUserActivityLevel(user.id)
        updatedCount++
      } catch (error) {
        console.error(`Failed to update user ${user.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} user activity levels`,
      totalUsers: twitterUsers.length,
      updatedUsers: updatedCount
    })

  } catch (error) {
    console.error('Twitter sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync Twitter data' },
      { status: 500 }
    )
  }
}