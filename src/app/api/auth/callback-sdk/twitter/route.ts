import { NextRequest, NextResponse } from "next/server";
import { getTwitterAuthClient, getTwitterClient } from "@/lib/twitter-sdk/twitter-client";
import prisma from "@/lib/prisma";

// Store state for verification (in production, use Redis or database)
const stateStore = new Map();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    
    console.log("Twitter callback received:", { code, state });
    
    if (!code) {
      return NextResponse.json(
        { error: "Authorization code missing" },
        { status: 400 }
      );
    }

    const authClient = getTwitterAuthClient();
    
    try {
      // Request access token
      const token = await authClient.requestAccessToken(code);
      console.log("Access token received:", token);
      
      // Get the authenticated user's details
      const userClient = getTwitterClient(token.token.access_token);
      const me = await userClient.users.findMyUser();
      
      console.log("User data from Twitter:", me.data);
      
      if (!me.data?.id) {
        throw new Error("Failed to get user data from Twitter");
      }
      
      // Get additional user details
      const userDetails = await userClient.users.findUserById(me.data.id, {
        "user.fields": ["profile_image_url", "description", "public_metrics", "verified"]
      });
      
      console.log("User details:", userDetails.data);
      
      // Generate a random wallet address placeholder (user will connect real wallet later)
      const walletPlaceholder = `twitter_${me.data.id}_${Date.now()}`;
      
      // Store or update user in database
      const user = await prisma.user.upsert({
        where: { twitterId: me.data.id },
        update: {
          twitterUsername: me.data.username,
          twitterName: me.data.name,
          twitterImage: userDetails.data?.profile_image_url?.replace('_normal', ''),
          twitterFollowers: userDetails.data?.public_metrics?.followers_count,
        },
        create: {
          twitterId: me.data.id,
          twitterUsername: me.data.username,
          twitterName: me.data.name,
          twitterImage: userDetails.data?.profile_image_url?.replace('_normal', ''),
          twitterFollowers: userDetails.data?.public_metrics?.followers_count,
          twitterActivity: "LOW",
          walletAddress: walletPlaceholder,
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
          access_token: token.token.access_token,
          refresh_token: token.token.refresh_token,
          expires_at: token.token.expires_at
            ? Math.floor(Date.now() / 1000) + token.token.expires_at
            : undefined,
        },
        create: {
          userId: user.id,
          type: "oauth",
          provider: "twitter",
          providerAccountId: me.data.id,
          access_token: token.token.access_token,
          refresh_token: token.token.refresh_token,
          expires_at: token.token.expires_at
            ? Math.floor(Date.now() / 1000) + token.token.expires_at
            : undefined,
          token_type: "bearer",
          scope: "tweet.read users.read offline.access like.read follows.read",
        },
      });
      
      // Redirect to frontend with success message
      const redirectUrl = new URL(`${process.env.NEXTAUTH_URL}/dashboard`);
      redirectUrl.searchParams.set("twitter_connected", "true");
      redirectUrl.searchParams.set("user_id", user.id);
      
      console.log("Redirecting to:", redirectUrl.toString());
      
      return NextResponse.redirect(redirectUrl);
    } catch (error: any) {
      console.error("Twitter API error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
        code: error.code
      });
      
      throw error;
    }
  } catch (error: any) {
    console.error("Twitter callback error:", error);
    
    // More detailed error logging
    if (error.response) {
      console.error("Response error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    const errorMessage = error.data?.detail || error.message || "Failed to authenticate with Twitter";
    
    // Redirect to frontend with error message
    const redirectUrl = new URL(`${process.env.NEXTAUTH_URL}/dashboard`);
    redirectUrl.searchParams.set("twitter_error", encodeURIComponent(errorMessage));
    
    return NextResponse.redirect(redirectUrl);
  }
}