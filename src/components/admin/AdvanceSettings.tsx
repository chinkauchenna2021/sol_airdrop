'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, Coins, Users, Shield, Globe, Database, 
  Bell, Mail, Twitter, Wallet, Lock, Key, Eye, EyeOff,
  Save, RefreshCw, AlertTriangle, CheckCircle2, Copy,
  Trash2, Plus, Edit, Search, Filter, Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/swtich'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription
} from '@/components/ui/advanceDialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

interface SystemConfig {
  key: string
  value: any
  description: string
  category: string
  type: 'boolean' | 'number' | 'string' | 'array'
  sensitive?: boolean
}

interface ClaimSettings {
  globalClaimsEnabled: boolean
  minClaimAmount: number
  claimFeeSOL: number
  claimCooldownHours: number
  maxDailyClaimsPerUser: number
  requireSOLBalance: boolean
  minSOLBalance: number
  blacklistedUsers: string[]
  whitelistedUsers: string[]
  claimSchedule: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
  autoApproval: {
    enabled: boolean
    maxAmount: number
    minUserLevel: number
  }
}

interface UserClaimControl {
  userId: string
  walletAddress: string
  twitterUsername?: string
  claimsEnabled: boolean
  reason?: string
  updatedAt: Date
  updatedBy: string
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('claims')
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [claimSettings, setClaimSettings] = useState<ClaimSettings | null>(null)
  const [userClaimControls, setUserClaimControls] = useState<UserClaimControl[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [configRes, claimRes, userControlRes] = await Promise.all([
        fetch('/api/admin/settings/config'),
        fetch('/api/admin/settings/claims'),
        fetch('/api/admin/settings/user-claims')
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfigs(configData.configs)
      }

      if (claimRes.ok) {
        const claimData = await claimRes.json()
        setClaimSettings(claimData.settings)
      }

      if (userControlRes.ok) {
        const userControlData = await userControlRes.json()
        setUserClaimControls(userControlData.controls)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveClaimSettings = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimSettings)
      })

