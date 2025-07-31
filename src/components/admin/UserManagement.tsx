'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, Filter, Download, Upload, Plus, Eye, Edit, 
  Trash2, Ban, UserCheck, UserX, Shield, Star, Calendar,
  Mail, Twitter, Wallet, MoreHorizontal, CheckCircle2,
  XCircle, AlertTriangle, DollarSign, TrendingUp, Activity,
  Settings as SettingsIcon, Clock, MapPin, ExternalLink,
  Copy, RefreshCw, Archive, UserPlus, Coins, Check, X,
  ChevronDown, ChevronUp, AlertCircle, Crown, Zap,
  FileText, History, TrendingDown
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  isApprovedForClaiming: boolean
  isApprovedForNFT: boolean
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
  approvalStatus: 'all' | 'approved' | 'pending' | 'rejected'
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

export const getApprovalBadgeColor = (isApproved: boolean, isPending: boolean = false) => {
  if (isPending) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return isApproved 
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30'
}

export function UserManagementSection() {
  const [users, setUsers] = useState<User[]>([
    // Mock data for demonstration
    {
      id: '1',
      walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      twitterUsername: 'john_doe',
      twitterFollowers: 1250,
      totalPoints: 15670,
      level: 15,
      rank: 42,
      isActive: true,
      isBanned: false,
      isAdmin: false,
      isPremium: true,
      isApprovedForClaiming: true,
      isApprovedForNFT: false,
      createdAt: new Date('2024-01-15'),
      lastLoginAt: new Date('2024-12-15'),
      claimsEnabled: true,
      referralCount: 23,
      totalClaimed: 4500,
      twitterActivity: 'HIGH',
      tokenAllocation: 4500,
      dailyStreak: 12,
      engagementScore: 85,
      riskScore: 15,
      country: 'US',
      notes: 'High engagement user'
    },
    {
      id: '2',
      walletAddress: '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi',
      twitterUsername: 'crypto_alice',
      twitterFollowers: 850,
      totalPoints: 8920,
      level: 8,
      rank: 156,
      isActive: true,
      isBanned: false,
      isAdmin: false,
      isPremium: false,
      isApprovedForClaiming: false,
      isApprovedForNFT: true,
      createdAt: new Date('2024-02-20'),
      lastLoginAt: new Date('2024-12-14'),
      claimsEnabled: true,
      referralCount: 7,
      totalClaimed: 3000,
      twitterActivity: 'MEDIUM',
      tokenAllocation: 3500,
      dailyStreak: 5,
      engagementScore: 68,
      riskScore: 45,
      country: 'UK'
    },
    {
      id: '3',
      walletAddress: 'DhJ8F3qNpqrC9XvK2mNbAaHhFfGgBbCc6tYxWqPpP1mN',
      totalPoints: 2450,
      level: 2,
      rank: 890,
      isActive: false,
      isBanned: true,
      isAdmin: false,
      isPremium: false,
      isApprovedForClaiming: false,
      isApprovedForNFT: false,
      createdAt: new Date('2024-03-10'),
      claimsEnabled: false,
      referralCount: 0,
      totalClaimed: 0,
      twitterActivity: 'LOW',
      tokenAllocation: 3000,
      dailyStreak: 0,
      engagementScore: 25,
      riskScore: 92,
      notes: 'Suspicious activity detected'
    }
  ])
  
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 3,
    totalPages: 1
  })

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalUser, setApprovalUser] = useState<User | null>(null)
  const [approvalType, setApprovalType] = useState<'claiming' | 'nft'>('claiming')

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    activity: 'all',
    dateRange: 'all',
    hasTwitter: 'all',
    isAdmin: 'all',
    approvalStatus: 'all',
    minPoints: '',
    maxPoints: ''
  })

  useEffect(() => {
    // Initialize with mock data
    setFilteredUsers(users)
    setPagination(prev => ({
      ...prev,
      total: users.length
    }))
  }, [users])

  useEffect(() => {
    applyFilters()
  }, [users, filters])

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

    // Approval status filter
    if (filters.approvalStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filters.approvalStatus) {
          case 'approved': 
            return user.isApprovedForClaiming || user.isApprovedForNFT
          case 'rejected':
            return !user.isApprovedForClaiming && !user.isApprovedForNFT
          case 'pending':
            // For demo purposes, users with medium risk scores are "pending"
            return user.riskScore >= 30 && user.riskScore < 70
          default: 
            return true
        }
      })
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
      // Mock API call - replace with actual API
      console.log(`Action: ${action} for user: ${userId}`, data)
      
      // Update local state for demo
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userId) {
            switch (action) {
              case 'ban':
                return { ...user, isBanned: true, isActive: false }
              case 'unban':
                return { ...user, isBanned: false, isActive: true }
              case 'activate':
                return { ...user, isActive: true }
              case 'deactivate':
                return { ...user, isActive: false }
              case 'toggleClaims':
                return { ...user, claimsEnabled: !user.claimsEnabled }
              case 'approveClaiming':
                return { ...user, isApprovedForClaiming: true }
              case 'rejectClaiming':
                return { ...user, isApprovedForClaiming: false }
              case 'approveNFT':
                return { ...user, isApprovedForNFT: true }
              case 'rejectNFT':
                return { ...user, isApprovedForNFT: false }
              case 'delete':
                return null // Will be filtered out
              case 'update':
                return { ...user, ...data }
              default:
                return user
            }
          }
          return user
        }).filter(Boolean) as User[]
      )

      // Show success message
      const actionMessages = {
        ban: 'User banned successfully',
        unban: 'User unbanned successfully',
        activate: 'User activated successfully',
        deactivate: 'User deactivated successfully',
        delete: 'User deleted successfully',
        update: 'User updated successfully',
        approveClaiming: 'User approved for token claiming',
        rejectClaiming: 'User rejected for token claiming',
        approveNFT: 'User approved for NFT claiming',
        rejectNFT: 'User rejected for NFT claiming'
      }

      alert(actionMessages[action as keyof typeof actionMessages] || 'Action completed')
      
      // Close modals
      setEditingUser(null)
      setViewingUser(null)
      setShowUserModal(false)
      setShowApprovalModal(false)
      setApprovalUser(null)
      
    } catch (error) {
      console.error(`User ${action} error:`, error)
      alert(`Failed to ${action} user`)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return

    try {
      console.log(`Bulk action: ${action} for users:`, Array.from(selectedUsers))
      
      // Mock bulk action - replace with actual API
      const userIds = Array.from(selectedUsers)
      
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (userIds.includes(user.id)) {
            switch (action) {
              case 'activate':
                return { ...user, isActive: true }
              case 'deactivate':
                return { ...user, isActive: false }
              case 'ban':
                return { ...user, isBanned: true, isActive: false }
              case 'unban':
                return { ...user, isBanned: false, isActive: true }
              case 'enableClaims':
                return { ...user, claimsEnabled: true }
              case 'disableClaims':
                return { ...user, claimsEnabled: false }
              case 'approveClaiming':
                return { ...user, isApprovedForClaiming: true }
              case 'rejectClaiming':
                return { ...user, isApprovedForClaiming: false }
              case 'approveNFT':
                return { ...user, isApprovedForNFT: true }
              case 'rejectNFT':
                return { ...user, isApprovedForNFT: false }
              default:
                return user
            }
          }
          return user
        })
      )

      setSelectedUsers(new Set())
      setShowBulkActions(false)
      alert(`Bulk ${action} completed for ${userIds.length} users`)
      
    } catch (error) {
      console.error(`Bulk ${action} error:`, error)
      alert(`Bulk ${action} failed`)
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

  const handleApprovalAction = (user: User, type: 'claiming' | 'nft') => {
    setApprovalUser(user)
    setApprovalType(type)
    setShowApprovalModal(true)
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
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 mt-1">
            {pagination?.total?.toString() || '0'} total users • {filteredUsers.length} filtered
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
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
              Actions ({selectedUsers.size})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-bold text-white">
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
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-bold text-white">
                  {users.filter(u => u.isApprovedForClaiming).length}
                </p>
                <p className="text-gray-400 text-sm">Approved Claims</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-bold text-white">
                  {users.filter(u => u.isApprovedForNFT).length}
                </p>
                <p className="text-gray-400 text-sm">NFT Approved</p>
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
                <p className="text-xl lg:text-2xl font-bold text-white">
                  {users.filter(u => u.isBanned).length}
                </p>
                <p className="text-gray-400 text-sm">Banned Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by wallet, Twitter, or user ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 pt-4 border-t border-white/10"
              >
                <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue  />
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity</SelectItem>
                    <SelectItem value="HIGH">High Activity</SelectItem>
                    <SelectItem value="MEDIUM">Medium Activity</SelectItem>
                    <SelectItem value="LOW">Low Activity</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.approvalStatus} onValueChange={(value: any) => setFilters(prev => ({ ...prev, approvalStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Approvals</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                  <th className="p-4 text-gray-400 font-medium">Approvals</th>
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
                            {user.twitterFollowers.toLocaleString()} followers
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="text-white font-semibold">
                            {user.totalPoints.toLocaleString()}
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getApprovalBadgeColor(user.isApprovedForClaiming)}>
                              <Coins className="w-3 h-3 mr-1" />
                              {user.isApprovedForClaiming ? 'Approved' : 'Rejected'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getApprovalBadgeColor(user.isApprovedForNFT)}>
                              <Crown className="w-3 h-3 mr-1" />
                              {user.isApprovedForNFT ? 'Approved' : 'Rejected'}
                            </Badge>
                          </div>
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
                          
                          {/* Enhanced Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {/* Status Actions */}
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, user.isBanned ? 'unban' : 'ban')}
                              >
                                {user.isBanned ? (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Unban User
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Ban User
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              
                              {/* Approval Actions */}
                              <DropdownMenuItem
                                onClick={() => handleApprovalAction(user, 'claiming')}
                              >
                                <Coins className="mr-2 h-4 w-4" />
                                Token Claiming
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => handleApprovalAction(user, 'nft')}
                              >
                                <Crown className="mr-2 h-4 w-4" />
                                NFT Claiming
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              
                              {/* Additional Actions */}
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'toggleClaims')}
                              >
                                <Zap className="mr-2 h-4 w-4" />
                                Toggle Claims
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(user.walletAddress)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Wallet
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewingUser(user)
                                  setShowUserModal(true)
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              
                              {/* Dangerous Actions */}
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                    handleUserAction(user.id, 'delete')
                                  }
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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

      {/* Enhanced User Modal */}
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

      {/* Approval Modal */}
      <ApprovalModal
        user={approvalUser}
        type={approvalType}
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false)
          setApprovalUser(null)
        }}
        onApprove={(approve) => {
          if (approvalUser) {
            const action = approve 
              ? (approvalType === 'claiming' ? 'approveClaiming' : 'approveNFT')
              : (approvalType === 'claiming' ? 'rejectClaiming' : 'rejectNFT')
            handleUserAction(approvalUser.id, action)
          }
        }}
      />

      {/* Enhanced Bulk Actions Modal */}
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
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}

