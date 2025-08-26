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
import { useWalletStore } from "@/store/useWalletStore";

console.log("Initializing Better Auth with configuration:");
console.log("Base URL:", process.env.NEXT_PUBLIC_APP_URL);

const { publicKey } = useWalletStore();

const baseURL: string | undefined =
	process.env.VERCEL === "1"
		? process.env.VERCEL_ENV === "production"
			? process.env.BETTER_AUTH_URL
			: process.env.VERCEL_ENV === "preview"
				? `https://${process.env.VERCEL_URL}`
				: undefined
		: undefined;

const cookieDomain: string | undefined =
	process.env.VERCEL === "1"
		? process.env.VERCEL_ENV === "production"
			? ".better-auth.com"
			: process.env.VERCEL_ENV === "preview"
				? `.${process.env.VERCEL_URL}`
				: undefined
		: undefined;






export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret:'6ad9158f7cdc70665f837d2178edd7375f24ab18a8ae34a2793137ed469c467e',
  baseURL: baseURL,
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!  || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET! || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
advanced: {
		crossSubDomainCookies: {
			enabled: process.env.NODE_ENV! === "production",
			domain: cookieDomain,
		},
	},
  plugins: [nextCookies()],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      const user = await prisma.user.findUnique({
        where: { id: newSession?.user.id },
      });
      if (newSession) {
        if (user) {
          console.log("🔑 User signed in:", user.id);
          try {
            await prisma.systemConfig.create({
              data: {
                key: `auth_signin_${user.id}_${Date.now()}`,
                value: {
                  type: "SIGNIN",
                  userId: user.id,
                  timestamp: new Date().toISOString(),
                },
                description: "User sign-in event",
              },
            });
          } catch (error) {
            console.error("Failed to log sign-in event:", error);
          }
        } else {
          console.log("🆕 User signed up:", newSession.user.id);
          console.log("🆕 User signed up:", newSession.user.id);
          try {
            if (newSession.user.email) {
              await prisma.user.upsert({
                where: { email: newSession.user.email },
                update: {
                  twitterName: newSession.user.name,
                  twitterImage: newSession.user.image,
                },
                create: {
                  email: newSession.user.email,
                  twitterName: newSession.user.name,
                  twitterImage: newSession.user.image,
                  walletAddress: publicKey || `wallet_${newSession.user.id}`,
                },
              });
            }

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
          } catch (error) {
            console.error("Failed to handle sign-up:", error);
          }
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;