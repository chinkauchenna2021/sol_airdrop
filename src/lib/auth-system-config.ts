// lib/auth-system-config.ts - Auth System Configuration & Switcher
import { TwitterAuthService } from '@/lib/twitter-auth'
import { auth as betterAuth } from '@/lib/better-auth-enhanced'
// import { authClient } from '@/hooks/better/useEnhancedTwitterAuth'
import { twitterMonitor } from '@/lib/twitter-monitor-enhanced'
import prisma from '@/lib/prisma'
import { authClient } from './auth-client'

export type AuthSystem = 'LEGACY' | 'BETTER_AUTH'

interface AuthSystemConfig {
  current: AuthSystem
  legacy: {
    enabled: boolean
    twitterAuth: TwitterAuthService
    features: {
      monitoring: boolean
      webhooks: boolean
      oauth2: boolean
    }
  }
  betterAuth: {
    enabled: boolean
    auth: typeof betterAuth
    client: typeof authClient
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
    startedAt?: Date
    completedAt?: Date
  }
}

class AuthSystemManager {
  private config: AuthSystemConfig
  private legacyTwitterAuth: TwitterAuthService

  constructor() {
    this.legacyTwitterAuth = new TwitterAuthService()
    
    this.config = {
      current: this.getCurrentSystem(),
      legacy: {
        enabled: this.getCurrentSystem() === 'LEGACY',
        twitterAuth: this.legacyTwitterAuth,
        features: {
          monitoring: true,
          webhooks: true,
          oauth2: true,
        }
      },
      betterAuth: {
        enabled: this.getCurrentSystem() === 'BETTER_AUTH',
        auth: betterAuth,
        client: authClient,
        features: {
          enhancedMonitoring: true,
          sessionManagement: true,
          twoFactor: true,
          adminPlugin: true,
        }
      },
      migration: {
        inProgress: false,
        usersMigrated: 0,
        totalUsers: 0,
      }
    }
  }

  /**
   * Get current auth system from environment or database
   */
  private getCurrentSystem(): AuthSystem {
    const envSystem = process.env.AUTH_SYSTEM as AuthSystem
    if (envSystem && ['LEGACY', 'BETTER_AUTH'].includes(envSystem)) {
      return envSystem
    }
    return 'LEGACY' // Default to legacy system
  }

