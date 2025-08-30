import { NextRequest, NextResponse } from "next/server";
import { getTwitterAuthClient } from "@/lib/twitter-sdk/twitter-client";

export async function GET(request: NextRequest) {
  try {
    const authClient = getTwitterAuthClient();
    const authUrl = authClient.generateAuthURL({
      state: crypto.randomUUID(),
      code_challenge_method: "s256",
    });
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Twitter auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Twitter authentication" },
      { status: 500 }
    );
  }
}