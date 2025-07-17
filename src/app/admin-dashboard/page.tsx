'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Activity, DollarSign, TrendingUp, Shield, AlertTriangle,
  Settings, Bell, Search, Filter, Download, RefreshCw, Eye,
  Ban, Check, X, ChevronDown, Menu, Moon, Sun, Zap, Database,
  BarChart3, PieChart, LineChart, UserCheck, Clock, Award,
  Wallet, Twitter, Globe, Lock, Unlock, Star,
  // Add these new icons
  Copy, Coins, RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts'
import toast from 'react-hot-toast'

// Types
interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPoints: number
  totalClaims: number
  pendingClaims: number
  totalDistributed: number
  totalEngagements: number
  newUsersToday: number
  activityDistribution: Record<string, {
    userCount: number
    tokensPerUser: number
    totalTokens: number
  }>
  claimStats: Array<{
    status: string
    count: number
    totalAmount: number
  }>
}

interface User {
  id: string
  walletAddress: string
  twitterUsername?: string
  twitterName?: string
  twitterFollowers?: number
  twitterActivity?: 'HIGH' | 'MEDIUM' | 'LOW'
  totalPoints: number
  level: number
  streak: number
  rank: number
  tokenAllocation: number
  isActive: boolean
  isAdmin: boolean
  isBanned: boolean
  riskScore: number
  createdAt: string
  lastActivity?: string
}

interface FraudAlert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId: string
  description: string
  riskScore: number
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'
  createdAt: string
}

interface SystemConfig {
  claimsEnabled: boolean
  minClaimAmount: number
  pointsPerLike: number
  pointsPerRetweet: number
  pointsPerComment: number
  pointsPerFollow: number
  highActivityTokens: number
  mediumActivityTokens: number
  lowActivityTokens: number
}

