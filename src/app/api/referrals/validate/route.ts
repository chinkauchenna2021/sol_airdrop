import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/next-auth/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    // Check if user is providing their own referral code (if authenticated)
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { referralCode: true }
      });

      if (user && user.referralCode === referralCode) {
        return NextResponse.json({ 
          error: 'Cannot use your own referral code',
          valid: false 
        }, { status: 400 });
      }

      // Check if user already has a referral
      const existingReferral = await prisma.referral.findUnique({
        where: { referredId: session.user.id }
      });

      if (existingReferral) {
        return NextResponse.json({ 
          error: 'You already used a referral code',
          valid: false 
        }, { status: 400 });
      }
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: {
        id: true,
        walletAddress: true,
        twitterUsername: true,
        isActive: true
      }
    });

    if (!referrer || !referrer.isActive) {
      return NextResponse.json({ 
        error: 'Invalid referral code',
        valid: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        id: referrer.id,
        walletAddress: referrer.walletAddress,
        twitterUsername: referrer.twitterUsername
      }
    });
  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}