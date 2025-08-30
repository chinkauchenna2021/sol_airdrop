// app/api/auth/callback/twitter/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTwitterAuthClient, getTwitterClient } from "@/lib/twitter-sdk/twitter-client";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    
    if (!code) {
      return NextResponse.json(
        { error: "Authorization code missing" },
        { status: 400 }
      );
    }

    const authClient = getTwitterAuthClient();
    await authClient.requestAccessToken(code);
    
    // Get the authenticated user's details
    const userClient = getTwitterClient(authClient.token?.access_token);
    const me = await userClient.users.findMyUser();
    
    if (!me.data?.id) {
      throw new Error("Failed to get user data from Twitter");
    }
    
    // Get additional user details
    const userDetails = await userClient.users.findUserById(me.data.id, {
      "user.fields": ["profile_image_url", "description", "public_metrics"]
    });
    
    // Store or update user in database
    const user = await prisma.user.upsert({
      where: { twitterId: me.data.id },
      update: {
        twitterUsername: me.data.username,
        twitterName: me.data.name,
        twitterImage: userDetails.data?.profile_image_url,
        twitterFollowers: userDetails.data?.public_metrics?.followers_count,
        // Store tokens in Account model instead of User model
      },
      create: {
        twitterId: me.data.id,
        twitterUsername: me.data.username,
        twitterName: me.data.name,
        twitterImage: userDetails.data?.profile_image_url,
        twitterFollowers: userDetails.data?.public_metrics?.followers_count,
        twitterActivity: "LOW",
        // Add other required fields from your schema
        walletAddress: "", // This should be connected later
        totalPoints: 0,
        totalTokens: 0,
        totalEarnedTokens: 0,
        level: 1,
        rank: 0,
        streak: 0,
        referralCode: crypto.randomUUID().slice(0, 8),
        isAdmin: false,
        isActive: true,
      },
    });
    
    // Also create/update the Account record for Better Auth compatibility
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "twitter",
          providerAccountId: me.data.id,
        },
      },
      update: {
        access_token: authClient.token?.access_token,
        refresh_token: authClient.token?.refresh_token,
        expires_at: authClient.token?.expires_at
          ? Math.floor(Date.now() / 1000) + authClient.token.expires_at 
          : undefined,
      },
      create: {
        userId: user.id,
        type: "oauth",
        provider: "twitter",
        providerAccountId: me.data.id,
        access_token: authClient.token?.access_token,
        refresh_token: authClient.token?.refresh_token,
        expires_at: authClient.token?.expires_at
          ? Math.floor(Date.now() / 1000) + authClient.token.expires_at
          : undefined,
        token_type: "bearer",
        scope: "tweet.read users.read offline.access like.read follows.read",
      },
    });
    
    // Redirect to frontend with success message
    const redirectUrl = new URL(`${process.env.NEXTAUTH_URL}/dashboard`);
    redirectUrl.searchParams.set("twitter_connected", "true");
    redirectUrl.searchParams.set("user_id", user.id);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Twitter callback error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Twitter" },
      { status: 500 }
    );
  }
}