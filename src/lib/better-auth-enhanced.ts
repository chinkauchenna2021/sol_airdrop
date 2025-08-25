import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { twoFactor } from "better-auth/plugins/two-factor"
import { admin } from "better-auth/plugins/admin"
import prisma from "@/lib/prisma"
import { nextCookies } from "better-auth/next-js"

console.log('Initializing Better Auth with configuration:')
console.log('Base URL:', process.env.NEXT_PUBLIC_APP_URL)

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL!,
  
  emailAndPassword: {
    enabled: false,
  },
  
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
  
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
  
  plugins: [nextCookies()],
  
  events: {
    onSignIn: async (data: { user: { id: string } }) => {
      console.log("🔑 User signed in:", data.user.id)
      try {
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
    
    onSignUp: async (data: { user: { id: string; email?: string; name?: string; image?: string } }) => {
      console.log("🆕 User signed up:", data.user.id)
      try {
        if (data.user.email) {
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
              walletAddress: `wallet_${data.user.id}`,
            }
          })
        }
        
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
    
    onSignOut: async (data: { userId: string }) => {
      console.log("👋 User signed out:", data.userId)
    },
  },
  
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "warn",
    disabled: false,
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user