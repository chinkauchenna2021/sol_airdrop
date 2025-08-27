// lib/auth-client.ts - Better Auth Client Configuration
import { createAuthClient } from "better-auth/react"
import type { Session, User } from "./better-auth-enhanced"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
})

export type { Session, User }