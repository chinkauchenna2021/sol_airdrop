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


import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/next-auth/auth";
import prisma from "@/lib/prisma";
import { User } from "@/app/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, walletAddress } = await request.json();
    
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

   const userData = await prisma.user.delete({
      where: { id: existingWalletUser?.id },
    });
    if (!userData || userData.id === userId) {
      // No existing user or same user, just update the wallet address
      const user = await prisma.user.update({
        where: { id: userId },
        data: { walletAddress },
      });
      return NextResponse.json({ user });
    }

    // Get target user data before we start
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Step 1: Transfer all related records in batches
    await transferUserDataInBatches(userData.id, userId);
    
    // Step 2: Update the target user with aggregated data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress,
        // Merge data from existing wallet user
        totalPoints: targetUser.totalPoints + userData.totalPoints,
        totalTokens: targetUser.totalTokens + userData.totalTokens,
        totalEarnedTokens: targetUser.totalEarnedTokens + userData.totalEarnedTokens,
        // Merge permissions
        permissions: userData.permissions || {},
        // Keep the higher level
        level: Math.max(userData.level, targetUser.level),
        // Keep the higher streak
        streak: Math.max(userData.streak, targetUser.streak),
      },
    });
    
    // Step 3: Delete the old wallet user after transferring all data
    await prisma.user.delete({
      where: { id: userData.id }
    });
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error syncing wallet:", error);
    return NextResponse.json(
      { error: "Failed to sync wallet" },
      { status: 500 }
    );
  }
}

// Helper function to transfer user data in batches to avoid timeout
async function transferUserDataInBatches(sourceUserId: string, targetUserId: string) {
  // Define transfer operations for each model
  const transferOperations = [
    // Simple transfers (no conflicts)
    { model: 'dailyEarning', foreignKey: 'userId' },
    { model: 'airdropClaim', foreignKey: 'userId' },
    { model: 'twitterEngagement', foreignKey: 'userId' },
    { model: 'taskCompletion', foreignKey: 'userId' },
    { model: 'claim', foreignKey: 'userId' },
    { model: 'pointHistory', foreignKey: 'userId' },
    { model: 'userAchievement', foreignKey: 'userId' },
    { model: 'notification', foreignKey: 'userId' },
    { model: 'fraudAlert', foreignKey: 'userId' },
    { model: 'nftClaim', foreignKey: 'userId' },
    { model: 'userNftHolding', foreignKey: 'userId' },
    { model: 'nftCollection', foreignKey: 'createdBy' },
    { model: 'nftDistribution', foreignKey: 'distributedBy' },
    { model: 'adminSession', foreignKey: 'adminId' },
    { model: 'adminAuditLog', foreignKey: 'adminId' },
    { model: 'campaignConfig', foreignKey: 'createdBy' },
    { model: 'airdropSeason', foreignKey: 'createdBy' },
  ];

  // Process simple transfers
  for (const operation of transferOperations) {
    await transferInBatch(operation.model, operation.foreignKey, sourceUserId, targetUserId);
  }

  // Handle complex cases with potential conflicts
  await handleReferrals(sourceUserId, targetUserId);
  await handleAccounts(sourceUserId, targetUserId);
  await handleSessions(sourceUserId, targetUserId);
  await handleNftClaimApproval(sourceUserId, targetUserId);
}

// Generic function to transfer records in batches
async function transferInBatch(modelName: string, foreignKey: string, sourceUserId: string, targetUserId: string) {
  const batchSize = 100; // Process 100 records at a time
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Use a transaction for each batch
    await prisma.$transaction(async (tx) => {
      // Get a batch of records
      const records = await (tx as any)[modelName].findMany({
        where: { [foreignKey]: sourceUserId },
        take: batchSize,
        skip: offset,
      });

      if (records.length === 0) {
        hasMore = false;
        return;
      }

      // Update the batch
      await (tx as any)[modelName].updateMany({
        where: {
          id: {
            in: records.map((r: any) => r.id),
          },
        },
        data: { [foreignKey]: targetUserId },
      });

      offset += records.length;
    }, {
      timeout: 10000, // 10 seconds timeout for each batch
    });
  }
}

// Handle referrals (both referrer and referred)
async function handleReferrals(sourceUserId: string, targetUserId: string) {
  await prisma.$transaction(async (tx) => {
    // Update referrerId in referrals where source user is the referrer
    await tx.referral.updateMany({
      where: { referrerId: sourceUserId },
      data: { referrerId: targetUserId }
    });
    
    // Update referredId in referrals where source user is the referred
    await tx.referral.updateMany({
      where: { referredId: sourceUserId },
      data: { referredId: targetUserId }
    });
  });
}

// Handle accounts (with potential conflicts)
async function handleAccounts(sourceUserId: string, targetUserId: string) {
  const sourceAccounts = await prisma.account.findMany({
    where: { userId: sourceUserId }
  });
  
  for (const account of sourceAccounts) {
    await prisma.$transaction(async (tx) => {
      // Check if target user already has an account with the same provider
      const existingAccount = await tx.account.findFirst({
        where: {
          userId: targetUserId,
          provider: account.provider,
          providerAccountId: account.providerAccountId
        }
      });
      
      if (!existingAccount) {
        // Transfer the account if no conflict
        await tx.account.update({
          where: { id: account.id },
          data: { userId: targetUserId }
        });
      } else {
        // If conflict exists, delete the duplicate account
        await tx.account.delete({
          where: { id: account.id }
        });
      }
    });
  }
}

// Handle sessions (with potential conflicts)
async function handleSessions(sourceUserId: string, targetUserId: string) {
  const sourceSessions = await prisma.session.findMany({
    where: { userId: sourceUserId }
  });
  
  for (const session of sourceSessions) {
    await prisma.$transaction(async (tx) => {
      // Check if target user already has a session with the same token
      const existingSession = await tx.session.findFirst({
        where: {
          userId: targetUserId,
          sessionToken: session.sessionToken
        }
      });
      
      if (!existingSession) {
        // Transfer the session if no conflict
        await tx.session.update({
          where: { id: session.id },
          data: { userId: targetUserId }
        });
      } else {
        // If conflict exists, delete the duplicate session
        await tx.session.delete({
          where: { id: session.id }
        });
      }
    });
  }
}

// Handle NftClaimApproval (unique constraint)
async function handleNftClaimApproval(sourceUserId: string, targetUserId: string) {
  await prisma.$transaction(async (tx) => {
    const sourceApproval = await tx.nftClaimApproval.findUnique({
      where: { userId: sourceUserId }
    });
    
    if (sourceApproval) {
      const targetApproval = await tx.nftClaimApproval.findUnique({
        where: { userId: targetUserId }
      });
      
      if (!targetApproval) {
        // Transfer if target doesn't have one
        await tx.nftClaimApproval.update({
          where: { id: sourceApproval.id },
          data: { userId: targetUserId }
        });
      } else {
        // If target already has one, delete the source
        await tx.nftClaimApproval.delete({
          where: { id: sourceApproval.id }
        });
      }
    }
  });
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