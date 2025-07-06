import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWalletStore } from '@/store/useWalletStore'
import { useUserStore } from '@/store/useUserStore'
import toast from 'react-hot-toast'

export function useSolana() {
  const { connection } = useConnection()
  const { publicKey, connected, connecting, disconnect } = useWallet()
  const { setWalletState } = useWalletStore()
  const { setUser } = useUserStore()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  // Update wallet state when connection changes
  useEffect(() => {
    if (connected && publicKey) {
      setWalletState({
        connected: true,
        publicKey: publicKey.toBase58(),
        connecting: false,
      })
      authenticateWallet(publicKey.toBase58())
      fetchBalance()
    } else {
      setWalletState({
        connected: false,
        publicKey: null,
        balance: 0,
        connecting: false,
      })
    }
  }, [connected, publicKey])

  // Update connecting state
  useEffect(() => {
    setWalletState({ connecting })
  }, [connecting])

  const authenticateWallet = async (walletAddress: string) => {
    try {
      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      if (res.ok) {
        const { user } = await res.json()
        setUser(user)
        toast.success('Wallet connected successfully!')
      }
    } catch (error) {
      console.error('Wallet auth error:', error)
      toast.error('Failed to authenticate wallet')
    }
  }

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) return

    try {
      setLoading(true)
      const balance = await connection.getBalance(publicKey)
      const sol = balance / LAMPORTS_PER_SOL
      setBalance(sol)
      setWalletState({ balance: sol })
    } catch (error) {
      console.error('Balance fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [publicKey, connection])

  const getTokenBalance = useCallback(async (
    mintAddress: string
  ): Promise<number> => {
    if (!publicKey) return 0

    try {
      const res = await fetch(`/api/solana/balance/${publicKey.toBase58()}?mint=${mintAddress}`)
      if (res.ok) {
        const { balance } = await res.json()
        return balance
      }
      return 0
    } catch (error) {
      console.error('Token balance error:', error)
      return 0
    }
  }, [publicKey])

  const sendTransaction = useCallback(async (
    recipient: string,
    amount: number,
    token?: string
  ): Promise<string | null> => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    try {
      setLoading(true)
      
      const res = await fetch('/api/solana/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: publicKey.toBase58(),
          to: recipient,
          amount,
          token,
        }),
      })

      if (res.ok) {
        const { signature } = await res.json()
        toast.success('Transaction sent successfully!')
        return signature
      }

      throw new Error('Transaction failed')
    } catch (error) {
      console.error('Transaction error:', error)
      toast.error('Failed to send transaction')
      return null
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  const validateAddress = useCallback((address: string): boolean => {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }, [])

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect()
      setUser(null)
      setWalletState({
        connected: false,
        publicKey: null,
        balance: 0,
      })
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect wallet')
    }
  }, [disconnect])

  const requestAirdrop = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !connection) return false

    try {
      setLoading(true)
      
      const signature = await connection.requestAirdrop(
        publicKey,
        LAMPORTS_PER_SOL // 1 SOL
      )
      
      await connection.confirmTransaction(signature)
      toast.success('Airdrop received!')
      fetchBalance()
      return true
    } catch (error) {
      console.error('Airdrop error:', error)
      toast.error('Failed to request airdrop')
      return false
    } finally {
      setLoading(false)
    }
  }, [publicKey, connection, fetchBalance])

  return {
    publicKey: publicKey?.toBase58() || null,
    connected,
    connecting,
    balance,
    loading,
    fetchBalance,
    getTokenBalance,
    sendTransaction,
    validateAddress,
    disconnectWallet,
    requestAirdrop,
  }
}