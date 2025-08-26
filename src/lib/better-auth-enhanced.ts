// import { betterAuth } from "better-auth";
// import { prismaAdapter } from "better-auth/adapters/prisma";
// import { twoFactor } from "better-auth/plugins/two-factor";
// import { admin } from "better-auth/plugins/admin";
// import prisma from "@/lib/prisma";
// import { nextCookies } from "better-auth/next-js";
// import { createAuthMiddleware, APIError } from "better-auth/api";
// import { useWalletStore } from "@/store/useWalletStore";

// console.log("Initializing Better Auth with configuration:");
// console.log("Base URL:", process.env.NEXT_PUBLIC_APP_URL);
// const { publicKey } = useWalletStore();
// export const auth = betterAuth({
//   database: prismaAdapter(prisma, {
//     provider: "postgresql",
//   }),

//   secret: process.env.BETTER_AUTH_SECRET!,
//   baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL!,

//   emailAndPassword: {
//     enabled: false,
//   },

//   socialProviders: {
//     twitter: {
//       clientId: process.env.TWITTER_CLIENT_ID!,
//       clientSecret: process.env.TWITTER_CLIENT_SECRET!,
//       redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`,
//     },
//   },

//   session: {
//     expiresIn: 60 * 60 * 24 * 30, // 30 days
//     updateAge: 60 * 60 * 24, // Update every 24 hours
//   },

//   advanced: {
//     useSecureCookies: process.env.NODE_ENV === "production",
//     cookiePrefix: "airdrop-auth",
//     crossSubDomainCookies: {
//       enabled: process.env.NODE_ENV === "production",
//       domain:
//         process.env.NODE_ENV === "production"
//           ? process.env.NEXT_PUBLIC_DOMAIN
//           : undefined,
//     },
//   },

//   plugins: [nextCookies()],
//   hooks: {
//     after: createAuthMiddleware(async (ctx) => {
//       const newSession = ctx.context.newSession;
//       const user = await prisma.user.findUnique({
//         where: { id: newSession?.user.id },
//       });
//       if (newSession) {
//         if (user) {
//           console.log("🔑 User signed in:", user.id);
//           try {
//             await prisma.systemConfig.create({
//               data: {
//                 key: `auth_signin_${user.id}_${Date.now()}`,
//                 value: {
//                   type: "SIGNIN",
//                   userId: user.id,
//                   timestamp: new Date().toISOString(),
//                 },
//                 description: "User sign-in event",
//               },
//             });
//           } catch (error) {
//             console.error("Failed to log sign-in event:", error);
//           }
//         } else {
//           console.log("🆕 User signed up:", newSession.user.id);
//           console.log("🆕 User signed up:", newSession.user.id);
//           try {
//             if (newSession.user.email) {
//               await prisma.user.upsert({
//                 where: { email: newSession.user.email },
//                 update: {
//                   twitterName: newSession.user.name,
//                   twitterImage: newSession.user.image,
//                 },
//                 create: {
//                   email: newSession.user.email,
//                   twitterName: newSession.user.name,
//                   twitterImage: newSession.user.image,
//                   walletAddress: publicKey || `wallet_${newSession.user.id}`,
//                 },
//               });
//             }

//             await prisma.systemConfig.create({
//               data: {
//                 key: `auth_signup_${newSession.user.id}_${Date.now()}`,
//                 value: {
//                   type: "SIGNUP",
//                   userId: newSession.user.id,
//                   timestamp: new Date().toISOString(),
//                 },
//                 description: "User registration event",
//               },
//             });
//           } catch (error) {
//             console.error("Failed to handle sign-up:", error);
//           }
//         }
//       }
//     }),
//   },

//   logger: {
//     disabled: false,
//     level: "error",
//     log: (level, message, ...args) => {
//       // Custom logging implementation
//       console.log(`[${level}] ${message}`, ...args);
//     },
//   },
// });

// export type Session = typeof auth.$Infer.Session;
// export type User = typeof auth.$Infer.Session.user;





import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins/two-factor";
import { admin } from "better-auth/plugins/admin";
import prisma from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware, APIError } from "better-auth/api";

console.log("Initializing Better Auth with configuration:");
console.log("Base URL:", process.env.NEXT_PUBLIC_APP_URL);

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
      // redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`,
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
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_DOMAIN
          : undefined,
    },
  },
  plugins: [ nextCookies()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // This runs before authentication is processed
      console.log("Authentication process started");
      
      // You can add pre-authentication logic here
      // For example: validate additional parameters, check rate limits, etc.
    }),
    
    after: createAuthMiddleware(async (ctx) => {
      const { isNewUser, newSession } = ctx.context;
      
      if (!newSession) {
        // No session was created, nothing to do
        return;
      }

      try {
        if (isNewUser) {
          // Handle new user sign-up
          console.log("🆕 New user signed up:", newSession.user.id);
          
          // Log the sign-up event
          await prisma.systemConfig.create({
            data: {
              key: `auth_signup_${newSession.user.id}_${Date.now()}`,
              value: {
                type: "SIGNUP",
                userId: newSession.user.id,
                timestamp: new Date().toISOString(),
              },
              description: "User registration event",
            },
          });
          
          // Note: Better Auth already creates the user record with Twitter data
          // No need to create/update user here unless you have additional fields
        } else {
          // Handle existing user sign-in
          console.log("🔑 Existing user signed in:", newSession.user.id);
          
          // Log the sign-in event
          await prisma.systemConfig.create({
            data: {
              key: `auth_signin_${newSession.user.id}_${Date.now()}`,
              value: {
                type: "SIGNIN",
                userId: newSession.user.id,
                timestamp: new Date().toISOString(),
              },
              description: "User sign-in event",
            },
          });
        }
      } catch (error) {
        console.error("Failed to process authentication event:", error);
        // Optionally throw an error to interrupt the flow if critical
        // throw new APIError("INTERNAL_SERVER_ERROR", { message: "Failed to process authentication" });
      }
    }),
  },
  logger: {
    disabled: false,
    level: "error",
    log: (level, message, ...args) => {
      console.log(`[${level}] ${message}`, ...args);
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;