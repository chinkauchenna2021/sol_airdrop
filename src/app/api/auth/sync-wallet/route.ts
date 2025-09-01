import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/next-auth/auth";
import prisma from "@/lib/prisma";


export async function POST(request: NextRequest) {
  try {
    const { userId , walletAddress} = await request.json();
    let walletDataHolder:any ={}
    // const session = await getServerSession(authOptions);
    console.log('<==================SESSION===============>', userId);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const userWalletData = await prisma.user.findUnique({
      where: { walletAddress },
    });

    // if (!userWalletData) {
    //   return NextResponse.json(
    //     { error: "User not found" },
    //     { status: 404 }
    //   );
    // }

    // Update user with wallet address
    walletDataHolder = { ...userWalletData, permissions: userWalletData?.permissions as any };

    const deleteWallet = await prisma.user.delete({
      where: { id: userWalletData?.id },
    });

    if (!deleteWallet) {
      return NextResponse.json(
        { error: "User not deleted" },
        { status: 404 }
      );
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...userWalletData, permissions:userWalletData?.permissions as any },
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