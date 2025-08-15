// app/api/admin/auth-system/route.ts - Admin Auth System Management
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { authSystemManager, AuthSystem } from '@/lib/auth-system-config'
import { twitterMonitor } from '@/lib/twitter-monitor-enhanced'
import prisma from '@/lib/prisma'
import { handleConfigUpdate, handleMigrationStatus, handleSystemSwitch, handleSystemTest } from '@/lib/auth-system'

// GET - Get current auth system status
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const config = authSystemManager.getConfig()
    const stats = await authSystemManager.getSystemStats()

    return NextResponse.json({
      success: true,
      config,
      stats,
      availableSystems: ['LEGACY', 'BETTER_AUTH'],
      features: {
        legacy: [
          'OAuth 2.0 Flow',
          'Basic Monitoring', 
          'Webhook Support',
          'Point Awarding'
        ],
        betterAuth: [
          'Enhanced Session Management',
          'Advanced Monitoring',
          'Two-Factor Authentication',
          'Admin Plugin',
          'Real-time Analytics',
          'Better Error Handling'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error getting auth system status:', error)
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    )
  }
}

// POST - Switch auth system or update configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { action, targetSystem, options } = await req.json()

    switch (action) {
      case 'SWITCH_SYSTEM':
        return await handleSystemSwitch(targetSystem, session.user.id)
      
      case 'TEST_SYSTEM':
        return await handleSystemTest(targetSystem)
      
      case 'MIGRATION_STATUS':
        return await handleMigrationStatus()
      
      case 'UPDATE_CONFIG':
        return await handleConfigUpdate(options, session.user.id)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in auth system management:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}


// PUT - Force refresh monitoring
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req)
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { action } = await req.json()

    if (action === 'REFRESH_MONITORING') {
      console.log('🔄 Admin forcing monitoring refresh...')
      
      // Stop current monitoring
      await twitterMonitor.stopAllMonitoring()
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Restart monitoring
      await twitterMonitor.startGlobalMonitoring()

      return NextResponse.json({
        success: true,
        message: 'Monitoring system refreshed',
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error refreshing monitoring:', error)
    return NextResponse.json(
      { error: 'Failed to refresh monitoring' },
      { status: 500 }
    )
  }
}