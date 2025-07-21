'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Gift, TrendingUp, Users, Calendar, Flame, Settings,
  BarChart3, Clock, Star, Target, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

interface EarningStats {
  totalDistributed: number
  claimsToday: number
  activeUsers: number
  averageStreak: number
  longestStreak: number
  totalUsers: number
  claimRate: number
  streakDistribution: Array<{
    days: string
    users: number
  }>
  dailyClaimHistory: Array<{
    date: string
    claims: number
    tokens: number
  }>
}

interface EarningConfig {
  loginReward: number
  referralReward: number
  streakBonus7: number
  streakBonus30: number
  enabled: boolean
}

export const DailyEarningManager = () => {
  const [stats, setStats] = useState<EarningStats | null>(null)
  const [config, setConfig] = useState<EarningConfig>({
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
        toast.success('Configuration updated successfully')
      } else {
        toast.error('Failed to update configuration')
      }
    } catch (error) {
      console.error('Config update error:', error)
      toast.error('Failed to update configuration')
    } finally {
      setUpdating(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchData()
    toast.success('Data refreshed')
  }

  if (loading) {
    return <div className="text-white">Loading daily earning data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Daily Earning Management</h2>
        <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Claims Today</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.claimsToday}</p>
                  <p className="text-gray-400 text-sm">{(stats.claimsToday * config.loginReward).toLocaleString()} tokens</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Streaks</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.activeUsers}</p>
                  <p className="text-gray-400 text-sm">Avg: {stats.averageStreak} days</p>
                </div>
                <Flame className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Claim Rate</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.claimRate.toFixed(1)}%</p>
                  <p className="text-gray-400 text-sm">of active users</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Earning Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium">Daily Login Reward</label>
                <Input
                  type="number"
                  value={config.loginReward}
                  onChange={(e) => setConfig(prev => ({ ...prev, loginReward: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
                <p className="text-gray-400 text-xs mt-1">CONNECT tokens per day</p>
              </div>

              <div>
                <label className="text-white text-sm font-medium">Referral Reward</label>
                <Input
                  type="number"
                  value={config.referralReward}
                  onChange={(e) => setConfig(prev => ({ ...prev, referralReward: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
                <p className="text-gray-400 text-xs mt-1">CONNECT tokens per referral</p>
              </div>

              <div>
                <label className="text-white text-sm font-medium">7-Day Streak Bonus</label>
                <Input
                  type="number"
                  value={config.streakBonus7}
                  onChange={(e) => setConfig(prev => ({ ...prev, streakBonus7: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
                <p className="text-gray-400 text-xs mt-1">Extra tokens for 7+ days</p>
              </div>

              <div>
                <label className="text-white text-sm font-medium">30-Day Streak Bonus</label>
                <Input
                  type="number"
                  value={config.streakBonus30}
                  onChange={(e) => setConfig(prev => ({ ...prev, streakBonus30: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
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

            <Button
              onClick={handleConfigUpdate}
              disabled={updating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {updating ? 'Updating...' : 'Update Configuration'}
            </Button>
          </CardContent>
        </Card>

        {/* Daily Claims Chart */}
        {stats && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Daily Claims Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyClaimHistory}>
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
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Streak Distribution */}
      {stats && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5" />
              Streak Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.streakDistribution.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">{item.days}</p>
                  <p className="text-2xl font-bold text-white">{item.users}</p>
                  <p className="text-gray-400 text-xs">users</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Flame className="w-4 h-4" />
                <span className="font-semibold">Longest Streak Record</span>
              </div>
              <p className="text-white text-lg font-bold">{stats.longestStreak} days</p>
              <p className="text-gray-400 text-sm">Current platform record</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}