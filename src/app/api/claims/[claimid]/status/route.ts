import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { claimId } = params

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        status: true,
        amount: true,
        transactionHash: true,
        createdAt: true,
        processedAt: true,
        userId: true,
        metadata: true,
      }
    })

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (claim.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: claim.id,
      status: claim.status,
      amount: claim.amount,
      transactionHash: claim.transactionHash,
      createdAt: claim.createdAt,
      processedAt: claim.processedAt,
      metadata: claim.metadata,
    })
  } catch (error) {
    console.error('Claim status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim status' },
      { status: 500 }
    )
  }
}