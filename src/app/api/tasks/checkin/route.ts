import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { POINTS_CONFIG, TOKENS_CONFIG, ACTIVITY_TYPES, isTokenActivity, isPointActivity, getTwitterTokenReward, getPointsReward } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { taskId } = await req.json()
    const userId = session.user.id

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        name: true,
        type: true,
        points: true,
        tokens: true,
        rewardType: true,
        requirements: true,
        isActive: true,
        expiresAt: true
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (!task.isActive) {
      return NextResponse.json(
        { error: 'Task is no longer active' },
        { status: 400 }
      )
    }

    if (task.expiresAt && new Date() > task.expiresAt) {
      return NextResponse.json(
        { error: 'Task has expired' },
        { status: 400 }
      )
    }

    // Check if task is already completed
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId: task.id
        }
      }
    })

    if (existingCompletion && existingCompletion.completed) {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      )
    }

    // Get user for validation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        twitterId: true,
        twitterUsername: true,
        isActive: true,
        isBanned: true,
        totalPoints:true,
      }
    })

    if (!user || user.isBanned || !user.isActive) {
      return NextResponse.json(
        { error: 'User account is not eligible' },
        { status: 403 }
      )
    }

    // Validate task requirements based on type
    const requirements = task.requirements as any
    let validationPassed = true
    let validationError = ''

    switch (task.type) {
      case 'WALLET_CONNECT':
        if (!user.walletAddress) {
          validationPassed = false
          validationError = 'Wallet must be connected'
        }
        break
        
      case 'SOCIAL_TWITTER':
        if (!user.twitterId) {
          validationPassed = false
          validationError = 'Twitter account must be connected'
        }
        // Additional Twitter engagement validation could go here
        break
        
      case 'REFERRAL':
        // Referral validation would check actual referral records
        const referralCount = await prisma.referral.count({
          where: { 
            referrerId: userId, 
            completed: true 
          }
        })
        if (requirements.referrals && referralCount < requirements.referrals) {
          validationPassed = false
          validationError = `Need ${requirements.referrals} referrals, you have ${referralCount}`
        }
        break
        
      case 'DAILY_CHECK_IN':
        // Check if daily check-in was done today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayCheckIn = await prisma.pointHistory.findFirst({
          where: {
            userId,
            action: 'DAILY_CHECK_IN',
            createdAt: { gte: today }
          }
        })
        if (!todayCheckIn) {
          validationPassed = false
          validationError = 'Daily check-in must be completed first'
        }
        break
        
      case 'CUSTOM':
        // Custom task validation based on requirements
        if (requirements.points && user.totalPoints < requirements.points) {
          validationPassed = false
          validationError = `Need ${requirements.points} points, you have ${user.totalPoints}`
        }
        if (requirements.level) {
          const userLevel = Math.floor(user.totalPoints / 1000) + 1
          if (userLevel < requirements.level) {
            validationPassed = false
            validationError = `Need level ${requirements.level}, you are level ${userLevel}`
          }
        }
        break
    }

    if (!validationPassed) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Calculate rewards based on task reward type
    let pointsReward = 0
    let tokensReward = 0
    let rewardType = task.rewardType || 'POINTS'

    switch (rewardType) {
      case 'POINTS':
        pointsReward = task.points || 0
        break
      case 'TOKENS':
        tokensReward = task.tokens || 0
        break
      case 'BOTH':
        pointsReward = task.points || 0
        tokensReward = task.tokens || 0
        break
      default:
        // Legacy: determine by task type
        if (task.type === 'REFERRAL' || task.type === 'SOCIAL_TWITTER') {
          tokensReward = task.points || getTwitterTokenReward('TASK')
          rewardType = 'TOKENS'
        } else {
          pointsReward = task.points || getPointsReward('TASK_COMPLETION')
          rewardType = 'POINTS'
        }
    }

    // Process task completion in a transaction
    await prisma.$transaction(async (tx) => {
      // Mark task as completed
      await tx.taskCompletion.upsert({
        where: {
          userId_taskId: {
            userId,
            taskId: task.id,
          }
        },
        update: {
          completed: true,
          completedAt: new Date(),
          points: pointsReward,
          tokens: tokensReward,
          rewardType: rewardType
        },
        create: {
          userId,
          taskId: task.id,
          completed: true,
          completedAt: new Date(),
          points: pointsReward,
          tokens: tokensReward,
          rewardType: rewardType
        }
      })

      // Update user balances
      const updateData: any = {}
      if (pointsReward > 0) {
        updateData.totalPoints = { increment: pointsReward }
      }
      if (tokensReward > 0) {
        updateData.totalTokens = { increment: tokensReward }
        updateData.totalEarnedTokens = { increment: tokensReward }
      }

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: updateData
        })
      }

      // Record in activity history
      if (pointsReward > 0) {
        await tx.pointHistory.create({
          data: {
            userId,
            points: pointsReward,
            tokens: 0,
            type: ACTIVITY_TYPES.POINTS,
            action: 'TASK_COMPLETION',
            description: `Task completed: ${task.name} (+${pointsReward} points)`,
            metadata: {
              taskId: task.id,
              taskName: task.name,
              taskType: task.type,
              pointsReward
            }
          }
        })
      }

      if (tokensReward > 0) {
        await tx.pointHistory.create({
          data: {
            userId,
            points: 0,
            tokens: tokensReward,
            type: ACTIVITY_TYPES.TOKENS,
            action: 'TASK_COMPLETION',
            description: `Task completed: ${task.name} (+${tokensReward} tokens)`,
            metadata: {
              taskId: task.id,
              taskName: task.name,
              taskType: task.type,
              tokensReward
            }
          }
        })
      }
    })

    // Prepare response message
    let message = `Task completed: ${task.name}!`
    const rewards = []
    
    if (pointsReward > 0) {
      rewards.push(`${pointsReward} points`)
    }
    if (tokensReward > 0) {
      rewards.push(`${tokensReward} tokens`)
    }
    
    if (rewards.length > 0) {
      message += ` You earned ${rewards.join(' and ')}.`
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        name: task.name,
        type: task.type,
        completed: true
      },
      rewards: {
        points: pointsReward,
        tokens: tokensReward,
        type: rewardType
      },
      message
    })

  } catch (error) {
    console.error('Task completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}

// GET route to fetch available tasks
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    
    // Get user info for task filtering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
        totalTokens: true,
        twitterId: true,
        walletAddress: true,
        level: true,
        _count: {
          select: {
            referrals: { where: { completed: true } }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get available tasks with completion status
    const tasks = await prisma.task.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        completions: {
          where: { userId },
          select: {
            completed: true,
            completedAt: true,
            points: true,
            tokens: true,
            rewardType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format tasks with completion status and eligibility
    const formattedTasks = tasks.map(task => {
      const completion = task.completions[0]
      const isCompleted = completion?.completed || false
      
      // Check eligibility
      let isEligible = true
      let eligibilityReason = ''
      
      const requirements = task.requirements as any
      
      switch (task.type) {
        case 'WALLET_CONNECT':
          if (!user.walletAddress) {
            isEligible = !isCompleted // Can still complete if not done
            eligibilityReason = 'Connect your wallet first'
          }
          break
          
        case 'SOCIAL_TWITTER':
          if (!user.twitterId) {
            isEligible = false
            eligibilityReason = 'Connect your Twitter account first'
          }
          break
          
        case 'REFERRAL':
          if (requirements.referrals) {
            const referralCount = user._count.referrals
            if (referralCount < requirements.referrals) {
              isEligible = false
              eligibilityReason = `Need ${requirements.referrals} referrals (you have ${referralCount})`
            }
          }
          break
          
        case 'CUSTOM':
          if (requirements.points && user.totalPoints < requirements.points) {
            isEligible = false
            eligibilityReason = `Need ${requirements.points} points (you have ${user.totalPoints})`
          }
          if (requirements.level) {
            const userLevel = Math.floor(user.totalPoints / 1000) + 1
            if (userLevel < requirements.level) {
              isEligible = false
              eligibilityReason = `Need level ${requirements.level} (you are level ${userLevel})`
            }
          }
          break
      }

      return {
        id: task.id,
        name: task.name,
        description: task.description,
        type: task.type,
        points: task.points || 0,
        tokens: task.tokens || 0,
        rewardType: task.rewardType || 'POINTS',
        requirements: task.requirements,
        isActive: task.isActive,
        expiresAt: task.expiresAt?.toISOString(),
        isCompleted,
        isEligible: isEligible && !isCompleted,
        eligibilityReason,
        completedAt: completion?.completedAt?.toISOString(),
        earnedRewards: completion ? {
          points: completion.points || 0,
          tokens: completion.tokens || 0,
          type: completion.rewardType || 'POINTS'
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      userStats: {
        totalPoints: user.totalPoints,
        totalTokens: user.totalTokens,
        level: Math.floor(user.totalPoints / 1000) + 1,
        referralCount: user._count.referrals,
        hasWallet: !!user.walletAddress,
        hasTwitter: !!user.twitterId
      }
    })

  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}