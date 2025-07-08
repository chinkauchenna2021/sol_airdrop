import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useWalletStore } from '@/store/useWalletStore'
import toast from 'react-hot-toast'

export function useAuth() {
  const router = useRouter()
  const { user, setUser, reset: resetUser } = useUserStore()
  const { connected, publicKey, reset: resetWallet } = useWalletStore()

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Auth check error:', error)
      return false
    }
  }, [setUser])

  const login = useCallback(async (walletAddress: string) => {
    try {
      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      if (res.ok) {
        const { user } = await res.json()
        setUser(user)
        toast.success('Logged in successfully!')
        return true
      }

      const error = await res.json()
      toast.error(error.message || 'Login failed')
      return false
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to login')
      return false
    }
  }, [setUser])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      resetUser()
      resetWallet()
      router.push('/')
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }, [resetUser, resetWallet, router])

  const requireAuth = useCallback((redirectTo = '/') => {
    if (!user) {
      router.push(redirectTo as any)
      toast.error('Please connect your wallet to continue')
      return false
    }
    return true
  }, [user, router])

  const requireAdmin = useCallback((redirectTo = '/') => {
    if (!user?.isAdmin) {
      router.push(redirectTo as any)
      toast.error('Admin access required')
      return false
    }
    return true
  }, [user, router])

  // Auto-login when wallet connects
  useEffect(() => {
    if (connected && publicKey && !user) {
      login(publicKey)
    }
  }, [connected, publicKey, user, login])

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    loading: false, // You could add loading state if needed
    checkAuth,
    login,
    logout,
    requireAuth,
    requireAdmin,
  }
}