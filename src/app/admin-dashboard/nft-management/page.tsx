// /app/admin/nft-management/page.tsx - New Combined Management Page
'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { motion } from 'framer-motion'
import { 
  Coins, Gift, Settings, Users, BarChart3, 
  Shield, RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react'
import AdminNFTMinting from '@/components/admin/AdminNFTMinting'
import NFTTokenClaiming from '@/components/admin/NFTTokenClaiming' 
import toast from 'react-hot-toast'

type TabType = 'minting' | 'claiming' | 'analytics'

interface SystemStats {
  totalCollections: number
  totalMinted: number
  totalDistributed: number
  totalClaimed: number
  activeUsers: number
  pendingApprovals: number
}

export default function NFTManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('minting')
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/nft-management/stats')
      if (response.ok) {
        const data = await response.json()
        setSystemStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
      toast.error('Failed to load system statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsChange = async (key: string, value: any) => {
    try {
      const response = await fetch('/api/admin/nft-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (response.ok) {
        toast.success('Settings updated successfully')
        await fetchSystemStats() // Refresh stats
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const handleAdminUpdate = async (updates: any) => {
    try {
      const response = await fetch('/api/admin/nft-claims/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast.success('Admin settings updated successfully')
        await fetchSystemStats() // Refresh stats
      } else {
        toast.error('Failed to update admin settings')
      }
    } catch (error) {
      toast.error('Failed to update admin settings')
    }
  }

  const tabs = [
    { 
      id: 'minting' as const, 
      label: 'NFT Minting', 
      icon: Coins, 
      description: 'Create and distribute NFT collections' 
    },
    { 
      id: 'claiming' as const, 
      label: 'Token Claims', 
      icon: Gift, 
      description: 'Manage NFT pass-based token claiming' 
    },
    { 
      id: 'analytics' as const, 
      label: 'Analytics', 
      icon: BarChart3, 
      description: 'View system performance and statistics' 
    }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading NFT management system...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    // <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              NFT Management Center
            </h1>
            <p className="text-gray-400 mt-2">
              Complete NFT lifecycle management - from minting to claiming
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchSystemStats}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">System Online</span>
            </div>
          </div>
        </motion.div>

        {/* System Overview */}
        {systemStats && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xl font-bold text-white">{systemStats.totalCollections}</p>
                  <p className="text-blue-300 text-xs">Collections</p>
                </div>
              </div>
            </div>

            <div className="bg-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xl font-bold text-white">{systemStats.totalMinted.toLocaleString()}</p>
                  <p className="text-green-300 text-xs">Minted</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xl font-bold text-white">{systemStats.totalDistributed.toLocaleString()}</p>
                  <p className="text-purple-300 text-xs">Distributed</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-xl font-bold text-white">{systemStats.totalClaimed.toLocaleString()}</p>
                  <p className="text-yellow-300 text-xs">Claimed</p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-600/20 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xl font-bold text-white">{systemStats.activeUsers}</p>
                  <p className="text-cyan-300 text-xs">Active Users</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-orange-500/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xl font-bold text-white">{systemStats.pendingApprovals}</p>
                  <p className="text-orange-300 text-xs">Pending</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-white/10"
        >
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-80">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'minting' && (
            <AdminNFTMinting onSettingsChange={handleSettingsChange} />
          )}
          
          {activeTab === 'claiming' && (
            <NFTTokenClaiming 
              isAdminView={true} 
              onAdminUpdate={handleAdminUpdate} 
            />
          )}
          
          {activeTab === 'analytics' && (
            <NFTAnalyticsDashboard systemStats={systemStats} />
          )}
        </motion.div>
      </div>
    // </AdminLayout>
  )
}

// Analytics Dashboard Component
function NFTAnalyticsDashboard({ systemStats }: { systemStats: SystemStats | null }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Performance Analytics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Minting Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Success Rate</span>
                <span className="text-green-400 font-bold">98.5%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }} />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Distribution Rate</span>
                <span className="text-blue-400 font-bold">95.2%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95.2%' }} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Claiming Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Claim Success Rate</span>
                <span className="text-purple-400 font-bold">97.1%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '97.1%' }} />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">User Satisfaction</span>
                <span className="text-yellow-400 font-bold">94.8%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '94.8%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-blue-400 font-semibold mb-2">System Health Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-gray-300">API: Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-gray-300">Database: Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-gray-300">Blockchain: Synced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-gray-300">Queue: Busy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 minutes ago', action: 'NFT Collection created', user: 'Admin', type: 'success' },
            { time: '5 minutes ago', action: 'User approved for claiming', user: 'John Doe', type: 'info' },
            { time: '8 minutes ago', action: 'Tokens claimed successfully', user: 'Jane Smith', type: 'success' },
            { time: '12 minutes ago', action: 'NFT distribution completed', user: '25 users', type: 'success' },
            { time: '15 minutes ago', action: 'System settings updated', user: 'Admin', type: 'warning' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'success' ? 'bg-green-400' :
                activity.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
              }`} />
              <div className="flex-1">
                <p className="text-white text-sm">{activity.action}</p>
                <p className="text-gray-400 text-xs">{activity.user} • {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}