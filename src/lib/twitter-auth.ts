import { TwitterApi } from 'twitter-api-v2'
import { SignJWT, jwtVerify } from 'jose'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

interface TwitterAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

interface TwitterTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  scope: string[]
}

interface TwitterUserInfo {
  id: string
  username: string
  name: string
  profileImageUrl?: string
  verified: boolean
  publicMetrics: {
    followersCount: number
    followingCount: number
    tweetCount: number
    listedCount: number
  }
  description?: string
  location?: string
  url?: string
  createdAt: string
}

export class TwitterAuthService {
  private config: TwitterAuthConfig
  private jwtSecret: Uint8Array

  constructor() {
    this.config = {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
      scopes: [
        'tweet.read',
        'users.read', 
        'follows.read',
        'like.read',
        'offline.access'
      ]
    }
    
    this.jwtSecret = new TextEncoder().encode(
      process.env.TWITTER_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret'
    )

    this.validateConfig()
  }

  private validateConfig(): void {
    const required = ['clientId', 'clientSecret', 'redirectUri']
    const missing = required.filter(key => !this.config[key as keyof TwitterAuthConfig])
    
    if (missing.length > 0) {
      throw new Error(`Missing required Twitter OAuth config: ${missing.join(', ')}`)
    }
  }

  /**
   * Generate secure OAuth 2.0 authorization URL with PKCE
   */
  async generateAuthUrl(userId: string): Promise<{
    authUrl: string
    state: string
    codeVerifier: string
  }> {
    try {
      const codeVerifier = this.generateCodeVerifier()
      const codeChallenge = await this.generateCodeChallenge(codeVerifier)
      const state = await this.generateSecureState(userId)
      
      await this.storeAuthState(state, {
        userId,
        codeVerifier,
        timestamp: new Date(),
        used: false
      })

      const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('client_id', this.config.clientId)
      authUrl.searchParams.set('redirect_uri', this.config.redirectUri)
      authUrl.searchParams.set('scope', this.config.scopes.join(' '))
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      return {
        authUrl: authUrl.toString(),
        state,
        codeVerifier
      }
    } catch (error) {
      console.error('Error generating auth URL:', error)
      throw new Error('Failed to generate Twitter authentication URL')
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    code: string, 
    state: string
  ): Promise<{
    success: boolean
    userId?: string
    user?: TwitterUserInfo
    tokens?: TwitterTokens
    error?: string
  }> {
    try {
      const storedState = await this.getAuthState(state)
      if (!storedState || storedState.used) {
        return { success: false, error: 'Invalid or expired authentication state' }
      }

      await this.markStateAsUsed(state)

      const tokenResponse = await this.exchangeCodeForTokens(code, storedState.codeVerifier)
      if (!tokenResponse.success) {
        return { success: false, error: tokenResponse.error }
      }

      const userInfo = await this.getUserInfo(tokenResponse.tokens!.accessToken)
      if (!userInfo) {
        return { success: false, error: 'Failed to retrieve user information' }
      }

      await this.storeUserTokens(storedState.userId, tokenResponse.tokens!)
      await this.updateUserTwitterInfo(storedState.userId, userInfo)

      return {
        success: true,
        userId: storedState.userId,
        user: userInfo,
        tokens: tokenResponse.tokens
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  /**
   * Get Twitter client for authenticated user
   */
  async getAuthenticatedClient(userId: string): Promise<TwitterApi | null> {
    try {
      const tokens = await this.getUserTokens(userId)
      if (!tokens) return null

      if (this.isTokenExpired(tokens)) {
        const refreshed = await this.refreshAccessToken(userId, tokens)
        if (!refreshed) return null
        const updatedTokens = await this.getUserTokens(userId)
        if (!updatedTokens) return null
        tokens.accessToken = updatedTokens.accessToken
      }

      return new TwitterApi(tokens.accessToken)
    } catch (error) {
      console.error('Error getting authenticated client:', error)
      return null
    }
  }

  /**
   * Disconnect Twitter account
   */
  async disconnectAccount(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getUserTokens(userId)
      if (tokens) {
        await this.revokeTokens(tokens.accessToken)
      }

      await Promise.all([
        this.removeUserTokens(userId),
        this.clearUserTwitterInfo(userId)
      ])

      await this.logAuthEvent(userId, 'DISCONNECT', {
        timestamp: new Date().toISOString(),
        reason: 'USER_INITIATED'
      })

      return true
    } catch (error) {
      console.error('Error disconnecting Twitter account:', error)
      return false
    }
  }

  /**
   * Check if user has valid Twitter connection
   */
  async isConnected(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getUserTokens(userId)
      if (!tokens) return false

      const client = await this.getAuthenticatedClient(userId)
      if (!client) return false

      try {
        await client.v2.me()
        return true
      } catch (error) {
        if (tokens.refreshToken) {
          const refreshed = await this.refreshAccessToken(userId, tokens)
          return refreshed
        }
        return false
      }
    } catch (error) {
      console.error('Error checking connection status:', error)
      return false
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(verifier).digest()
    return hash.toString('base64url')
  }

  private async generateSecureState(userId: string): Promise<string> {
    const payload = {
      userId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    }

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(this.jwtSecret)
  }

  private async storeAuthState(state: string, data: any): Promise<void> {
    const stateKey = this.getStateKey(state)
    await prisma.systemConfig.upsert({
      where: { key: stateKey },
      update: { 
        value: data,
        updatedAt: new Date()
      },
      create: {
        key: stateKey,
        value: data,
        description: 'Twitter OAuth state'
      }
    })

    // Auto-cleanup after 10 minutes
    setTimeout(async () => {
      try {
        await prisma.systemConfig.deleteMany({
          where: { key: stateKey }
        })
      } catch (error) {
        console.error('Error cleaning up auth state:', error)
      }
    }, 10 * 60 * 1000)
  }

  private async getAuthState(state: string): Promise<any | null> {
    try {
      const { payload } = await jwtVerify(state, this.jwtSecret)
      
      const stored = await prisma.systemConfig.findUnique({
        where: { key: this.getStateKey(state) }
      })

      if (!stored) return null

      // Verify timestamp (additional security)
      const stateData = stored.value as any
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      if (new Date(stateData.timestamp).getTime() < fiveMinutesAgo) {
        await this.cleanupExpiredState(state)
        return null
      }

      return stateData
    } catch (error) {
      console.error('Invalid state token:', error)
      return null
    }
  }

  private async markStateAsUsed(state: string): Promise<void> {
    const stateKey = this.getStateKey(state)
    await prisma.systemConfig.updateMany({
      where: { key: stateKey },
      data: { 
        value: { used: true, usedAt: new Date() }
      }
    })
  }

  private getStateKey(state: string): string {
    return `twitter_auth_state_${state.slice(-16)}`
  }

  private async cleanupExpiredState(state: string): Promise<void> {
    await prisma.systemConfig.deleteMany({
      where: { key: this.getStateKey(state) }
    })
  }

  private async exchangeCodeForTokens(
    code: string, 
    codeVerifier: string
  ): Promise<{ success: boolean; tokens?: TwitterTokens; error?: string }> {
    try {
      const tokenEndpoint = 'https://api.twitter.com/2/oauth2/token'
      
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier
      })

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token exchange failed:', errorText)
        return { success: false, error: 'Failed to exchange authorization code' }
      }

      const tokenData = await response.json()
      
      const tokens: TwitterTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        scope: tokenData.scope?.split(' ') || this.config.scopes
      }

      return { success: true, tokens }
    } catch (error) {
      console.error('Token exchange error:', error)
      return { success: false, error: 'Token exchange failed' }
    }
  }

  private async getUserInfo(accessToken: string): Promise<TwitterUserInfo | null> {
    try {
      const client = new TwitterApi(accessToken)
      
      const user = await client.v2.me({
        'user.fields': [
          'id', 'username', 'name', 'profile_image_url', 'verified',
          'public_metrics', 'description', 'location', 'url', 'created_at'
        ]
      })

      if (!user.data) return null

      return {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
        profileImageUrl: user.data.profile_image_url,
        verified: user.data.verified || false,
        publicMetrics: {
          followersCount: user.data.public_metrics?.followers_count || 0,
          followingCount: user.data.public_metrics?.following_count || 0,
          tweetCount: user.data.public_metrics?.tweet_count || 0,
          listedCount: user.data.public_metrics?.listed_count || 0
        },
        description: user.data.description,
        location: user.data.location,
        url: user.data.url,
        createdAt: user.data.created_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting user info:', error)
      return null
    }
  }

  private async storeUserTokens(userId: string, tokens: TwitterTokens): Promise<void> {
    const encryptedTokens = this.encryptTokens(tokens)
    
    await prisma.systemConfig.upsert({
      where: { key: `twitter_tokens_${userId}` },
      update: { 
        value: encryptedTokens,
        updatedAt: new Date()
      },
      create: {
        key: `twitter_tokens_${userId}`,
        value: encryptedTokens,
        description: 'Encrypted Twitter OAuth tokens'
      }
    })
  }

  private async getUserTokens(userId: string): Promise<TwitterTokens | null> {
    try {
      const stored = await prisma.systemConfig.findUnique({
        where: { key: `twitter_tokens_${userId}` }
      })

      if (!stored?.value) return null

      return this.decryptTokens(stored.value as any)
    } catch (error) {
      console.error('Error retrieving user tokens:', error)
      return null
    }
  }

  private async removeUserTokens(userId: string): Promise<void> {
    await prisma.systemConfig.deleteMany({
      where: { key: `twitter_tokens_${userId}` }
    })
  }

  private async updateUserTwitterInfo(userId: string, userInfo: TwitterUserInfo): Promise<void> {
    // Calculate activity level based on followers
    let activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    const followers = userInfo.publicMetrics.followersCount

    if (followers >= 1000) {
      activityLevel = 'HIGH'
    } else if (followers >= 500) {
      activityLevel = 'MEDIUM'
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterId: userInfo.id,
        twitterUsername: userInfo.username,
        twitterName: userInfo.name,
        twitterImage: userInfo.profileImageUrl,
        twitterFollowers: userInfo.publicMetrics.followersCount,
        twitterActivity: activityLevel,
        updatedAt: new Date()
      }
    })

    await this.awardConnectionBonus(userId)
  }

  private async clearUserTwitterInfo(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterId: null,
        twitterUsername: null,
        twitterName: null,
        twitterImage: null,
        twitterFollowers: null,
        twitterActivity: null,
        updatedAt: new Date()
      }
    })
  }

  private async awardConnectionBonus(userId: string): Promise<void> {
    const TWITTER_CONNECTION_POINTS = 50

    try {
      const existingBonus = await prisma.pointHistory.findFirst({
        where: {
          userId,
          action: 'TWITTER_CONNECT'
        }
      })

      if (!existingBonus) {
        await Promise.all([
          prisma.pointHistory.create({
            data: {
              userId,
              points: TWITTER_CONNECTION_POINTS,
              action: 'TWITTER_CONNECT',
              description: 'Connected Twitter account',
              metadata: {
                timestamp: new Date().toISOString(),
                source: 'twitter_auth'
              }
            }
          }),
          prisma.user.update({
            where: { id: userId },
            data: {
              totalPoints: { increment: TWITTER_CONNECTION_POINTS }
            }
          })
        ])
      }
    } catch (error) {
      console.error('Error awarding connection bonus:', error)
    }
  }

  private isTokenExpired(tokens: TwitterTokens): boolean {
    return tokens.expiresAt.getTime() < Date.now() + (5 * 60 * 1000)
  }

  private async refreshAccessToken(userId: string, tokens: TwitterTokens): Promise<boolean> {
    if (!tokens.refreshToken) return false

    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }).toString()
      })

      if (!response.ok) return false

      const tokenData = await response.json()
      
      const refreshedTokens: TwitterTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || tokens.refreshToken,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        scope: tokenData.scope?.split(' ') || tokens.scope
      }

      await this.storeUserTokens(userId, refreshedTokens)
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  private async revokeTokens(accessToken: string): Promise<void> {
    try {
      await fetch('https://api.twitter.com/2/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${accessToken}`
        },
        body: new URLSearchParams({
          token: accessToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }).toString()
      })
    } catch (error) {
      console.error('Token revocation error:', error)
    }
  }

  private encryptTokens(tokens: TwitterTokens): any {
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this-in-production'
    const algorithm = 'aes-256-cbc'
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher(algorithm, key)
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(tokens), 'utf8'),
      cipher.final()
    ])

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      algorithm
    }
  }

  private decryptTokens(encryptedData: any): TwitterTokens {
    try {
      const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this-in-production'
      const algorithm = encryptedData.algorithm || 'aes-256-cbc'
      
      const decipher = crypto.createDecipher(algorithm, key)
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
        decipher.final()
      ])

      const tokens = JSON.parse(decrypted.toString('utf8'))
      
      return {
        ...tokens,
        expiresAt: new Date(tokens.expiresAt)
      }
    } catch (error) {
      console.error('Token decryption error:', error)
      throw new Error('Failed to decrypt tokens')
    }
  }

  private async logAuthEvent(userId: string, event: string, data: any): Promise<void> {
    try {
      await prisma.analytics.create({
        data: {
          metadata: {
            type: 'TWITTER_AUTH_EVENT',
            userId,
            event,
            data,
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (error) {
      console.error('Error logging auth event:', error)
    }
  }
}

export const twitterAuth = new TwitterAuthService()