// Enhanced User Modal Component
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
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.totalPoints.toLocaleString()}</p>
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
                    <span className="text-white">{user.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Streak:</span>
                    <span className="text-white">{user.dailyStreak} days</span>
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
                        <span className="text-white">{user.twitterFollowers?.toLocaleString() || 'N/A'}</span>
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

          <TabsContent value="approvals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Token Claiming Approval
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Status:</span>
                    <Badge className={getApprovalBadgeColor(user.isApprovedForClaiming)}>
                      {user.isApprovedForClaiming ? 'Approved' : 'Rejected'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleQuickAction('approveClaiming')}
                      disabled={user.isApprovedForClaiming}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleQuickAction('rejectClaiming')}
                      disabled={!user.isApprovedForClaiming}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    NFT Claiming Approval
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Status:</span>
                    <Badge className={getApprovalBadgeColor(user.isApprovedForNFT)}>
                      {user.isApprovedForNFT ? 'Approved' : 'Rejected'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleQuickAction('approveNFT')}
                      disabled={user.isApprovedForNFT}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleQuickAction('rejectNFT')}
                      disabled={!user.isApprovedForNFT}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Risk Assessment</CardTitle>
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
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${user.engagementScore}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
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
                    <label className="text-white text-sm font-medium">Admin Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this user..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                    onClick={() => handleQuickAction('toggleClaims')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Toggle Claims
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigator.clipboard.writeText(user.walletAddress)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Wallet Address
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                        handleQuickAction('delete')
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
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

// Approval Modal Component
function ApprovalModal({
  user,
  type,
  isOpen,
  onClose,
  onApprove
}: {
  user: User | null
  type: 'claiming' | 'nft'
  isOpen: boolean
  onClose: () => void
  onApprove: (approve: boolean) => void
}) {
  if (!user) return null

  const currentStatus = type === 'claiming' ? user.isApprovedForClaiming : user.isApprovedForNFT
  const title = type === 'claiming' ? 'Token Claiming Approval' : 'NFT Claiming Approval'
  const description = type === 'claiming' 
    ? 'Approve or reject this user for token claiming privileges'
    : 'Approve or reject this user for NFT claiming privileges'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'claiming' ? <Coins className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.walletAddress.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">
                {user.walletAddress.slice(0, 12)}...{user.walletAddress.slice(-6)}
              </p>
              {user.twitterUsername && (
                <p className="text-gray-400 text-sm">@{user.twitterUsername}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Current Status</p>
              <Badge className={getApprovalBadgeColor(currentStatus)}>
                {currentStatus ? 'Approved' : 'Rejected'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Risk Score</p>
              <Badge className={getRiskBadgeColor(user.riskScore)}>
                {user.riskScore}%
              </Badge>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1" 
              onClick={() => onApprove(true)}
              disabled={currentStatus}
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => onApprove(false)}
              disabled={!currentStatus}
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Enhanced Bulk Actions Modal
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>
            Perform actions on {selectedCount} selected users
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Status Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => onAction('activate')}>
                <UserCheck className="w-4 h-4 mr-2" />
                Activate
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('deactivate')}>
                <UserX className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('unban')}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Unban
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onAction('ban')}>
                <Ban className="w-4 h-4 mr-2" />
                Ban
              </Button>
            </div>
          </div>

          {/* Approval Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Approval Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => onAction('approveClaiming')}>
                <Coins className="w-4 h-4 mr-2" />
                Approve Claims
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('rejectClaiming')}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Claims
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('approveNFT')}>
                <Crown className="w-4 h-4 mr-2" />
                Approve NFT
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('rejectNFT')}>
                <X className="w-4 h-4 mr-2" />
                Reject NFT
              </Button>
            </div>
          </div>

          {/* Utility Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Utility Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => onAction('enableClaims')}>
                <Zap className="w-4 h-4 mr-2" />
                Enable Claims
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('disableClaims')}>
                <XCircle className="w-4 h-4 mr-2" />
                Disable Claims
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('export')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('archive')}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Create User Modal (Enhanced)
function CreateUserModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    walletAddress: '',
    twitterUsername: '',
    isApprovedForClaiming: false,
    isApprovedForNFT: false,
    isActive: true,
    isPremium: false,
    twitterActivity: 'LOW' as const,
    tokenAllocation: 3000,
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mock API call - replace with actual implementation
    console.log('Creating user:', formData)
    
    // Simulate success
    setTimeout(() => {
      alert('User created successfully!')
      onSuccess()
      onClose()
      setFormData({
        walletAddress: '',
        twitterUsername: '',
        isApprovedForClaiming: false,
        isApprovedForNFT: false,
        isActive: true,
        isPremium: false,
        twitterActivity: 'LOW',
        tokenAllocation: 3000,
        notes: ''
      })
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system with custom settings
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium">Wallet Address *</label>
              <Input
                required
                value={formData.walletAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="Enter Solana wallet address"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium">Twitter Username</label>
              <Input
                value={formData.twitterUsername}
                onChange={(e) => setFormData(prev => ({ ...prev, twitterUsername: e.target.value }))}
                placeholder="@username (optional)"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium">Activity Level</label>
              <Select 
                value={formData.twitterActivity} 
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
                value={formData.tokenAllocation}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenAllocation: parseInt(e.target.value) }))}
                className="mt-1"
                min="1000"
                max="10000"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-medium">Permissions</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.isApprovedForClaiming}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isApprovedForClaiming: checked as boolean }))}
                />
                <span className="text-white text-sm">Approve for Token Claiming</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.isApprovedForNFT}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isApprovedForNFT: checked as boolean }))}
                />
                <span className="text-white text-sm">Approve for NFT Claiming</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                />
                <span className="text-white text-sm">Active Account</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.isPremium}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked as boolean }))}
                />
                <span className="text-white text-sm">Premium Account</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium">Admin Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this user..."
              className="mt-1"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UserManagementSection