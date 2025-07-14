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

// FIXED: Proper session handling for API routes
export async function getSession(req?: NextRequest) {
  let token: string | undefined

  console.log('🔍 getSession called with req:', !!req)

  if (req) {
    // When called from API routes with NextRequest
    token = req.cookies.get('auth-token')?.value
    console.log('🔍 Token from request cookies:', !!token)
  } else {
    // When called from server components/middleware
    try {
      const cookieStore = await cookies()
      token = cookieStore.get('auth-token')?.value
      console.log('🔍 Token from server cookies:', !!token)
    } catch (error) {
      console.error('❌ Error accessing cookies:', error)
      return null
    }
  }

  if (!token) {
    console.log('❌ No auth token found')
    return null
  }

  console.log('🔍 Token preview:', token.substring(0, 20) + '...')

  const payload = await verifyToken(token)
  if (!payload) {
    console.log('❌ Invalid token payload')
    return null
  }

  console.log('✅ Token verified, userId:', payload.userId)

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        walletAddress: true,
        isAdmin: true,
        twitterUsername: true,
        twitterId: true,
        totalPoints: true,
        isActive: true,
      },
    })

    if (!user) {
      console.log('❌ User not found in database:', payload.userId)
      return null
    }

    if (!user.isActive) {
      console.log('❌ User is inactive:', payload.userId)
      return null
    }

    console.log('✅ User found and active:', user.id)

    return {
      user,
      expires: new Date(payload.exp! * 1000).toISOString(),
    }
  } catch (error) {
    console.error('❌ Database error in getSession:', error)
    return null
  }
}
// FIXED: Response-based cookie setting for API routes
export async function setAuthCookie(token: string, response?: NextResponse): Promise<NextResponse | void> {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  }

  if (response) {
    // When called from API routes with NextResponse
    response.cookies.set('auth-token', token, cookieOptions)
    return response
  } else {
    // When called from server actions/components
    try {
      const cookieStore = await cookies()
      await cookieStore.set('auth-token', token, cookieOptions)
    } catch (error) {
      console.error('Error setting cookie:', error)
    }
  }
}

export async function clearAuthCookie(response?: NextResponse): Promise<NextResponse | void> {
  if (response) {
    // When called from API routes
    response.cookies.delete('auth-token')
    return response
  } else {
    // When called from server actions/components
    try {
      const cookieStore = await cookies()
      await cookieStore.delete('auth-token')
    } catch (error) {
      console.error('Error clearing cookie:', error)
    }
  }
}

export async function authenticateWallet(walletAddress: string) {
  console.log('🔐 authenticateWallet called for:', walletAddress)
  
  try {
    // Check database connection
    console.log('🔍 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connected')

    // Find existing user
    console.log('👤 Looking for existing user...')
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (user) {
      console.log('✅ Existing user found:', user.id)
    } else {
      console.log('📝 Creating new user...')
      
      // Check if wallet is in admin list
      const adminWallets = process.env.ADMIN_WALLETS?.split(',') || []
      const isAdmin = adminWallets.includes(walletAddress)
      console.log('👑 Admin status:', isAdmin)

      try {
        user = await prisma.user.create({
          data: {
            walletAddress,
            isAdmin,
            isActive: true,
          },
        })
        console.log('✅ New user created:', user.id)

        // Award welcome bonus
        console.log('🎁 Awarding welcome bonus...')
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
        console.log('✅ Welcome bonus awarded')

      } catch (createError) {
        console.error('❌ Error creating user:', createError)
        throw new Error(`Failed to create user: ${createError instanceof Error ? createError.message : 'Unknown error'}`)
      }
    }

    // Create JWT token
    console.log('🔑 Creating JWT token...')
    try {
      const token = await createToken({
        userId: user.id,
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin,
      })
      console.log('✅ JWT token created, length:', token.length)

      return { user, token }
    } catch (tokenError) {
      console.error('❌ Error creating token:', tokenError)
      throw new Error(`Failed to create token: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`)
    }

  } catch (error) {
    console.error('❌ authenticateWallet error:', error)
    
    // Disconnect from database
    await prisma.$disconnect()
    
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error('Unknown authentication error')
    }
  }
}

// FIXED: Better error handling for auth middleware
export async function requireAuth(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const session = await getSession(req)
      
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required. Please connect your wallet.' },
          { status: 401 }
        )
      }

      return handler(req, ...args, session)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

export async function requireAdmin(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const session = await getSession(req)
      
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (!session.user.isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }

      return handler(req, ...args, session)
    } catch (error) {
      console.error('Admin middleware error:', error)
      return NextResponse.json(
        { error: 'Authorization error' },
        { status: 500 }
      )
    }
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// HELPER: Debug function to check auth status
export async function debugAuth(req: NextRequest) {
  console.log('🔍 Debug Auth Info:')
  console.log('Cookies:', req.cookies.getAll())
  console.log('Auth Token:', req.cookies.get('auth-token')?.value ? 'Present' : 'Missing')
  
  const session = await getSession(req)
  console.log('Session:', session ? 'Valid' : 'Invalid')
  
  return session
}