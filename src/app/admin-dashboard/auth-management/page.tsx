'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/swtich'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Settings, 
  Users, 
  Activity, 
  Shield, 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Twitter,
  Database,
  Monitor
} from 'lucide-react'
import { toast } from 'sonner'

interface AuthSystemConfig {
  current: 'LEGACY' | 'BETTER_AUTH'
  legacy: {
    enabled: boolean
    features: {
      monitoring: boolean
      webhooks: boolean
      oauth2: boolean
    }
  }
  betterAuth: {
    enabled: boolean
    features: {
      enhancedMonitoring: boolean
      sessionManagement: boolean
      twoFactor: boolean
      adminPlugin: boolean
    }
  }
  migration: {
    inProgress: boolean
    usersMigrated: number
    totalUsers: number
    startedAt?: string
    completedAt?: string
  }
}

interface SystemStats {
  currentSystem: string
  usersWithTwitter: number
  activeMonitoring: number
  systemUptime: number
  migrationStatus: any
}

export default function AuthSystemDashboard() {
  const [config, setConfig] = useState<AuthSystemConfig | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    loadSystemData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadSystemData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSystemData = async () => {
    try {
      const response = await fetch('/api/admin/auth-system')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load system data:', error)
      toast.error('Failed to load system data')
    } finally {
      setLoading(false)
    }
  }

  const switchSystem = async (targetSystem: 'LEGACY' | 'BETTER_AUTH') => {
    if (switching) return

    setSwitching(true)
    try {
      const response = await fetch('/api/admin/auth-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SWITCH_SYSTEM',
          targetSystem
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Successfully switched to ${targetSystem}`)
        await loadSystemData()
      } else {
        toast.error(`Failed to switch: ${data.error}`)
      }
    } catch (error) {
      console.error('Switch error:', error)
      toast.error('Failed to switch auth system')
    } finally {
      setSwitching(false)
    }
  }

  const testSystem = async (system: 'LEGACY' | 'BETTER_AUTH') => {
    setTesting(system)
    try {
      const response = await fetch('/api/admin/auth-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_SYSTEM',
          targetSystem: system
        })
      })

      const data = await response.json()
      setTestResults({ [system]: data })

      if (data.summary.success) {
        toast.success(`${system} system test passed`)
      } else {
        toast.warning(`${system} system test failed`)
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Failed to test system')
    } finally {
      setTesting(null)
    }
  }

  const refreshMonitoring = async () => {
    try {
      const response = await fetch('/api/admin/auth-system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REFRESH_MONITORING' })
      })

      if (response.ok) {
        toast.success('Monitoring system refreshed')
        await loadSystemData()
      } else {
        toast.error('Failed to refresh monitoring')
      }
    } catch (error) {
      console.error('Refresh error:', error)
      toast.error('Failed to refresh monitoring')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!config || !stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>System Error</AlertTitle>
        <AlertDescription>Failed to load auth system configuration</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authentication System Manager</h1>
          <p className="text-gray-600 mt-2">Manage and switch between authentication systems</p>
        </div>
        <Button onClick={loadSystemData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Current System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{config.current}</div>
              <div className="text-sm text-gray-600">Active System</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.usersWithTwitter}</div>
              <div className="text-sm text-gray-600">Connected Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.activeMonitoring}</div>
              <div className="text-sm text-gray-600">Active Monitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(stats.systemUptime / 3600)}h
              </div>
              <div className="text-sm text-gray-600">System Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Status */}
      {config.migration.inProgress && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertTitle>Migration in Progress</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <Progress 
                value={(config.migration.usersMigrated / config.migration.totalUsers) * 100} 
                className="w-full"
              />
              <div className="text-sm mt-1">
                {config.migration.usersMigrated} / {config.migration.totalUsers} users migrated
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs  className="w-full" value={''} onValueChange={function (value: string): void {
        throw new Error('Function not implemented.')
      } } children={undefined}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Legacy System */}
            <Card className={config.current === 'LEGACY' ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Legacy System
                  </div>
                  {config.current === 'LEGACY' && (
                    <Badge variant="default">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Traditional OAuth 2.0 implementation with basic monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OAuth 2.0 Flow</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Basic Monitoring</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Webhook Support</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Point Awarding</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => switchSystem('LEGACY')}
                    disabled={config.current === 'LEGACY' || switching}
                    className="flex-1"
                  >
                    {switching ? 'Switching...' : 'Switch to Legacy'}
                  </Button>
                  <Button
                    onClick={() => testSystem('LEGACY')}
                    disabled={testing === 'LEGACY'}
                    variant="outline"
                    size="sm"
                  >
                    {testing === 'LEGACY' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Better Auth System */}
            <Card className={config.current === 'BETTER_AUTH' ? 'ring-2 ring-green-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Better Auth System
                  </div>
                  {config.current === 'BETTER_AUTH' && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Enhanced authentication with advanced features and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enhanced Sessions</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Advanced Monitoring</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Two-Factor Auth</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admin Plugin</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Analytics</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => switchSystem('BETTER_AUTH')}
                    disabled={config.current === 'BETTER_AUTH' || switching}
                    className="flex-1"
                  >
                    {switching ? 'Switching...' : 'Switch to Better Auth'}
                  </Button>
                  <Button
                    onClick={() => testSystem('BETTER_AUTH')}
                    disabled={testing === 'BETTER_AUTH'}
                    variant="outline"
                    size="sm"
                  >
                    {testing === 'BETTER_AUTH' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Twitter Monitoring Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeMonitoring}</div>
                  <div className="text-sm text-blue-700">Active Monitors</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.usersWithTwitter}</div>
                  <div className="text-sm text-green-700">Connected Accounts</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">98.5%</div>
                  <div className="text-sm text-purple-700">System Uptime</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={refreshMonitoring} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Monitoring
                </Button>
                <Button onClick={() => toast.info('Feature coming soon')} variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Monitoring
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <div className="space-y-4">
            {testResults && Object.entries(testResults).map(([system, results]: [string, any]) => (
              <Card key={system}>
                <CardHeader>
                  <CardTitle>{system} Test Results</CardTitle>
                  <CardDescription>
                    {results.summary.passed}/{results.summary.total} tests passed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.testResults.tests.map((test: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{test.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{test.details}</span>
                          {test.status === 'PASS' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent authentication system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Logs will appear here when events occur</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}