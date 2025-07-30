'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, Settings, Users, Zap, 
  TrendingUp, AlertTriangle, CheckCircle,
  Play, Pause, Eye, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SystemStatus {
  claimingEnabled: boolean
  nftPassRequired: boolean
  requireApproval: boolean
  seasonStatus: string
  totalUsers: number
  eligibleUsers: number
  approvedUsers: number
  totalAirdropClaims: number
  totalNFTPassClaims: number
  totalTokensClaimed: number
  totalFeesCollected: number
  currentSeason: {
    id: string
    name: string
    status: string
    totalAllocation: number
    claimedAmount: number
    claimedPercentage: number
  } | null
}

export default function NFTAdminDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  async function fetchSystemStatus() {
    try {
      const [controlsRes, statsRes] = await Promise.all([
        fetch('/api/admin/nft-claims/controls'),
        fetch('/api/admin/nft-claims/stats')
      ])


      if (controlsRes.ok && statsRes.ok) {
          const controls = await controlsRes.json()
          const stats = await statsRes.json()
          
          setStatus({
              ...controls,
          ...stats,
          currentSeason: {
            id: 'season-1',
            name: 'Season 1 Airdrop',
            status: controls.seasonStatus,
            totalAllocation: 1000000000,
            claimedAmount: stats.totalTokensClaimed || 0,
            claimedPercentage: stats.totalTokensClaimed ? 
              (stats.totalTokensClaimed / 1000000000) * 100 : 0
          }
        })
      }
    } catch (error) {
        console.error('Failed to fetch system status:', error)
        toast.error('Failed to load system status')
    } finally {
      setLoading(false)
    }
  }

  const toggleSetting = async (key: string, currentValue: any) => {
    setUpdating(key)
    try {
        const response = await fetch('/api/admin/nft-claims/controls', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !currentValue })
      })

      if (response.ok) {
        toast.success(`${key} updated successfully`)
        fetchSystemStatus()
      } else {
        toast.error(`Failed to update ${key}`)
      }
    } catch (error) {
        toast.error(`Failed to update ${key}`)
    } finally {
        setUpdating(null)
    }
  }

//   const createNewSeason = async () => {
//     setUpdating('newSeason')
//     try {
    //       const response = await fetch('/api/admin/create-season', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({
            //           name: `Season ${Date.now()}`,
            //           description: 'New airdrop season',
            //           totalAllocation: 400000000,
//           nftPassRequired: true,
//           requireApproval: false,
//           feeAmount: 4.00
//         })
//       })

//       if (response.ok) {
    //         toast.success('New season created successfully')
    //         fetchSystemStatus()
//       } else {
//         toast.error('Failed to create new season')
//       }
//     } catch (error) {
//       toast.error('Failed to create new season')
//     } finally {
//       setUpdating(null)
//     }
//   }

console.log("=========STATUS========", status )
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300">Failed to load system status</p>
        <Button onClick={fetchSystemStatus} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" />
            NFT Claiming System
          </h1>
          <p className="text-gray-400 mt-2">
            Manage NFT pass requirements and token claiming
          </p>
        </div>
        
        {/* <Button
          onClick={createNewSeason}
          disabled={updating === 'newSeason'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {updating === 'newSeason' ? 'Creating...' : 'New Season'}
        </Button> */}
      </div>

      {/* System Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5" />
              System Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Claiming Status:</span>
              <div className="flex items-center gap-2">
                <Badge className={status.claimingEnabled ? 
                  'bg-green-500/20 text-green-400 border-green-500/30' : 
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }>
                  {status.claimingEnabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
                <Button
                  size="sm"
                  variant={status.claimingEnabled ? 'destructive' : 'default'}
                  onClick={() => toggleSetting('claimingEnabled', status.claimingEnabled)}
                  disabled={updating === 'claimingEnabled'}
                >
                  {updating === 'claimingEnabled' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : status.claimingEnabled ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">NFT Pass Required:</span>
              <div className="flex items-center gap-2">
                <Badge className={status.nftPassRequired ? 
                  'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }>
                  {status.nftPassRequired ? 'YES' : 'NO'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleSetting('nftPassRequired', status.nftPassRequired)}
                  disabled={updating === 'nftPassRequired'}
                >
                  {updating === 'nftPassRequired' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Toggle'
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Admin Approval:</span>
              <div className="flex items-center gap-2">
                <Badge className={status.requireApproval ? 
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }>
                  {status.requireApproval ? 'REQUIRED' : 'NOT REQUIRED'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleSetting('requireApproval', status.requireApproval)}
                  disabled={updating === 'requireApproval'}
                >
                  {updating === 'requireApproval' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Toggle'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Season */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="w-5 h-5" />
              Current Season
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status.currentSeason ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Season Name:</span>
                  <span className="text-white font-semibold">{status?.currentSeason?.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <Badge className={status?.currentSeason?.status === 'ACTIVE' ? 
                    'bg-green-500/20 text-green-400 border-green-500/30' : 
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }>
                    {status.currentSeason.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Allocation:</span>
                  <span className="text-white font-semibold">
                    {status?.currentSeason?.totalAllocation?.toLocaleString()} CONNECT
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Claimed:</span>
                  <span className="text-white font-semibold">
                    {status?.currentSeason?.claimedAmount?.toLocaleString()} CONNECT
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Progress:</span>
                    <span className="text-white font-semibold">
                      {status?.currentSeason?.claimedPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(status.currentSeason.claimedPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-gray-400">No active season</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{status.totalUsers}</p>
            <p className="text-gray-400 text-sm">Total Users</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{status.eligibleUsers}</p>
            <p className="text-gray-400 text-sm">Eligible Users</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{status.totalNFTPassClaims}</p>
            <p className="text-gray-400 text-sm">NFT Passes</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{status.totalAirdropClaims}</p>
            <p className="text-gray-400 text-sm">Token Claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">Token Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Tokens Claimed:</span>
              <span className="text-white font-semibold">
                {status?.totalTokensClaimed?.toLocaleString()} CONNECT
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Fees Collected:</span>
              <span className="text-white font-semibold">
                {status.totalFeesCollected} SOL
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Approved Users:</span>
              <span className="text-white font-semibold">
                {status.approvedUsers}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open('/admin/users', '_blank')}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open('/admin/analytics', '_blank')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={fetchSystemStatus}
            >
              <Eye className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="w-5 h-5 text-green-400" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-semibold">API Status</p>
              <p className="text-green-300 text-sm">All systems operational</p>
            </div>
            
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 font-semibold">Security</p>
              <p className="text-blue-300 text-sm">All checks passed</p>
            </div>
            
            <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-purple-400 font-semibold">Performance</p>
              <p className="text-purple-300 text-sm">Optimal response times</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}