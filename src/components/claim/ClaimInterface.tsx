import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Coins, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ClaimData {
  balances: {
    claimableTokens: number
    totalPoints: number
    totalEarnedTokens: number
    claimsEnabled: boolean
  }
  recentClaims: Array<{
    id: string
    amount: number
    status: string
    paymentMethod: string
    transactionHash?: string
    createdAt: string
    processedAt?: string
    type: string
  }>
  limits: {
    minClaimAmount: number
    maxClaimAmount: number
  }
  message: string
}

export default function ClaimTokens() {
  const [data, setData] = useState<ClaimData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimAmount, setClaimAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'SOLANA' | 'USDC'>('SOLANA')

  useEffect(() => {
    fetchClaimData()
  }, [])

  const fetchClaimData = async () => {
    try {
      const res = await fetch('/api/claims')
      if (res.ok) {
        const claimData = await res.json()
        setData(claimData)
      } else {
        toast.error('Failed to load claim data')
      }
    } catch (error) {
      console.error('Claim data fetch error:', error)
      toast.error('Failed to load claim data')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!data) return

    const tokens = parseFloat(claimAmount)
    
    // Validation
    if (!tokens || tokens <= 0) {
      toast.error('Please enter a valid token amount')
      return
    }

    if (tokens < data.limits.minClaimAmount) {
      toast.error(`Minimum claim amount is ${data.limits.minClaimAmount} tokens`)
      return
    }

    if (tokens > data.limits.maxClaimAmount) {
      toast.error(`Maximum claim amount is ${data.limits.maxClaimAmount} tokens`)
      return
    }

    if (tokens > data.balances.claimableTokens) {
      toast.error('Insufficient token balance')
      return
    }

    setClaiming(true)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens,
          paymentMethod
        })
      })

      const result = await res.json()

      if (res.ok) {
        toast.success('Claim submitted successfully! Processing...')
        setClaimAmount('')
        fetchClaimData() // Refresh data
      } else {
        toast.error(result.error || 'Failed to submit claim')
      }
    } catch (error) {
      console.error('Claim submission error:', error)
      toast.error('Failed to submit claim')
    } finally {
      setClaiming(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-600'
      case 'PROCESSING':
        return 'bg-yellow-600'
      case 'FAILED':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading claim data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Failed to load claim data</div>
      </div>
    )
  }

  const canClaim = data.balances.claimsEnabled && data.balances.claimableTokens >= data.limits.minClaimAmount

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Claim Tokens</h1>
          <p className="text-gray-400">
            Convert your earned tokens to claimable cryptocurrency
          </p>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Claimable Tokens */}
          <Card className="bg-green-800 border-green-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Claimable Tokens
              </CardTitle>
              <Coins className="h-4 w-4 text-green-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {data.balances.claimableTokens.toFixed(2)}
              </div>
              <p className="text-xs text-green-200 mt-1">
                Ready to claim
              </p>
            </CardContent>
          </Card>

          {/* Points (Non-claimable) */}
          <Card className="bg-blue-800 border-blue-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Points
              </CardTitle>
              <Info className="h-4 w-4 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {data.balances.totalPoints.toLocaleString()}
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Non-claimable rewards
              </p>
            </CardContent>
          </Card>

          {/* Lifetime Tokens */}
          <Card className="bg-purple-800 border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Lifetime Tokens
              </CardTitle>
              <ExternalLink className="h-4 w-4 text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {data.balances.totalEarnedTokens.toFixed(2)}
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Total earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Alert className="bg-yellow-900/20 border-yellow-600">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            <strong>Important:</strong> Only tokens can be claimed for cryptocurrency. 
            Points are non-transferable platform rewards for achievements and daily activities.
          </AlertDescription>
        </Alert>

        {/* Claim Form */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Claim Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {!canClaim ? (
              <Alert className="bg-red-900/20 border-red-600">
                <XCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200">
                  {!data.balances.claimsEnabled 
                    ? 'Claims are currently disabled for your account.'
                    : `You need at least ${data.limits.minClaimAmount} tokens to make a claim.`
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token Amount
                  </label>
                  <Input
                    type="number"
                    placeholder={`Min: ${data.limits.minClaimAmount}`}
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    min={data.limits.minClaimAmount}
                    max={Math.min(data.balances.claimableTokens, data.limits.maxClaimAmount)}
                    step="0.01"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Available: {data.balances.claimableTokens.toFixed(2)} tokens
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <div className="flex space-x-4">
                    <Button
                      variant={paymentMethod === 'SOLANA' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('SOLANA')}
                      className="flex-1"
                    >
                      SOL
                    </Button>
                    <Button
                      variant={paymentMethod === 'USDC' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('USDC')}
                      className="flex-1"
                    >
                      USDC
                    </Button>
                  </div>
                </div>

                {/* Claim Button */}
                <Button
                  onClick={handleClaim}
                  disabled={claiming || !claimAmount || parseFloat(claimAmount) < data.limits.minClaimAmount}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {claiming ? 'Processing...' : `Claim ${claimAmount || '0'} Tokens`}
                </Button>

                {/* Limits Info */}
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Minimum claim: {data.limits.minClaimAmount} tokens</p>
                  <p>• Maximum claim: {data.limits.maxClaimAmount} tokens</p>
                  <p>• Claims are processed within 24 hours</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim History */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentClaims.length > 0 ? (
                data.recentClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(claim.status)}
                      <div>
                        <p className="text-white font-medium">
                          {claim.amount.toFixed(2)} tokens
                        </p>
                        <p className="text-gray-400 text-sm">
                          {new Date(claim.createdAt).toLocaleDateString()} • {claim.paymentMethod}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <Badge variant="secondary" className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                      {claim.transactionHash && (
                        <p className="text-xs text-gray-400">
                          <a 
                            href={`https://solscan.io/tx/${claim.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-400 flex items-center"
                          >
                            View TX <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No claims yet. Start by earning tokens from referrals and Twitter activities!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How to Earn Tokens */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">How to Earn More Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-3">
                <h4 className="text-green-400 font-semibold">Referral Activities</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Successful referral: 50 tokens</li>
                  <li>• Share your referral link</li>
                  <li>• Higher rewards for active referrals</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-blue-400 font-semibold">Twitter Activities</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Like tweets: 0.5 tokens each</li>
                  <li>• Retweet: 1.0 tokens each</li>
                  <li>• Comment: 0.8 tokens each</li>
                  <li>• Follow accounts: 2.0 tokens each</li>
                  <li>• Quote tweets: 1.5 tokens each</li>
                </ul>
              </div>
            </div>
            
            <Alert className="mt-4 bg-blue-900/20 border-blue-600">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                <strong>Note:</strong> Points from daily check-ins, task completions, and achievements 
                cannot be claimed. Only tokens from referrals and Twitter activities are claimable.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}