// lib/better-auth-enhanced.ts - Simplified Better Auth Configuration
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
// import { twoFactor } from "better-auth/plugins/two-factor"
// import { admin } from "better-auth/plugins/admin"
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Basic configuration
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL!,
  
  // Disable email/password auth - only social
  emailAndPassword: {
    enabled: false,
  },
  
  // Social providers configuration
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      // redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`,
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },

  // Advanced settings
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "airdrop-auth",
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" 
        ? process.env.NEXT_PUBLIC_DOMAIN 
        : undefined
    },
  },

  // Plugins
  // plugins: [
  //   twoFactor({
  //     issuer: process.env.NEXT_PUBLIC_APP_NAME || "Tweetxconnect Airdrop",
  //   }),
  //   admin(),
  // ],
     plugins: [nextCookies()],
  // Event handlers
  events: {
    onSignIn: async (data: { user: { id: any } }) => {
      console.log("🔑 User signed in:", data.user.id)
      try {
        // Log authentication event
        await prisma.systemConfig.create({
          data: {
            key: `auth_signin_${data.user.id}_${Date.now()}`,
            value: {
              type: 'SIGNIN',
              userId: data.user.id,
              timestamp: new Date().toISOString(),
            },
            description: 'User sign-in event'
          }
        })
      } catch (error) {
        console.error("Failed to log sign-in event:", error)
      }
    },
    
    onSignUp: async (data: { user: { id: any; email: any; name: any; image: any } }) => {
      console.log("🆕 User signed up:", data.user.id)
      try {
        // Handle new user setup
        if (data.user.email) {
          // Create initial user record or update existing
          await prisma.user.upsert({
            where: { email: data.user.email },
            update: {
              twitterName: data.user.name,
              twitterImage: data.user.image,
            },
            create: {
              email: data.user.email,
              twitterName: data.user.name,
              twitterImage: data.user.image,
              walletAddress: `wallet_${data.user.id}`, // Generate or assign wallet
            }
          })
        }

        // Log registration event
        await prisma.systemConfig.create({
          data: {
            key: `auth_signup_${data.user.id}_${Date.now()}`,
            value: {
              type: 'SIGNUP',
              userId: data.user.id,
              timestamp: new Date().toISOString(),
            },
            description: 'User registration event'
          }
        })
      } catch (error) {
        console.error("Failed to handle sign-up:", error)
      }
    },
    
    onSignOut: async (data: { userId: any }) => {
      console.log("👋 User signed out:", data.userId)
    },
  },

  // Error handling
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "warn",
    disabled: false,
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
