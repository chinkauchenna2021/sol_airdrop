// /app/api/claim/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet }
    })

    if (!user) {
      return NextResponse.json({ claims: [] })
    }

    const claims = await prisma.claim.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const formattedClaims = claims.map(claim => ({
      id: claim.id,
      amount: claim.amount,
      timestamp: claim.createdAt.toISOString(),
      status: claim.status,
      transactionHash: claim.transactionHash,
      feesPaid: claim.feesPaid,
      type: claim.type
    }))

    return NextResponse.json({ claims: formattedClaims })

  } catch (error: any) {
    console.error('Claim history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim history' },
      { status: 500 }
    )
  }
}