import { NextRequest, NextResponse } from 'next/server'
import { getSession, debugAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug endpoint called')
    
    // Debug session
    const session = await debugAuth(req)
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user || null,
      cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false
    })
  }
}