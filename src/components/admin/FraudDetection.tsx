'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, AlertTriangle, Eye, Ban, Check, X,
  TrendingUp, Users, Activity, Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FraudAlert {
  id: string
  type: 'SYBIL_ATTACK' | 'WALLET_CLUSTERING' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId: string
  userWallet: string
  description: string
  evidence: any[]
  riskScore: number
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'
  createdAt: Date
  investigatedBy?: string
}

interface FraudMetrics {
  totalAlerts: number
  criticalAlerts: number
  resolvedToday: number
  falsePositiveRate: number
  sybilClusters: number
  suspiciousPatterns: Array<{
    pattern: string
    count: number
    riskLevel: string
  }>
}

export function FraudDetection() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFraudData()
    const interval = setInterval(fetchFraudData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchFraudData = async () => {
    try {
      const [alertsRes, metricsRes] = await Promise.all([
        fetch('/api/admin/fraud/alerts'),
        fetch('/api/admin/fraud/metrics')
      ])

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts)
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }
    } catch (error) {
      console.error('Error fetching fraud data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/fraud/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        await fetchFraudData()
        setSelectedAlert(null)
      }
    } catch (error) {
      console.error('Error handling alert action:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500 bg-red-500/10'
      case 'HIGH': return 'border-orange-500 bg-orange-500/10'
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-500/10'
      case 'LOW': return 'border-blue-500 bg-blue-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SYBIL_ATTACK': return <Users className="w-5 h-5" />
      case 'WALLET_CLUSTERING': return <Activity className="w-5 h-5" />
      case 'SUSPICIOUS_ACTIVITY': return <AlertTriangle className="w-5 h-5" />
      case 'RATE_LIMIT_EXCEEDED': return <TrendingUp className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'pending') return alert.status === 'PENDING'
    if (filter === 'critical') return alert.severity === 'CRITICAL'
    return alert.severity === filter.toUpperCase()
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Fraud Detection</h1>
          <p className="text-gray-400">Real-time security monitoring and threat detection</p>
        </div>
        <Button variant="solana">
          <Shield className="w-4 h-4 mr-2" />
          Security Settings
        </Button>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Alerts</p>
                  <p className="text-2xl font-bold text-white">{metrics.totalAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-400">{metrics.criticalAlerts}</p>
                </div>
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Resolved Today</p>
                  <p className="text-2xl font-bold text-green-400">{metrics.resolvedToday}</p>
                </div>
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">False Positive Rate</p>
                  <p className="text-2xl font-bold text-yellow-400">{metrics.falsePositiveRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspicious Patterns */}
      {metrics && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Detected Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.suspiciousPatterns.map((pattern, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{pattern.pattern}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      pattern.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                      pattern.riskLevel === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {pattern.riskLevel}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">{pattern.count}</p>
                  <p className="text-gray-400 text-sm">occurrences</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'critical', 'high', 'medium', 'low'].map(filterOption => (
          <Button
            key={filterOption}
            variant={filter === filterOption ? "solana" : "outline"}
            size="sm"
            onClick={() => setFilter(filterOption)}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Button>
        ))}
      </div>

      {/* Fraud Alerts */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-lg border ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-medium">{alert.type.replace('_', ' ')}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                      alert.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                      alert.severity === 'MEDIUM' ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{alert.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>User: {alert.userWallet.slice(0, 8)}...</span>
                    <span>Risk Score: {alert.riskScore}/100</span>
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Investigate
                </Button>
                {alert.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, 'resolve')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, 'ban_user')}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}