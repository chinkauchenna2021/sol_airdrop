// app/api/auth/debug/route.ts - Temporary debug route
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth-enhanced"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug - Environment check:")
    console.log("- BETTER_AUTH_SECRET exists:", !!process.env.BETTER_AUTH_SECRET)
    console.log("- BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL)
    console.log("- TWITTER_CLIENT_ID exists:", !!process.env.TWITTER_CLIENT_ID)
    console.log("- TWITTER_CLIENT_SECRET exists:", !!process.env.TWITTER_CLIENT_SECRET)
    console.log("- Request URL:", request.url)
    
    // Test auth instance
    console.log("- Auth instance created:", !!auth)
    console.log("- Auth config keys:", Object.keys(auth as any))
    
    return NextResponse.json({
      status: "ok",
      env: {
        hasSecret: !!process.env.BETTER_AUTH_SECRET,
        hasTwitterId: !!process.env.TWITTER_CLIENT_ID,
        hasTwitterSecret: !!process.env.TWITTER_CLIENT_SECRET,
        baseUrl: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
      },
      auth: {
        created: !!auth,
        type: typeof auth,
      }
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log("🔍 Debug POST request:")
    console.log("- URL:", request.url)
    console.log("- Headers:", Object.fromEntries(request.headers.entries()))
    console.log("- Body length:", body.length)
    console.log("- Body preview:", body.substring(0, 200))
    
    return NextResponse.json({
      status: "debug_ok",
      receivedData: {
        url: request.url,
        method: request.method,
        bodyLength: body.length,
        hasBody: body.length > 0,
      }
    })
  } catch (error) {
    console.error("Debug POST error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}