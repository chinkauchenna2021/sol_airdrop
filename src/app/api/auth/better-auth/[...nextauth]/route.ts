import { auth } from "@/lib/better-auth-enhanced"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"

// Convert better-auth to Next.js handlers
const { GET: authGET, POST: authPOST } = toNextJsHandler(auth)

export async function GET(request: NextRequest) {
  try {
    console.log(`🔄 Better Auth GET: ${request.url}`)
    return await authGET(request)
  } catch (error) {
    console.error('❌ Better Auth GET error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log(`🔄 Better Auth POST: ${request.url}`)
    return await authPOST(request)
  } catch (error) {
    console.error('❌ Better Auth POST error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}