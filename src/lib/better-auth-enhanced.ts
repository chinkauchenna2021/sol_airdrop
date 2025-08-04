// lib/better-auth-enhanced.ts - Enhanced Better Auth Configuration
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { twoFactor } from "better-auth/plugins/two-factor"
import { admin } from "better-auth/plugins/admin"
import prisma from "@/lib/prisma"

export interface TwitterUserData {
  id: string
  username: string
  name: string
  email?: string
  image?: string
  verified?: boolean
  followers_count?: number
  following_count?: number
  tweet_count?: number
  description?: string
  location?: string
  created_at?: string
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Disable email/password auth - only social
  emailAndPassword: {
    enabled: false,
  },
  
  // Enhanced social providers configuration
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`,
      scope: [
        "tweet.read",
        "users.read", 
        "follows.read",
        "like.read",
        "offline.access"
      ],
      fields: [
        "id",
        "username", 
        "name",
        "profile_image_url",
        "verified",
        "public_metrics",
        "description",
        "location",
        "created_at"
      ]
    },
  },

  // Enhanced session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Advanced security settings
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "airdrop-auth",
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" 
        ? process.env.NEXT_PUBLIC_DOMAIN 
        : "localhost"
    },
    generateId: () => {
      // Generate custom ID compatible with your system
      return Math.random().toString(36).substring(2) + Date.now().toString(36)
    }
  },

  // Enhanced rate limiting
  rateLimit: {
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
    storage: "memory", // Use Redis in production
  },

  // Comprehensive callbacks for integration
  callbacks: {
    async signIn({ user, account, profile }:{user:any;account:any;profile:any}): Promise<boolean> {
      try {
        console.log("🔑 Better Auth Sign In:", { 
          userId: user.id, 
          provider: account?.provider,
          username: (profile as TwitterUserData)?.username 
        })

        // Log authentication event
        await prisma.systemConfig.upsert({
          where: { key: `auth_log_${user.id}_${Date.now()}` },
          update: {},
          create: {
            key: `auth_log_${user.id}_${Date.now()}`,
            value: {
              type: 'SIGNIN',
              provider: account?.provider,
              timestamp: new Date().toISOString(),
              metadata: {
                username: (profile as TwitterUserData)?.username,
                verified: (profile as TwitterUserData)?.verified,
              }
            },
            description: 'Better Auth sign-in event'
          }
        })

        return true
      } catch (error) {
        console.error("❌ Sign in callback error:", error)
        return false
      }
    },

    async signUp({ user, account, profile }:{user:any;account:any;profile:any}): Promise<boolean> {
      try {
        console.log("🆕 Better Auth Sign Up:", { 
          userId: user.id, 
          provider: account?.provider,
          username: (profile as TwitterUserData)?.username 
        })

        if (account?.provider === "twitter") {
          const twitterData = profile as TwitterUserData
          
          // Enhanced user data extraction
          const userData = {
            twitterId: twitterData.id,
            twitterUsername: twitterData.username,
            twitterName: twitterData.name,
            twitterImage: twitterData.image,
            twitterFollowers: twitterData.followers_count || 0,
            email: twitterData.email || null,
          }

          // Store enhanced Twitter data for later sync
          await prisma.systemConfig.upsert({
            where: { key: `pending_twitter_data_${user.id}` },
            update: { 
              value: userData,
              updatedAt: new Date()
            },
            create: {
              key: `pending_twitter_data_${user.id}`,
              value: userData,
              description: 'Pending Twitter data for user sync'
            }
          })

          // Log new user registration
          await prisma.systemConfig.create({
            data: {
              key: `auth_log_${user.id}_${Date.now()}`,
              value: {
                type: 'SIGNUP',
                provider: account.provider,
                timestamp: new Date().toISOString(),
                metadata: userData
              },
              description: 'Better Auth new user registration'
            }
          })
        }

        return true
      } catch (error) {
        console.error("❌ Sign up callback error:", error)
        return false
      }
    },

    async session({ session, token }:{session:any;token:any}): Promise<any> {
      try {
        // Enhance session with custom data
        if (session.user?.id) {
          const userData = await prisma.systemConfig.findUnique({
            where: { key: `pending_twitter_data_${session.user.id}` }
          })

          if (userData?.value) {
            session.user = {
              ...session.user,
              ...userData.value as any
            }
          }
        }

        return session
      } catch (error) {
        console.error("❌ Session callback error:", error)
        return session
      }
    }
  },

  // Enhanced error handling
  error: {
    onError: (error: any, ctx: any) => {
      console.error("🚨 Better Auth Error:", {
        error: error.message,
        stack: error.stack,
        context: ctx,
        timestamp: new Date().toISOString()
      })

      // Log error to database for analysis
      prisma.systemConfig.create({
        data: {
          key: `auth_error_${Date.now()}`,
          value: {
            error: error.message,
            stack: error.stack,
            context: ctx,
            timestamp: new Date().toISOString()
          },
          description: 'Better Auth error log'
        }
      }).catch(console.error)
    }
  },

  // Enhanced logging
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    disabled: false,
  },

  // Plugins for enhanced functionality
  plugins: [
    twoFactor({
      issuer: process.env.NEXT_PUBLIC_APP_NAME || "Tweetxconnect Airdrop",
    }),
    admin(),
  ],

  // Custom handlers for Twitter-specific functionality
  hooks: {
    async before(ctx: any) {
      // Pre-authentication checks
      if (ctx.path === "/sign-in/social" && ctx.query?.provider === "twitter") {
        console.log("🐦 Twitter authentication initiated")
      }
    },

    async after(ctx: any) {
      // Post-authentication actions
      if (ctx.path === "/callback/twitter" && ctx.user) {
        console.log("✅ Twitter authentication completed for:", ctx.user.id)
        
        // Trigger monitoring setup
        await setupTwitterMonitoring(ctx.user.id)
      }
    }
  }
})

// Helper function to setup Twitter monitoring for new users
async function setupTwitterMonitoring(userId: string) {
  try {
    // Initialize monitoring configuration for the user
    await prisma.systemConfig.upsert({
      where: { key: `twitter_monitoring_${userId}` },
      update: {
        value: {
          enabled: true,
          lastCheck: new Date().toISOString(),
          checkInterval: 3600000, // 1 hour
          engagementTracking: true,
          activityScoring: true
        }
      },
      create: {
        key: `twitter_monitoring_${userId}`,
        value: {
          enabled: true,
          lastCheck: new Date().toISOString(),
          checkInterval: 3600000,
          engagementTracking: true,
          activityScoring: true
        },
        description: 'Twitter monitoring configuration'
      }
    })

    console.log("📊 Twitter monitoring setup completed for user:", userId)
  } catch (error) {
    console.error("❌ Error setting up Twitter monitoring:", error)
  }
}

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user