'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  MoreVertical,
  Eye,
  Shield,  
  Gift,
  Calendar,
  ExternalLink,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  walletAddress: string
  username: string
  totalPoints: number
  createdAt: string
  approval?: {
    approved: boolean
    claimed: boolean
    approvedAt?: string
    claimedAt?: string
    approvedBy?: string
  }
}

interface ApprovalStats {
  total: number
  approved: number
  pending: number
  claimed: number
}

export default function AdminNFTApprovalManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [stats, setStats] = useState<ApprovalStats>({ total: 0, approved: 0, pending: 0, claimed: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'claimed'>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showUserModal, setShowUserModal] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/nft-claims/users')
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setStats(data.stats)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterStatus) {
          case 'approved':
            return user.approval?.approved && !user.approval?.claimed
          case 'pending':
            return !user.approval?.approved
          case 'claimed':
            return user.approval?.claimed
          default:
            return true
        }
      })
    }

    setFilteredUsers(filtered)
  }

  const handleApproveUser = async (userId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/admin/nft-claims/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved })
      })

      if (response.ok) {
        toast.success(`User ${approved ? 'approved' : 'rejected'} successfully`)
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update approval')
      }
    } catch (error) {
      console.error('Error updating approval:', error)
      toast.error('Failed to update approval')
    }
  }

  const handleBulkApprove = async (approved: boolean) => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected')
      return
    }

    try {
      setBulkActionLoading(true)
      const userIds = Array.from(selectedUsers)
      
      const response = await fetch('/api/admin/nft-claims/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, approved })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        setSelectedUsers(new Set())
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to bulk update')
      }
    } catch (error) {
      console.error('Error in bulk approve:', error)
      toast.error('Failed to bulk update')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
    }
  }

  const getStatusBadge = (user: User) => {
    if (user.approval?.claimed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
          <Gift className="w-3 h-3" />
          Claimed
        </span>
      )
    } else if (user.approval?.approved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      )
    }
  }

  const exportData = () => {
    const csv = [
      ['Username', 'Wallet Address', 'Points', 'Status', 'Approved Date', 'Claimed Date'].join(','),
      ...filteredUsers.map(user => [
        user.username,
        user.walletAddress,
        user.totalPoints,
        user.approval?.claimed ? 'Claimed' : user.approval?.approved ? 'Approved' : 'Pending',
        user.approval?.approvedAt ? new Date(user.approval.approvedAt).toLocaleDateString() : '',
        user.approval?.claimedAt ? new Date(user.approval.claimedAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nft-approvals-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400" />
            NFT Approval Management
          </h2>
          <p className="text-gray-400 mt-1">
            Manage user approvals for NFT claiming
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Claimed</p>
              <p className="text-2xl font-bold text-purple-400">{stats.claimed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or wallet address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="claimed">Claimed</option>
          </select>
          
          {selectedUsers.size > 0 && (
            <>
              <button
                onClick={() => handleBulkApprove(true)}
                disabled={bulkActionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Approve ({selectedUsers.size})
              </button>
              <button
                onClick={() => handleBulkApprove(false)}
                disabled={bulkActionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject ({selectedUsers.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Points</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-gray-400 text-sm font-mono">
                        {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-medium">
                      {user.totalPoints.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!user.approval?.claimed && (
                        <>
                          {!user.approval?.approved ? (
                            <button
                              onClick={() => handleApproveUser(user.id, true)}
                              className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-all"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveUser(user.id, false)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                              title="Revoke"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => setShowUserModal(user)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`https://solscan.io/account/${user.walletAddress}`, '_blank')}
                        className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg transition-all"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowUserModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">User Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Username</label>
                  <p className="text-white font-medium">{showUserModal.username}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Wallet Address</label>
                  <p className="text-white font-mono text-sm break-all">{showUserModal.walletAddress}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Total Points</label>
                  <p className="text-blue-400 font-medium">{showUserModal.totalPoints.toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(showUserModal)}
                  </div>
                </div>
                
                {showUserModal.approval?.approvedAt && (
                  <div>
                    <label className="text-gray-400 text-sm">Approved Date</label>
                    <p className="text-white">
                      {new Date(showUserModal.approval.approvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {showUserModal.approval?.claimedAt && (
                  <div>
                    <label className="text-gray-400 text-sm">Claimed Date</label>
                    <p className="text-white">
                      {new Date(showUserModal.approval.claimedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-gray-400 text-sm">Joined</label>
                  <p className="text-white">
                    {new Date(showUserModal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUserModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open(`https://solscan.io/account/${showUserModal.walletAddress}`, '_blank')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Explorer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}