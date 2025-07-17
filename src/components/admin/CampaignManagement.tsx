'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit, Trash2, Play, Pause, Eye, Calendar,
  Target, Coins, Users, TrendingUp, Settings, Copy,
  CheckCircle, AlertTriangle, Clock, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface Campaign {
  id: string
  name: string
  description: string
  tokenMint: string
  totalAllocation: number
  distributed: number
  remaining: number
  startDate: Date
  endDate: Date
  eligibilityCriteria: {
    minFollowers?: number
    minPoints?: number
    twitterRequired: boolean
    walletAgeMinDays?: number
    excludeNewAccounts: boolean
    maxParticipants?: number
  }
  distributionRules: {
    type: 'equal' | 'weighted' | 'lottery' | 'activity_based'
    highActivityAllocation?: number
    mediumActivityAllocation?: number
    lowActivityAllocation?: number
    bonusMultipliers?: any
  }
  isActive: boolean
  participants: number
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

interface CampaignForm {
  name: string
  description: string
  tokenMint: string
  totalAllocation: number
  startDate: string
  endDate: string
  eligibilityCriteria: {
    minFollowers?: number
    minPoints?: number
    twitterRequired: boolean
    walletAgeMinDays?: number
    excludeNewAccounts: boolean
    maxParticipants?: number
  }
  distributionRules: {
    type: 'equal' | 'weighted' | 'lottery' | 'activity_based'
    highActivityAllocation?: number
    mediumActivityAllocation?: number
    lowActivityAllocation?: number
    bonusMultipliers?: any
  }
}

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({
    name: '',
    description: '',
    tokenMint: '',
    totalAllocation: 0,
    startDate: '',
    endDate: '',
    eligibilityCriteria: {
      twitterRequired: true,
      excludeNewAccounts: false
    },
    distributionRules: {
      type: 'activity_based',
      highActivityAllocation: 4000,
      mediumActivityAllocation: 3500,
      lowActivityAllocation: 3000
    }
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to fetch campaigns')
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!validateForm()) return

    try {
      setProcessing('create')
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      })

      if (res.ok) {
        toast.success('Campaign created successfully')
        await fetchCampaigns()
        setShowForm(false)
        resetForm()
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign')
    } finally {
      setProcessing(null)
    }
  }

  const handleUpdateCampaign = async () => {
    if (!editingCampaign || !validateForm()) return

    try {
      setProcessing('update')
      const res = await fetch(`/api/admin/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      })

      if (res.ok) {
        toast.success('Campaign updated successfully')
        await fetchCampaigns()
        setEditingCampaign(null)
        setShowForm(false)
        resetForm()
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to update campaign')
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
      toast.error('Failed to update campaign')
    } finally {
      setProcessing(null)
    }
  }

  const handleToggleCampaign = async (campaignId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      setProcessing(campaignId)
      const res = await fetch(`/api/admin/campaigns/${campaignId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        toast.success(`Campaign ${action}ed successfully`)
        await fetchCampaigns()
      } else {
        const error = await res.json()
        toast.error(error.message || `Failed to ${action} campaign`)
      }
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error)
      toast.error(`Failed to ${action} campaign`)
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    try {
      setProcessing(campaignId)
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Campaign deleted successfully')
        await fetchCampaigns()
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    } finally {
      setProcessing(null)
    }
  }

  const validateForm = (): boolean => {
    if (!campaignForm.name.trim()) {
      toast.error('Campaign name is required')
      return false
    }
    if (!campaignForm.description.trim()) {
      toast.error('Campaign description is required')
      return false
    }
    if (!campaignForm.tokenMint.trim()) {
      toast.error('Token mint address is required')
      return false
    }
    if (campaignForm.totalAllocation <= 0) {
      toast.error('Total allocation must be greater than 0')
      return false
    }
    if (!campaignForm.startDate) {
      toast.error('Start date is required')
      return false
    }
    if (!campaignForm.endDate) {
      toast.error('End date is required')
      return false
    }
    if (new Date(campaignForm.startDate) >= new Date(campaignForm.endDate)) {
      toast.error('End date must be after start date')
      return false
    }
    return true
  }

  const resetForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      tokenMint: '',
      totalAllocation: 0,
      startDate: '',
      endDate: '',
      eligibilityCriteria: {
        twitterRequired: true,
        excludeNewAccounts: false
      },
      distributionRules: {
        type: 'activity_based',
        highActivityAllocation: 4000,
        mediumActivityAllocation: 3500,
        lowActivityAllocation: 3000
      }
    })
  }

  const editCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setCampaignForm({
      name: campaign.name,
      description: campaign.description,
      tokenMint: campaign.tokenMint,
      totalAllocation: campaign.totalAllocation,
      startDate: new Date(campaign.startDate).toISOString().slice(0, 16),
      endDate: new Date(campaign.endDate).toISOString().slice(0, 16),
      eligibilityCriteria: campaign.eligibilityCriteria,
      distributionRules: campaign.distributionRules
    })
    setShowForm(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'paused': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getProgressPercentage = (distributed: number, total: number) => {
    return total > 0 ? Math.min((distributed / total) * 100, 100) : 0
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campaign Management</h1>
          <p className="text-gray-400">Create and manage airdrop campaigns</p>
        </div>
        <Button 
          variant="solana"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Campaigns</p>
                <p className="text-2xl font-bold text-white">{campaigns.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Campaigns</p>
                <p className="text-2xl font-bold text-green-400">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Allocated</p>
                <p className="text-2xl font-bold text-purple-400">
                  {campaigns.reduce((sum, c) => sum + c.totalAllocation, 0).toLocaleString()}
                </p>
              </div>
              <Coins className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Participants</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {campaigns.reduce((sum, c) => sum + c.participants, 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-white/10 bg-white/5 h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-lg truncate">{campaign.name}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{campaign.description}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <div className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        {campaign.status}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Token Mint */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Token:</span>
                    <code className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
                      {campaign.tokenMint.slice(0, 8)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(campaign.tokenMint)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Distribution Progress</span>
                      <span className="text-white">
                        {getProgressPercentage(campaign.distributed, campaign.totalAllocation).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage(campaign.distributed, campaign.totalAllocation)}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs">Total Allocation</p>
                      <p className="text-white font-semibold">{campaign.totalAllocation.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Participants</p>
                      <p className="text-white font-semibold">{campaign.participants.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Distributed</p>
                      <p className="text-green-400 font-semibold">{campaign.distributed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Remaining</p>
                      <p className="text-blue-400 font-semibold">{campaign.remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      Campaign Timeline
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Start:</span>
                        <span className="text-white">{new Date(campaign.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">End:</span>
                        <span className="text-white">{new Date(campaign.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-white/10">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleCampaign(campaign.id, 'start')}
                        disabled={processing === campaign.id}
                        className="flex-1"
                      >
                        {processing === campaign.id ? (
                          <div className="loading-spinner w-4 h-4 mr-1" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        Start
                      </Button>
                    )}
                    
                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleCampaign(campaign.id, 'pause')}
                        disabled={processing === campaign.id}
                        className="flex-1"
                      >
                        {processing === campaign.id ? (
                          <div className="loading-spinner w-4 h-4 mr-1" />
                        ) : (
                          <Pause className="w-4 h-4 mr-1" />
                        )}
                        Pause
                      </Button>
                    )}
                    
                    {campaign.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleCampaign(campaign.id, 'start')}
                        disabled={processing === campaign.id}
                        className="flex-1"
                      >
                        {processing === campaign.id ? (
                          <div className="loading-spinner w-4 h-4 mr-1" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        Resume
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editCampaign(campaign)}
                      disabled={processing === campaign.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/admin/campaigns/${campaign.id}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/admin/campaigns/${campaign.id}/analytics`, '_blank')}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>

                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        disabled={processing === campaign.id}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && !loading && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
            <p className="text-gray-400 mb-6">Create your first campaign to start distributing tokens</p>
            <Button variant="solana" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open)
        if (!open) {
          setEditingCampaign(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm font-medium">Campaign Name</label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Summer Airdrop 2024"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium">Token Mint Address</label>
                  <Input
                    value={campaignForm.tokenMint}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, tokenMint: e.target.value }))}
                    placeholder="Bs6D..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium">Description</label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your campaign..."
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-white text-sm font-medium">Total Allocation</label>
                  <Input
                    type="number"
                    value={campaignForm.totalAllocation}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, totalAllocation: parseInt(e.target.value) || 0 }))}
                    placeholder="1000000"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium">Start Date</label>
                  <Input
                    type="datetime-local"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium">End Date</label>
                  <Input
                    type="datetime-local"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Eligibility Criteria</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-white text-sm font-medium">Minimum Followers</label>
                  <Input
                    type="number"
                    value={campaignForm.eligibilityCriteria.minFollowers || ''}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      eligibilityCriteria: {
                        ...prev.eligibilityCriteria,
                        minFollowers: parseInt(e.target.value) || undefined
                      }
                    }))}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium">Minimum Points</label>
                  <Input
                    type="number"
                    value={campaignForm.eligibilityCriteria.minPoints || ''}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      eligibilityCriteria: {
                        ...prev.eligibilityCriteria,
                        minPoints: parseInt(e.target.value) || undefined
                      }
                    }))}
                    placeholder="50"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium">Wallet Age (Days)</label>
                  <Input
                    type="number"
                    value={campaignForm.eligibilityCriteria.walletAgeMinDays || ''}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      eligibilityCriteria: {
                        ...prev.eligibilityCriteria,
                        walletAgeMinDays: parseInt(e.target.value) || undefined
                      }
                    }))}
                    placeholder="7"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={campaignForm.eligibilityCriteria.twitterRequired}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      eligibilityCriteria: {
                        ...prev.eligibilityCriteria,
                        twitterRequired: e.target.checked
                      }
                    }))}
                    className="rounded border-white/20"
                  />
                  <span className="text-white text-sm">Twitter account required</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={campaignForm.eligibilityCriteria.excludeNewAccounts}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      eligibilityCriteria: {
                        ...prev.eligibilityCriteria,
                        excludeNewAccounts: e.target.checked
                      }
                    }))}
                    className="rounded border-white/20"
                  />
                  <span className="text-white text-sm">Exclude new accounts (less than 30 days)</span>
                </label>
              </div>
            </div>

            {/* Distribution Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Distribution Rules</h3>
              
              <div>
                <label className="text-white text-sm font-medium">Distribution Type</label>
                <select
                  title='distribution'
                  value={campaignForm.distributionRules.type}
                  onChange={(e) => setCampaignForm(prev => ({
                    ...prev,
                    distributionRules: {
                      ...prev.distributionRules,
                      type: e.target.value as any
                    }
                  }))}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                >
                  <option value="equal">Equal Distribution</option>
                  <option value="weighted">Weighted by Points</option>
                  <option value="lottery">Lottery System</option>
                  <option value="activity_based">Activity-Based (Recommended)</option>
                </select>
              </div>

              {campaignForm.distributionRules.type === 'activity_based' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium">High Activity Allocation</label>
                    <Input
                      type="number"
                      value={campaignForm.distributionRules.highActivityAllocation || 4000}
                      onChange={(e) => setCampaignForm(prev => ({
                        ...prev,
                        distributionRules: {
                          ...prev.distributionRules,
                          highActivityAllocation: parseInt(e.target.value)
                        }
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">For users with 1000+ followers</p>
                  </div>
                  
                  <div>
                    <label className="text-white text-sm font-medium">Medium Activity Allocation</label>
                    <Input
                      type="number"
                      value={campaignForm.distributionRules.mediumActivityAllocation || 3500}
                      onChange={(e) => setCampaignForm(prev => ({
                        ...prev,
                        distributionRules: {
                          ...prev.distributionRules,
                          mediumActivityAllocation: parseInt(e.target.value)
                        }
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">For users with 500+ followers</p>
                  </div>
                  
                  <div>
                    <label className="text-white text-sm font-medium">Low Activity Allocation</label>
                    <Input
                      type="number"
                      value={campaignForm.distributionRules.lowActivityAllocation || 3000}
                      onChange={(e) => setCampaignForm(prev => ({
                        ...prev,
                        distributionRules: {
                          ...prev.distributionRules,
                          lowActivityAllocation: parseInt(e.target.value)
                        }
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">For users with &lt;500 followers</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingCampaign(null)
                  resetForm()
                }}
                disabled={processing !== null}
              >
                Cancel
              </Button>
              <Button
                variant="solana"
                onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
                disabled={processing !== null}
              >
                {processing ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2" />
                    {editingCampaign ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingCampaign ? 'Update Campaign' : 'Create Campaign'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}