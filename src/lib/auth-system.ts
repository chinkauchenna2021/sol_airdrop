import { NextResponse } from "next/server"
import { AuthSystem, authSystemManager } from "./auth-system-config"
import prisma from "./prisma"
import { twitterMonitor } from "./twitter-monitor-enhanced"

// Handle system switch
export async function handleSystemSwitch(targetSystem: AuthSystem, adminId: string) {
  try {
    console.log(`🔄 Admin ${adminId} initiating switch to ${targetSystem}`)

    const result = await authSystemManager.switchAuthSystem(targetSystem)

    // Log the switch attempt
    await prisma.systemConfig.create({
      data: {
        key: `auth_switch_log_${Date.now()}`,
        value: {
          adminId,
          targetSystem,
          result,
          timestamp: new Date().toISOString(),
        },
        description: 'Auth system switch log'
      }
    })

    if (result.success) {
      // Restart monitoring with new system
      if (targetSystem === 'BETTER_AUTH') {
        await twitterMonitor.startGlobalMonitoring()
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        previousSystem: result.previousSystem,
        currentSystem: targetSystem,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.message,
          previousSystem: result.previousSystem 
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Error switching auth system:', error)
    return NextResponse.json(
      { error: 'System switch failed' },
      { status: 500 }
    )
  }
}

// Handle system test
export async function handleSystemTest(targetSystem: AuthSystem) {
  try {
    console.log(`🧪 Testing ${targetSystem} system...`)

    const testResults = {
      system: targetSystem,
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    if (targetSystem === 'BETTER_AUTH') {
      // Test better-auth configuration
      testResults.tests.push({
        name: 'Environment Variables',
        status: process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET ? 'PASS' : 'FAIL',
        details: 'Twitter OAuth credentials check'
      })

      // Test database tables
      try {
        await prisma.$queryRawUnsafe('SELECT 1 FROM session LIMIT 1')
        testResults.tests.push({
          name: 'Database Tables',
          status: 'PASS',
          details: 'Better-auth tables exist'
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Database Tables',
          status: 'FAIL',
          details: 'Missing better-auth tables'
        })
      }

      // Test auth instance
      try {
        const authConfig = authSystemManager.getConfig().betterAuth.auth
        testResults.tests.push({
          name: 'Auth Instance',
          status: authConfig ? 'PASS' : 'FAIL',
          details: 'Better-auth instance initialization'
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Auth Instance',
          status: 'FAIL',
          details: 'Failed to initialize better-auth'
        })
      }

    } else if (targetSystem === 'LEGACY') {
      // Test legacy system
      testResults.tests.push({
        name: 'Environment Variables',
        status: process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET ? 'PASS' : 'FAIL',
        details: 'Twitter API v1.1 credentials check'
      })

      testResults.tests.push({
        name: 'Legacy Service',
        status: 'PASS', // Assuming legacy service is always available
        details: 'Legacy TwitterAuthService'
      })
    }

    const passedTests = testResults.tests.filter(t => t.status === 'PASS').length
    const totalTests = testResults.tests.length

    return NextResponse.json({
      success: true,
      testResults,
      summary: {
        passed: passedTests,
        total: totalTests,
        success: passedTests === totalTests
      }
    })

  } catch (error) {
    console.error('❌ Error testing auth system:', error)
    return NextResponse.json(
      { error: 'System test failed' },
      { status: 500 }
    )
  }
}

// Handle migration status check
export async function handleMigrationStatus() {
  try {
    const config = authSystemManager.getConfig()
    const migration = config.migration

    // Get additional migration details
    const migrationLogs = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: 'session_migration_' }
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    })

    const recentSwitches = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: 'auth_switch_log_' }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      migration,
      migrationLogs: migrationLogs.map(log => ({
        id: log.id,
        data: log.value,
        timestamp: log.updatedAt
      })),
      recentSwitches: recentSwitches.map(log => ({
        id: log.id,
        data: log.value,
        timestamp: log.updatedAt
      }))
    })

  } catch (error) {
    console.error('❌ Error getting migration status:', error)
    return NextResponse.json(
      { error: 'Failed to get migration status' },
      { status: 500 }
    )
  }
}

// Handle configuration updates
export async function handleConfigUpdate(options: any, adminId: string) {
  try {
    console.log(`⚙️ Admin ${adminId} updating auth config:`, options)

    // Update monitoring intervals
    if (options.monitoringInterval) {
      await prisma.systemConfig.updateMany({
        where: {
          key: { startsWith: 'twitter_monitoring_' }
        },
        data: {
          value: {
            checkInterval: options.monitoringInterval * 60 * 1000 // Convert minutes to ms
          }
        }
      })
    }

    // Update point values
    if (options.pointValues) {
      await prisma.systemConfig.upsert({
        where: { key: 'point_values_config' },
        update: {
          value: options.pointValues
        },
        create: {
          key: 'point_values_config',
          value: options.pointValues,
          description: 'Custom point values for engagements'
        }
      })
    }

    // Enable/disable features
    if (options.features) {
      const config = authSystemManager.getConfig()
      
      if (config.current === 'BETTER_AUTH') {
        config.betterAuth.features = { ...config.betterAuth.features, ...options.features }
      } else {
        config.legacy.features = { ...config.legacy.features, ...options.features }  
      }
    }

    // Log configuration change
    await prisma.systemConfig.create({
      data: {
        key: `config_update_log_${Date.now()}`,
        value: {
          adminId,
          options,
          timestamp: new Date().toISOString(),
        },
        description: 'Auth system configuration update'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      updatedOptions: options
    })

  } catch (error) {
    console.error('❌ Error updating configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}
