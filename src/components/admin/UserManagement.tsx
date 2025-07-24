'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, Filter, Download, Upload, Plus, Eye, Edit, 
  Trash2, Ban, UserCheck, UserX, Shield, Star, Calendar,
  Mail, Twitter, Wallet, MoreHorizontal, CheckCircle2,
  XCircle, AlertTriangle, DollarSign, TrendingUp, Activity,
  Settings as SettingsIcon, Clock, MapPin, ExternalLink,
  Copy, RefreshCw, Archive, UserPlus,
  Coins
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/advanceDialog'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

interface User {
  id: string
  walletAddress: string
  twitterUsername?: string
  twitterId?: string
  twitterFollowers?: number  
  totalPoints: number
  level: number
  rank: number
  isActive: boolean
  isBanned: boolean
  isAdmin: boolean
  isPremium: boolean
  createdAt: Date
  lastLoginAt?: Date
  claimsEnabled: boolean
  referralCount: number
  totalClaimed: number
  twitterActivity: 'HIGH' | 'MEDIUM' | 'LOW'
  tokenAllocation: number
  dailyStreak: number
  engagementScore: number
  riskScore: number
  country?: string
  timezone?: string
  notes?: string
}

interface UserFilters {
  search: string
  status: 'all' | 'active' | 'inactive' | 'banned'
  activity: 'all' | 'HIGH' | 'MEDIUM' | 'LOW'
  dateRange: 'all' | '7d' | '30d' | '90d'
  hasTwitter: 'all' | 'yes' | 'no'
  isAdmin: 'all' | 'yes' | 'no'
  minPoints: string
  maxPoints: string
}

