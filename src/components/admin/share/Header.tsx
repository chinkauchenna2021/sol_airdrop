'use client'

import { useState } from 'react'
import { 
  Shield, RefreshCw, Search, Plus, ChevronDown,
  Download, Settings, Coins, XCircle, CheckCircle2,
  Twitter, User, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from '../AdminNotification'
import toast from 'react-hot-toast'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPoints: number
  totalClaims: number
  pendingClaims: number
  totalDistributed: number
  totalEngagements: number
  newUsersToday: number
  claimsEnabled: boolean
  maintenanceMode: boolean
  systemHealth: 'healthy' | 'warning' | 'critical'
}

interface QuickAction {
  id: string
  label: string
  icon: any
  color: string
  action: () => void
  enabled: boolean
}

interface AdminHeaderProps {
  stats: AdminStats | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  onRefresh: () => void
  refreshing: boolean
  notifications: any[]
  onQuickAction: (action: string, data?: any) => void
}

export function AdminHeader({
  stats,
  searchQuery,
  setSearchQuery,
  onRefresh,
  refreshing,
  notifications,
  onQuickAction
}: AdminHeaderProps) {
  const [showQuickActions, setShowQuickActions] = useState(false)

  const toggleClaims = async () => {
    await onQuickAction('toggle-claims', { enabled: !stats?.claimsEnabled })
  }

  const toggleMaintenance = async () => {
    await onQuickAction('toggle-maintenance', { enabled: !stats?.maintenanceMode })
  }

  const syncTwitterData = async () => {
    toast.loading('Syncing Twitter data...')
    try {
      await onQuickAction('sync-twitter')
      toast.success('Twitter sync completed')
    } catch (error) {
      toast.error('Twitter sync failed')
    }
  }

  const exportUsers = () => {
    window.open('/api/admin/export/users', '_blank')
  }

  const quickActions: QuickAction[] = [
    {
      id: 'toggle-claims',
      label: stats?.claimsEnabled ? 'Disable Claims' : 'Enable Claims',
      icon: Coins,
      color: stats?.claimsEnabled ? 'bg-red-500' : 'bg-green-500',
      action: toggleClaims,
      enabled: true
    },
    {
      id: 'maintenance',
      label: stats?.maintenanceMode ? 'Exit Maintenance' : 'Maintenance Mode',
      icon: Settings,
      color: stats?.maintenanceMode ? 'bg-green-500' : 'bg-yellow-500',
      action: toggleMaintenance,
      enabled: true
    },
    {
      id: 'export-users',
      label: 'Export Users',
      icon: Download,
      color: 'bg-blue-500',
      action: exportUsers,
      enabled: true
    },
    {
      id: 'sync-twitter',
      label: 'Sync Twitter Data',
      icon: Twitter,
      color: 'bg-blue-400',
      action: syncTwitterData,
      enabled: true
    }
  ]

  const getSystemHealthColor = () => {
    if (!stats) return 'bg-gray-500'
    switch (stats.systemHealth) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSystemHealthIcon = () => {
    if (!stats) return <AlertTriangle className="w-4 h-4" />
    switch (stats.systemHealth) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'critical': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo & Status */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <div className="flex items-center gap-3">
                <p className="text-gray-400">Platform Management & Analytics</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getSystemHealthColor()}`} />
                  <span className="text-xs text-gray-400 capitalize flex items-center gap-1">
                    {getSystemHealthIcon()}
                    {stats?.systemHealth || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center gap-4">
            {/* Status Badges */}
            <div className="hidden md:flex items-center gap-2">
              {stats?.maintenanceMode && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Maintenance Mode
                </Badge>
              )}
              
              <Badge className={stats?.claimsEnabled ? 
                'bg-green-500/20 text-green-400 border-green-500/30' : 
                'bg-red-500/20 text-red-400 border-red-500/30'
              }>
                Claims {stats?.claimsEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-white/5 border-white/10"
              />
            </div>

            {/* Quick Actions */}
            <div className="relative">
              <Button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Quick Actions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              
              {showQuickActions && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-white/10 z-50">
                  <div className="p-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          action.action()
                          setShowQuickActions(false)
                        }}
                        disabled={!action.enabled}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            {/* Notifications */}
            <NotificationCenter notifications={notifications} />

            {/* Stats Summary */}
            {stats && (
              <div className="text-right hidden lg:block">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-400">
                        {stats.totalUsers.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-xs">Total Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">
                        {stats.activeUsers.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-xs">Active Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-400">
                        {stats.pendingClaims.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-xs">Pending Claims</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <User className="w-3 h-3" />
                    <span>+{stats.newUsersToday} today</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close quick actions */}
      {showQuickActions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowQuickActions(false)}
        />
      )}
    </header>
  )
}