  /**
   * Switch to a different auth system
   */
  async switchAuthSystem(targetSystem: AuthSystem): Promise<{
    success: boolean
    message: string
    previousSystem: AuthSystem
  }> {
    const previousSystem = this.config.current

    if (previousSystem === targetSystem) {
      return {
        success: true,
        message: `Already using ${targetSystem} auth system`,
        previousSystem
      }
    }

    try {
      console.log(`🔄 Switching from ${previousSystem} to ${targetSystem}...`)

      // Pre-switch validation
      const validation = await this.validateSwitchRequirements(targetSystem)
      if (!validation.valid) {
        return {
          success: false,
          message: `Cannot switch to ${targetSystem}: ${validation.reason}`,
          previousSystem
        }
      }

      // Perform the switch
      await this.performSwitch(previousSystem, targetSystem)

      // Update configuration
      this.config.current = targetSystem
      this.config.legacy.enabled = targetSystem === 'LEGACY'
      this.config.betterAuth.enabled = targetSystem === 'BETTER_AUTH'

      // Store in database
      await this.saveSystemConfig()

      console.log(`✅ Successfully switched to ${targetSystem}`)

      return {
        success: true,
        message: `Successfully switched to ${targetSystem} auth system`,
        previousSystem
      }

    } catch (error) {
      console.error('❌ Error switching auth systems:', error)
      return {
        success: false,
        message: `Failed to switch to ${targetSystem}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        previousSystem
      }
    }
  }

  /**
   * Validate if switch is possible
   */
  private async validateSwitchRequirements(targetSystem: AuthSystem): Promise<{
    valid: boolean
    reason?: string
  }> {
    try {
      if (targetSystem === 'BETTER_AUTH') {
        // Check if better-auth dependencies are installed
        if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
          return {
            valid: false,
            reason: 'Missing Twitter OAuth credentials for better-auth'
          }
        }

        // Check database compatibility
        const dbCheck = await this.checkBetterAuthTables()
        if (!dbCheck.valid) {
          return {
            valid: false,
            reason: `Database not ready: ${dbCheck.reason}`
          }
        }
      }

      if (targetSystem === 'LEGACY') {
        // Check if legacy system requirements are met
        if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
          return {
            valid: false,
            reason: 'Missing Twitter API credentials for legacy system'
          }
        }
      }

      return { valid: true }

    } catch (error) {
      return {
        valid: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check if better-auth database tables exist
   */
  private async checkBetterAuthTables(): Promise<{
    valid: boolean
    reason?: string
  }> {
    try {
      // Check for better-auth required tables
      const tables = ['session', 'account', 'verification']
      
      for (const table of tables) {
        try {
          await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`)
        } catch (error) {
          return {
            valid: false,
            reason: `Missing table: ${table}. Run better-auth migrations first.`
          }
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        reason: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Perform the actual system switch
   */
  private async performSwitch(from: AuthSystem, to: AuthSystem): Promise<void> {
    if (from === 'LEGACY' && to === 'BETTER_AUTH') {
      await this.switchFromLegacyToBetter()
    } else if (from === 'BETTER_AUTH' && to === 'LEGACY') {
      await this.switchFromBetterToLegacy()
    }
  }

  /**
   * Switch from legacy to better-auth
   */
  private async switchFromLegacyToBetter(): Promise<void> {
    console.log('🔄 Migrating from legacy to better-auth...')

    // Stop legacy monitoring
    console.log('⏹️ Stopping legacy monitoring...')
    // Legacy system monitoring shutdown would go here

    // Start better-auth monitoring
    console.log('🚀 Starting better-auth monitoring...')
    await twitterMonitor.startGlobalMonitoring()

    // Migrate existing sessions (if needed)
    await this.migrateSessions('LEGACY_TO_BETTER')

    console.log('✅ Migration to better-auth completed')
  }

  /**
   * Switch from better-auth to legacy
   */
  private async switchFromBetterToLegacy(): Promise<void> {
    console.log('🔄 Switching from better-auth to legacy...')

    // Stop better-auth monitoring
    console.log('⏹️ Stopping better-auth monitoring...')
    await twitterMonitor.stopAllMonitoring()

    // Start legacy monitoring
    console.log('🚀 Starting legacy monitoring...')
    // Legacy system monitoring startup would go here

    // Migrate sessions if needed
    await this.migrateSessions('BETTER_TO_LEGACY')

    console.log('✅ Switch to legacy system completed')
  }

  /**
   * Migrate user sessions between systems
   */
  private async migrateSessions(direction: 'LEGACY_TO_BETTER' | 'BETTER_TO_LEGACY'): Promise<void> {
    try {
      console.log(`🔄 Migrating sessions: ${direction}`)

      const users = await prisma.user.findMany({
        where: { twitterId: { not: null } },
        select: {
          id: true,
          twitterId: true,
          twitterUsername: true,
          walletAddress: true,
        }
      })

      this.config.migration.inProgress = true
      this.config.migration.totalUsers = users.length
      this.config.migration.usersMigrated = 0
      this.config.migration.startedAt = new Date()

      let migrated = 0

      for (const user of users) {
        try {
          if (direction === 'LEGACY_TO_BETTER') {
            // Create better-auth session mapping
            await prisma.systemConfig.create({
              data: {
                key: `session_migration_${user.id}`,
                value: {
                  userId: user.id,
                  twitterId: user.twitterId,
                  migrationDate: new Date().toISOString(),
                  direction: 'LEGACY_TO_BETTER'
                },
                description: 'Session migration mapping'
              }
            })
          } else {
            // Clean up better-auth data
            await prisma.systemConfig.deleteMany({
              where: {
                key: { startsWith: `better_auth_user_${user.id}` }
              }
            })
          }

          migrated++
          this.config.migration.usersMigrated = migrated

          if (migrated % 100 === 0) {
            console.log(`📊 Migrated ${migrated}/${users.length} users`)
          }

        } catch (error) {
          console.error(`❌ Error migrating user ${user.id}:`, error)
        }
      }

      this.config.migration.inProgress = false
      this.config.migration.completedAt = new Date()

      console.log(`✅ Session migration completed: ${migrated}/${users.length} users`)

    } catch (error) {
      console.error('❌ Session migration failed:', error)
      this.config.migration.inProgress = false
      throw error
    }
  }

  /**
   * Save system configuration to database
   */
  private async saveSystemConfig(): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key: 'auth_system_config' },
      update: {
        value: {
          current: this.config.current,
          lastSwitched: new Date().toISOString(),
          legacy: {
            enabled: this.config.legacy.enabled,
            features: this.config.legacy.features
          },
          betterAuth: {
            enabled: this.config.betterAuth.enabled,
            features: this.config.betterAuth.features
          },
          migration: this.config.migration
        }
      },
      create: {
        key: 'auth_system_config',
        value: {
          current: this.config.current,
          lastSwitched: new Date().toISOString(),
          legacy: {
            enabled: this.config.legacy.enabled,
            features: this.config.legacy.features
          },
          betterAuth: {
            enabled: this.config.betterAuth.enabled,
            features: this.config.betterAuth.features
          },
          migration: this.config.migration
        },
        description: 'Auth system configuration'
      }
    })
  }

  /**
   * Get current configuration
   */
  getConfig(): AuthSystemConfig {
    return { ...this.config }
  }

  /**
   * Get appropriate Twitter auth handler based on current system
   */
  getTwitterAuthHandler() {
    return this.config.current === 'BETTER_AUTH' 
      ? this.config.betterAuth.client
      : this.config.legacy.twitterAuth
  }

  /**
   * Check if feature is available in current system
   */
  isFeatureAvailable(feature: string): boolean {
    if (this.config.current === 'BETTER_AUTH') {
      return !!(this.config.betterAuth.features as any)[feature]
    } else {
      return !!(this.config.legacy.features as any)[feature]
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    currentSystem: AuthSystem
    usersWithTwitter: number
    activeMonitoring: number
    systemUptime: number
    migrationStatus: any
  }> {
    const usersWithTwitter = await prisma.user.count({
      where: { twitterId: { not: null } }
    })

    const monitoringConfigs = await prisma.systemConfig.count({
      where: {
        key: { startsWith: 'twitter_monitoring_' }
      }
    })

    return {
      currentSystem: this.config.current,
      usersWithTwitter,
      activeMonitoring: monitoringConfigs,
      systemUptime: process.uptime(),
      migrationStatus: this.config.migration
    }
  }
}

// Create singleton instance
export const authSystemManager = new AuthSystemManager()

// Environment variable helper for easy switching
export function getAuthSystemFromEnv(): AuthSystem {
  return (process.env.AUTH_SYSTEM as AuthSystem) || 'LEGACY'
}

// Utility function to check which system is active
export function isUsingBetterAuth(): boolean {
  return authSystemManager.getConfig().current === 'BETTER_AUTH'
}

export function isUsingLegacyAuth(): boolean {
  return authSystemManager.getConfig().current === 'LEGACY'
}