      if (res.ok) {
        toast.success('Claim settings saved successfully')
      } else {
        toast.error('Failed to save claim settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save claim settings')
    } finally {
      setSaving(false)
    }
  }

  const updateUserClaimStatus = async (userId: string, enabled: boolean, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/settings/user-claims/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, reason })
      })

      if (res.ok) {
        await fetchSettings()
        toast.success(`User claim status updated`)
      } else {
        toast.error('Failed to update user claim status')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update user claim status')
    }
  }

  const bulkUpdateUserClaims = async (userIds: string[], enabled: boolean, reason: string) => {
    try {
      const res = await fetch('/api/admin/settings/user-claims/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, enabled, reason })
      })

      if (res.ok) {
        await fetchSettings()
        toast.success(`Bulk updated ${userIds.length} users`)
        setShowBulkUpdate(false)
      } else {
        toast.error('Failed to bulk update users')
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      toast.error('Failed to bulk update users')
    }
  }

  const addUserToClaimControl = async (walletAddress: string, enabled: boolean, reason: string) => {
    try {
      const res = await fetch('/api/admin/settings/user-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, enabled, reason })
      })

      if (res.ok) {
        await fetchSettings()
        toast.success('User added to claim control')
        setShowAddUser(false)
      } else {
        toast.error('Failed to add user to claim control')
      }
    } catch (error) {
      console.error('Add user error:', error)
      toast.error('Failed to add user to claim control')
    }
  }

  const filteredUserControls = userClaimControls.filter(control =>
    control.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    control.twitterUsername?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Admin Settings</h2>
          <p className="text-gray-400 mt-1">Configure platform settings and user permissions</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchSettings}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/api/admin/export/settings', '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="claims">Token Claims</TabsTrigger>
          <TabsTrigger value="users">User Controls</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Token Claims Settings */}
        <TabsContent value="claims" className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Global Claim Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {claimSettings && (
                <>
                  {/* Global Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="global-claims">Global Claims Enabled</Label>
                          <p className="text-sm text-gray-400">Enable or disable all token claims platform-wide</p>
                        </div>
                        <Switch
                          id="global-claims"
                          checked={claimSettings.globalClaimsEnabled}
                          onCheckedChange={(checked: any) => 
                            setClaimSettings(prev => prev ? { ...prev, globalClaimsEnabled: checked } : null)
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="min-claim">Minimum Claim Amount</Label>
                        <Input
                          id="min-claim"
                          type="number"
                          value={claimSettings.minClaimAmount}
                          onChange={(e) => 
                            setClaimSettings(prev => prev ? { ...prev, minClaimAmount: parseInt(e.target.value) } : null)
                          }
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-400 mt-1">Minimum points required to claim tokens</p>
                      </div>

                      <div>
                        <Label htmlFor="claim-fee">Claim Fee (SOL)</Label>
                        <Input
                          id="claim-fee"
                          type="number"
                          step="0.001"
                          value={claimSettings.claimFeeSOL}
                          onChange={(e) => 
                            setClaimSettings(prev => prev ? { ...prev, claimFeeSOL: parseFloat(e.target.value) } : null)
                          }
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-400 mt-1">SOL fee required for claiming ($5 worth)</p>
                      </div>

                      <div>
                        <Label htmlFor="cooldown">Claim Cooldown (Hours)</Label>
                        <Input
                          id="cooldown"
                          type="number"
                          value={claimSettings.claimCooldownHours}
                          onChange={(e) => 
                            setClaimSettings(prev => prev ? { ...prev, claimCooldownHours: parseInt(e.target.value) } : null)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="max-daily">Max Daily Claims Per User</Label>
                        <Input
                          id="max-daily"
                          type="number"
                          value={claimSettings.maxDailyClaimsPerUser}
                          onChange={(e) => 
                            setClaimSettings(prev => prev ? { ...prev, maxDailyClaimsPerUser: parseInt(e.target.value) } : null)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="require-sol">Require SOL Balance</Label>
                          <p className="text-sm text-gray-400">Require minimum SOL balance to claim</p>
                        </div>
                        <Switch
                          id="require-sol"
                          checked={claimSettings.requireSOLBalance}
                          onCheckedChange={(checked: any) => 
                            setClaimSettings(prev => prev ? { ...prev, requireSOLBalance: checked } : null)
                          }
                        />
                      </div>

                      {claimSettings.requireSOLBalance && (
                        <div>
                          <Label htmlFor="min-sol">Minimum SOL Balance</Label>
                          <Input
                            id="min-sol"
                            type="number"
                            step="0.001"
                            value={claimSettings.minSOLBalance}
                            onChange={(e) => 
                              setClaimSettings(prev => prev ? { ...prev, minSOLBalance: parseFloat(e.target.value) } : null)
                            }
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Claim Schedule */}
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Claim Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Scheduled Claims</Label>
                          <p className="text-sm text-gray-400">Restrict claims to specific hours</p>
                        </div>
                        <Switch
                          checked={claimSettings.claimSchedule.enabled}
                          onCheckedChange={(checked: any) => 
                            setClaimSettings(prev => prev ? {
                              ...prev,
                              claimSchedule: { ...prev.claimSchedule, enabled: checked }
                            } : null)
                          }
                        />
                      </div>

                      {claimSettings.claimSchedule.enabled && (
                        <>
                          <div>
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={claimSettings.claimSchedule.startTime}
                              onChange={(e) => 
                                setClaimSettings(prev => prev ? {
                                  ...prev,
                                  claimSchedule: { ...prev.claimSchedule, startTime: e.target.value }
                                } : null)
                              }
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={claimSettings.claimSchedule.endTime}
                              onChange={(e) => 
                                setClaimSettings(prev => prev ? {
                                  ...prev,
                                  claimSchedule: { ...prev.claimSchedule, endTime: e.target.value }
                                } : null)
                              }
                              className="mt-1"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Auto Approval */}
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Auto Approval Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Auto Approval</Label>
                          <p className="text-sm text-gray-400">Automatically approve small claims</p>
                        </div>
                        <Switch
                          checked={claimSettings.autoApproval.enabled}
                          onCheckedChange={(checked: any) => 
                            setClaimSettings(prev => prev ? {
                              ...prev,
                              autoApproval: { ...prev.autoApproval, enabled: checked }
                            } : null)
                          }
                        />
                      </div>

                      {claimSettings.autoApproval.enabled && (
                        <>
                          <div>
                            <Label>Max Auto-Approve Amount</Label>
                            <Input
                              type="number"
                              value={claimSettings.autoApproval.maxAmount}
                              onChange={(e) => 
                                setClaimSettings(prev => prev ? {
                                  ...prev,
                                  autoApproval: { ...prev.autoApproval, maxAmount: parseInt(e.target.value) }
                                } : null)
                              }
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Min User Level</Label>
                            <Input
                              type="number"
                              value={claimSettings.autoApproval.minUserLevel}
                              onChange={(e) => 
                                setClaimSettings(prev => prev ? {
                                  ...prev,
                                  autoApproval: { ...prev.autoApproval, minUserLevel: parseInt(e.target.value) }
                                } : null)
                              }
                              className="mt-1"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <Button 
                      onClick={saveClaimSettings}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Claim Settings
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Claim Controls */}
        <TabsContent value="users" className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Individual User Claim Controls
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkUpdate(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bulk Update
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddUser(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by wallet address or Twitter username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUserControls.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No user claim controls configured</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddUser(true)}
                      className="mt-2"
                    >
                      Add First User
                    </Button>
                  </div>
                ) : (
                  filteredUserControls.map((control) => (
                    <motion.div
                      key={control.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {control.walletAddress.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {control.walletAddress.slice(0, 8)}...{control.walletAddress.slice(-4)}
                          </p>
                          {control.twitterUsername && (
                            <p className="text-gray-400 text-sm">@{control.twitterUsername}</p>
                          )}
                          {control.reason && (
                            <p className="text-gray-400 text-xs mt-1">{control.reason}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={control.claimsEnabled ? 
                          'bg-green-500/20 text-green-400 border-green-500/30' : 
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }>
                          {control.claimsEnabled ? 'Claims Enabled' : 'Claims Disabled'}
                        </Badge>
                        
                        <div className="text-right text-sm text-gray-400">
                          <p>Updated {new Date(control.updatedAt).toLocaleDateString()}</p>
                          <p>by {control.updatedBy}</p>
                        </div>

                        <Switch
                          checked={control.claimsEnabled}
                          onCheckedChange={(checked: boolean) => 
                            updateUserClaimStatus(control.userId, checked, 
                              checked ? 'Claims re-enabled by admin' : 'Claims disabled by admin'
                            )
                          }
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configs
              .filter(config => config.category === 'system')
              .map((config) => (
                <Card key={config.key} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-sm">{config.key}</CardTitle>
                    <p className="text-xs text-gray-400">{config.description}</p>
                  </CardHeader>
                  <CardContent>
                    {config.type === 'boolean' ? (
                      <Switch
                        checked={config.value as boolean}
                        onCheckedChange={(checked: boolean) => {
                          // Update config logic here
                        }}
                      />
                    ) : config.type === 'number' ? (
                      <Input
                        type="number"
                        value={config.value as number}
                        onChange={(e) => {
                          // Update config logic here
                        }}
                      />
                    ) : (
                      <Input
                        type={config.sensitive ? 'password' : 'text'}
                        value={config.value as string}
                        onChange={(e) => {
                          // Update config logic here
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="security">
          <p className="text-gray-400">Security settings would go here...</p>
        </TabsContent>

        <TabsContent value="integrations">
          <p className="text-gray-400">Integration settings would go here...</p>
        </TabsContent>

        <TabsContent value="notifications">
          <p className="text-gray-400">Notification settings would go here...</p>
        </TabsContent>
      </Tabs>

      {/* Add User Modal */}
      <AddUserClaimControlModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSubmit={addUserToClaimControl}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateClaimsModal
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        onSubmit={bulkUpdateUserClaims}
        userCount={userClaimControls.length}
      />
    </div>
  )
}

// Add User to Claim Control Modal
function AddUserClaimControlModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (walletAddress: string, enabled: boolean, reason: string) => void
}) {
  const [walletAddress, setWalletAddress] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address')
      return
    }
    
    onSubmit(walletAddress.trim(), enabled, reason.trim())
    
    // Reset form
    setWalletAddress('')
    setEnabled(true)
    setReason('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User to Claim Control</DialogTitle>
          <DialogDescription>
            Add a specific user to claim control list
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input
              id="wallet"
              placeholder="Enter Solana wallet address..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable">Enable Claims</Label>
              <p className="text-sm text-gray-400">Allow this user to claim tokens</p>
            </div>
            <Switch
              id="enable"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this control..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Bulk Update Claims Modal
function BulkUpdateClaimsModal({
  isOpen,
  onClose,
  onSubmit,
  userCount
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userIds: string[], enabled: boolean, reason: string) => void
  userCount: number
}) {
  const [action, setAction] = useState<'enable' | 'disable'>('enable')
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const handleSubmit = () => {
    if (confirmText !== 'CONFIRM') {
      toast.error('Please type CONFIRM to proceed')
      return
    }

    // This would need to be implemented to get selected user IDs
    const userIds: string[] = [] // Get selected user IDs
    
    onSubmit(userIds, action === 'enable', reason)
    
    // Reset form
    setAction('enable')
    setReason('')
    setConfirmText('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update Claim Status</DialogTitle>
          <DialogDescription>
            Update claim status for multiple users at once
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Action</Label>
            <Select value={action} onValueChange={(value: any) => setAction(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enable">Enable Claims</SelectItem>
                <SelectItem value="disable">Disable Claims</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bulk-reason">Reason</Label>
            <Textarea
              id="bulk-reason"
              placeholder="Enter reason for bulk update..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
              required
            />
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Confirmation Required</p>
                <p className="text-sm text-gray-400 mt-1">
                  This action will affect {userCount} users. Type <strong>CONFIRM</strong> to proceed.
                </p>
              </div>
            </div>
            <Input
              placeholder="Type CONFIRM to proceed"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={confirmText !== 'CONFIRM' || !reason.trim()}
            variant={action === 'disable' ? 'destructive' : 'default'}
          >
            {action === 'enable' ? 'Enable Claims' : 'Disable Claims'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}