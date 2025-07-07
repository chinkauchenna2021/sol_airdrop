import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { verifyEngagement, verifyFollow, trackEngagement } from '@/lib/twitter'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest
) {

  const requestUrl = new URL(req.url);
  const taskId = requestUrl.searchParams.get("taskId");
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {

    // Get user with Twitter info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twitterId: true,
        twitterUsername: true,
      }
    })

    if (!user?.twitterId) {
      return NextResponse.json(
        { error: 'Twitter account not connected' },
        { status: 400 }
      )
    }

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId  as string}
    })

    if (!task || !task.isActive) {
      return NextResponse.json(
        { error: 'Task not found or inactive' },
        { status: 404 }
      )
    }

    // Check if already completed
    const existing = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId: task.id,
        }
      }
    })

    if (existing?.completed) {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      )
    }

    // Verify task completion based on type
    const requirements = task.requirements as any
    let verified = false

    switch (requirements.action?.toUpperCase()) {
      case 'LIKE':
        verified = await verifyEngagement(user.id, requirements.targetId, 'LIKE')
        break
      case 'RETWEET':
        verified = await verifyEngagement(user.id, requirements.targetId, 'RETWEET')
        break
      case 'COMMENT':
        verified = await verifyEngagement(user.id, requirements.targetId, 'COMMENT')
        break
      case 'FOLLOW':
        verified = await verifyFollow(user.id, requirements.targetUsername || requirements.targetId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid task type' },
          { status: 400 }
        )
    }

    if (!verified) {
      return NextResponse.json(
        { error: 'Task completion could not be verified. Please complete the task and try again.' },
        { status: 400 }
      )
    }

    // Track engagement and award points
    const tracked = await trackEngagement(
      user.id,
      requirements.targetId,
      requirements.action.toUpperCase(),
      task.points
    )

    if (!tracked) {
      return NextResponse.json(
        { error: 'Task already recorded' },
        { status: 400 }
      )
    }

    // Mark task as completed
    await prisma.taskCompletion.upsert({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId: task.id,
        }
      },
      update: {
        completed: true,
        completedAt: new Date(),
        points: task.points,
      },
      create: {
        userId: user.id,
        taskId: task.id,
        completed: true,
        completedAt: new Date(),
        points: task.points,
      }
    })

    return NextResponse.json({
      success: true,
      points: task.points,
      message: `Task completed! You earned ${task.points} points.`
    })
  } catch (error) {
    console.error('Task completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}