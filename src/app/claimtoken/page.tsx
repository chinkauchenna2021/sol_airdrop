'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, Wallet, Shield, AlertTriangle, CheckCircle2, 
  XCircle, Info, TrendingUp, Clock, Star, Zap,
  ExternalLink, Copy, RefreshCw, Download, ArrowRight,
  DollarSign, Activity, Award, Users, Target, Sparkles,
  Gift, Key, Lock, Unlock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { useSolana } from '@/hooks/useSolana'
import { useUserStore } from '@/store/useUserStore'
import { getSolAmountForUsd, checkNftOwnership, transferNftWithSolCheck } from '@/utils'
import toast from 'react-hot-toast'
import { DashboardData } from '../dashboard/page'

interface UserBalance {
  solBalance: number
  connectTokens: number
  usdValue: number
  claimableTokens: number
  totalEarned: number
  level: number
  rank: number
  nextLevelRequiredPoints: number
  currentPoints: number
}

interface NFTPassStatus {
  hasValidPass: boolean
  passNFTs: Array<{
    mint: string
    name: string
    symbol: string
    image?: string
  }>
  requiredPasses: string[]
  isEligible: boolean
}

interface ClaimRequirements {
  minimumSolBalance: number
  claimFeeSOL: number
  minimumConnectTokens: number
  cooldownPeriod: number
  dailyLimit: number
  userTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  kycRequired: boolean
  claimsEnabled: boolean
  nftPassRequired: boolean
  nftPassPrice: number // $4 in SOL
}

interface AdminControls {
  claimingEnabled: boolean
  nftPassRequired: boolean
  requireApproval: boolean
  seasonStatus: 'ACTIVE' | 'CLAIMING' | 'ENDED'
  feeAmount: number
}

interface ClaimHistory {
  id: string
  amount: number
  timestamp: Date
  transactionHash: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  feesPaid: number
  type: 'NFT_PASS' | 'TOKEN_CLAIM'
}

interface SolPriceData {
  price: number
  change24h: number
  lastUpdated: Date
}

