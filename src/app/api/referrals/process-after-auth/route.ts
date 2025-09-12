import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { POINTS } from '@/lib/constants';
import { getSession } from '@/lib/next-auth/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referralCode } = await req.json();
    const userId = session.user.id;

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    // Check if user already has a referral (prevent multiple referrals)
    const existingReferral = await prisma.referral.findUnique({
      where: { referredId: userId }
    });

    if (existingReferral) {
      return NextResponse.json({ error: 'User already has a referral' }, { status: 400 });
    }

    // Check if user is trying to use their own referral code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true }
    });

    if (user && user.referralCode === referralCode) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Process referral
    const result = await processReferral(referralCode, userId);

    return NextResponse.json({
      success: true,
      message: 'Referral processed successfully',
      points: result.tokens
    });

  } catch (error: any) {
    console.error('Referral processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process referral' },
      { status: 400 }
    );
  }
}

async function processReferral(referralCode: string, newUserId: string) {
  return await prisma.$transaction(async (tx) => {
    // Find the referrer
    const referrer = await tx.user.findUnique({
      where: { referralCode },
      select: { id: true, isActive: true }
    });

    if (!referrer || !referrer.isActive) {
      throw new Error('Invalid referral code');
    }

    // Check if user is trying to refer themselves
    if (referrer.id === newUserId) {
      throw new Error('Cannot refer yourself');
    }

    const referralPoints = POINTS.REFERRAL;

    // Create referral record
    await tx.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: newUserId,
        tokens: referralPoints,
        completed: true
      }
    });

    // Award points to referrer
    await tx.pointHistory.create({
      data: {
        userId: referrer.id,
        tokens: 1,
        action: 'REFERRAL_BONUS',
        description: 'Referred a new user',
        metadata: {
          referredUserId: newUserId,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Update referrer's total points
    await tx.user.update({
      where: { id: referrer.id },
      data: { totalTokens: { increment: referralPoints } }
    });

    // Award bonus points to new user
    await tx.pointHistory.create({
      data: {
        userId: newUserId,
        tokens: referralPoints,
        action: 'REFERRAL_WELCOME',
        description: 'Welcome bonus for joining via referral',
        metadata: {
          referrerId: referrer.id,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Update new user's total points
    await tx.user.update({
      where: { id: newUserId },
      data: { totalTokens: { increment: referralPoints } }
    });

    return { success: true, tokens: referralPoints };
  });
}