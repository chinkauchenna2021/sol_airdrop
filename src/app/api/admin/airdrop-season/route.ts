import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TOKEN_CONFIG } from '@/lib/constants'


export async function POST(req: NextRequest) {
        const session = await getSession(req)
        if (!session || !session.user.isAdmin) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    
  const { action, seasonId } = await req.json()

  try {
    if (action === 'start_claiming') {
      // End current active season
      await prisma.airdropSeason.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'ENDED' }
      })

      // Start claiming phase for specified season
      const season = await prisma.airdropSeason.update({
        where: { id: seasonId },
        data: { 
          status: 'CLAIMING'
        }
      })

      return NextResponse.json({
        success: true,
        season,
        message: 'Airdrop claiming phase started'
      })
    }

    if (action === 'create_season') {
      const season = await prisma.airdropSeason.create({
        data: {
          name: `Season ${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
          status: 'ACTIVE',
          creator: session.user.id as any,
          totalAllocation: TOKEN_CONFIG.AIRDROP_ALLOCATION / 4, // Quarterly allocation
          startDate: new Date(),
           
        }
      })

      return NextResponse.json({
        success: true,
        season,
        message: 'New airdrop season created'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Airdrop season error:', error)
    return NextResponse.json(
      { error: 'Failed to manage airdrop season' },
      { status: 500 }
    )
  }
}
