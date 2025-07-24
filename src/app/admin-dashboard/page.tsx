'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Activity, DollarSign, TrendingUp, Shield, AlertTriangle,
  Settings, Bell, Search, Filter, Download, RefreshCw, Eye,
  Ban, Check, X, ChevronDown, Menu, Moon, Sun, Zap, Database,
  BarChart3, PieChart, LineChart, UserCheck, Clock, Award,
  Wallet, Twitter, Globe, Lock, Unlock, Star, Copy, Coins, 
  RotateCcw, Gift, Flame, Calendar, Target, Crown, Medal
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts'
import toast from 'react-hot-toast'
import { UserManagementSection } from '@/components/admin/UserManagement'
import { AdminSettings } from '@/components/admin/AdvanceSettings'

// Enhanced Daily Earning Manager Component
const DailyEarningManager = () => {
  const [stats, setStats] = useState<{
    totalDistributed: number
    claimsToday: number
    activeUsers: number
    averageStreak: number
    longestStreak: number
    totalUsers: number
    claimRate: number
    streakDistribution: Array<{ days: string, users: number }>
    dailyClaimHistory: Array<{ date: string, claims: number, tokens: number }>
  } | null>(null)
  
  const [config, setConfig] = useState({
    loginReward: 5,
    referralReward: 3,
    streakBonus7: 5,
    streakBonus30: 15,
    enabled: true
  })
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/api/admin/earning/stats'),
        fetch('/api/admin/earning/config')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData)
      }
    } catch (error) {
      console.error('Failed to fetch earning data:', error)
      toast.error('Failed to load earning data')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = async () => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/earning/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (res.ok) {
        toast.success('Earning configuration updated successfully!')
        fetchData() // Refresh data
      } else {
        toast.error('Failed to update configuration')
      }
    } catch (error) {
      console.error('Config update failed:', error)
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Distributed</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.totalDistributed.toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">CONNECT tokens</p>
              </div>
              <Gift className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Claims Today</p>
                <p className="text-2xl font-bold text-blue-400">{stats.claimsToday}</p>
                <p className="text-gray-400 text-sm">{(stats.claimsToday * config.loginReward).toLocaleString()} tokens</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Streaks</p>
                <p className="text-2xl font-bold text-orange-400">{stats.activeUsers}</p>
                <p className="text-gray-400 text-sm">Avg: {stats.averageStreak} days</p>
              </div>
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Claim Rate</p>
                <p className="text-2xl font-bold text-purple-400">{stats.claimRate.toFixed(1)}%</p>
                <p className="text-gray-400 text-sm">of active users</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-white/5 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Earning Configuration
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium">Daily Login Reward</label>
                <input
                  type="number"
                  value={config.loginReward}
                  onChange={(e) => setConfig(prev => ({ ...prev, loginReward: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">CONNECT tokens per day</p>
              </div>

              <div>
                <label className="text-white text-sm font-medium">Referral Reward</label>
                <input
                  type="number"
                  value={config.referralReward}
                  onChange={(e) => setConfig(prev => ({ ...prev, referralReward: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">CONNECT tokens per referral</p>
              </div>

              <div>
                <label className="text-white text-sm font-medium">7-Day Streak Bonus</label>
                <input
                  type="number"
                  value={config.streakBonus7}
                  onChange={(e) => setConfig(prev => ({ ...prev, streakBonus7: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">Extra tokens for 7+ days</p>
              </div>

              <div>
                <label className="text-white text-sm font-medium">30-Day Streak Bonus</label>
                <input
                  type="number"
                  value={config.streakBonus30}
                  onChange={(e) => setConfig(prev => ({ ...prev, streakBonus30: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">Extra tokens for 30+ days</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <label className="text-white text-sm">Enable Daily Earning System</label>
            </div>

            <button
              onClick={handleConfigUpdate}
              disabled={updating}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              {updating ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>
        </div>

        {/* Daily Claims Chart */}
        {stats && (
          <div className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Daily Claims Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={stats.dailyClaimHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Claims"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Tokens"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Airdrop Management Component
const AirdropManager = () => {
  const [airdropStats, setAirdropStats] = useState<{
    currentSeason: {
      id: string
      name: string
      status: string
      totalAllocation: number
      claimed: number
      claimedPercentage: number
    } | null
    tierDistribution: Array<{ tier: string, users: number, tokens: number }>
    recentClaims: Array<{
      id: string
      user: { walletAddress: string, twitterUsername?: string }
      tier: string
      tokens: number
      claimedAt: string
    }>
  } | null>(null)

  const [seasonConfig, setSeasonConfig] = useState({
    name: '',
    totalAllocation: 400000000,
    claimingEnabled: false,
    highTierTokens: 4500,
    mediumTierTokens: 4000,
    lowTierTokens: 3000
  })

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchAirdropData()
  }, [])

  const fetchAirdropData = async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/api/admin/airdrop/stats'),
        fetch('/api/admin/airdrop/config')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setAirdropStats(statsData)
      }

      if (configRes.ok) {
        const configData = await configRes.json()
        setSeasonConfig(configData)
      }
    } catch (error) {
      console.error('Failed to fetch airdrop data:', error)
      toast.error('Failed to load airdrop data')
    } finally {
      setLoading(false)
    }
  }

  const handleSeasonUpdate = async () => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/airdrop/season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seasonConfig)
      })

      if (res.ok) {
        toast.success('Airdrop season updated successfully!')
        fetchAirdropData()
      } else {
        toast.error('Failed to update airdrop season')
      }
    } catch (error) {
      console.error('Season update failed:', error)
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const toggleClaimingStatus = async () => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/airdrop/toggle-claiming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !seasonConfig.claimingEnabled })
      })

      if (res.ok) {
        setSeasonConfig(prev => ({ ...prev, claimingEnabled: !prev.claimingEnabled }))
        toast.success(`Claiming ${!seasonConfig.claimingEnabled ? 'enabled' : 'disabled'} successfully!`)
      } else {
        toast.error('Failed to toggle claiming status')
      }
    } catch (error) {
      console.error('Toggle claiming failed:', error)
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Season Overview */}
      {airdropStats?.currentSeason && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white">{airdropStats.currentSeason.name}</h3>
              <p className="text-gray-300">Current Airdrop Season</p>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                airdropStats.currentSeason.status === 'CLAIMING' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {airdropStats.currentSeason.status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Allocation</p>
              <p className="text-2xl font-bold text-purple-400">
                {airdropStats.currentSeason.totalAllocation.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Claimed</p>
              <p className="text-2xl font-bold text-green-400">
                {airdropStats.currentSeason.claimed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Progress</p>
              <p className="text-2xl font-bold text-blue-400">
                {airdropStats.currentSeason.claimedPercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${airdropStats.currentSeason.claimedPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Season Configuration */}
        <div className="bg-white/5 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Season Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium">Season Name</label>
              <input
                type="text"
                value={seasonConfig.name}
                onChange={(e) => setSeasonConfig(prev => ({ ...prev, name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="e.g. Season 1"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium">Total Allocation</label>
              <input
                type="number"
                value={seasonConfig.totalAllocation}
                onChange={(e) => setSeasonConfig(prev => ({ ...prev, totalAllocation: parseInt(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <p className="text-gray-400 text-xs mt-1">Total CONNECT tokens for this season</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-white text-sm font-medium">HIGH Tier</label>
                <input
                  type="number"
                  value={seasonConfig.highTierTokens}
                  onChange={(e) => setSeasonConfig(prev => ({ ...prev, highTierTokens: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">Tokens per user</p>
              </div>
              
              <div>
                <label className="text-white text-sm font-medium">MEDIUM Tier</label>
                <input
                  type="number"
                  value={seasonConfig.mediumTierTokens}
                  onChange={(e) => setSeasonConfig(prev => ({ ...prev, mediumTierTokens: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">Tokens per user</p>
              </div>
              
              <div>
                <label className="text-white text-sm font-medium">LOW Tier</label>
                <input
                  type="number"
                  value={seasonConfig.lowTierTokens}
                  onChange={(e) => setSeasonConfig(prev => ({ ...prev, lowTierTokens: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">Tokens per user</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Claiming Status</h4>
                <p className="text-gray-400 text-sm">
                  {seasonConfig.claimingEnabled ? 'Users can claim airdrops' : 'Claiming is disabled'}
                </p>
              </div>
              <button
                onClick={toggleClaimingStatus}
                disabled={updating}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  seasonConfig.claimingEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {updating ? 'Updating...' : seasonConfig.claimingEnabled ? 'Disable Claiming' : 'Enable Claiming'}
              </button>
            </div>

            <button
              onClick={handleSeasonUpdate}
              disabled={updating}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              {updating ? 'Updating...' : 'Update Season Configuration'}
            </button>
          </div>
        </div>

        {/* Tier Distribution */}
        {airdropStats && (
          <div className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Tier Distribution
            </h3>
            
            <div className="space-y-4">
              {airdropStats.tierDistribution.map((tier, index) => {
                const colors = ['text-yellow-400', 'text-blue-400', 'text-purple-400']
                const bgColors = ['bg-yellow-400/20', 'bg-blue-400/20', 'bg-purple-400/20']
                const icons = [Crown, Star, Medal]
                const Icon = icons[index]
                
                return (
                  <div key={tier.tier} className={`${bgColors[index]} rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${colors[index]}`} />
                        <div>
                          <h4 className={`font-semibold ${colors[index]}`}>{tier.tier} Tier</h4>
                          <p className="text-gray-300 text-sm">{tier.users} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${colors[index]}`}>
                          {tier.tokens.toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-sm">tokens each</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Claims */}
      {airdropStats?.recentClaims && (
        <div className="bg-white/5 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Claims
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 py-3">User</th>
                  <th className="text-left text-gray-400 py-3">Tier</th>
                  <th className="text-left text-gray-400 py-3">Tokens</th>
                  <th className="text-left text-gray-400 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {airdropStats.recentClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-white/5">
                    <td className="py-3">
                      <div>
                        <p className="text-white font-medium">
                          {claim.user.twitterUsername || `${claim.user.walletAddress.slice(0, 6)}...${claim.user.walletAddress.slice(-4)}`}
                        </p>
                        <p className="text-gray-400 text-sm">{claim.user.walletAddress.slice(0, 16)}...</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        claim.tier === 'HIGH' ? 'bg-yellow-500/20 text-yellow-400' :
                        claim.tier === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {claim.tier}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-green-400 font-semibold">{claim.tokens.toLocaleString()}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-gray-300">{new Date(claim.claimedAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Twitter Monitoring Component
const TwitterMonitoring = () => {
  const [twitterStats, setTwitterStats] = useState<{
    totalTracked: number
    highEngagement: number
    mediumEngagement: number
    lowEngagement: number
    recentActivity: Array<{
      id: string
      user: { walletAddress: string, twitterUsername?: string }
      engagementType: string
      points: number
      createdAt: string
    }>
  } | null>(null)

  const [monitoringConfig, setMonitoringConfig] = useState({
    enabled: true,
    trackingInterval: 60,
    highEngagementThreshold: 1000,
    mediumEngagementThreshold: 500
  })

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchTwitterData()
  }, [])

  const fetchTwitterData = async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/api/admin/twitter/stats'),
        fetch('/api/admin/twitter/config')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setTwitterStats(statsData)
      }

      if (configRes.ok) {
        const configData = await configRes.json()
        setMonitoringConfig(configData)
      }
    } catch (error) {
      console.error('Failed to fetch Twitter data:', error)
      toast.error('Failed to load Twitter monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = async () => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/twitter/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitoringConfig)
      })

      if (res.ok) {
        toast.success('Twitter monitoring configuration updated!')
        fetchTwitterData()
      } else {
        toast.error('Failed to update configuration')
      }
    } catch (error) {
      console.error('Config update failed:', error)
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const runManualSync = async () => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/twitter/sync', { method: 'POST' })
      
      if (res.ok) {
        toast.success('Manual Twitter sync completed!')
        fetchTwitterData()
      } else {
        toast.error('Sync failed')
      }
    } catch (error) {
      console.error('Manual sync failed:', error)
      toast.error('Sync failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Twitter Stats Overview */}
      {twitterStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tracked</p>
                <p className="text-2xl font-bold text-blue-400">{twitterStats.totalTracked}</p>
                <p className="text-gray-400 text-sm">Connected accounts</p>
              </div>
              <Twitter className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Engagement</p>
                <p className="text-2xl font-bold text-yellow-400">{twitterStats.highEngagement}</p>
                <p className="text-gray-400 text-sm">4,500 tokens each</p>
              </div>
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Medium Engagement</p>
                <p className="text-2xl font-bold text-blue-400">{twitterStats.mediumEngagement}</p>
                <p className="text-gray-400 text-sm">4,000 tokens each</p>
              </div>
              <Star className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Low Engagement</p>
                <p className="text-2xl font-bold text-purple-400">{twitterStats.lowEngagement}</p>
                <p className="text-gray-400 text-sm">3,000 tokens each</p>
              </div>
              <Medal className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitoring Configuration */}
        <div className="bg-white/5 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Monitoring Configuration
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-semibold">Twitter Monitoring</h4>
                <p className="text-gray-400 text-sm">
                  {monitoringConfig.enabled ? 'Actively tracking engagements' : 'Monitoring disabled'}
                </p>
              </div>
              <button
                onClick={() => setMonitoringConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  monitoringConfig.enabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {monitoringConfig.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div>
              <label className="text-white text-sm font-medium">Tracking Interval (minutes)</label>
              <input
                type="number"
                value={monitoringConfig.trackingInterval}
                onChange={(e) => setMonitoringConfig(prev => ({ ...prev, trackingInterval: parseInt(e.target.value) || 60 }))}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <p className="text-gray-400 text-xs mt-1">How often to check for new engagements</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium">High Engagement Threshold</label>
                <input
                  type="number"
                  value={monitoringConfig.highEngagementThreshold}
                  onChange={(e) => setMonitoringConfig(prev => ({ ...prev, highEngagementThreshold: parseInt(e.target.value) || 1000 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">Minimum followers for HIGH tier</p>
              </div>

              <div>
                <label className="text-white text-sm font-medium">Medium Engagement Threshold</label>
                <input
                  type="number"
                  value={monitoringConfig.mediumEngagementThreshold}
                  onChange={(e) => setMonitoringConfig(prev => ({ ...prev, mediumEngagementThreshold: parseInt(e.target.value) || 500 }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-gray-400 text-xs mt-1">Minimum followers for MEDIUM tier</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfigUpdate}
                disabled={updating}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                {updating ? 'Updating...' : 'Update Config'}
              </button>
              
              <button
                onClick={runManualSync}
                disabled={updating}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {twitterStats?.recentActivity && (
          <div className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Twitter Activity
            </h3>
            
            <div className="space-y-3">
              {twitterStats.recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Twitter className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {activity.user.twitterUsername || `${activity.user.walletAddress.slice(0, 6)}...`}
                      </p>
                      <p className="text-gray-400 text-xs">{activity.engagementType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 text-sm font-semibold">+{activity.points}</span>
                    <p className="text-gray-400 text-xs">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Enhanced Admin Dashboard
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

export default function EnhancedAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error)
      toast.error('Failed to load admin stats')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAdminStats()
    setRefreshing(false)
    toast.success('Data refreshed successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'daily-earning', label: 'Daily Earning', icon: Coins },
    { id: 'airdrop', label: 'Airdrop Management', icon: Gift },
    { id: 'twitter', label: 'Twitter Monitoring', icon: Twitter },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400">Platform Management & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {stats && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Total Users</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white/5 p-2 rounded-2xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-blue-400">{stats.totalUsers.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">+{stats.newUsersToday} today</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Users</p>
                      <p className="text-2xl font-bold text-green-400">{stats.activeUsers.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">{((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% active</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Distributed</p>
                      <p className="text-2xl font-bold text-purple-400">{stats.totalDistributed.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">CONNECT tokens</p>
                    </div>
                    <Coins className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Engagements</p>
                      <p className="text-2xl font-bold text-yellow-400">{stats.totalEngagements.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">Twitter interactions</p>
                    </div>
                    <Twitter className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('airdrop')}
                    className="flex items-center gap-3 p-4 bg-purple-600/20 border border-purple-500/30 rounded-xl hover:bg-purple-600/30 transition-colors"
                  >
                    <Gift className="w-6 h-6 text-purple-400" />
                    <div className="text-left">
                      <p className="text-white font-semibold">Manage Airdrop</p>
                      <p className="text-gray-400 text-sm">Configure seasons & claims</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('daily-earning')}
                    className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition-colors"
                  >
                    <Coins className="w-6 h-6 text-green-400" />
                    <div className="text-left">
                      <p className="text-white font-semibold">Daily Earning</p>
                      <p className="text-gray-400 text-sm">Configure rewards & streaks</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('twitter')}
                    className="flex items-center gap-3 p-4 bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-colors"
                  >
                    <Twitter className="w-6 h-6 text-blue-400" />
                    <div className="text-left">
                      <p className="text-white font-semibold">Twitter Monitor</p>
                      <p className="text-gray-400 text-sm">Track engagement tiers</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'daily-earning' && (
            <motion.div
              key="daily-earning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DailyEarningManager />
            </motion.div>
          )}

          {activeTab === 'airdrop' && (
            <motion.div
              key="airdrop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AirdropManager />
            </motion.div>
          )}

          {activeTab === 'twitter' && (
            <motion.div
              key="twitter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TwitterMonitoring />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <UserManagementSection />
              {/* <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">User Management</h3>
                <p className="text-gray-400">
                  User management functionality will be implemented here. This will include user search, 
                  filtering, activity tracking, and moderation tools.
                </p>
              </div> */}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Advanced Analytics</h3>
                <p className="text-gray-400">
                  Advanced analytics dashboard will be implemented here. This will include detailed charts,
                  user behavior analysis, and platform performance metrics.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Platform Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">General Settings</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h5 className="text-white font-medium">Platform Maintenance</h5>
                          <p className="text-gray-400 text-sm">Enable maintenance mode</p>
                        </div>
                        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                          Disabled
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h5 className="text-white font-medium">New User Registration</h5>
                          <p className="text-gray-400 text-sm">Allow new users to join</p>
                        </div>
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                          Enabled
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h5 className="text-white font-medium">Token Claims</h5>
                          <p className="text-gray-400 text-sm">Allow users to claim tokens</p>
                        </div>
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                          Enabled
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Security Settings</h4>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <h5 className="text-white font-medium mb-2">Rate Limiting</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-gray-400 text-sm">API Requests/min</label>
                            <input
                              type="number"
                              defaultValue={100}
                              className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm">Claims/hour</label>
                            <input
                              type="number"
                              defaultValue={24}
                              className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-lg">
                        <h5 className="text-white font-medium mb-2">Fraud Detection</h5>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Auto-ban suspicious activity</span>
                          <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors">
                            Enabled
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                    Save All Settings
                  </button>
                </div>
              </div> */}
              <AdminSettings  />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}