export default function EnhancedAdminDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([])
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [analytics, setAnalytics] = useState<any[]>([])
  
  // UI states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
  // Filter states
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })

  // Auth check and initial data load
  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth')
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please connect your wallet first')
          window.location.href = '/'
          return
        }
        if (res.status === 403) {
          toast.error('Admin access required')
          window.location.href = '/'
          return
        }
      }
      
      await fetchAllData()
    } catch (error) {
      console.error('Auth check failed:', error)
      toast.error('Authentication failed')
      window.location.href = '/'
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchFraudAlerts(),
        fetchSystemConfig(),
        fetchAnalytics()
      ])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/admin-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(userSearch && { search: userSearch }),
        ...(userFilter !== 'all' && { filter: userFilter })
      })
      
      const res = await fetch(`/api/admin/admin-users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total
        }))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchFraudAlerts = async () => {
    try {
      const res = await fetch('/api/admin/fraud/alerts')
      if (res.ok) {
        const data = await res.json()
        setFraudAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch fraud alerts:', error)
    }
  }

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch('/api/admin/config')
      if (res.ok) {
        const data = await res.json()
        setSystemConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch system config:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics || [])
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (res.ok) {
        await fetchUsers()
        toast.success(`User ${action} successfully`)
        setShowUserModal(false)
      }
    } catch (error) {
      console.error('User action failed:', error)
      toast.error('Action failed')
    }
  }

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/fraud/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })
      
      if (res.ok) {
        await fetchFraudAlerts()
        toast.success(`Alert ${action} successfully`)
        setShowAlertModal(false)
      }
    } catch (error) {
      console.error('Alert action failed:', error)
      toast.error('Action failed')
    }
  }

  const handleConfigUpdate = async (config: Partial<SystemConfig>) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (res.ok) {
        await fetchSystemConfig()
        toast.success('Configuration updated')
        setShowConfigModal(false)
      }
    } catch (error) {
      console.error('Config update failed:', error)
      toast.error('Update failed')
    }
  }

  // Computed values
  const filteredUsers = useMemo(() => {
    let filtered = users
    
    if (userSearch) {
      const search = userSearch.toLowerCase()
      filtered = filtered.filter(user => 
        user.walletAddress.toLowerCase().includes(search) ||
        user.twitterUsername?.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search)
      )
    }
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (userFilter) {
          case 'active': return user.isActive
          case 'inactive': return !user.isActive
          case 'admin': return user.isAdmin
          case 'banned': return user.isBanned
          case 'high-risk': return user.riskScore >= 70
          default: return true
        }
      })
    }
    
    return filtered
  }, [users, userSearch, userFilter])

  const chartData = useMemo(() => {
    if (!analytics.length) return []
    
    return analytics.slice(-30).map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      users: item.totalUsers,
      active: item.activeUsers,
      engagements: item.totalEngagements,
      claims: item.totalClaims
    }))
  }, [analytics])

  const pieData = useMemo(() => {
    if (!stats?.activityDistribution) return []
    
    return Object.entries(stats.activityDistribution).map(([activity, data]) => ({
      name: activity.charAt(0) + activity.slice(1).toLowerCase(),
      value: data.userCount,
      tokens: data.tokensPerUser
    }))
  }, [stats])

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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-white hover:bg-gray-700"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="text-white hover:bg-gray-700"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Badge variant="secondary" className="bg-blue-600 text-white">
              Admin
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 bg-gray-800 border-r border-gray-700 h-screen sticky top-0"
            >
              <nav className="p-4 space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'users', label: 'User Management', icon: Users },
                  { id: 'fraud', label: 'Fraud Detection', icon: Shield },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map(item => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'default' : 'ghost'}
                    className={`w-full justify-start ${
                      activeTab === item.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Total Users',
                    value: stats.totalUsers.toLocaleString(),
                    icon: Users,
                    color: 'from-blue-500 to-blue-600',
                    change: '+12%'
                  },
                  {
                    title: 'Active Users',
                    value: stats.activeUsers.toLocaleString(),
                    icon: Activity,
                    color: 'from-green-500 to-green-600',
                    change: '+8%'
                  },
                  {
                    title: 'Total Claims',
                    value: stats.totalClaims.toLocaleString(),
                    icon: DollarSign,
                    color: 'from-purple-500 to-purple-600',
                    change: '+23%'
                  },
                  {
                    title: 'Pending Claims',
                    value: stats.pendingClaims.toLocaleString(),
                    icon: Clock,
                    color: 'from-orange-500 to-orange-600',
                    change: '-5%'
                  }
                ].map((stat, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-700 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">{stat.title}</p>
                          <p className="text-3xl font-bold text-white">{stat.value}</p>
                          <p className="text-sm text-green-400">{stat.change}</p>
                        </div>
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="active" 
                          stroke="#10B981" 
                          strokeWidth={2}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Activity Distribution */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Activity Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <RechartsPieChart data={pieData}>
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} 
                            />
                          ))}
                        </RechartsPieChart>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fraudAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.severity === 'CRITICAL' ? 'text-red-400' :
                            alert.severity === 'HIGH' ? 'text-orange-400' :
                            alert.severity === 'MEDIUM' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium">{alert.type}</p>
                            <p className="text-sm text-gray-400">{alert.description}</p>
                          </div>
                        </div>
                        <Badge variant={
                          alert.severity === 'CRITICAL' ? 'destructive' :
                          alert.severity === 'HIGH' ? 'destructive' :
                          alert.severity === 'MEDIUM' ? 'default' :
                          'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* User Filters */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                        <SelectItem value="high-risk">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left p-3 text-gray-300">User</th>
                          <th className="text-left p-3 text-gray-300">Activity</th>
                          <th className="text-left p-3 text-gray-300">Points</th>
                          <th className="text-left p-3 text-gray-300">Tokens</th>
                          <th className="text-left p-3 text-gray-300">Risk</th>
                          <th className="text-left p-3 text-gray-300">Status</th>
                          <th className="text-left p-3 text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.slice(0, 20).map((user) => (
                          <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700">
                            <td className="p-3">
                              <div>
                                <p className="text-white font-medium">
                                  {user.twitterUsername || `${user.walletAddress.slice(0, 8)}...`}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {user.walletAddress.slice(0, 12)}...
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant={
                                user.twitterActivity === 'HIGH' ? 'default' :
                                user.twitterActivity === 'MEDIUM' ? 'secondary' :
                                'outline'
                              }>
                                {user.twitterActivity || 'LOW'}
                              </Badge>
                            </td>
                            <td className="p-3 text-white">{user.totalPoints.toLocaleString()}</td>
                            <td className="p-3 text-white">{user.tokenAllocation.toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`${
                                user.riskScore >= 70 ? 'text-red-400' :
                                user.riskScore >= 40 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>
                                {user.riskScore}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex space-x-1">
                                {user.isAdmin && <Badge variant="default">Admin</Badge>}
                                {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                                {!user.isActive && <Badge variant="outline">Inactive</Badge>}
                              </div>
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowUserModal(true)
                                }}
                                className="text-blue-400 hover:bg-gray-600"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Fraud Detection Tab */}
          {activeTab === 'fraud' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-6 h-6 mr-2" />
                    Fraud Alerts ({fraudAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fraudAlerts.map((alert) => (
                      <div key={alert.id} className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className={`w-6 h-6 ${
                              alert.severity === 'CRITICAL' ? 'text-red-400' :
                              alert.severity === 'HIGH' ? 'text-orange-400' :
                              alert.severity === 'MEDIUM' ? 'text-yellow-400' :
                              'text-blue-400'
                            }`} />
                            <div>
                              <h3 className="text-white font-medium">{alert.type}</h3>
                              <p className="text-gray-400">{alert.description}</p>
                              <p className="text-sm text-gray-500">
                                Risk Score: {alert.riskScore} | {new Date(alert.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              alert.severity === 'CRITICAL' ? 'destructive' :
                              alert.severity === 'HIGH' ? 'destructive' :
                              alert.severity === 'MEDIUM' ? 'default' :
                              'secondary'
                            }>
                              {alert.severity}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedAlert(alert)
                                setShowAlertModal(true)
                              }}
                              className="text-blue-400 hover:bg-gray-600"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Platform Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="engagements" fill="#3B82F6" />
                      <Bar dataKey="claims" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && systemConfig && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Claim Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-gray-300">Claims Enabled</label>
                          <Badge variant={systemConfig.claimsEnabled ? "default" : "secondary"}>
                            {systemConfig.claimsEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-gray-300">Min Claim Amount</label>
                          <span className="text-white">{systemConfig.minClaimAmount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Point Values</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-gray-300">Points per Like</label>
                          <span className="text-white">{systemConfig.pointsPerLike}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-gray-300">Points per Retweet</label>
                          <span className="text-white">{systemConfig.pointsPerRetweet}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-gray-300">Points per Comment</label>
                          <span className="text-white">{systemConfig.pointsPerComment}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowConfigModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Update Configuration
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>

      {/* User Detail Modal */}
     {/* Enhanced User Detail Modal */}
<Dialog open={showUserModal} onOpenChange={setShowUserModal}>
  <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader className="border-b border-gray-700 pb-4">
      <DialogTitle className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-400" />
        User Details
      </DialogTitle>
    </DialogHeader>
    
    {selectedUser && (
      <div className="space-y-6 p-1">
        {/* User Header with Avatar/Icon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {selectedUser.twitterUsername 
                ? selectedUser.twitterUsername[0].toUpperCase() 
                : selectedUser.walletAddress.slice(0, 2).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate">
              {selectedUser.twitterName || selectedUser.twitterUsername || 'Anonymous User'}
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              @{selectedUser.twitterUsername || 'No Twitter'}
            </p>
            
            {/* Wallet Address with Copy Button */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 mt-2">
              <label className="text-xs text-gray-400 whitespace-nowrap">Wallet:</label>
              <code className="text-sm text-green-400 font-mono truncate flex-1 min-w-0">
                {selectedUser.walletAddress}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(selectedUser.walletAddress)
                  toast.success('Wallet address copied!')
                }}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {selectedUser.isAdmin && (
              <Badge variant="default" className="bg-purple-600">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            {selectedUser.isBanned && (
              <Badge variant="destructive">
                <Ban className="w-3 h-3 mr-1" />
                Banned
              </Badge>
            )}
            {!selectedUser.isActive && (
              <Badge variant="outline" className="border-gray-500">
                Inactive
              </Badge>
            )}
            <Badge 
              variant={
                selectedUser.twitterActivity === 'HIGH' ? 'default' :
                selectedUser.twitterActivity === 'MEDIUM' ? 'secondary' :
                'outline'
              }
              className={
                selectedUser.twitterActivity === 'HIGH' ? 'bg-green-600' :
                selectedUser.twitterActivity === 'MEDIUM' ? 'bg-yellow-600' :
                'border-gray-500'
              }
            >
              {selectedUser.twitterActivity || 'LOW'} Activity
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-blue-400" />
              <label className="text-sm text-gray-400">Total Points</label>
            </div>
            <p className="text-2xl font-bold text-white">
              {selectedUser.totalPoints.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-green-400" />
              <label className="text-sm text-gray-400">Token Allocation</label>
            </div>
            <p className="text-2xl font-bold text-white">
              {selectedUser.tokenAllocation.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <label className="text-sm text-gray-400">Level</label>
            </div>
            <p className="text-2xl font-bold text-white">
              {selectedUser.level || Math.floor(selectedUser.totalPoints / 1000) + 1}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <label className="text-sm text-gray-400">Risk Score</label>
            </div>
            <p className={`text-2xl font-bold ${
              selectedUser.riskScore >= 70 ? 'text-red-400' :
              selectedUser.riskScore >= 40 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {selectedUser.riskScore}
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
              Account Information
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Rank</span>
                <span className="text-white font-medium">#{selectedUser.rank}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Streak</span>
                <span className="text-white font-medium">{selectedUser.streak || 0} days</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Twitter Followers</span>
                <span className="text-white font-medium">
                  {selectedUser.twitterFollowers?.toLocaleString() || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Joined</span>
                <span className="text-white font-medium">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {selectedUser.lastActivity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Last Activity</span>
                  <span className="text-white font-medium">
                    {new Date(selectedUser.lastActivity).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
              Quick Stats
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Account Status</span>
                <Badge variant={selectedUser.isActive ? "default" : "outline"}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Admin Status</span>
                <Badge variant={selectedUser.isAdmin ? "default" : "outline"}>
                  {selectedUser.isAdmin ? 'Admin' : 'User'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Ban Status</span>
                <Badge variant={selectedUser.isBanned ? "destructive" : "outline"}>
                  {selectedUser.isBanned ? 'Banned' : 'Good Standing'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Risk Level</span>
                <Badge variant={
                  selectedUser.riskScore >= 70 ? "destructive" :
                  selectedUser.riskScore >= 40 ? "default" :
                  "outline"
                }>
                  {selectedUser.riskScore >= 70 ? 'High Risk' :
                   selectedUser.riskScore >= 40 ? 'Medium Risk' :
                   'Low Risk'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="destructive"
              onClick={() => handleUserAction(selectedUser.id, selectedUser.isBanned ? 'unban' : 'ban')}
              className="flex-1 sm:flex-none"
            >
              {selectedUser.isBanned ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unban User
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleUserAction(selectedUser.id, selectedUser.isActive ? 'deactivate' : 'activate')}
              className="border-gray-600 text-white hover:bg-gray-700 flex-1 sm:flex-none"
            >
              <Activity className="w-4 h-4 mr-2" />
              {selectedUser.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleUserAction(selectedUser.id, selectedUser.isAdmin ? 'remove_admin' : 'make_admin')}
              className="border-gray-600 text-white hover:bg-gray-700 flex-1 sm:flex-none"
            >
              <Shield className="w-4 h-4 mr-2" />
              {selectedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                // Add functionality to view user's transaction history
                toast('Transaction history view coming soon!')
              }}
              className="border-gray-600 text-white hover:bg-gray-700 flex-1 sm:flex-none"
            >
              <Eye className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
          
          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                // Reset user points
                if (confirm('Are you sure you want to reset this user\'s points to 0?')) {
                  handleUserAction(selectedUser.id, 'reset_points')
                }
              }}
              className="text-yellow-400 hover:bg-yellow-400/10 flex-1 sm:flex-none"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Points
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                // Send notification to user
                toast('Notification feature coming soon!')
              }}
              className="text-blue-400 hover:bg-blue-400/10 flex-1 sm:flex-none"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                // Export user data
                const userData = {
                  ...selectedUser,
                  exportedAt: new Date().toISOString()
                }
                const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `user-${selectedUser.id}-data.json`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('User data exported!')
              }}
              className="text-green-400 hover:bg-green-400/10 flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
      {/* Alert Detail Modal */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Fraud Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Alert Type</label>
                <p className="text-white font-medium">{selectedAlert.type}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <p className="text-white">{selectedAlert.description}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Risk Score</label>
                <p className="text-white text-xl font-bold">{selectedAlert.riskScore}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <Badge variant="outline">{selectedAlert.status}</Badge>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="default"
                  onClick={() => handleAlertAction(selectedAlert.id, 'RESOLVED')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Resolve
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleAlertAction(selectedAlert.id, 'FALSE_POSITIVE')}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  False Positive
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => handleAlertAction(selectedAlert.id, 'INVESTIGATING')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Investigate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update System Configuration</DialogTitle>
          </DialogHeader>
          {systemConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">High Activity Tokens</label>
                  <Input 
                    type="number"
                    defaultValue={systemConfig.highActivityTokens}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Medium Activity Tokens</label>
                  <Input 
                    type="number"
                    defaultValue={systemConfig.mediumActivityTokens}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Low Activity Tokens</label>
                  <Input 
                    type="number"
                    defaultValue={systemConfig.lowActivityTokens}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Points per Like</label>
                  <Input 
                    type="number"
                    defaultValue={systemConfig.pointsPerLike}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowConfigModal(false)}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Handle config update here
                    handleConfigUpdate({})
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Update Configuration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}