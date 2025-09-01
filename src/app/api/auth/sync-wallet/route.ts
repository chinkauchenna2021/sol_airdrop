// app/api/auth/sync-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/next-auth/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Update user with wallet address
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error syncing wallet:", error);
    return NextResponse.json(
      { error: "Failed to sync wallet" },
      { status: 500 }
    );
  }
}