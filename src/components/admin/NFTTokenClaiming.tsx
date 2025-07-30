// /components/admin/NFTTokenClaiming.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Gift, AlertTriangle, CheckCircle, Users, 
  Lock, Unlock, RefreshCw, Settings, Eye, EyeOff
} from 'lucide-react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { ClaimStatusCard } from './nft/ClaimStatusCard'
import { NFTPassVerification } from './nft/NFTPassVerification'
import { useSolana } from '@/hooks/useSolana'
import { useUserStore } from '@/store/useUserStore'

interface NFTTokenClaimingProps {
  isAdminView?: boolean
  onAdminUpdate?: (controls: Partial<AdminControls>) => void
}

interface AdminControls {
  claimingEnabled: boolean
  nftPassRequired: boolean
  requireApproval: boolean
  approvedUsers: string[]
  seasonStatus: 'ACTIVE' | 'CLAIMING' | 'ENDED'
  feeAmount: number
}

interface ClaimStatus {
  isEnabled: boolean
  userApproved: boolean
  seasonActive: boolean
  userTier: 'HIGH' | 'MEDIUM' | 'LOW' | null
  allocation: number
  claimingFee: number
  alreadyClaimed: boolean
  requirements: {
    nftPassRequired: boolean
    twitterConnected: boolean
    walletConnected: boolean
    minimumEngagement: boolean
    adminApproval: boolean
  }
  currentSeason: {
    id: string
    name: string
    status: string
    totalAllocation: number
    claimedPercentage: number
    endDate: string
  } | null
}

