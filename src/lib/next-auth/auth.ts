// import NextAuth, { AuthOptions, getServerSession, NextAuthOptions } from "next-auth";
// import TwitterProvider from "next-auth/providers/twitter";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import prisma from "@/lib/prisma";
// import { DefaultSession, DefaultUser } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       twitterId?: string;
//       twitterUsername?: string;
//       twitterName?: string;
//       twitterImage?: string;
//       twitterFollowers?: number;
//       twitterActivity?: any;
//       walletAddress?: string;
//       totalTokens?: number;
//       totalEarnedTokens?: number;
//       [key: string]: any;
//     } & DefaultSession["user"];
//   }
//   interface User extends DefaultUser {
//     id: string;
//     twitterId?: string;
//     twitterUsername?: string;
//     twitterName?: string;
//     twitterImage?: string;
//     twitterFollowers?: number;
//     twitterActivity?: any;
//     walletAddress?: string;
//     totalTokens?: number;
//     totalEarnedTokens?: number;
//     [key: string]: any;
//   }
// }

// export const authOptions: AuthOptions = {
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     TwitterProvider({
//       clientId: process.env.TWITTER_CLIENT_ID!,
//       clientSecret: process.env.TWITTER_CLIENT_SECRET!,
//       version: "2.0",
//       authorization: {
//         url: "https://twitter.com/i/oauth2/authorize",
//         params: {
//           scope: "tweet.read users.read like.read follows.read offline.access",
//         },
//       },
//     }),
//   ],
//   secret: process.env.NEXTAUTH_SECRET as string,
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     async session({ session, token }) {
//       // FIX: Use token instead of user when using JWT strategy
//       if (session?.user && token?.sub) {
//         session.user.id = token.sub;
        
//         // Add Twitter data from token to session
//         if (token.twitterId) session.user.twitterId = token.twitterId as string;
//         if (token.twitterUsername) session.user.twitterUsername = token.twitterUsername as string;
        
//         // Get additional user data from database
//         const dbUser = await prisma.user.findUnique({
//           where: { id: token.sub }, // Use token.sub instead of user.id
//           select: {
//             twitterId: true,
//             twitterUsername: true,
//             twitterName: true,
//             twitterImage: true,
//             twitterFollowers: true,
//             twitterActivity: true,
//             walletAddress: true,
//             totalTokens: true,
//             totalEarnedTokens: true,
//           },
//         });
        
//         if (dbUser) {
//           session.user.twitterId = dbUser.twitterId ?? undefined;
//           session.user.twitterUsername = dbUser.twitterUsername ?? undefined;
//           session.user.twitterName = dbUser.twitterName ?? undefined;
//           session.user.twitterImage = dbUser.twitterImage ?? undefined;
//           session.user.twitterFollowers = dbUser.twitterFollowers ?? undefined;
//           session.user.twitterActivity = dbUser.twitterActivity ?? undefined;
//           session.user.walletAddress = dbUser.walletAddress ?? undefined;
//           session.user.totalTokens = dbUser.totalTokens ?? undefined;
//           session.user.totalEarnedTokens = dbUser.totalEarnedTokens ?? undefined;
//         }
//       }
//       return session;
//     },
//     async jwt({ token, account, profile, user }) {
//       // Persist the OAuth access_token to the token
//       if (account) {
//         token.accessToken = account.access_token;
//         token.refreshToken = account.refresh_token;
//       }
      
//       // Add Twitter profile data to token
//       if (profile) {
//         token.twitterId = (profile as any)?.id;
//         token.twitterUsername = (profile as any)?.username;
//       }
      
//       // Add user ID to token when available (during initial sign-in)
//       if (user) {
//         token.id = user.id;
//       }
      
//       return token;
//     },
//   },
//   events: {
//     async createUser({ user }) {
//       console.log("==========================Creating user: ====================================", user);
//       // Create user record in our custom User table when a new user signs up
//       try {
//         await prisma.user.upsert({
//           where: { email: user.email! },
//           update: {},
//           create: {
//             id: user.id,
//             email: user.email!,
//             twitterId: user.twitterId as string,
//             twitterUsername: user.twitterUsername as string,
//             twitterName: user.name!,
//             twitterImage: user.image!,
//             walletAddress: `twitter_${user.twitterId}_${Date.now()}`,
//             totalPoints: 0,
//             totalTokens: 100, // Welcome bonus
//             totalEarnedTokens: 100,
//             level: 1,
//             rank: 0,
//             streak: 0,
//             referralCode: crypto.randomUUID().slice(0, 8),
//             isAdmin: false,
//             isActive: true,
//           },
//         });
//         // Record welcome bonus
//         await prisma.pointHistory.create({
//           data: {
//             userId: user.id,
//             tokens: 100,
//             type: "TOKENS",
//             action: "WELCOME_BONUS",
//             description: "100 tokens welcome bonus for connecting Twitter",
//           },
//         });
//       } catch (error) {
//         console.error("Error creating user record:", error);
//       }
//     },
//   },
// };




import NextAuth, { AuthOptions, getServerSession, NextAuthOptions, DefaultUser , DefaultSession  } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { getCookies } from "cookies-next/client";

// Extend the NextAuth types
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
    error?: string; // Add error property to session
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

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    twitterId?: string;
    twitterUsername?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    walletAddress?: string;
    [key: string]: any;
  }
}


// Add this helper function at the top of the file
function extractTwitterProfile(profile: any) {
  // Twitter OAuth 2.0 profile structure might be nested
  const twitterProfile = profile?.data || profile;
  
  return {
    id: twitterProfile?.id,
    username: twitterProfile?.username,
    name: twitterProfile?.name,
    profile_image_url: twitterProfile?.profile_image_url,
  };
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
// Update the TwitterProvider configuration
// Update the TwitterProvider configuration
TwitterProvider({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  version: "2.0",
  authorization: {
    url: "https://twitter.com/i/oauth2/authorize",
    params: {
      scope: "tweet.read users.read like.read follows.read offline.access",
      response_type: "code",
      code_challenge: "challenge",
      code_challenge_method: "plain",
    },
  },
  // Update the profile callback to match our schema
  profile(profile) {
    // Log the raw profile in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Raw Twitter Profile:', profile);
    }
    
    // Extract the actual user data from the response
    const userData = profile?.data || profile;
    
    return {
      id: userData.id,
      name: userData.name,
      email: null, // Twitter doesn't provide email by default
      image: userData.profile_image_url,
      // Add Twitter-specific fields that match our schema
      twitterUsername: userData.username,
      twitterName: userData.name,
      twitterImage: userData.profile_image_url,
    };
  },
}),
  ],




  secret: process.env.NEXTAUTH_SECRET!,
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60, // 60 days
  },
  callbacks: {
async session({ session, token }) {
  if (session?.user && token?.sub) {
    session.user.id = token.sub;
    
    // Add Twitter data from token to session
    if (token.twitterId) session.user.twitterId = token.twitterId as string;
    if (token.twitterUsername) session.user.twitterUsername = token.twitterUsername as string;
    
    // Get additional user data from database
    const dbUser = await prisma.user.findUnique({
      where: { id: token.sub },
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
  
  // Propagate token error to session
  if (token.error) {
    session.error = token.error;
  }
  
  return session;
},
    

async signIn({ user, account, profile, credentials }) {
  // Only handle Twitter provider
  if (account?.provider !== "twitter") return true;
  
  try {
    // Extract Twitter profile data with fallbacks
    const twitterProfile = extractTwitterProfile(profile);
    
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Twitter SignIn Profile:', twitterProfile);
    }
    
    // Validate required fields
    if (!twitterProfile.id) {
      console.error("Twitter ID not found in profile", profile);
      return false;
    }
    
    //get users walletkey


    // Check if we have a wallet address from state parameter
    const walletAddress = (account as any)?.state?.walletAddress;
    
    if (walletAddress) {
      // Look for user with this wallet address
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress },
      });
      
      if (existingUser) {
        // Update the existing user with Twitter info
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            twitterId: twitterProfile.id,
            twitterUsername: twitterProfile.username,
            twitterName: twitterProfile.name,
            twitterImage: twitterProfile.profile_image_url,
          },
        });
        
        // Set the user ID to the existing user
        user.id = existingUser.id;
        return true;
      }
    }
    
    // Check if user already exists with this Twitter ID
    const existingUserByTwitterId = await prisma.user.findUnique({
      where: { twitterId: twitterProfile.id },
    });
    
    if (existingUserByTwitterId) {
      // Update the existing user's Twitter info
      await prisma.user.update({
        where: { id: existingUserByTwitterId.id },
        data: {
          twitterUsername: twitterProfile.username,
          twitterName: twitterProfile.name,
          twitterImage: twitterProfile.profile_image_url,
        },
      });
      
      // Set the user ID to the existing user
      user.id = existingUserByTwitterId.id;
      return true;
    }
    
    // No existing user found, allow creating a new one
    return true;
  } catch (error) {
    console.error("Error during Twitter sign in:", error);
    return false;
  }
},

