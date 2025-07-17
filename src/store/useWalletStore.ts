import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  connected: boolean
  publicKey: string | null
  balance: number
  connecting: boolean
  disconnecting: boolean
}

interface WalletActions {
  setWalletState: (state: Partial<WalletState>) => void
  disconnect: () => void
  reset: () => void
}

type WalletStore = WalletState & WalletActions

const initialState: WalletState = {
  connected: false,
  publicKey: null,
  balance: 0,
  connecting: false,
  disconnecting: false,
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setWalletState: (newState) => {
        set((state) => ({ ...state, ...newState }))
      },
      
      disconnect: () => {
        set({
          connected: false,
          publicKey: null,
          balance: 0,
          connecting: false,
          disconnecting: true,
        })
        
        // Reset disconnecting flag after a delay
        setTimeout(() => {
          set({ disconnecting: false })
        }, 2000)
      },
      
      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        // Don't persist connection state to prevent auto-reconnect on refresh
        connected: false,
        publicKey: null,
        balance: 0,
        connecting: false,
        disconnecting: false,
      }),
    }
  )
)