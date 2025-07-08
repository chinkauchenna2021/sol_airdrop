import { User, TwitterEngagement, Task, TaskCompletion, Claim, PointHistory, Referral } from '../../src/app/generated/prisma'

export interface ExtendedUser extends User {
  engagements?: TwitterEngagement[]
  tasks?: TaskCompletion[]
  claims?: Claim[]
  pointHistory?: PointHistory[]
  referrals?: Referral[]
}

export interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    walletAddress: string
    twitterUsername?: string
    twitterImage?: string
    totalPoints: number
  }
  change: number
}

export interface TwitterTask {
  id: string
  type: 'LIKE' | 'RETWEET' | 'FOLLOW' | 'COMMENT'
  targetId: string
  targetUsername?: string
  points: number
  completed: boolean
  description: string
}

export interface ClaimRequest {
  amount: number
  walletAddress: string
  paymentMethod: 'SOLANA' | 'USDC'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface TwitterProfile {
  id: string
  username: string
  name: string
  profileImage: string
  followersCount: number
  verified: boolean
}

export interface TokenomicsData {
  totalSupply: number
  circulatingSupply: number
  airdropAllocation: number
  communityRewards: number
  teamAllocation: number
  liquidityPool: number
  distributed: number
  remaining: number
}

export interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalPoints: number
  totalClaims: number
  totalEngagements: number
  userGrowth: Array<{
    date: string
    count: number
  }>
  engagementTypes: Array<{
    type: string
    count: number
  }>
  claimStats: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
}

export interface WalletState {
  connected: boolean
  publicKey: string | null
  balance: number
  connecting: boolean
  disconnecting: boolean
}

export interface SystemConfig {
  claimsEnabled: boolean
  minClaimAmount: number
  claimRate: number
  pointsPerLike: number
  pointsPerRetweet: number
  pointsPerComment: number
  pointsPerFollow: number
  pointsPerReferral: number
  dailyCheckInPoints: number
}

export interface AuthSession {
  user: {
    id: string
    walletAddress: string
    isAdmin: boolean
    twitterUsername?: string
  }
  expires: string
}