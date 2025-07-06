import { create } from 'zustand'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPoints: number
  totalClaims: number
  pendingClaims: number
  totalDistributed: number
  totalEngagements: number
  newUsersToday: number
}

interface SystemConfig {
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

interface AdminState {
  stats: AdminStats | null
  config: SystemConfig | null
  isLoading: boolean
  setStats: (stats: AdminStats) => void
  setConfig: (config: SystemConfig) => void
  updateConfig: (key: keyof SystemConfig, value: any) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAdminStore = create<AdminState>((set) => ({
  stats: null,
  config: null,
  isLoading: false,
  setStats: (stats) => set({ stats }),
  setConfig: (config) => set({ config }),
  updateConfig: (key, value) =>
    set((state) => ({
      config: state.config ? { ...state.config, [key]: value } : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ stats: null, config: null, isLoading: false }),
}))