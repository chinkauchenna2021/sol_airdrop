import NextAuth, { AuthOptions, getServerSession } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      twitterId?: string;
      twitterUsername?: string;
      twitterName?: string;
      twitterImage?: string;
      twitterFollowers?: number;
      twitterActivity?: any;
      walletAddress?: string;
      totalTokens?: number;
      totalEarnedTokens?: number;
      [key: string]: any;
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    id: string;
    twitterId?: string;
    twitterUsername?: string;
    twitterName?: string;
    twitterImage?: string;
    twitterFollowers?: number;
    twitterActivity?: any;
    walletAddress?: string;
    totalTokens?: number;
    totalEarnedTokens?: number;
    [key: string]: any;
  }
}

const authOptions: AuthOptions  = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "tweet.read users.read like.read follows.read offline.access",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        console.log(session,'<-- session-->')
        // Get additional user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            twitterId: true,
            twitterUsername: true,
            twitterName: true,
            twitterImage: true,
            twitterFollowers: true,
            twitterActivity: true,
            walletAddress: true,
            totalTokens: true,
            totalEarnedTokens: true,
          },
        });

        if (dbUser) {
          session.user.twitterId = dbUser.twitterId ?? undefined;
          session.user.twitterUsername = dbUser.twitterUsername ?? undefined;
          session.user.twitterName = dbUser.twitterName ?? undefined;
          session.user.twitterImage = dbUser.twitterImage ?? undefined;
          session.user.twitterFollowers = dbUser.twitterFollowers ?? undefined;
          session.user.twitterActivity = dbUser.twitterActivity ?? undefined;
          session.user.walletAddress = dbUser.walletAddress ?? undefined;
          session.user.totalTokens = dbUser.totalTokens ?? undefined;
          session.user.totalEarnedTokens = dbUser.totalEarnedTokens ?? undefined;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (profile) {
        token.twitterId = (profile as any)?.id ?? undefined;
        token.twitterUsername = (profile as any)?.username ?? undefined;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("Creating user:", user);
      // Create user record in our custom User table when a new user signs up
      try {
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {},
          create: {
            id: user.id,
            email: user.email!,
            twitterId: user.twitterId as string,
            twitterUsername: user.twitterUsername as string,
            twitterName: user.name!,
            twitterImage: user.image!,
            walletAddress: `twitter_${user.twitterId}_${Date.now()}`,
            totalPoints: 0,
            totalTokens: 100, // Welcome bonus
            totalEarnedTokens: 100,
            level: 1,
            rank: 0,
            streak: 0,
            referralCode: crypto.randomUUID().slice(0, 8),
            isAdmin: false,
            isActive: true,
          },
        });

        // Record welcome bonus
        await prisma.pointHistory.create({
          data: {
            userId: user.id,
            tokens: 100,
            type: "TOKENS",
            action: "WELCOME_BONUS",
            description: "100 tokens welcome bonus for connecting Twitter",
          },
        });
      } catch (error) {
        console.error("Error creating user record:", error);
      }
    },
  },
});




/**
 * Helper function to get the session on the server without having to import the authOptions object every single time
 * @returns The session object or null
 */
const getSession = () => getServerSession(authOptions)

export { authOptions, getSession }