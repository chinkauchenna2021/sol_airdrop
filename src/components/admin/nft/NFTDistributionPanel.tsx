// /components/admin/nft/NFTDistributionPanel.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, Users, AlertTriangle, CheckCircle, 
  Search, Filter, UserCheck, UserX
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  username?: string
  walletAddress: string
  totalPoints: number
  twitterActivity?: string
  isActive: boolean
}

interface NFTDistributionPanelProps {
  collections: any[]
  users: User[]
  onDistribute: (mintAddress: string, userWallets: string[]) => Promise<void>
  loading: boolean
  distributionEnabled: boolean
}

export function NFTDistributionPanel({ 
  collections, 
  users, 
  onDistribute, 
  loading,
  distributionEnabled 
}: NFTDistributionPanelProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedCollection, setSelectedCollection] = useState<string>('')

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterActive === 'all' ? true :
                         filterActive === 'active' ? user.isActive :
                         !user.isActive

    return matchesSearch && matchesFilter
  })

  const handleUserSelection = (userId: string, walletAddress: string) => {
    if (selectedUsers.includes(walletAddress)) {
      setSelectedUsers(prev => prev.filter(addr => addr !== walletAddress))
    } else {
      setSelectedUsers(prev => [...prev, walletAddress])
    }
  }

  const handleSelectAll = () => {
    const allWallets = filteredUsers.map(user => user.walletAddress)
    setSelectedUsers(allWallets)
  }

  const handleClearSelection = () => {
    setSelectedUsers([])
  }

  const handleDistribution = async () => {
    if (!selectedCollection) {
      toast.error('Please select an NFT collection')
      return
    }
    
    if (selectedUsers.length === 0) {
      toast.error('Please select users to distribute to')
      return
    }

    await onDistribute(selectedCollection, selectedUsers)
    setSelectedUsers([])
  }

  return (
    <div className="space-y-6">
      {/* Collection Selection */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Send className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Select Collection</h2>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-gray-400">No NFT collections available for distribution</p>
            <p className="text-sm text-gray-500 mt-1">Create an NFT collection first</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collections.map((collection) => (
              <div 
                key={collection.mintAddress} 
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedCollection === collection.mintAddress
                    ? 'border-purple-500 bg-purple-600/10'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
                onClick={() => setSelectedCollection(collection.mintAddress)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{collection.name}</h3>
                    <p className="text-sm text-gray-400">
                      {collection.symbol} • Supply: {collection.supply.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {collection.mintAddress.slice(0, 16)}...{collection.mintAddress.slice(-16)}
                    </p>
                  </div>
                  
                  {selectedCollection === collection.mintAddress && (
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Selection */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Select Recipients</h2>
            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-sm">
              {selectedUsers.length} Selected
            </span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
             title="select-section"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Select All
            </button>
            
            <button
              onClick={handleClearSelection}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredUsers.map((user) => {
            const isSelected = selectedUsers.includes(user.walletAddress)
            
            return (
              <div 
                key={user.id} 
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-600/10 border border-blue-500/30' 
                    : 'bg-gray-700/30 hover:bg-gray-700/50'
                }`}
                onClick={() => handleUserSelection(user.id, user.walletAddress)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by parent click
                  className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{user.username || 'Anonymous'}</p>
                    {user.isActive ? (
                      <UserCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <UserX className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
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
                
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                )}
              </div>
            )
          })}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">No users found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Distribution Button */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleDistribution}
            disabled={!distributionEnabled || selectedUsers.length === 0 || !selectedCollection || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Distributing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Distribute to {selectedUsers.length} Users
              </>
            )}
          </button>
        </div>

        {/* Status Messages */}
        {!distributionEnabled && (
          <div className="mt-4 p-3 bg-red-600/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm font-medium">
                Distribution is currently disabled by admin settings
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
