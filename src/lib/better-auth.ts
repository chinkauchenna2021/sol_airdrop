// lib/better-auth.ts - Better Auth Configuration
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or your database provider
  }),
  emailAndPassword: {
    enabled: false, // We only want social auth
  },
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "airdrop-auth",
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" 
        ? process.env.NEXT_PUBLIC_DOMAIN 
        : "localhost"
    }
  },
  callbacks: {
    async signIn({ user, account }:{user:any,account:any}) {
      // This will be called when a user signs in
      console.log("Better Auth Sign In:", { user, account })
      return true
    },
    async signUp({ user, account }:{user:any,account:any}) {
      // Handle new user registration
      console.log("Better Auth Sign Up:", { user, account })
      
      // You can add custom logic here for new users
      if (account?.provider === "twitter") {
        // Award welcome bonus points or other initialization
        console.log("New Twitter user registered:", user.email)
      }
      
      return true
    },
  },
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user 