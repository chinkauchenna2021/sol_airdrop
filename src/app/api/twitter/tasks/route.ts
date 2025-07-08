import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user with completed tasks
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tasks: {
          where: { completed: true },
          select: { taskId: true }
        }
      }
    })

    if (!user || !user.twitterId) {
      return NextResponse.json({ 
        error: 'Twitter not connected',
        tasks: [] 
      }, { status: 400 })
    }

    // Get available Twitter tasks
    const tasks = await prisma.task.findMany({
      where: {
        type: 'SOCIAL_TWITTER',
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    // Get completed engagements
    const completedEngagements = await prisma.twitterEngagement.findMany({
      where: { userId: user.id },
      select: {
        tweetId: true,
        engagementType: true
      }
    })

    // Format tasks with completion status
    const formattedTasks = tasks.map((task:any | unknown ) => {
      const requirements = task.requirements as any
      const isCompleted = user.tasks.some((t:{
    taskId: string;
}) => t.taskId === task.id) ||
        completedEngagements.some((e:{tweetId: string;engagementType: any}) => 
          e.tweetId === requirements.targetId && 
          e.engagementType === requirements.action?.toUpperCase()
        )

      return {
        id: task.id,
        type: requirements.action?.toUpperCase() || 'CUSTOM',
        targetId: requirements.targetId || '',
        targetUsername: requirements.targetUsername,
        points: task.points,
        completed: isCompleted,
        description: task.description,
        tweetUrl: requirements.tweetUrl,
      }
    })

    // Add some default tasks if none exist
    if (formattedTasks.length === 0) {
      const defaultTasks = [
        {
          id: 'default-1',
          type: 'FOLLOW',
          targetId: '1234567890',
          targetUsername: 'SolanaAirdrop',
          points: 50,
          completed: false,
          description: 'Follow our official Twitter account',
        },
        {
          id: 'default-2',
          type: 'LIKE',
          targetId: '1234567890',
          targetUsername: 'SolanaAirdrop',
          points: 10,
          completed: false,
          description: 'Like our latest tweet',
          tweetUrl: 'https://twitter.com/SolanaAirdrop/status/1234567890',
        },
        {
          id: 'default-3',
          type: 'RETWEET',
          targetId: '1234567890',
          targetUsername: 'SolanaAirdrop',
          points: 20,
          completed: false,
          description: 'Retweet our announcement',
          tweetUrl: 'https://twitter.com/SolanaAirdrop/status/1234567890',
        },
      ]
      
      return NextResponse.json({ tasks: defaultTasks })
    }

    return NextResponse.json({ tasks: formattedTasks })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}