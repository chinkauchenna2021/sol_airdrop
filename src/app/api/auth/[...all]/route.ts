import { auth } from "@/lib/better-auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth)

export async function GET(request: NextRequest) {
  try {
    return await authGET(request)
  } catch (error) {
    console.error('Better Auth GET error:', error)
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    return await authPOST(request)
  } catch (error) {
    console.error('Better Auth POST error:', error)
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}