import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const alerts = await prisma.fraudAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            walletAddress: true,
            twitterUsername: true
          }
        }
      }
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Fraud alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fraud alerts' },
      { status: 500 }
    )
  }
}
