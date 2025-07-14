import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasAdminWallets: !!process.env.ADMIN_WALLETS,
    databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  })
}