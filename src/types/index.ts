import { LeaderboardEntry } from "@/lib/types"

interface LeaderboardFilters {
  search?: string
  activity?: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
  hasTwitter?: boolean | null
  minStreak?: number
  minPoints?: number
  maxPoints?: number
  region?: string
}

interface LeaderboardStats {
  totalActiveUsers: number
  totalPoints: number
  totalEngagements: number
  activityDistribution: Array<{
    twitterActivity: string
    _count: number
  }>
  topGainers: Array<{
    id: string
    twitterUsername?: string
    walletAddress: string
    totalPoints: number
  }>
  newUsers: number
  averagePoints: number
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  userRank?: {
    rank: number
    change: number
    previousRank?: number
    pointsChange?: number
  }
  totalUsers: number
  totalPages: number
  currentPage: number
  lastUpdated: string
  stats: LeaderboardStats
  timeRange: string
  filters: LeaderboardFilters
}