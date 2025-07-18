import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LeaderboardEntry } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatTokenAmount(amount: number, decimals = 9): string {
  return (amount / Math.pow(10, decimals)).toFixed(4)
}

export function parseTokenAmount(amount: string, decimals = 9): number {
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals))
}

export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' minutes ago'
  
  return Math.floor(seconds) + ' seconds ago'
}

export function generateReferralCode(userId: string): string {
  return Buffer.from(userId).toString('base64').slice(0, 8).toUpperCase()
}

export function decodeReferralCode(code: string): string | null {
  try {
    const decoded = Buffer.from(code, 'base64').toString()
    return decoded
  } catch {
    return null
  }
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function groupBy<T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = getKey(item)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {} as Record<K, T[]>)
}




export const leaderboardUtils = {
  formatPoints: (points: number): string => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`
    }
    return points.toLocaleString()
  },

  formatWalletAddress: (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  },

  getActivityColor: (activity?: string): string => {
    switch (activity) {
      case 'HIGH': return 'text-green-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'LOW': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  },

  getActivityBadgeColor: (activity?: string): string => {
    switch (activity) {
      case 'HIGH': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'LOW': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  },

  getStreakColor: (streak?: number): string => {
    if (!streak) return 'text-gray-400'
    if (streak >= 30) return 'text-red-400'
    if (streak >= 14) return 'text-orange-400'
    if (streak >= 7) return 'text-yellow-400'
    return 'text-green-400'
  },

  getRankBadgeColor: (rank: number): string => {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    if (rank === 3) return 'bronze'
    return 'default'
  },

  calculatePercentile: (rank: number, total: number): number => {
    return Math.round(((total - rank) / total) * 100)
  },

  getChangeDescription: (change: number): string => {
    if (change === 0) return 'No change'
    if (change > 0) return `Up ${change} position${change > 1 ? 's' : ''}`
    return `Down ${Math.abs(change)} position${Math.abs(change) > 1 ? 's' : ''}`
  },

  exportToCSV: (data: LeaderboardEntry[]): string => {
    const headers = ['Rank', 'Username', 'Wallet Address', 'Points', 'Level', 'Streak', 'Activity', 'Change']
    const rows = data.map(entry => [
      entry.rank,
      entry.user.twitterUsername || 'Anonymous',
      entry.user.walletAddress,
      entry.user.totalPoints,
      // entry.user. || 1,
      // entry.user.streak || 0,
      // entry.user.twitterActivity || 'LOW',
      entry.change
    ])
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }
}