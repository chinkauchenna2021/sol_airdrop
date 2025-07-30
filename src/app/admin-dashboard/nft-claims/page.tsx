// /app/admin/nft-claims/page.tsx
'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import NFTTokenClaiming from '@/components/admin/NFTTokenClaiming'
import { motion } from 'framer-motion'
import { 
  Gift, Users, TrendingUp, AlertTriangle, CheckCircle,
  Settings, RefreshCw, BarChart3, Clock, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminControls {
  claimingEnabled: boolean
  nftPassRequired: boolean
  requireApproval: boolean
  approvedUsers: string[]
  seasonStatus: 'ACTIVE' | 'CLAIMING' | 'ENDED'
  feeAmount: number
}

interface ClaimStats {
  totalEligible: number
  totalApproved: number
  totalClaimed: number
  totalDistributed: number
  pendingApprovals: number
  activeUsers: number
}

export default function AdminNFTClaimsPage() {
  const [adminControls, setAdminControls] = useState<AdminControls | null>(null)
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [controlsRes, statsRes] = await Promise.all([
        fetch('/api/admin/nft-claims/controls'),
        fetch('/api/admin/nft-claims/stats')
      ])

      if (controlsRes.ok) {
        const controlsData = await controlsRes.json()
        setAdminControls(controlsData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setClaimStats(statsData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminUpdate = async (updates: Partial<AdminControls>) => {
    try {
      const response = await fetch('/api/admin/nft-claims/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setAdminControls(prev => prev ? { ...prev, ...updates } : null)
        await fetchData() // Refresh stats
        toast.success('Admin settings updated successfully')
      } else {
        toast.error('Failed to update admin settings')
      }
    } catch (error) {
      toast.error('Failed to update admin settings')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading NFT claims management...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Gift className="w-8 h-8 text-green-400" />
              NFT Token Claims Management
            </h1>
            <p className="text-gray-400 mt-2">
              Manage NFT pass-based token claiming system and user approvals
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            
            {adminControls && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  adminControls.claimingEnabled ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-sm text-gray-300">
                  Claims {adminControls.claimingEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Admin Statistics Overview */}
        {claimStats && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{claimStats.totalEligible}</p>
                    <p className="text-blue-300 text-sm">Total Eligible</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{claimStats.totalApproved}</p>
                    <p className="text-green-300 text-sm">Approved</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{claimStats.totalClaimed}</p>
                    <p className="text-purple-300 text-sm">Claims Made</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{claimStats.pendingApprovals}</p>
                    <p className="text-yellow-300 text-sm">Pending</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{claimStats.totalDistributed}</p>
                    <p className="text-orange-300 text-sm">Distributed</p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-600/20 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{claimStats.activeUsers}</p>
                    <p className="text-cyan-300 text-sm">Active Users</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              System Overview
            </h2>
            {adminControls && (
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  adminControls.claimingEnabled 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-red-600/20 text-red-400'
                }`}>
                  Claims {adminControls.claimingEnabled ? 'Active' : 'Inactive'}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  adminControls.seasonStatus === 'ACTIVE' 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : adminControls.seasonStatus === 'CLAIMING'
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'bg-gray-600/20 text-gray-400'
                }`}>
                  Season: {adminControls.seasonStatus}
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-600/20 text-yellow-400">
                  Fee: ${adminControls.feeAmount}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300">Approval Status</h3>
              <div className="space-y-2">
                {claimStats && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Approval Rate</span>
                      <span className="text-white font-medium">
                        {claimStats.totalEligible > 0 
                          ? Math.round((claimStats.totalApproved / claimStats.totalEligible) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${claimStats.totalEligible > 0 
                            ? (claimStats.totalApproved / claimStats.totalEligible) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300">Claim Progress</h3>
              <div className="space-y-2">
                {claimStats && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Claim Rate</span>
                      <span className="text-white font-medium">
                        {claimStats.totalApproved > 0 
                          ? Math.round((claimStats.totalClaimed / claimStats.totalApproved) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${claimStats.totalApproved > 0 
                            ? (claimStats.totalClaimed / claimStats.totalApproved) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300">System Health</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">All Systems Operational</span>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main NFT Token Claiming Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <NFTTokenClaiming 
            isAdminView={true} 
            onAdminUpdate={handleAdminUpdate} 
          />
        </motion.div>
      </div>
    </AdminLayout>
  )
}