export default function AdvancedTokenClaimPage() {
  const { connected, publicKey } = useWallet()
  const { balance, getTokenBalance } = useSolana()
  const { user } = useUserStore()
  
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [nftPassStatus, setNftPassStatus] = useState<NFTPassStatus | null>(null)
  const [claimRequirements, setClaimRequirements] = useState<ClaimRequirements | null>(null)
  const [adminControls, setAdminControls] = useState<AdminControls | null>(null)
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([])
  const [solPrice, setSolPrice] = useState<SolPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimingNFTPass, setClaimingNFTPass] = useState(false)
  const [claimAmount, setClaimAmount] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showNFTPassDialog, setShowNFTPassDialog] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    eligible: boolean
    reasons: string[]
    requirements: string[]
  }>({ eligible: false, reasons: [], requirements: [] })

  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed')

  useEffect(() => {
    if (connected && publicKey) {
      initializeData()
    }
  }, [connected, publicKey])

  const initializeData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchUserData(),
        fetchNFTPassStatus(),
        fetchClaimRequirements(),
        fetchAdminControls(),
        fetchSolPrice(),
        fetchClaimHistory()
      ])
    } catch (error) {
      console.error('Error initializing data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const [balanceRes, tokenRes] = await Promise.all([
        fetch('/api/user/balance'),
        fetch('/api/user/tokens')
      ])

      if (balanceRes.ok && tokenRes.ok) {
        const balanceData = await balanceRes.json()
        const tokenData = await tokenRes.json()
        
        setUserBalance({
          solBalance: balance,
          connectTokens: tokenData.balance,
          usdValue: tokenData.usdValue,
          claimableTokens: tokenData.claimable,
          totalEarned: tokenData.totalEarned,
          level: user?.rank || 1,
          rank: user?.rank || 0,
          nextLevelRequiredPoints: tokenData.nextLevelPoints,
          currentPoints: user?.totalPoints || 0
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchNFTPassStatus = async () => {
    if (!publicKey) return
    
    try {
      const response = await fetch(`/api/nft-claims/pass-status?wallet=${publicKey.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNftPassStatus(data)
      }
    } catch (error) {
      console.error('Error fetching NFT pass status:', error)
    }
  }

  const fetchClaimRequirements = async () => {
    try {
      const res = await fetch('/api/claim/requirements')
      if (res.ok) {
        const data = await res.json()
        const requirements = data.requirements
        
        // Get current SOL price for $4 fee
        const { solAmount } = await getSolAmountForUsd(4)
        
        setClaimRequirements({
          ...requirements,
          nftPassPrice: solAmount
        })
        checkEligibility({ ...requirements, nftPassPrice: solAmount })
      }
    } catch (error) {
      console.error('Error fetching claim requirements:', error)
    }
  }

  const fetchAdminControls = async () => {
    try {
      const res = await fetch('/api/admin/nft-claims/controls')
      if (res.ok) {
        const data = await res.json()
        setAdminControls(data)
      }
    } catch (error) {
      console.error('Error fetching admin controls:', error)
    }
  }

  const fetchSolPrice = async () => {
    try {
      const res = await fetch('/api/solana/price')
      if (res.ok) {
        const data = await res.json()
        setSolPrice(data.priceData)
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error)
    }
  }

  const fetchClaimHistory = async () => {
    try {
      const res = await fetch('/api/user/claim-history')
      if (res.ok) {
        const data = await res.json()
        setClaimHistory(data.history)
      }
    } catch (error) {
      console.error('Error fetching claim history:', error)
    }
  }

  const handleDailyClaim = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/earning/daily-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(`Claimed ${result.tokens || 5} CONNECT tokens! 🎉`)
        
        if (data) {
          setData(prev => ({
            ...prev!,
            user: {
              ...prev!.user,
              totalEarnedTokens: (prev!.user.totalEarnedTokens || 0) + (result.tokens || 5),
              streak: result.currentStreak || prev!.user.streak
            },
            stats: {
              ...prev!.stats,
              dailyEarningStatus: {
                canClaim: false,
                currentStreak: result.currentStreak || prev!.stats.dailyEarningStatus?.currentStreak || 0,
                totalEarned: (prev!.stats.dailyEarningStatus?.totalEarned || 0) + (result.tokens || 5),
                nextClaimIn: result.nextClaimIn || 24
              }
            }
          }))
        }
      } else {
        toast.error(result.error || 'Failed to claim daily reward')
      }
    } catch (error) {
      console.error('Daily claim error:', error)
      toast.error('Failed to claim daily reward')
    } finally {
      setClaiming(false)
    }
  }

  const checkEligibility = (requirements: ClaimRequirements) => {
    if (!userBalance || !requirements || !adminControls) return

    const reasons: string[] = []
    const requirementsList: string[] = []

    // Check if claims are globally enabled
    if (!adminControls.claimingEnabled) {
      reasons.push('Token claims are currently disabled by admin')
    }

    // Check if NFT pass is required and user has it
    if (requirements.nftPassRequired && !nftPassStatus?.hasValidPass) {
      reasons.push('NFT pass required for token claiming')
      requirementsList.push('Obtain an NFT pass by paying $4 worth of SOL')
    }

    // Check SOL balance requirement (minimum + fee)
    const requiredSol = requirements.minimumSolBalance + requirements.claimFeeSOL
    if (userBalance.solBalance < requiredSol) {
      reasons.push(`Insufficient SOL balance. Need ${requiredSol} SOL (${requirements.minimumSolBalance} minimum + ${requirements.claimFeeSOL} fee)`)
      requirementsList.push(`Maintain at least ${requiredSol} SOL in your wallet`)
    }

    // Check minimum claimable tokens
    if (userBalance.claimableTokens < requirements.minimumConnectTokens) {
      reasons.push(`Minimum ${requirements.minimumConnectTokens} CONNECT tokens required to claim`)
      requirementsList.push(`Earn at least ${requirements.minimumConnectTokens} CONNECT tokens`)
    }

    setEligibilityCheck({
      eligible: reasons.length === 0,
      reasons,
      requirements: requirementsList
    })
  }

  const handleClaimNFTPass = async () => {
    if (!publicKey || !claimRequirements) return

    setClaimingNFTPass(true)
    try {
      // Check if user has enough SOL for $4 fee
      const { solAmount } = await getSolAmountForUsd(4)
      
      if (balance < solAmount) {
        toast.error(`Insufficient SOL balance. Need ${solAmount.toFixed(4)} SOL ($4)`)
        return
      }

      // Process NFT pass claim
      const response = await fetch('/api/nft-claims/claim-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          feeAmount: solAmount
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('NFT pass claimed successfully! 🎉')
        
        // Refresh NFT pass status
        await fetchNFTPassStatus()
        await fetchClaimHistory()
        
        setShowNFTPassDialog(false)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to claim NFT pass')
      }
    } catch (error) {
      console.error('NFT pass claim error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to claim NFT pass')
    } finally {
      setClaimingNFTPass(false)
    }
  }

  const handleClaimTokens = async () => {
    if (!eligibilityCheck.eligible || !publicKey) {
      toast.error('Claim requirements not met')
      return
    }

    try {
      setClaiming(true)
      const claimAmountNum = parseInt(claimAmount) || userBalance?.claimableTokens || 0

      // Verify NFT pass ownership before proceeding
      if (claimRequirements?.nftPassRequired) {
        const hasPass = await checkNftOwnership(
          publicKey,
          nftPassStatus?.requiredPasses || [],
          'devnet'
        )
        
        if (!hasPass) {
          toast.error('NFT pass verification failed')
          return
        }
      }

      // Process the token claim
      const claimResponse = await fetch('/api/claim/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: claimAmountNum,
          walletAddress: publicKey.toString(),
          hasNFTPass: nftPassStatus?.hasValidPass || false
        })
      })

      if (claimResponse.ok) {
        const result = await claimResponse.json()
        toast.success(`Successfully claimed ${claimAmountNum} CONNECT tokens!`)
        setShowConfirmDialog(false)
        setClaimAmount('')
        
        // Refresh data
        await Promise.all([
          fetchUserData(),
          fetchClaimHistory()
        ])
      } else {
        const error = await claimResponse.json()
        throw new Error(error.message || 'Claim failed')
      }
    } catch (error) {
      console.error('Claim error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to claim tokens')
    } finally {
      setClaiming(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'DIAMOND': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'PLATINUM': return 'bg-gray-300/20 text-gray-300 border-gray-300/30'
      case 'GOLD': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'SILVER': return 'bg-gray-400/20 text-gray-400 border-gray-400/30'
      default: return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400'
      case 'PENDING': return 'text-yellow-400'
      case 'FAILED': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatSolValue = (sol: number) => {
    if (!solPrice) return `${sol.toFixed(4)} SOL`
    const usdValue = sol * solPrice.price
    return `${sol.toFixed(4)} SOL (~$${usdValue.toFixed(2)})`
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-white/10 bg-white/5">
          <CardContent className="p-8 text-center">
            <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your Solana wallet to view and claim your CONNECT tokens
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white">Loading your token data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Claim CONNECT Tokens</h1>
              <p className="text-gray-400">Convert your earned points to CONNECT tokens</p>
            </div>
          </motion.div>

          {solPrice && (
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-gray-400">SOL Price:</span>
                <span className="text-white font-semibold">${solPrice.price.toFixed(2)}</span>
                <span className={`text-sm ${solPrice.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {solPrice.change24h >= 0 ? '+' : ''}{solPrice.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* NFT Pass Status */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  NFT Pass Status
                  {nftPassStatus?.hasValidPass ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!adminControls?.claimingEnabled ? (
                  <Alert className="border-red-500/20 bg-red-500/10">
                    <Lock className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      NFT pass claiming is currently disabled by administrators.
                    </AlertDescription>
                  </Alert>
                ) : nftPassStatus?.hasValidPass ? (
                  <div className="space-y-4">
                    <Alert className="border-green-500/20 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300">
                        <p className="font-semibold">NFT Pass Verified! ✅</p>
                        <p>You can now claim your CONNECT tokens.</p>
                      </AlertDescription>
                    </Alert>
                    
                    {nftPassStatus.passNFTs.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Your NFT Passes:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {nftPassStatus.passNFTs.map((nft, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                              {nft.image && (
                                <img 
                                  src={nft.image} 
                                  alt={nft.name}
                                  className="w-10 h-10 rounded-lg"
                                />
                              )}
                              <div>
                                <p className="text-white font-semibold">{nft.name}</p>
                                <p className="text-gray-400 text-sm">{nft.symbol}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert className="border-yellow-500/20 bg-yellow-500/10">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <AlertDescription className="text-yellow-300">
                        <p className="font-semibold">NFT Pass Required</p>
                        <p>You need an NFT pass to claim your CONNECT tokens. Get one for $4 worth of SOL.</p>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-white font-semibold">NFT Pass Price</h4>
                          <p className="text-gray-400 text-sm">One-time purchase for unlimited claiming</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">
                            {claimRequirements?.nftPassPrice.toFixed(4)} SOL
                          </p>
                          <p className="text-gray-400 text-sm">~$4.00 USD</p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        onClick={() => setShowNFTPassDialog(true)}
                        disabled={claimingNFTPass || !adminControls?.claimingEnabled}
                      >
                        {claimingNFTPass ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Gift className="w-5 h-5 mr-2" />
                            Get NFT Pass
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">SOL Balance:</span>
                      <span className="text-white font-semibold">
                        {formatSolValue(userBalance?.solBalance || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">CONNECT Tokens:</span>
                      <span className="text-white font-semibold">
                        {userBalance?.connectTokens.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Current Points:</span>
                      <span className="text-white font-semibold">
                        {userBalance?.currentPoints.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Claimable Tokens:</span>
                      <span className="text-green-400 font-bold text-lg">
                        {userBalance?.claimableTokens.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Earned:</span>
                      <span className="text-white font-semibold">
                        {userBalance?.totalEarned.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">User Level:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">Level {userBalance?.level}</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Rank #{userBalance?.rank}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {userBalance && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Progress to Level {userBalance.level + 1}</span>
                      <span className="text-white text-sm">
                        {userBalance.currentPoints} / {userBalance.nextLevelRequiredPoints}
                      </span>
                    </div>
                    <Progress 
                      value={(userBalance.currentPoints / userBalance.nextLevelRequiredPoints) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requirements Check */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Claim Requirements
                  {eligibilityCheck.eligible ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {claimRequirements && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Minimum SOL Balance:</span>
                        <span className="text-white">
                          {formatSolValue(claimRequirements.minimumSolBalance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Claim Fee:</span>
                        <span className="text-white">
                          {formatSolValue(claimRequirements.claimFeeSOL)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Minimum Tokens:</span>
                        <span className="text-white">
                          {claimRequirements.minimumConnectTokens} CONNECT
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Your Tier:</span>
                        <Badge className={getTierColor(claimRequirements.userTier)}>
                          {claimRequirements.userTier}
                        </Badge>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {!eligibilityCheck.eligible && (
                      <Alert className="border-red-500/20 bg-red-500/10">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">
                          <div className="space-y-2">
                            <p className="font-semibold">Requirements not met:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {eligibilityCheck.reasons.map((reason, index) => (
                                <li key={index}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {eligibilityCheck.eligible && (
                      <Alert className="border-green-500/20 bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <AlertDescription className="text-green-300">
                          <p className="font-semibold">All requirements met! You can claim your tokens.</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claim History */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Claim History
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchClaimHistory}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {claimHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No claim history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {claimHistory.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            claim.type === 'NFT_PASS' 
                              ? 'bg-purple-500/20' 
                              : 'bg-blue-500/20'
                          }`}>
                            {claim.type === 'NFT_PASS' ? (
                              <Key className="w-5 h-5 text-purple-400" />
                            ) : (
                              <Coins className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                              {claim.type === 'NFT_PASS' 
                                ? 'NFT Pass' 
                                : `${claim.amount.toLocaleString()} CONNECT`
                              }
                            </p>
                            <p className="text-gray-400 text-sm">
                              {new Date(claim.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getStatusColor(claim.status)}`}>
                              {claim.status}
                            </span>
                            {claim.transactionHash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://solscan.io/tx/${claim.transactionHash}`, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs">
                            Fee: {formatSolValue(claim.feesPaid)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Claim Panel */}
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  Claim Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Available to Claim */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-400 text-sm">Available to Claim</p>
                  <p className="text-4xl font-bold text-green-400 mb-2">
                    {userBalance?.claimableTokens.toLocaleString() || 0}
                  </p>
                  <p className="text-gray-400 text-sm">CONNECT Tokens</p>
                </div>

                <Separator />

                {/* Admin Controls Check */}
                {!adminControls?.claimingEnabled ? (
                  <div className="text-center py-8">
                    <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Claiming Disabled</h3>
                    <p className="text-gray-400">Token claiming is currently disabled by administrators.</p>
                  </div>
                ) : !nftPassStatus?.hasValidPass && claimRequirements?.nftPassRequired ? (
                  <div className="text-center py-8">
                    <Key className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">NFT Pass Required</h3>
                    <p className="text-gray-400 mb-4">You need an NFT pass to claim your tokens.</p>
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => setShowNFTPassDialog(true)}
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Get NFT Pass
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Claim Amount Input */}
                    <div>
                      <Label className="text-white">Claim Amount</Label>
                      <div className="relative mt-2">
                        <Input
                          type="number"
                          value={claimAmount}
                          onChange={(e) => setClaimAmount(e.target.value)}
                          placeholder="Enter amount to claim"
                          max={userBalance?.claimableTokens || 0}
                          className="pr-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setClaimAmount(userBalance?.claimableTokens.toString() || '0')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                        >
                          MAX
                        </Button>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        Maximum: {userBalance?.claimableTokens.toLocaleString() || 0} CONNECT
                      </p>
                    </div>

                    {/* Fee Breakdown */}
                    {claimRequirements && claimAmount && (
                      <div className="bg-white/5 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Tokens to Claim:</span>
                          <span className="text-white">{parseInt(claimAmount).toLocaleString()} CONNECT</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Claim Fee:</span>
                          <span className="text-white">{formatSolValue(claimRequirements.claimFeeSOL)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-400">You'll Receive:</span>
                          <span className="text-green-400">{parseInt(claimAmount).toLocaleString()} CONNECT</span>
                        </div>
                      </div>
                    )}

                    {/* Claim Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3"
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={!eligibilityCheck.eligible || !claimAmount || claiming}
                    >
                      {claiming ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Coins className="w-5 h-5 mr-2" />
                          Claim Tokens
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Additional Info */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Info className="w-4 h-4" />
                    <span>Claims are processed on Solana blockchain</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Tokens will be sent to your connected wallet
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400 text-sm">Total Earnings</span>
                  </div>
                  <span className="text-white font-semibold">{user?.totalPoints} pts</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">Referrals</span>
                  </div>
                  <span className="text-white font-semibold">{user?.twitterFollowers || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-sm">Daily Streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold">{data?.user.streak || 0}</span>
                    {(data?.user.streak || 0) > 7 && <span className="text-orange-400">🔥</span>}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400 text-sm">Completion Rate</span>
                  </div>
                  <span className="text-white font-semibold">85%</span>
                </div>
              </CardContent>
            </Card>

            {/* Tier Benefits */}
            {claimRequirements && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {claimRequirements.userTier} Tier Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-gray-400 space-y-2">
                    {claimRequirements.userTier === 'BRONZE' && (
                      <>
                        <p>• Maximum claim: 1,000 CONNECT</p>
                        <p>• Standard processing time</p>
                        <p>• Basic support priority</p>
                      </>
                    )}
                    {claimRequirements.userTier === 'SILVER' && (
                      <>
                        <p>• Maximum claim: 5,000 CONNECT</p>
                        <p>• Priority processing</p>
                        <p>• Enhanced support</p>
                        <p>• 5% bonus on referrals</p>
                      </>
                    )}
                    {claimRequirements.userTier === 'GOLD' && (
                      <>
                        <p>• Maximum claim: 15,000 CONNECT</p>
                        <p>• Fast processing</p>
                        <p>• Priority support</p>
                        <p>• 10% bonus on referrals</p>
                        <p>• Exclusive tasks access</p>
                      </>
                    )}
                    {claimRequirements.userTier === 'PLATINUM' && (
                      <>
                        <p>• Maximum claim: 50,000 CONNECT</p>
                        <p>• Instant processing</p>
                        <p>• VIP support</p>
                        <p>• 15% bonus on referrals</p>
                        <p>• Early access to features</p>
                        <p>• Reduced claim fees</p>
                      </>
                    )}
                    {claimRequirements.userTier === 'DIAMOND' && (
                      <>
                        <p>• Unlimited claims</p>
                        <p>• Instant processing</p>
                        <p>• White-glove support</p>
                        <p>• 25% bonus on referrals</p>
                        <p>• Beta feature access</p>
                        <p>• No claim fees</p>
                        <p>• Personal account manager</p>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => window.open('/upgrade-tier', '_blank')}
                  >
                    Upgrade Tier
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* NFT Pass Purchase Dialog */}
        <AnimatePresence>
          {showNFTPassDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNFTPassDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-white/10"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Get NFT Pass</h3>
                  <p className="text-gray-400">
                    Purchase an NFT pass to unlock token claiming
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">NFT Pass Price:</span>
                    <span className="text-white font-semibold">
                      {claimRequirements?.nftPassPrice.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">USD Value:</span>
                    <span className="text-white">~$4.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your SOL Balance:</span>
                    <span className="text-white">
                      {balance.toFixed(4)} SOL
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-400">After Purchase:</span>
                    <span className="text-green-400">
                      {Math.max(0, balance - (claimRequirements?.nftPassPrice || 0)).toFixed(4)} SOL
                    </span>
                  </div>
                </div>

                <Alert className="mb-6 border-purple-500/20 bg-purple-500/10">
                  <Info className="h-4 w-4 text-purple-400" />
                  <AlertDescription className="text-purple-300 text-sm">
                    This NFT pass is a one-time purchase that grants you permanent access to claim your CONNECT tokens.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNFTPassDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={handleClaimNFTPass}
                    disabled={claimingNFTPass || balance < (claimRequirements?.nftPassPrice || 0)}
                  >
                    {claimingNFTPass ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Purchase Pass
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Claim Confirmation Dialog */}
        <AnimatePresence>
          {showConfirmDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-white/10"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Confirm Token Claim</h3>
                  <p className="text-gray-400">
                    You're about to claim {parseInt(claimAmount).toLocaleString()} CONNECT tokens
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Claim Amount:</span>
                    <span className="text-white font-semibold">
                      {parseInt(claimAmount).toLocaleString()} CONNECT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SOL Fee:</span>
                    <span className="text-white">
                      {formatSolValue(claimRequirements?.claimFeeSOL || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">NFT Pass Status:</span>
                    <span className={`text-sm font-medium ${nftPassStatus?.hasValidPass ? 'text-green-400' : 'text-red-400'}`}>
                      {nftPassStatus?.hasValidPass ? 'Verified ✓' : 'Required'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your SOL Balance:</span>
                    <span className="text-white">
                      {formatSolValue(userBalance?.solBalance || 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-400">After Transaction:</span>
                    <span className="text-green-400">
                      {formatSolValue((userBalance?.solBalance || 0) - (claimRequirements?.claimFeeSOL || 0))}
                    </span>
                  </div>
                </div>

                <Alert className="mb-6 border-blue-500/20 bg-blue-500/10">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300 text-sm">
                    This transaction will be processed on the Solana blockchain. 
                    Make sure you have enough SOL to cover the network fee.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    onClick={handleClaimTokens}
                    disabled={claiming}
                  >
                    {claiming ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm Claim
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Section */}
        <div className="mt-12">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Security First</h4>
                  <p className="text-gray-400 text-sm">
                    All transactions are secured by Solana blockchain. Never share your private keys.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-green-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Processing Time</h4>
                  <p className="text-gray-400 text-sm">
                    Claims are typically processed within 1-5 minutes depending on network conditions.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Support</h4>
                  <p className="text-gray-400 text-sm">
                    Having issues? Contact our support team via Discord or email for assistance.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View FAQ
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Join Discord
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  User Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}