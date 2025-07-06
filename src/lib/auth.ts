import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-secret-key'
)

export interface JWTPayload {
  userId: string
  walletAddress: string
  isAdmin: boolean
  exp?: number
  [key: string]: unknown
}

export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  
  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(req?: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      walletAddress: true,
      isAdmin: true,
      twitterUsername: true,
      twitterId: true,
      totalPoints: true,
    },
  })

  if (!user) return null

  return {
    user,
    expires: new Date(payload.exp! * 1000).toISOString(),
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  await cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  await cookieStore.delete('auth-token')
}

export async function authenticateWallet(walletAddress: string) {
  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (!user) {
      // Check if wallet is in admin list
      const adminWallets = process.env.ADMIN_WALLETS?.split(',') || []
      const isAdmin = adminWallets.includes(walletAddress)

      user = await prisma.user.create({
        data: {
          walletAddress,
          isAdmin,
        },
      })

      // Award welcome bonus
      await prisma.pointHistory.create({
        data: {
          userId: user.id,
          points: 100,
          action: 'WELCOME_BONUS',
          description: 'Welcome to the platform!',
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { totalPoints: 100 },
      })
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      isAdmin: user.isAdmin,
    })

    await setAuthCookie(token)

    return { user, token }
  } catch (error) {
    console.error('Authentication error:', error)
    throw new Error('Failed to authenticate')
  }
}

export async function requireAuth(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await getSession(req)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(req, ...args, session)
  }
}

export async function requireAdmin(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await getSession(req)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return handler(req, ...args, session)
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}