import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { subDays, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || session.user.id
  const days = parseInt(searchParams.get('days') || '7')

  try {
    const startDate = subDays(new Date(), days)
    
    // Get engagement data grouped by date and type
    const engagements = await prisma.twitterEngagement.groupBy({
      by: ['createdAt', 'engagementType'],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _count: true,
    })

    // Process data for chart
    const dateMap = new Map<string, any>()
    
    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      dateMap.set(date, {
        date,
        likes: 0,
        retweets: 0,
        comments: 0,
        total: 0,
      })
    }

    // Fill in actual engagement data
    engagements.forEach((engagement) => {
      const date = format(new Date(engagement.createdAt), 'yyyy-MM-dd')
      const data = dateMap.get(date)
      
      if (data) {
        const type = engagement.engagementType.toLowerCase()
        if (type in data) {
          data[type] += engagement._count
          data.total += engagement._count
        }
      }
    })

    // Convert map to array and sort by date
    const chartData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Engagement analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    )
  }
}