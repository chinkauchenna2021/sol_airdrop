'use client'

import { useState, useEffect, SetStateAction } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Eye, Edit, Trash2, Ban, UserCheck, UserX, Shield, 
  Star, Mail, Twitter, Wallet, MoreHorizontal, CheckCircle2,
  XCircle, AlertTriangle, DollarSign, TrendingUp, Activity,
  Settings as SettingsIcon, Clock, MapPin, ExternalLink,
  Copy, RefreshCw, Archive, UserPlus, Award, Coins,
  Calendar, Phone, Globe, Heart, MessageSquare,
  Download,
  User
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/advanceDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/swtich'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

interface User {
  id: string
  walletAddress: string
  twitterUsername?: string
  twitterId?: string
  twitterFollowers?: number  
  totalPoints: number
  level: number
  rank: number
  isActive: boolean
  isBanned: boolean
  isAdmin: boolean
  isPremium: boolean
  isVerified: boolean
  createdAt: Date
  lastLoginAt?: Date
  claimsEnabled: boolean
  referralCount: number
  totalClaimed: number
  twitterActivity: 'HIGH' | 'MEDIUM' | 'LOW'
  tokenAllocation: number
  dailyStreak: number
  engagementScore: number
  riskScore: number
  country?: string
  timezone?: string
  notes?: string
  email?: string
  phoneNumber?: string
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_STARTED'
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  lifetimeEarnings: number
  socialScore: number
  achievements: string[]
  warnings: number
  suspensions: number
  lastActivityAt?: Date
}

interface UserActivity {
  id: string
  type: 'LOGIN' | 'CLAIM' | 'TWITTER_ENGAGEMENT' | 'REFERRAL' | 'TASK_COMPLETION'
  description: string
  timestamp: Date
  metadata?: any
}

interface UserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, action: string, data?: any) => void
  isEditing: boolean
}