export const getActivityBadgeColor = (activity: string) => {
    switch (activity) {
      case 'HIGH': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

 export const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 80) return 'bg-red-500/20 text-red-400 border-red-500/30'
    if (riskScore >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-green-500/20 text-green-400 border-green-500/30'
  }



export function UserManagementSection() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    activity: 'all',
    dateRange: 'all',
    hasTwitter: 'all',
    isAdmin: 'all',
    minPoints: '',
    maxPoints: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, pagination.limit])

  useEffect(() => {
    applyFilters()
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages
        }))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.walletAddress.toLowerCase().includes(query) ||
        user.twitterUsername?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => {
        switch (filters.status) {
          case 'active': return user.isActive && !user.isBanned
          case 'inactive': return !user.isActive
          case 'banned': return user.isBanned
          default: return true
        }
      })
    }

    // Activity filter
    if (filters.activity !== 'all') {
      filtered = filtered.filter(user => user.twitterActivity === filters.activity)
    }

    // Twitter filter
    if (filters.hasTwitter !== 'all') {
      filtered = filtered.filter(user => 
        filters.hasTwitter === 'yes' ? user.twitterUsername : !user.twitterUsername
      )
    }

    // Admin filter
    if (filters.isAdmin !== 'all') {
      filtered = filtered.filter(user => 
        filters.isAdmin === 'yes' ? user.isAdmin : !user.isAdmin
      )
    }

    // Points range filter
    if (filters.minPoints) {
      filtered = filtered.filter(user => user.totalPoints >= parseInt(filters.minPoints))
    }
    if (filters.maxPoints) {
      filtered = filtered.filter(user => user.totalPoints <= parseInt(filters.maxPoints))
    }

    setFilteredUsers(filtered)
  }

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      })

      if (res.ok) {
        await fetchUsers()
        toast.success(`User ${action} successful`)
        setEditingUser(null)
        setViewingUser(null)
      } else {
        toast.error(`Failed to ${action} user`)
      }
    } catch (error) {
      console.error(`User ${action} error:`, error)
      toast.error(`Failed to ${action} user`)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return

    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          action
        })
      })

      if (res.ok) {
        await fetchUsers()
        setSelectedUsers(new Set())
        setShowBulkActions(false)
        toast.success(`Bulk ${action} completed`)
      } else {
        toast.error(`Bulk ${action} failed`)
      }
    } catch (error) {
      console.error(`Bulk ${action} error:`, error)
      toast.error(`Bulk ${action} failed`)
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    }
  }




  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 mt-1">
            {pagination?.total?.toString() || '1'} total users • {filteredUsers.length} filtered
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/api/admin/export/users', '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCreateUser(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
          
          {selectedUsers.size > 0 && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowBulkActions(true)}
            >
              Bulk Actions ({selectedUsers.size})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.isActive && !u.isBanned).length}
                </p>
                <p className="text-gray-400 text-sm">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Twitter className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.twitterUsername).length}
                </p>
                <p className="text-gray-400 text-sm">Twitter Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.isBanned).length}
                </p>
                <p className="text-gray-400 text-sm">Banned Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.isAdmin).length}
                </p>
                <p className="text-gray-400 text-sm">Admin Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by wallet, Twitter, or user ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-white/10"
            >
              <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.activity} onValueChange={(value: any) => setFilters(prev => ({ ...prev, activity: value }))}>
                <SelectTrigger>
                  <SelectValue  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="HIGH">High Activity</SelectItem>
                  <SelectItem value="MEDIUM">Medium Activity</SelectItem>
                  <SelectItem value="LOW">Low Activity</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.hasTwitter} onValueChange={(value: any) => setFilters(prev => ({ ...prev, hasTwitter: value }))}>
                <SelectTrigger>
                  <SelectValue  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="yes">Has Twitter</SelectItem>
                  <SelectItem value="no">No Twitter</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Min Points"
                value={filters.minPoints}
                onChange={(e) => setFilters(prev => ({ ...prev, minPoints: e.target.value }))}
                className="bg-white/5 border-white/10"
              />

              <Input
                placeholder="Max Points"
                value={filters.maxPoints}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPoints: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-left">
                  <th className="p-4">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={selectAllUsers}
                    />
                  </th>
                  <th className="p-4 text-gray-400 font-medium">User</th>
                  <th className="p-4 text-gray-400 font-medium">Activity</th>
                  <th className="p-4 text-gray-400 font-medium">Points</th>
                  <th className="p-4 text-gray-400 font-medium">Status</th>
                  <th className="p-4 text-gray-400 font-medium">Risk</th>
                  <th className="p-4 text-gray-400 font-medium">Last Seen</th>
                  <th className="p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {user.walletAddress.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">
                                {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-4)}
                              </p>
                              {user.isAdmin && (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  Admin
                                </Badge>
                              )}
                              {user.isPremium && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            {user.twitterUsername && (
                              <div className="flex items-center gap-1 mt-1">
                                <Twitter className="w-3 h-3 text-blue-400" />
                                <span className="text-gray-400 text-sm">@{user.twitterUsername}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge className={getActivityBadgeColor(user.twitterActivity)}>
                          {user.twitterActivity}
                        </Badge>
                        {user.twitterFollowers && (
                          <p className="text-gray-400 text-xs mt-1">
                            {user.twitterFollowers} followers
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="text-white font-semibold">
                            {user.totalPoints}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Level {user.level} • #{user.rank}
                          </p>
                          {user.dailyStreak > 0 && (
                            <p className="text-orange-400 text-xs">
                              🔥 {user.dailyStreak} day streak
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {user.isBanned ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : user.isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <UserX className="w-4 h-4 text-yellow-400" />
                          )}
                          <span className={`text-sm ${
                            user.isBanned ? 'text-red-400' : 
                            user.isActive ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            user.claimsEnabled ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <span className="text-xs text-gray-400">
                            Claims {user.claimsEnabled ? 'On' : 'Off'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge className={getRiskBadgeColor(user.riskScore)}>
                          {user.riskScore}%
                        </Badge>
                        <p className="text-gray-400 text-xs mt-1">
                          Score: {user.engagementScore}/100
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="text-gray-400 text-sm">
                          {user.lastLoginAt ? (
                            <>
                              <p>{new Date(user.lastLoginAt).toLocaleDateString()}</p>
                              <p className="text-xs">
                                {new Date(user.lastLoginAt).toLocaleTimeString()}
                              </p>
                            </>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingUser(user)
                              setShowUserModal(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user)
                              setShowUserModal(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">
          Showing {filteredUsers.length} of {pagination.total} users
        </p>
        <div className="flex gap-2">
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={page === pagination.page ? "default" : "outline"}
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page }))}
            >
              {page}
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced User Modal */}
      <UserModal
        user={editingUser || viewingUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setEditingUser(null)
          setViewingUser(null)
        }}
        onSave={handleUserAction}
        isEditing={!!editingUser}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        selectedCount={selectedUsers.size}
        onAction={handleBulkAction}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onSuccess={fetchUsers}
      />
    </div>
  )
}

// Advanced User Modal Component
export function UserModal({ 
  user, 
  isOpen, 
  onClose, 
  onSave, 
  isEditing 
}: {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, action: string, data?: any) => void
  isEditing: boolean
}) {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [activeTab, setActiveTab] = useState('overview')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (user) {
      setFormData(user)
      setAdminNotes(user.notes || '')
    }
  }, [user])

  if (!user) return null

  const handleSave = () => {
    if (isEditing && Object.keys(formData).length > 0) {
      onSave(user.id, 'update', formData)
    }
  }

  const handleQuickAction = (action: string, value?: any) => {
    onSave(user.id, action, value ? { [action]: value } : undefined)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.walletAddress.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-lg">
                {user.walletAddress.slice(0, 12)}...{user.walletAddress.slice(-6)}
              </p>
              {user.twitterUsername && (
                <p className="text-sm text-gray-400">@{user.twitterUsername}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.totalPoints}</p>
                  <p className="text-gray-400 text-sm">Total Points</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">#{user.rank}</p>
                  <p className="text-gray-400 text-sm">Rank</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.referralCount}</p>
                  <p className="text-gray-400 text-sm">Referrals</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.totalClaimed}</p>
                  <p className="text-gray-400 text-sm">Tokens Claimed</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-white">{user.level || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Streak:</span>
                    <span className="text-white">{user.dailyStreak || "0"} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member Since:</span>
                    <span className="text-white">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Login:</span>
                    <span className="text-white">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Twitter Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.twitterUsername ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username:</span>
                        <span className="text-white">@{user.twitterUsername}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Followers:</span>
                        <span className="text-white">{user.twitterFollowers || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Activity Level:</span>
                        <Badge className={getActivityBadgeColor(user.twitterActivity)}>
                          {user.twitterActivity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Token Allocation:</span>
                        <span className="text-white">{user.tokenAllocation} CONNECT</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No Twitter account connected</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium">Activity Level</label>
                    <Select 
                      value={formData.twitterActivity || user.twitterActivity} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, twitterActivity: value as any }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High Activity</SelectItem>
                        <SelectItem value="MEDIUM">Medium Activity</SelectItem>
                        <SelectItem value="LOW">Low Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium">Token Allocation</label>
                    <Input
                      type="number"
                      value={formData.tokenAllocation || user.tokenAllocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenAllocation: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.claimsEnabled ?? user.claimsEnabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, claimsEnabled: checked as boolean }))}
                      />
                      <span className="text-white text-sm">Enable Claims</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.isActive ?? user.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                      />
                      <span className="text-white text-sm">Active Account</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.isPremium ?? user.isPremium}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked as boolean }))}
                      />
                      <span className="text-white text-sm">Premium Account</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium">Points Adjustment</label>
                    <Input
                      type="number"
                      placeholder="Enter points to add/subtract"
                      className="mt-1"
                    />
                    <p className="text-gray-400 text-xs mt-1">Use negative numbers to subtract points</p>
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium">Admin Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this user..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Security Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Risk Score:</span>
                    <Badge className={getRiskBadgeColor(user.riskScore)}>
                      {user.riskScore}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement Score:</span>
                    <span className="text-white">{user.engagementScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Status:</span>
                    <span className={user.isBanned ? 'text-red-400' : 'text-green-400'}>
                      {user.isBanned ? 'Banned' : 'Good Standing'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('resetPassword')}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('toggleBan', !user.isBanned)}
                  >
                    {user.isBanned ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
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
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('clearSessions')}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Sessions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isEditing && (
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Bulk Actions Modal
function BulkActionsModal({
  isOpen,
  onClose,
  selectedCount,
  onAction
}: {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onAction: (action: string) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>
            Perform actions on {selectedCount} selected users
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => onAction('activate')}>
            <UserCheck className="w-4 h-4 mr-2" />
            Activate
          </Button>
          <Button variant="outline" onClick={() => onAction('deactivate')}>
            <UserX className="w-4 h-4 mr-2" />
            Deactivate
          </Button>
          <Button variant="outline" onClick={() => onAction('enableClaims')}>
            <Coins className="w-4 h-4 mr-2" />
            Enable Claims
          </Button>
          <Button variant="outline" onClick={() => onAction('disableClaims')}>
            <XCircle className="w-4 h-4 mr-2" />
            Disable Claims
          </Button>
          <Button variant="outline" onClick={() => onAction('export')}>
            <Download className="w-4 h-4 mr-2" />
            Export Selected
          </Button>
          <Button variant="destructive" onClick={() => onAction('ban')}>
            <Ban className="w-4 h-4 mr-2" />
            Ban Users
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Create User Modal (placeholder - would need full implementation)
function CreateUserModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <p className="text-gray-400">Manual user creation form would go here...</p>
      </DialogContent>
    </Dialog>
  )
}