import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  req: NextRequest
) {


  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");
  await requireAdmin(req)

  try {
    const { action } = await req.json()
    const seasonId = id

    let updateData: any = {}

    switch (action) {
      case 'start_claiming':
        updateData = {
          status: 'CLAIMING',
          claimingStartedAt: new Date()
        }
        break
      case 'end_season':
        updateData = {
          status: 'ENDED',
          endDate: new Date()
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const season = await prisma.airdropSeason.update({
      where: { id: String(seasonId)},
      data: updateData
    })

    return NextResponse.json({ 
      success: true, 
      season: {
        ...season,
        totalAllocation: Number(season.totalAllocation)
      }
    })
  } catch (error) {
    console.error('Season action error:', error)
    return NextResponse.json(
      { error: 'Failed to update season' },
      { status: 500 }
    )
  }
}
