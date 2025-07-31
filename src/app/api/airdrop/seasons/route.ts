import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  await requireAdmin(req)
      const session = await getSession(req)
  

  try {
    const seasons = await prisma.airdropSeason.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { claims: true } },
        claims: {
          select: { tokens: true, status: true }
        }
      }
    })

    return NextResponse.json({ seasons })
  } catch (error) {
    console.error('Fetch seasons error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  await requireAdmin(req)
  const session = await getSession(req)
  

  try {
    const { name, totalAllocation } = await req.json()

    // End any currently active seasons
    await prisma.airdropSeason.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'ENDED', endDate: new Date() }
    })

    // Create new season
    const season = await prisma.airdropSeason.create({
      data: {
        name,
        totalAllocation: BigInt(totalAllocation),
        creator: session?.user.id as any,
        status: 'ACTIVE',
        startDate: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      season: {
        ...season,
        totalAllocation: Number(season.totalAllocation)
      }
    })
  } catch (error) {
    console.error('Create season error:', error)
    return NextResponse.json(
      { error: 'Failed to create season' },
      { status: 500 }
    )
  }
}
