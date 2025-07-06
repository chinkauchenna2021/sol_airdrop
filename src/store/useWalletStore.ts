import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  connected: boolean
  publicKey: string | null
  balance: number
  connecting: boolean
  disconnecting: boolean
  setWalletState: (state: Partial<WalletState>) => void
  reset: () => void
}

const initialState = {
  connected: false,
  publicKey: null,
  balance: 0,
  connecting: false,
  disconnecting: false,
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      ...initialState,
      setWalletState: (state) => set((prev) => ({ ...prev, ...state })),
      reset: () => set(initialState),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({ publicKey: state.publicKey }),
    }
  )
)