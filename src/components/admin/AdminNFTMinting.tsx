// /components/admin/AdminNFTMinting.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, Plus, Send, AlertTriangle, CheckCircle, 
  Settings, RefreshCw, Loader
} from 'lucide-react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useSolana } from '@/hooks/useSolana'
import { NFTCreationForm } from './nft/NFTCreationForm'
import { NFTCollectionsList } from './nft/NFTCollectionsList'
import { NFTDistributionPanel } from './nft/NFTDistributionPanel'

interface AdminNFTMintingProps {
  onSettingsChange?: (key: string, value: any) => void
}

interface AdminSettings {
  mintingEnabled: boolean
  distributionEnabled: boolean
  defaultSupply: number
  mintingFee: number
}

interface MintedNFT {
  mintAddress: string
  name: string
  symbol: string
  supply: number
  createdAt: string
  distributionResults?: any[]
}

interface User {
  id: string
  username?: string
  walletAddress: string
  totalPoints: number
  twitterActivity?: string
  isActive: boolean
}

export default function AdminNFTMinting({ onSettingsChange }: AdminNFTMintingProps) {
  const { connected, publicKey, signTransaction } = useWallet()
  const { balance } = useSolana()
  
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    mintingEnabled: true,
    distributionEnabled: true,
    defaultSupply: 100000000,
    mintingFee: 0.01
  })
  
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'distribute'>('create')
  const [loading, setLoading] = useState(false)

  const [operationProgress, setOperationProgress] = useState({
    stage: '',
    current: 0,
    total: 0,
    details: ''
  })

  useEffect(() => {
    fetchAdminSettings()
    fetchMintedNFTs()
    fetchUsers()
  }, [])

  const fetchAdminSettings = async () => {
    try {
      const response = await fetch('/api/admin/nft-settings')
      if (response.ok) {
        const settings = await response.json()
        setAdminSettings(settings)
      }
    } catch (error) {
      console.error('Failed to fetch admin settings:', error)
    }
  }

  const fetchMintedNFTs = async () => {
    try {
      const response = await fetch('/api/admin/nfts')
      if (response.ok) {
        const data = await response.json()
        setMintedNFTs(data.nfts || [])
      }
    } catch (error) {
      console.error('Failed to fetch minted NFTs:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleNFTCreation = async (metadata: any) => {
    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet first')
      return
    }

    if (balance < adminSettings.mintingFee) {
      toast.error(`Insufficient SOL balance. Need at least ${adminSettings.mintingFee} SOL`)
      return
    }

    setLoading(true)
    setOperationProgress({
      stage: 'Creating NFT Collection',
      current: 1,
      total: 4,
      details: 'Preparing transaction...'
    })

    try {
      setOperationProgress(prev => ({ 
        ...prev, 
        current: 2, 
        details: 'Creating mint...' 
      }))

      const response = await fetch('/api/admin/create-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata,
          initialSupply: adminSettings.defaultSupply,
          adminWallet: publicKey.toBase58()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create NFT')
      }

      const result = await response.json()

      setOperationProgress(prev => ({ 
        ...prev, 
        current: 3, 
        details: 'Finalizing...' 
      }))

      const newNFT: MintedNFT = {
        mintAddress: result.mintAddress,
        name: metadata.name,
        symbol: metadata.symbol,
        supply: adminSettings.defaultSupply,
        createdAt: new Date().toISOString()
      }

      setMintedNFTs(prev => [newNFT, ...prev])

      setOperationProgress(prev => ({ 
        ...prev, 
        current: 4, 
        details: 'Complete!' 
      }))

      toast.success(`NFT collection created successfully!`)

    } catch (error: any) {
      console.error('NFT creation error:', error)
      toast.error(error.message || 'Failed to create NFT collection')
    } finally {
      setLoading(false)
      setOperationProgress({ stage: '', current: 0, total: 0, details: '' })
    }
  }

  const handleNFTDistribution = async (mintAddress: string, userWallets: string[]) => {
    if (!adminSettings.distributionEnabled) {
      toast.error('Distribution is currently disabled')
      return
    }

    setLoading(true)
    setOperationProgress({
      stage: 'Distributing NFTs',
      current: 0,
      total: userWallets.length,
      details: 'Starting distribution...'
    })

    try {
      const response = await fetch('/api/admin/distribute-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress,
          userWallets,
          nftsPerUser: 1
        })
      })

      if (!response.ok) {
        throw new Error('Failed to distribute NFTs')
      }

      const result = await response.json()
      
      setMintedNFTs(prev => 
        prev.map(nft => 
          nft.mintAddress === mintAddress 
            ? { ...nft, distributionResults: result.distributionResults }
            : nft
        )
      )

      const successful = result.distributionResults.filter((r: any) => r.success).length
      toast.success(`Successfully distributed NFTs to ${successful}/${userWallets.length} users`)

    } catch (error: any) {
      console.error('Distribution error:', error)
      toast.error(error.message || 'Failed to distribute NFTs')
    } finally {
      setLoading(false)
      setOperationProgress({ stage: '', current: 0, total: 0, details: '' })
    }
  }

  const handleSettingsUpdate = async (key: string, value: any) => {
    try {
      const response = await fetch('/api/admin/nft-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (response.ok) {
        setAdminSettings(prev => ({ ...prev, [key]: value }))
        toast.success('Settings updated successfully')
        onSettingsChange?.(key, value)
      }
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Admin Controls</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">NFT Minting</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={adminSettings.mintingEnabled}
                onChange={(e) => handleSettingsUpdate('mintingEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-300">
                {adminSettings.mintingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Distribution</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={adminSettings.distributionEnabled}
                onChange={(e) => handleSettingsUpdate('distributionEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-300">
                {adminSettings.distributionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Initial Supply</label>
            <input
              type="number"
              value={adminSettings.defaultSupply}
              onChange={(e) => handleSettingsUpdate('defaultSupply', parseInt(e.target.value) || 0)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Minting Fee (SOL)</label>
            <input
              type="number"
              value={adminSettings.mintingFee}
              onChange={(e) => handleSettingsUpdate('mintingFee', parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              step="0.001"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 p-2 rounded-xl">
        {[
          { id: 'create' as const, label: 'Create NFT', icon: Plus },
          { id: 'manage' as const, label: 'Manage Collections', icon: Coins },
          { id: 'distribute' as const, label: 'Distribute', icon: Send }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Progress Indicator */}
      <AnimatePresence>
        {loading && operationProgress.stage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <Loader className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-blue-400 font-medium">{operationProgress.stage}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(operationProgress.current / operationProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-300">{operationProgress.details}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <NFTCreationForm
              onNFTCreated={(nft) => setMintedNFTs(prev => [nft, ...prev])}
              initialSupply={adminSettings.defaultSupply}
              mintingEnabled={adminSettings.mintingEnabled}
              loading={loading}
              onSubmit={handleNFTCreation}
            />
          </motion.div>
        )}

        {activeTab === 'manage' && (
          <motion.div
            key="manage"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <NFTCollectionsList
              collections={mintedNFTs}
              loading={false}
              onRefresh={fetchMintedNFTs}
            />
          </motion.div>
        )}

        {activeTab === 'distribute' && (
          <motion.div
            key="distribute"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <NFTDistributionPanel
              collections={mintedNFTs}
              users={users}
              onDistribute={handleNFTDistribution}
              loading={loading}
              distributionEnabled={adminSettings.distributionEnabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Messages */}
      {!connected && (
        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-400 font-medium">Wallet Not Connected</p>
              <p className="text-yellow-300/80 text-sm">Please connect your admin wallet to create and manage NFTs</p>
            </div>
          </div>
        </div>
      )}

      {!adminSettings.mintingEnabled && (
        <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">NFT Minting Disabled</p>
              <p className="text-red-300/80 text-sm">NFT minting is currently disabled by admin settings</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}