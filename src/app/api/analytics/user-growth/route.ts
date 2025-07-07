import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { subDays, format, startOfDay } from 'date-fns'

export async function GET (req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const startDate = subDays(new Date(), days)
    
    // Get users created per day
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        updatedAt: true,
      }
    })

    // Process data for chart
    const dateMap = new Map<string, any>()
    
    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      dateMap.set(date, {
        date,
        users: 0,
        active: 0,
      })
    }

    // Count new users per day
    users.forEach((user) => {
      const date = format(new Date(user.createdAt), 'yyyy-MM-dd')
      const data = dateMap.get(date)
      if (data) {
        data.users += 1
      }
    })

    // Count active users per day (users who were active that day)
    users.forEach((user) => {
      const date = format(new Date(user.updatedAt), 'yyyy-MM-dd')
      const data = dateMap.get(date)
      if (data) {
        data.active += 1
      }
    })

    // Calculate cumulative total
    let cumulativeTotal = await prisma.user.count({
      where: {
        createdAt: { lt: startDate }
      }
    })

    // Convert map to array and add cumulative totals
    const chartData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(day => {
        cumulativeTotal += day.users
        return {
          ...day,
          users: cumulativeTotal,
        }
      })

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('User growth analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user growth data' },
      { status: 500 }
    )
  }
}