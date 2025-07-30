// /app/admin/nft-minting/page.tsx
'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminNFTMinting from '@/components/admin/AdminNFTMinting'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle } from 'lucide-react'
import { useWalletStore } from '@/store/useWalletStore'
import toast from 'react-hot-toast'

export default function AdminNFTMintingPage() {
  const { connected } = useWalletStore()
  const [adminSettings, setAdminSettings] = useState<Record<string, any>>({})

  const handleSettingsChange = async (key: string, value: any) => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (response.ok) {
        setAdminSettings(prev => ({ ...prev, [key]: value }))
        toast.success('Settings updated successfully')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    }
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
              NFT Collection Management
            </h1>
            <p className="text-gray-400 mt-2">
              Create, mint, and distribute NFT collections for your platform
            </p>
          </div>
          
          {!connected && (
            <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 text-sm font-medium">
                  Wallet Required
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-600/10 border border-red-500/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Security Notice</h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                NFT minting operations require admin wallet signatures and SOL for transaction fees. 
                Ensure your admin wallet is properly secured and has sufficient balance before creating collections.
                All minting activities are logged for audit purposes.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main NFT Minting Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AdminNFTMinting onSettingsChange={handleSettingsChange} />
        </motion.div>
      </div>
    // </AdminLayout>
  )
}


