import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Activity, AlertTriangle, Shield, Zap, TrendingUp,
  Database, Globe, Clock, Eye, Info, CheckCircle2,
  UserX, DollarSign, Target, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RealTimeMetrics {
  activeUsers: number
  onlineAdmins: number
  pendingClaims: number
  suspiciousActivity: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  recentActions: AdminAction[]
  alertCount: number
  performanceMetrics: {
    responseTime: number
    errorRate: number
    cpuUsage: number
    memoryUsage: number
  }
}

interface AdminAction {
  id: string
  adminId: string
  action: string
  target?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
  metadata: any
}

export function RealTimeDashboard() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    initializeWebSocket()
    fetchInitialData()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const initializeWebSocket = () => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/admin-dashboard`)
    
    ws.onopen = () => {
      console.log('Admin WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'METRICS_UPDATE':
          setMetrics(data.metrics)
          break
        case 'NEW_ALERT':
          setAlerts(prev => [data.alert, ...prev.slice(0, 9)])
          break
        case 'USER_ACTION':
          // Handle real-time user action
          break
      }
    }

    ws.onclose = () => {
      console.log('Admin WebSocket disconnected')
      // Reconnect after 5 seconds
      setTimeout(initializeWebSocket, 5000)
    }

    wsRef.current = ws
  }

  const fetchInitialData = async () => {
    try {
      const [metricsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/realtime/metrics'),
        fetch('/api/admin/realtime/alerts')
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
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
      {/* System Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              metrics?.systemHealth === 'healthy' ? 'bg-green-400' : 
              metrics?.systemHealth === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className={getSystemHealthColor(metrics?.systemHealth || 'healthy')}>
              System {metrics?.systemHealth || 'Unknown'}
            </span>
            <span className="text-gray-400 text-sm ml-4">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Security Center
          </Button>
          <Button variant="solana" size="sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {metrics?.alertCount || 0} Alerts
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={metrics?.activeUsers || 0}
          icon={Users}
          trend="+12%"
          color="from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Online Admins"
          value={metrics?.onlineAdmins || 0}
          icon={Shield}
          trend="+1"
          color="from-green-500 to-green-600"
        />
        <MetricCard
          title="Pending Claims"
          value={metrics?.pendingClaims || 0}
          icon={DollarSign}
          trend="-5%"
          color="from-yellow-500 to-yellow-600"
        />
        <MetricCard
          title="Suspicious Activity"
          value={metrics?.suspiciousActivity || 0}
          icon={AlertTriangle}
          trend="0"
          color="from-red-500 to-red-600"
        />
      </div>

      {/* Performance Metrics */}
      {metrics?.performanceMetrics && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <PerformanceMetric
                label="Response Time"
                value={`${metrics.performanceMetrics.responseTime}ms`}
                status={metrics.performanceMetrics.responseTime < 200 ? 'good' : 'warning'}
              />
              <PerformanceMetric
                label="Error Rate"
                value={`${metrics.performanceMetrics.errorRate}%`}
                status={metrics.performanceMetrics.errorRate < 1 ? 'good' : 'warning'}
              />
              <PerformanceMetric
                label="CPU Usage"
                value={`${metrics.performanceMetrics.cpuUsage}%`}
                status={metrics.performanceMetrics.cpuUsage < 70 ? 'good' : 'warning'}
              />
              <PerformanceMetric
                label="Memory Usage"
                value={`${metrics.performanceMetrics.memoryUsage}%`}
                status={metrics.performanceMetrics.memoryUsage < 80 ? 'good' : 'warning'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admin Actions */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.recentActions?.slice(0, 5).map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(action.severity)}`} />
                    <div>
                      <p className="text-white text-sm font-medium">{action.action}</p>
                      <p className="text-gray-400 text-xs">
                        by Admin {action.adminId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {alerts.slice(0, 5).map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-red-400 text-sm font-medium">{alert.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{alert.description}</p>
                      </div>
                      <span className="text-red-500 text-xs">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper Components
function MetricCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-6 rounded-lg glass-effect"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`text-sm font-medium ${
          trend.startsWith('+') ? 'text-green-400' : 
          trend.startsWith('-') ? 'text-red-400' : 'text-gray-400'
        }`}>
          {trend}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
    </motion.div>
  )
}

function PerformanceMetric({ label, value, status }: any) {
  return (
    <div className="text-center">
      <div className={`inline-flex items-center gap-1 text-sm ${
        status === 'good' ? 'text-green-400' : 'text-yellow-400'
      }`}>
        {status === 'good' ? 
          <CheckCircle2 className="w-4 h-4" /> : 
          <Info className="w-4 h-4" />
        }
        {label}
      </div>
      <p className="text-lg font-bold text-white mt-1">{value}</p>
    </div>
  )
}