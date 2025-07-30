'use client'

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, ToggleLeft, ToggleRight, 
  DollarSign, Hash, Shield, AlertTriangle 
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminSettings {
  mintingEnabled: boolean
  distributionEnabled: boolean
  claimingEnabled: boolean
  nftPassRequired: boolean
  requireApproval: boolean
  defaultSupply: number
  mintingFee: number
  claimingFee: number
  seasonStatus: 'ACTIVE' | 'CLAIMING' | 'ENDED'
}

interface AdminControlPanelProps {
  settings: AdminSettings
  onSettingsChange: (key: string, value: any) => Promise<void>
  className?: string
}

export function AdminControlPanel({ 
  settings, 
  onSettingsChange, 
  className = '' 
}: AdminControlPanelProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  const handleSettingChange = async (key: string, value: any) => {
    setUpdating(key)
    try {
      await onSettingsChange(key, value)
    } catch (error) {
      toast.error(`Failed to update ${key}`)
    } finally {
      setUpdating(null)
    }
  }

  const settingGroups = [
    {
      title: 'System Controls',
      icon: Shield,
      settings: [
        {
          key: 'mintingEnabled',
          label: 'NFT Minting',
          type: 'boolean' as const,
          value: settings.mintingEnabled,
          description: 'Enable/disable NFT collection creation'
        },
        {
          key: 'distributionEnabled',
          label: 'NFT Distribution',
          type: 'boolean' as const,
          value: settings.distributionEnabled,
          description: 'Enable/disable NFT distribution to users'
        },
        {
          key: 'claimingEnabled',
          label: 'Token Claiming',
          type: 'boolean' as const,
          value: settings.claimingEnabled,
          description: 'Enable/disable NFT token claiming'
        },
        {
          key: 'nftPassRequired',
          label: 'NFT Pass Required',
          type: 'boolean' as const,
          value: settings.nftPassRequired,
          description: 'Require NFT pass for token claiming'
        },
        {
          key: 'requireApproval',
          label: 'Admin Approval',
          type: 'boolean' as const,
          value: settings.requireApproval,
          description: 'Require admin approval for claims'
        }
      ] 
    },
    {
      title: 'Configuration',
      icon: Settings,
      settings: [
        {
          key: 'defaultSupply',
          label: 'Default Supply',
          type: 'number' as const,
          value: settings.defaultSupply,
          description: 'Default initial supply for new collections',
          min: 1,
          max: 1000000
        },
        {
          key: 'mintingFee',
          label: 'Minting Fee (SOL)',
          type: 'number' as const,
          value: settings.mintingFee,
          description: 'Fee in SOL for minting collections',
          min: 0,
          step: 0.001
        },
        {
          key: 'claimingFee',
          label: 'Claiming Fee (USD)',
          type: 'number' as const,
          value: settings.claimingFee,
          description: 'Fee in USD for claiming tokens',
          min: 0,
          step: 0.1
        }
      ]
    },
    {
      title: 'Season Management',
      icon: DollarSign,
      settings: [
        {
          key: 'seasonStatus',
          label: 'Season Status',
          type: 'select' as const,
          value: settings.seasonStatus,
          description: 'Current airdrop season status',
          options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'CLAIMING', label: 'Claiming' },
            { value: 'ENDED', label: 'Ended' }
          ]
        }
      ] 
    }
  ]


  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">System Administration</h2>
      </div>

     <div className="space-y-8">
        {settingGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
              <group.icon className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">{group.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.settings.map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      {setting.label}
                    </label>
                    {updating === setting.key && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {setting.type === 'boolean' && (
                    <button
                      onClick={() => handleSettingChange(setting.key, !setting.value)}
                      disabled={updating === setting.key}
                      className="flex items-center gap-2"
                    >
                      {setting.value ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-500" />
                      )}
                      <span className={`text-sm ${setting.value ? 'text-green-400' : 'text-gray-400'}`}>
                        {setting.value ? 'Enabled' : 'Disabled'}
                      </span>
                    </button>
                  )}

                  {setting.type === 'number' && (
                    <input
                      type="number"
                      value={setting.value as any}
                      onChange={(e) => {
                        const value = setting.step ? parseFloat(e.target.value) : parseInt(e.target.value)
                        handleSettingChange(setting.key, value || 0)
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                      min={setting.min}
                      max={setting.max}
                      step={setting.step}
                      disabled={updating === setting.key}
                    />
                  )}

                  {setting.type === 'select' && (
                    <select
                      title="btn-claim"
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                      disabled={updating === setting.key}
                    >
                      {setting.options.map((option: { value: Key | readonly string[] | null | undefined; label: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }) => (
                        <option key={option.value as any} value={option.value as any}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="text-xs text-gray-500">{setting.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Status */}
      <div className="mt-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
        <h4 className="text-blue-400 font-semibold mb-3">System Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${settings.mintingEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-300">Minting: {settings.mintingEnabled ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${settings.distributionEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-300">Distribution: {settings.distributionEnabled ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${settings.claimingEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-300">Claiming: {settings.claimingEnabled ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              settings.seasonStatus === 'ACTIVE' ? 'bg-green-400' : 
              settings.seasonStatus === 'CLAIMING' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-sm text-gray-300">Season: {settings.seasonStatus}</span>
          </div>
        </div>
      </div>

      {/* Warning Messages */}
      {(!settings.mintingEnabled || !settings.distributionEnabled || !settings.claimingEnabled) && (
        <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-sm font-medium">System Partially Disabled</p>
              <p className="text-yellow-300/80 text-xs mt-1">
                Some system functions are currently disabled. Users may not be able to access all features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}