export default function NFTTokenClaiming({ 
  isAdminView = false, 
  onAdminUpdate 
}: NFTTokenClaimingProps) {
  const { connected, publicKey } = useWallet()
  const { balance } = useSolana()
  const { user } = useUserStore()
  
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)
  const [adminControls, setAdminControls] = useState<AdminControls | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  
  const [approvalMode, setApprovalMode] = useState<'individual' | 'bulk'>('individual')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])

  useEffect(() => {
    if (connected) {
      fetchClaimStatus()
      if (isAdminView) {
        fetchAdminControls()
        fetchUsers()
      }
    }
  }, [connected, isAdminView])

  const fetchClaimStatus = async () => {
    try {
      const res = await fetch('/api/nft-claims/status')
      if (res.ok) {
        const data = await res.json()
        setClaimStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch claim status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminControls = async () => {
    try {
      const res = await fetch('/api/admin/nft-claims/controls')
      if (res.ok) {
        const data = await res.json()
        setAdminControls(data)
      }
    } catch (error) {
      console.error('Failed to fetch admin controls:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setFilteredUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleAdminToggle = async (key: keyof AdminControls, value: any) => {
    if (!adminControls) return

    try {
      const response = await fetch('/api/admin/nft-claims/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (response.ok) {
        const updatedControls = { ...adminControls, [key]: value }
        setAdminControls(updatedControls)
        onAdminUpdate?.(updatedControls)
        toast.success('Settings updated successfully')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const handleUserApproval = async (userId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/admin/nft-claims/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved })
      })

      if (response.ok) {
        toast.success(`User ${approved ? 'approved' : 'rejected'} successfully`)
        await fetchUsers()
      }
    } catch (error) {
      toast.error('Failed to update user approval')
    }
  }

  const handleBulkApproval = async (userIds: string[], approved: boolean) => {
    try {
      const response = await fetch('/api/admin/nft-claims/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, approved })
      })

      if (response.ok) {
        toast.success(`${userIds.length} users ${approved ? 'approved' : 'rejected'} successfully`)
        setSelectedUsers([])
        await fetchUsers()
      }
    } catch (error) {
      toast.error('Failed to bulk update approvals')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading claim status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-purple-400" />
            NFT Token Claiming
            {isAdminView && (
              <span className="text-sm bg-red-600/20 text-red-400 px-2 py-1 rounded-full">
                Admin Panel
              </span>
            )}
          </h1>
          <p className="text-gray-400 mt-1">
            {isAdminView 
              ? 'Manage NFT token claiming system and user approvals'
              : 'Claim your NFT tokens with valid pass verification'
            }
          </p>
        </div>
        
        {isAdminView && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showAdminPanel 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showAdminPanel ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {showAdminPanel ? 'Hide Controls' : 'Show Controls'}
            </button>
            <button
              onClick={() => {
                fetchClaimStatus()
                fetchAdminControls()
                fetchUsers()
              }}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Admin Controls Panel */}
      {isAdminView && showAdminPanel && adminControls && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Admin Controls</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* System Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">System Controls</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Claiming Enabled</span>
                  <input
                    type="checkbox"
                    checked={adminControls.claimingEnabled}
                    onChange={(e) => handleAdminToggle('claimingEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">NFT Pass Required</span>
                  <input
                    type="checkbox"
                    checked={adminControls.nftPassRequired}
                    onChange={(e) => handleAdminToggle('nftPassRequired', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Require Approval</span>
                  <input
                    type="checkbox"
                    checked={adminControls.requireApproval}
                    onChange={(e) => handleAdminToggle('requireApproval', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Season Management */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Season Status</h3>
              <div className="space-y-2">
                <select
                  title="season-management"
                  value={adminControls.seasonStatus}
                  onChange={(e) => handleAdminToggle('seasonStatus', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="CLAIMING">Claiming</option>
                  <option value="ENDED">Ended</option>
                </select>
                
                <div className="mt-2">
                  <label className="text-xs text-gray-400">Fee Amount ($)</label>
                  <input
                    type="number"
                    value={adminControls.feeAmount}
                    onChange={(e) => handleAdminToggle('feeAmount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* User Management */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">User Management</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setApprovalMode('bulk')}
                    className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                      approvalMode === 'bulk'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Bulk
                  </button>
                </div>
                
                {approvalMode === 'bulk' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleBulkApproval(selectedUsers, true)}
                      disabled={selectedUsers.length === 0}
                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      Approve ({selectedUsers.length})
                    </button>
                    <button
                      onClick={() => handleBulkApproval(selectedUsers, false)}
                      disabled={selectedUsers.length === 0}
                      className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      Reject ({selectedUsers.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Approved Users</span>
                  <span className="text-green-400">{adminControls.approvedUsers.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Total Users</span>
                  <span className="text-blue-400">{filteredUsers.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Approval Rate</span>
                  <span className="text-yellow-400">
                    {filteredUsers.length > 0 
                      ? Math.round((adminControls.approvedUsers.length / filteredUsers.length) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Approval Management (Admin Only) */}
      {isAdminView && showAdminPanel && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">User Approval Management</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              />
              {approvalMode === 'bulk' && (
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-2">
              {filteredUsers
                .filter(user => 
                  user.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  user.walletAddress?.toLowerCase().includes(userSearchQuery.toLowerCase())
                )
                .map((user) => {
                  const isApproved = adminControls?.approvedUsers.includes(user.id)
                  const isSelected = selectedUsers.includes(user.id)
                  
                  return (
                    <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg">
                      {approvalMode === 'bulk' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user.id])
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{user.username || 'Anonymous'}</p>
                          {isApproved && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                        <p className="text-sm text-gray-400">
                          {user.walletAddress?.slice(0, 8)}...{user.walletAddress?.slice(-8)}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500">
                            Points: {user.totalPoints || 0}
                          </span>
                          <span className="text-xs text-gray-500">
                            Activity: {user.twitterActivity || 'None'}
                          </span>
                        </div>
                      </div>

                      {approvalMode === 'individual' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUserApproval(user.id, true)}
                            disabled={isApproved}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                          >
                            {isApproved ? 'Approved' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleUserApproval(user.id, false)}
                            disabled={!isApproved}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Main Claiming Interface (User View) */}
      {!isAdminView && (
        <>
          {/* Season Status */}
          {claimStatus?.currentSeason && (
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Gift className="w-6 h-6 text-purple-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{claimStatus.currentSeason.name}</h2>
                    <p className="text-purple-300">Season Status: {claimStatus.currentSeason.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">
                    {claimStatus.currentSeason.claimedPercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">Claimed</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${claimStatus.currentSeason.claimedPercentage}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-400">
                <span>Total Allocation: {claimStatus.currentSeason.totalAllocation.toLocaleString()} tokens</span>
                <span>Ends: {new Date(claimStatus.currentSeason.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* NFT Pass Verification */}
          <NFTPassVerification
            walletAddress={publicKey?.toBase58()}
            onStatusChange={(status) => {
              // Handle NFT pass status change
            }}
          />

          {/* Claim Status */}
          {claimStatus && (
            <ClaimStatusCard claimStatus={claimStatus} />
          )}

          {/* Claiming Interface */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">Claim Your Tokens</h2>
            </div>

            {claimStatus?.alreadyClaimed ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Already Claimed!</h3>
                <p className="text-gray-400">You have successfully claimed your NFT tokens for this season.</p>
              </div>
            ) : !claimStatus?.isEnabled ? (
              <div className="text-center py-8">
                <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Claiming Disabled</h3>
                <p className="text-gray-400">NFT token claiming is currently disabled by administrators.</p>
              </div>
            ) : !connected ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400">Please connect your Solana wallet to claim your NFT tokens.</p>
              </div>
            ) : !Object.values(claimStatus?.requirements || {}).every(Boolean) ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Requirements Not Met</h3>
                <p className="text-gray-400">Please fulfill all requirements above to claim your tokens.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Claim Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Token Allocation:</span>
                      <span className="text-white font-bold">
                        {claimStatus?.allocation.toLocaleString()} TOKENS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Fee:</span>
                      <span className="text-white">${claimStatus?.claimingFee} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Your SOL Balance:</span>
                      <span className="text-white">{balance.toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={claiming}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-bold text-lg transition-all"
                >
                  {claiming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      Claim NFT Tokens
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
    