import { NextRequest, NextResponse } from "next/server";
import { getTwitterClient } from "@/lib/twitter-sdk/twitter-client";

export async function GET(request: NextRequest) {
  try {
    // Test bearer token authentication
    const client = getTwitterClient();
    
    // Try to get a sample tweet to test connectivity
    const tweet = await client.tweets.findTweetById("20", {
      "tweet.fields": ["text", "author_id"]
    });
    
    return NextResponse.json({
      success: true,
      bearerToken: !!process.env.TWITTER_BEARER_TOKEN,
      clientId: !!process.env.TWITTER_CLIENT_ID,
      clientSecret: !!process.env.TWITTER_CLIENT_SECRET,
      testTweet: tweet.data?.text || "No tweet found",
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error("Twitter debug error:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.data,
      env: {
        TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN ? "SET" : "MISSING",
        TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ? "SET" : "MISSING",
        TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? "SET" : "MISSING",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}