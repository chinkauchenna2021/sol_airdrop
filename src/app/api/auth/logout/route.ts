// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    console.log('🔌 Logout API called')
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Clear the auth cookie
    await clearAuthCookie(response)
    
    console.log('✅ Logout successful')
    return response
    
  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}