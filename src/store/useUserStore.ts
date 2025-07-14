import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  walletAddress: string
  twitterUsername?: string
  twitterId?: string
  totalPoints: number
  rank: number
  isAdmin: boolean
  twitterActivity? : "HIGH"|'LOW'|'MEDIUM'
  twitterFollowers?:number

}

interface UserState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  updatePoints: (points: number) => void
  updateRank: (rank: number) => void
  reset: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      updatePoints: (points) =>
        set((state) => ({
          user: state.user ? { ...state.user, totalPoints: points } : null,
        })),
      updateRank: (rank) =>
        set((state) => ({
          user: state.user ? { ...state.user, rank } : null,
        })),
      reset: () => set({ user: null, isLoading: false }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)