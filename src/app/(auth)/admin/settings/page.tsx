'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface SystemConfig {
  claimsEnabled: boolean
  minClaimAmount: number
  claimRate: number
  claimFeePercentage: number
  pointsPerLike: number
  pointsPerRetweet: number
  pointsPerComment: number
  pointsPerFollow: number
  pointsPerReferral: number
  dailyCheckInPoints: number
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaving(true)
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (res.ok) {
        toast.success('Settings saved successfully')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: keyof SystemConfig, value: any) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
          <p className="text-gray-400">Configure platform parameters and features</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchConfig}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="solana"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims Settings */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Claims Configuration</CardTitle>
            <CardDescription>Manage token claim settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white">Claims Enabled</label>
              <button
                onClick={() => handleInputChange('claimsEnabled', !config.claimsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  config.claimsEnabled ? 'bg-solana-green' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    config.claimsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="text-white text-sm">Minimum Claim Amount</label>
              <Input
                type="number"
                value={config.minClaimAmount}
                onChange={(e) => handleInputChange('minClaimAmount', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm">Claim Rate (tokens per point)</label>
              <Input
                type="number"
                step="0.0001"
                value={config.claimRate}
                onChange={(e) => handleInputChange('claimRate', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm">Claim Fee Percentage</label>
              <Input
                type="number"
                step="0.1"
                value={config.claimFeePercentage}
                onChange={(e) => handleInputChange('claimFeePercentage', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Points Settings */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Points Configuration</CardTitle>
            <CardDescription>Set points for different actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm">Points per Like</label>
              <Input
                type="number"
                value={config.pointsPerLike}
                onChange={(e) => handleInputChange('pointsPerLike', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm">Points per Retweet</label>
              <Input
                type="number"
                value={config.pointsPerRetweet}
                onChange={(e) => handleInputChange('pointsPerRetweet', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm">Points per Comment</label>
              <Input
                type="number"
                value={config.pointsPerComment}
                onChange={(e) => handleInputChange('pointsPerComment', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm">Points per Follow</label>
              <Input
                type="number"
                value={config.pointsPerFollow}
                onChange={(e) => handleInputChange('pointsPerFollow', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bonus Points Settings */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Bonus Points</CardTitle>
            <CardDescription>Configure bonus rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm">Referral Points</label>
              <Input
                type="number"
                value={config.pointsPerReferral}
                onChange={(e) => handleInputChange('pointsPerReferral', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-white text-sm">Daily Check-in Points</label>
              <Input
                type="number"
                value={config.dailyCheckInPoints}
                onChange={(e) => handleInputChange('dailyCheckInPoints', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast('Feature coming soon')}
            >
              Export User Data
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast('Feature coming soon')}
            >
              Reset Daily Limits
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast('Feature coming soon')}
            >
              Send Mass Notification
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => toast('Feature coming soon')}
            >
              Emergency Stop Claims
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}