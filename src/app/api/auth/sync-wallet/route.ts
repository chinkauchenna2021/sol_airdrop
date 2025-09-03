// import { NextRequest, NextResponse } from "next/server";
// import { getSession } from "@/lib/next-auth/auth";
// import prisma from "@/lib/prisma";


// export async function POST(request: NextRequest) {
//   try {
//     const { userId , walletAddress} = await request.json();
//     let walletDataHolder:any ={}
//     // const session = await getServerSession(authOptions);
//     console.log('<==================SESSION===============>', userId);
//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

    
//     if (!walletAddress) {
//       return NextResponse.json(
//         { error: "Wallet address is required" },
//         { status: 400 }
//       );
//     }

//     const userWalletData = await prisma.user.findUnique({
//       where: { walletAddress },
//     });

//     // if (!userWalletData) {
//     //   return NextResponse.json(
//     //     { error: "User not found" },
//     //     { status: 404 }
//     //   );
//     // }

//     // Update user with wallet address
//     walletDataHolder = { ...userWalletData, permissions: userWalletData?.permissions as any };

//     const deleteWallet = await prisma.user.delete({
//       where: { id: userWalletData?.id },
//     });

//     if (!deleteWallet) {
//       return NextResponse.json(
//         { error: "User not deleted" },
//         { status: 404 }
//       );
//     }
//     const user = await prisma.user.update({
//       where: { id: userId },
//       data: { ...userWalletData, permissions:userWalletData?.permissions as any },
//     });
  

//     return NextResponse.json({ user });
//   } catch (error) {
//     console.error("Error syncing wallet:", error);
//     return NextResponse.json(
//       { error: "Failed to sync wallet" },
//       { status: 500 }
//     );
//   }
// }



// app/api/auth/sync-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/next-auth/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, walletAddress } = await request.json();
    console.log(userId, walletAddress, "============Wallet-Address========")
    
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
    
    // Check if wallet is already linked to another account
    const existingWalletUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    console.log(existingWalletUser , "=========USER WALLET=======")
    
    if (existingWalletUser && existingWalletUser.id !== userId) {
      // Merge accounts
      const mergedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress,
          // Merge data from existing wallet user
          totalPoints: {
            increment: existingWalletUser.totalPoints
          },
          totalTokens: {
            increment: existingWalletUser.totalTokens
          },
          totalEarnedTokens: {
            increment: existingWalletUser.totalEarnedTokens
          },
          // Merge permissions
          permissions: existingWalletUser.permissions || {}
        },
      });
      
      // Delete the old wallet user after merging
      await prisma.user.delete({
        where: { id: existingWalletUser.id }
      });
      
      return NextResponse.json({ user: mergedUser });
    }
    
    // Simple wallet sync if no existing wallet user
    const user = await prisma.user.update({
      where: { id: userId },
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





// import { NextRequest, NextResponse } from "next/server";
// import { getSession } from "@/lib/auth";
// import prisma from "@/lib/prisma";

// export async function POST(req: NextRequest) {
//   try {
//     const session = await getSession();
    
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
    
//     const { twitterId, twitterUsername, twitterName, twitterImage } = await req.json();
    
//     if (!twitterId) {
//       return NextResponse.json({ error: "Twitter ID is required" }, { status: 400 });
//     }
    
//     // Check if the Twitter ID is already linked to another user
//     const existingUserByTwitterId = await prisma.user.findUnique({
//       where: { twitterId },
//     });
    
//     if (existingUserByTwitterId && existingUserByTwitterId.id !== session.user.id) {
//       return NextResponse.json({ 
//         error: "Twitter account is already linked to another user" 
//       }, { status: 400 });
//     }
    
//     // Update the current user with Twitter information
//     const updatedUser = await prisma.user.update({
//       where: { id: session.user.id },
//       data: {
//         twitterId,
//         twitterUsername,
//         twitterName,
//         twitterImage,
//       },
//     });
    
//     return NextResponse.json({ user: updatedUser });
//   } catch (error) {
//     console.error("Error linking Twitter account:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }