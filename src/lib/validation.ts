import { z } from 'zod'
import { REGEX, LIMITS, PAYMENT_METHODS } from './constants'

// User schemas
export const walletAuthSchema = z.object({
  walletAddress: z.string()
    .regex(REGEX.WALLET_ADDRESS, 'Invalid wallet address format')
})

export const userUpdateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(LIMITS.MAX_USERNAME_LENGTH, `Username must be less than ${LIMITS.MAX_USERNAME_LENGTH} characters`)
    .regex(REGEX.USERNAME, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .optional(),
  bio: z.string()
    .max(LIMITS.MAX_BIO_LENGTH, `Bio must be less than ${LIMITS.MAX_BIO_LENGTH} characters`)
    .optional(),
})

// Claim schemas
export const createClaimSchema = z.object({
  points: z.number()
    .int('Points must be a whole number')
    .min(LIMITS.MIN_CLAIM_AMOUNT, `Minimum claim amount is ${LIMITS.MIN_CLAIM_AMOUNT} points`)
    .max(LIMITS.MAX_CLAIM_AMOUNT, `Maximum claim amount is ${LIMITS.MAX_CLAIM_AMOUNT} points`),
  paymentMethod: z.enum([PAYMENT_METHODS.SOLANA, PAYMENT_METHODS.USDC])
    .default(PAYMENT_METHODS.SOLANA),
})

// Task schemas
export const createTaskSchema = z.object({
  name: z.string()
    .min(3, 'Task name must be at least 3 characters')
    .max(100, 'Task name must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  type: z.enum(['SOCIAL_TWITTER', 'SOCIAL_DISCORD', 'WALLET_CONNECT', 'REFERRAL', 'DAILY_CHECK_IN', 'CUSTOM']),
  points: z.number()
    .int('Points must be a whole number')
    .min(1, 'Points must be at least 1')
    .max(10000, 'Points cannot exceed 10,000'),
  requirements: z.record(z.any()),
  expiresAt: z.string().datetime().optional(),
})

export const completeTaskSchema = z.object({
  taskId: z.string().cuid('Invalid task ID'),
})

// Twitter schemas
export const twitterEngagementSchema = z.object({
  tweetId: z.string().min(1, 'Tweet ID is required'),
  engagementType: z.enum(['LIKE', 'RETWEET', 'COMMENT', 'QUOTE', 'FOLLOW']),
})

// Analytics schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
})

// Admin schemas
export const adminUserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  totalPoints: z.number().int().min(0).optional(),
})

export const systemConfigUpdateSchema = z.object({
  key: z.string().min(1, 'Config key is required'),
  value: z.any(),
  description: z.string().optional(),
})

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').nullable(),
})

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['users', 'tasks', 'claims']).optional(),
})

// Referral schemas
export const referralSchema = z.object({
  referralCode: z.string()
    .min(6, 'Invalid referral code')
    .max(20, 'Invalid referral code'),
})

// Type exports
export type WalletAuth = z.infer<typeof walletAuthSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type CreateClaim = z.infer<typeof createClaimSchema>
export type CreateTask = z.infer<typeof createTaskSchema>
export type CompleteTask = z.infer<typeof completeTaskSchema>
export type TwitterEngagement = z.infer<typeof twitterEngagementSchema>
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>
export type SystemConfigUpdate = z.infer<typeof systemConfigUpdateSchema>
export type Pagination = z.infer<typeof paginationSchema>
export type Search = z.infer<typeof searchSchema>
export type Referral = z.infer<typeof referralSchema>