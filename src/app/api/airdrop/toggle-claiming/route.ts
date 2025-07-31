import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  await requireAdmin(req)
  
  const { enabled } = await req.json()

  try {
    // Get current active season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: {
        status: {
          in: ['ACTIVE', 'CLAIMING']
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!currentSeason) {
      return NextResponse.json(
        { error: 'No active season found' },
        { status: 404 }
      )
    }

    // Update season status
    const newStatus = enabled ? 'CLAIMING' : 'ACTIVE'
    await prisma.airdropSeason.update({
      where: { id: currentSeason.id },
      data: { 
        status: newStatus,
        startDate: (enabled ? new Date() : null) as any
      }
    })

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Claiming ${enabled ? 'enabled' : 'disabled'} successfully`
    })

  } catch (error) {
    console.error('Toggle claiming error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle claiming status' },
      { status: 500 }
    )
  }
}