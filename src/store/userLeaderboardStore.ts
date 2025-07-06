import { create } from 'zustand'

interface LeaderboardEntry {
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

interface LeaderboardState {
  entries: LeaderboardEntry[]
  userRank: number | null
  timeRange: 'all' | 'monthly' | 'weekly'
  isLoading: boolean
  lastUpdated: Date | null
  setEntries: (entries: LeaderboardEntry[]) => void
  setUserRank: (rank: number | null) => void
  setTimeRange: (range: 'all' | 'monthly' | 'weekly') => void
  setLoading: (loading: boolean) => void
  updateEntry: (userId: string, updates: Partial<LeaderboardEntry>) => void
  reset: () => void
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  userRank: null,
  timeRange: 'all',
  isLoading: false,
  lastUpdated: null,
  setEntries: (entries) => set({ entries, lastUpdated: new Date() }),
  setUserRank: (rank) => set({ userRank: rank }),
  setTimeRange: (range) => set({ timeRange: range }),
  setLoading: (loading) => set({ isLoading: loading }),
  updateEntry: (userId, updates) =>
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.user.id === userId ? { ...entry, ...updates } : entry
      ),
    })),
  reset: () =>
    set({
      entries: [],
      userRank: null,
      timeRange: 'all',
      isLoading: false,
      lastUpdated: null,
    }),
}))