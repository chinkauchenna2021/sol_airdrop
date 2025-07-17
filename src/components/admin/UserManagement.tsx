'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, Filter, Download, Upload, Edit, 
  Trash2, Ban, CheckCircle, AlertTriangle, Eye,
  UserCheck, UserX, Shield, Activity, MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface User {
  id: string
  walletAddress: string
  twitterUsername?: string
  twitterImage?: string
  totalPoints: number
  level: number
  rank: number
  twitterActivity?: 'HIGH' | 'MEDIUM' | 'LOW'
  tokenAllocation: number
  isActive: boolean
  isAdmin: boolean
  createdAt: Date
  lastActivity?: Date
  suspiciousFlags: string[]
  riskScore: number
}

interface UserFilters {
  search: string
  activityLevel?: string
  status?: string
  riskLevel?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [filters, pagination.page])

  useEffect(() => {
    filterUsers()
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.activityLevel && { activity: filters.activityLevel }),
        ...(filters.status && { status: filters.status }),
        ...(filters.riskLevel && { risk: filters.riskLevel })
      })

      const res = await fetch(`/api/admin/users?${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = useCallback(() => {
    let filtered = [...users]

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.walletAddress.toLowerCase().includes(search) ||
        user.twitterUsername?.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search)
      )
    }

    setFilteredUsers(filtered)
  }, [users, filters])

  const handleBulkAction = async (action: string) => {
    const userIds = Array.from(selectedUsers)
    
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userIds })
      })

      if (res.ok) {
        await fetchUsers()
        setSelectedUsers(new Set())
        setShowBulkActions(false)
      }
    } catch (error) {
      console.error('Bulk action error:', error)
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getActivityBadgeColor = (activity?: string) => {
    switch (activity) {
      case 'HIGH': return 'bg-green-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">
            {pagination.total.toLocaleString()} total users
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          {selectedUsers.size > 0 && (
            <Button 
              variant="solana" 
              size="sm"
              onClick={() => setShowBulkActions(true)}
            >
              Bulk Actions ({selectedUsers.size})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <select
             title='selector'
              value={filters.activityLevel || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, activityLevel: e.target.value || undefined }))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
            >
              <option value="">All Activity Levels</option>
              <option value="HIGH">High Activity</option>
              <option value="MEDIUM">Medium Activity</option>
              <option value="LOW">Low Activity</option>
            </select>

            <select
              title='selector'
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
            title='selector'
              value={filters.riskLevel || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value || undefined }))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk (0-40)</option>
              <option value="medium">Medium Risk (41-70)</option>
              <option value="high">High Risk (71-100)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
                        } else {
                          setSelectedUsers(new Set())
                        }
                      }}
                      className="rounded border-white/20"
                    />
                  </th>
                  <th className="p-4 text-left text-gray-400 font-medium">User</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Activity</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Points & Level</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Token Allocation</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Risk Score</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Status</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers)
                            if (e.target.checked) {
                              newSelected.add(user.id)
                            } else {
                              newSelected.delete(user.id)
                            }
                            setSelectedUsers(newSelected)
                          }}
                          className="rounded border-white/20"
                        />
                      </td>
                      
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.twitterImage ? (
                            <img
                              src={user.twitterImage}
                              alt={user.twitterUsername}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {user.twitterUsername || `${user.walletAddress.slice(0, 6)}...`}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-4)}
                            </p>
                          </div>
                          {user.isAdmin && (
                            <Shield className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getActivityBadgeColor(user.twitterActivity)}`} />
                          <span className="text-gray-300 text-sm">
                            {user.twitterActivity || 'None'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Rank #{user.rank}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="text-white font-medium">
                          {user.totalPoints.toLocaleString()} pts
                        </p>
                        <p className="text-gray-400 text-xs">
                          Level {user.level}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="text-green-400 font-medium">
                          {user.tokenAllocation.toLocaleString()} tokens
                        </p>
                      </td>

                      <td className="p-4">
                        <span className={`font-medium ${getRiskScoreColor(user.riskScore)}`}>
                          {user.riskScore}/100
                        </span>
                        {user.suspiciousFlags.length > 0 && (
                          <AlertTriangle className="w-4 h-4 text-yellow-400 ml-2" />
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {user.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <UserX className="w-4 h-4 text-red-400" />
                          )}
                          <span className={`text-sm ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
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
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={page === pagination.page ? "solana" : "outline"}
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page }))}
            >
              {page}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">
              Selected {selectedUsers.size} users
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('activate')}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Activate
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('deactivate')}
              >
                <UserX className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('export')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleBulkAction('ban')}
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
