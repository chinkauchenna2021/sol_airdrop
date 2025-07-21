import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Get all active tasks
    const tasks = await prisma.task.findMany({
      where: { isActive: true },
      include: {
        completions: {
          where: { userId },
          select: { completed: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format tasks with completion status
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.name,
      description: task.description,
      points: task.points,
      type: task.type,
      requirements: task.requirements,
      completed: task.completions.length > 0 && task.completions[0].completed,
      expiresAt: task.expiresAt
    }))

    return NextResponse.json({ tasks: formattedTasks })

  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}