export function AdvancedUserModal({ 
  user, 
  isOpen, 
  onClose, 
  onSave, 
  isEditing 
}: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [activeTab, setActiveTab] = useState('overview')
  const [adminNotes, setAdminNotes] = useState('')
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [pointsAdjustment, setPointsAdjustment] = useState('')
  const [tokenAdjustment, setTokenAdjustment] = useState('')
  const [banReason, setBanReason] = useState('')
  const [warningMessage, setWarningMessage] = useState('')

  useEffect(() => {
    if (user) {
      setFormData(user)
      setAdminNotes(user.notes || '')
      fetchUserActivity()
    }
  }, [user])

  const fetchUserActivity = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users/${user.id}/activity`)
      if (res.ok) {
        const data = await res.json()
        setUserActivity(data.activity || [])
      }
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const handleSave = () => {
    if (isEditing && Object.keys(formData).length > 0) {
      onSave(user.id, 'update', { 
        ...formData, 
        notes: adminNotes,
        updatedBy: 'admin' // This should be the current admin's ID
      })
    }
  }

  const handleQuickAction = (action: string, value?: any) => {
    onSave(user.id, action, value ? { [action]: value } : undefined)
  }

  const handlePointsAdjustment = () => {
    if (pointsAdjustment) {
      onSave(user.id, 'adjust-points', { 
        amount: parseInt(pointsAdjustment),
        reason: `Admin adjustment: ${pointsAdjustment > '0' ? 'bonus' : 'deduction'}` 
      })
      setPointsAdjustment('')
    }
  }

  const handleTokenAdjustment = () => {
    if (tokenAdjustment) {
      onSave(user.id, 'adjust-tokens', { 
        amount: parseInt(tokenAdjustment),
        reason: `Admin token adjustment` 
      })
      setTokenAdjustment('')
    }
  }

  const handleBanUser = () => {
    if (banReason.trim()) {
      onSave(user.id, 'ban-user', { 
        reason: banReason,
        bannedBy: 'admin'
      })
      setBanReason('')
    } else {
      toast.error('Please provide a reason for banning this user')
    }
  }

  const handleWarning = () => {
    if (warningMessage.trim()) {
      onSave(user.id, 'warn-user', { 
        message: warningMessage,
        warnedBy: 'admin'
      })
      setWarningMessage('')
    } else {
      toast.error('Please provide a warning message')
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'LOGIN': return <Activity className="w-4 h-4 text-blue-400" />
      case 'CLAIM': return <Coins className="w-4 h-4 text-green-400" />
      case 'TWITTER_ENGAGEMENT': return <Twitter className="w-4 h-4 text-blue-400" />
      case 'REFERRAL': return <Users className="w-4 h-4 text-purple-400" />
      case 'TASK_COMPLETION': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier) {
      case 'DIAMOND': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'PLATINUM': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'GOLD': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'SILVER': return 'bg-gray-400/20 text-gray-400 border-gray-400/30'
      default: return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'HIGH', color: 'text-red-400' }
    if (score >= 50) return { level: 'MEDIUM', color: 'text-yellow-400' }
    return { level: 'LOW', color: 'text-green-400' }
  }

  const riskLevel = getRiskLevel(user.riskScore)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {user.walletAddress.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="text-xl font-bold">
                  {user.walletAddress.slice(0, 12)}...{user.walletAddress.slice(-6)}
                </p>
                <div className="flex items-center gap-2">
                  {user.isAdmin && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {user.isPremium && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {user.isVerified && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge className={getLoyaltyTierColor(user.loyaltyTier)}>
                    <Award className="w-3 h-3 mr-1" />
                    {user.loyaltyTier}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                {user.twitterUsername && (
                  <div className="flex items-center gap-1">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400">@{user.twitterUsername}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Badge className={getKycStatusColor(user.kycStatus)}>
                  KYC: {user.kycStatus}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="admin">Admin Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.totalPoints.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Total Points</p>
                  <p className="text-xs text-green-400 mt-1">Rank #{user.rank}</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.level}</p>
                  <p className="text-gray-400 text-sm">Level</p>
                  <Progress value={(user.totalPoints % 1000) / 10} className="mt-2" />
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.referralCount}</p>
                  <p className="text-gray-400 text-sm">Referrals</p>
                  <p className="text-xs text-blue-400 mt-1">+{user.referralCount * 100} pts</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{user.totalClaimed.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Tokens Claimed</p>
                  <p className="text-xs text-purple-400 mt-1">CONNECT</p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Daily Streak</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white font-semibold">{user.dailyStreak} days</span>
                        {user.dailyStreak > 7 && <span className="text-orange-400">🔥</span>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400">Engagement Score</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white font-semibold">{user.engagementScore}/100</span>
                        <Progress value={user.engagementScore} className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400">Social Score</Label>
                      <span className="text-white font-semibold block mt-1">{user.socialScore}/100</span>
                    </div>
                    <div>
                      <Label className="text-gray-400">Lifetime Earnings</Label>
                      <span className="text-white font-semibold block mt-1">{user.lifetimeEarnings.toLocaleString()} CONNECT</span>
                    </div>
                  </div>
                  
                  {user.country && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{user.country}</span>
                      {user.timezone && (
                        <span className="text-gray-400">({user.timezone})</span>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-400">Last Activity</Label>
                    <p className="text-white mt-1">
                      {user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Twitter className="w-5 h-5" />
                    Social Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.twitterUsername ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">@{user.twitterUsername}</p>
                          <p className="text-gray-400 text-sm">Twitter Connected</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://twitter.com/${user.twitterUsername}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400">Followers</Label>
                          <p className="text-white font-semibold mt-1">
                            {user.twitterFollowers?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-400">Activity Level</Label>
                          <Badge className={
                            user.twitterActivity === 'HIGH' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            user.twitterActivity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }>
                            {user.twitterActivity}
                          </Badge>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Twitter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No Twitter account connected</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            {user.achievements && user.achievements.length > 0 && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.achievements.map((achievement, index) => (
                      <Badge key={index} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Star className="w-3 h-3 mr-1" />
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUserActivity}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : userActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {userActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{activity.description}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          {activity.metadata && (
                            <div className="mt-2 text-xs text-gray-500">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Active Account</Label>
                          <p className="text-sm text-gray-400">Enable/disable user account</p>
                        </div>
                        <Switch
                          checked={formData.isActive ?? user.isActive}
                          onCheckedChange={(checked: any) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Claims Enabled</Label>
                          <p className="text-sm text-gray-400">Allow token claims</p>
                        </div>
                        <Switch
                          checked={formData.claimsEnabled ?? user.claimsEnabled}
                          onCheckedChange={(checked: any) => setFormData(prev => ({ ...prev, claimsEnabled: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Premium Account</Label>
                          <p className="text-sm text-gray-400">Premium benefits</p>
                        </div>
                        <Switch
                          checked={formData.isPremium ?? user.isPremium}
                          onCheckedChange={(checked : any) => setFormData(prev => ({ ...prev, isPremium: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Verified Status</Label>
                          <p className="text-sm text-gray-400">Verified user badge</p>
                        </div>
                        <Switch
                          checked={formData.isVerified ?? user.isVerified}
                          onCheckedChange={(checked: any) => setFormData(prev => ({ ...prev, isVerified: checked }))}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Activity Level</Label>
                        <Select 
                          value={formData.twitterActivity || user.twitterActivity} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, twitterActivity: value as any }))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HIGH">High Activity</SelectItem>
                            <SelectItem value="MEDIUM">Medium Activity</SelectItem>
                            <SelectItem value="LOW">Low Activity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white">Loyalty Tier</Label>
                        <Select 
                          value={formData.loyaltyTier || user.loyaltyTier} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, loyaltyTier: value as any }))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRONZE">Bronze</SelectItem>
                            <SelectItem value="SILVER">Silver</SelectItem>
                            <SelectItem value="GOLD">Gold</SelectItem>
                            <SelectItem value="PLATINUM">Platinum</SelectItem>
                            <SelectItem value="DIAMOND">Diamond</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white">KYC Status</Label>
                        <Select 
                          value={formData.kycStatus || user.kycStatus} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, kycStatus: value as any }))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="VERIFIED">Verified</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Email Address</Label>
                      <Input
                        type="email"
                        value={formData.email || user.email || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@example.com"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Phone Number</Label>
                      <Input
                        type="tel"
                        value={formData.phoneNumber || user.phoneNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Country</Label>
                      <Input
                        value={formData.country || user.country || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="United States"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Timezone</Label>
                      <Input
                        value={formData.timezone || user.timezone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                        placeholder="America/New_York"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Risk Score:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${riskLevel.color}`}>
                        {user.riskScore}%
                      </span>
                      <Badge className={
                        riskLevel.level === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        riskLevel.level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border-green-500/30'
                      }>
                        {riskLevel.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Status:</span>
                    <span className={user.isBanned ? 'text-red-400' : 'text-green-400'}>
                      {user.isBanned ? 'Banned' : 'Good Standing'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Warnings:</span>
                    <span className="text-white">{user.warnings}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Suspensions:</span>
                    <span className="text-white">{user.suspensions}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Login:</span>
                    <span className="text-white">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Security Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleQuickAction('reset-password')}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Force Password Reset
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleQuickAction('clear-sessions')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Clear All Sessions
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleQuickAction('require-2fa')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Require 2FA
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleQuickAction('freeze-account')}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Freeze Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Token Allocation</Label>
                      <p className="text-white font-semibold mt-1">
                        {user.tokenAllocation.toLocaleString()} CONNECT
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Total Claimed</Label>
                      <p className="text-white font-semibold mt-1">
                        {user.totalClaimed.toLocaleString()} CONNECT
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Lifetime Earnings</Label>
                      <p className="text-white font-semibold mt-1">
                        {user.lifetimeEarnings.toLocaleString()} CONNECT
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Remaining Balance</Label>
                      <p className="text-white font-semibold mt-1">
                        {(user.tokenAllocation - user.totalClaimed).toLocaleString()} CONNECT
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Financial Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Adjust Points</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="±1000"
                        value={pointsAdjustment}
                        onChange={(e) => setPointsAdjustment(e.target.value)}
                      />
                      <Button onClick={handlePointsAdjustment} disabled={!pointsAdjustment}>
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Use negative numbers to deduct points</p>
                  </div>

                  <div>
                    <Label className="text-white">Adjust Token Allocation</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="±500"
                        value={tokenAdjustment}
                        onChange={(e) => setTokenAdjustment(e.target.value)}
                      />
                      <Button onClick={handleTokenAdjustment} disabled={!tokenAdjustment}>
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Adjust available token allocation</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Admin Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={adminNotes}
                    onChange={(e: { target: { value: SetStateAction<string> } }) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this user..."
                    className="min-h-32"
                    rows={4}
                  />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white text-red-400">Moderation Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Send Warning</Label>
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={warningMessage}
                        onChange={(e: { target: { value: SetStateAction<string> } }) => setWarningMessage(e.target.value)}
                        placeholder="Warning message..."
                        rows={2}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleWarning}
                        className="w-full"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Send Warning
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-white text-red-400">Ban User</Label>
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={banReason}
                        onChange={(e: { target: { value: SetStateAction<string> } }) => setBanReason(e.target.value)}
                        placeholder="Reason for ban..."
                        rows={2}
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleBanUser}
                        className="w-full"
                        disabled={user.isBanned}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        {user.isBanned ? 'User Already Banned' : 'Ban User'}
                      </Button>
                    </div>
                  </div>

                  {user.isBanned && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickAction('unban-user')}
                      className="w-full"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Unban User
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`/admin/users/${user.id}/export`, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(user.walletAddress)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {isEditing && (
              <Button onClick={handleSave}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}