async jwt({ token, account, profile, user }) {
  // Initial sign in
  if (account && profile) {
    // Extract Twitter profile data with fallbacks
    const twitterProfile = extractTwitterProfile(profile);
    
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Twitter JWT Profile:', twitterProfile);
    }
    
    // Store Twitter info in token
    token.twitterId = twitterProfile.id;
    token.twitterUsername = twitterProfile.username;
    token.accessToken = account.access_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt = account.expires_at;
    
    // Try to find existing user by wallet address
    const walletAddress = (account as any)?.state?.walletAddress;
    
    if (walletAddress) {
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress },
      });
      
      if (existingUser) {
        // Update existing user with Twitter info
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            twitterId: twitterProfile.id,
            twitterUsername: twitterProfile.username,
            twitterName: twitterProfile.name,
            twitterImage: twitterProfile.profile_image_url,
          },
        });
        
        // Return token with existing user's ID
        return {
          ...token,
          sub: existingUser.id,
          walletAddress: existingUser.walletAddress,
        };
      }
    }
    
    // Check if user already exists with this Twitter ID
    const existingUserByTwitterId = await prisma.user.findUnique({
      where: { twitterId: twitterProfile.id },
    });
    
    if (existingUserByTwitterId) {
      // Update existing user's Twitter info
      await prisma.user.update({
        where: { id: existingUserByTwitterId.id },
        data: {
          twitterUsername: twitterProfile.username,
          twitterName: twitterProfile.name,
          twitterImage: twitterProfile.profile_image_url,
        },
      });
      
      // Return token with existing user's ID
      return {
        ...token,
        sub: existingUserByTwitterId.id,
        walletAddress: existingUserByTwitterId.walletAddress,
      };
    }
  }
  
  // Handle subsequent token refreshes
  if (token.expiresAt && Date.now() > (token.expiresAt - 300) * 1000) {
    // Token is expired, try to refresh it
    if (token.refreshToken) {
      try {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', token.refreshToken);
        params.append('client_id', process.env.TWITTER_CLIENT_ID!);
        
        const response = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${Buffer.from(
              `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
          body: params,
        });
        
        const tokens = await response.json();
        
        if (!response.ok) {
          console.error("Token refresh failed:", tokens);
          return {
            ...token,
            error: "RefreshAccessTokenError",
          };
        }
        
        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
          expiresAt: tokens.expires_at,
          error: undefined,
        };
      } catch (error) {
        console.error("Error refreshing access token:", error);
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    } else {
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }
  }
  
  return token;
}
  },
events: {
  async createUser({ user }) {
    console.log("Creating user:", user);
    
    try {
      // Check if user already exists (might have been created in the signIn callback)
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (existingUser) {
        console.log("User already exists, skipping creation");
        return;
      }
      
      // Create user record in our custom User table
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          twitterId: user.id, // Twitter ID is the same as user ID
          twitterUsername: user.twitterUsername, // Use the field from profile callback
          twitterName: user.name,
          twitterImage: user.image,
          walletAddress: `twitter_${user.id}_${Date.now()}`,
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
      throw error; // Re-throw to see the error in NextAuth logs
    }
  },
},
};


/**
 * Helper function to get the session on the server without having to import the authOptions object every single time
 * @returns The session object or null
 */
const getSession = () => getServerSession(authOptions);
export { getSession };

