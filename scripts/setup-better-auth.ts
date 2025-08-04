// import { PrismaClient } from '@prisma/client'
// import { AUTH_SYSTEM_CONFIG, initializeAuthSystem } from '../config/auth-system.config'

// const prisma = new PrismaClient()

// async function setupBetterAuth() {
//   console.log('🔧 Setting up Better Auth system...')

//   try {
//     // 1. Initialize auth system
//     const initResult = await initializeAuthSystem()
//     if (!initResult.success) {
//       throw new Error(initResult.message)
//     }

//     // 2. Ensure database tables exist
//     console.log('📊 Checking database tables...')
    
//     // Check if better-auth tables exist
//     try {
//       await prisma.$queryRawUnsafe('SELECT 1 FROM session LIMIT 1')
//       console.log('✅ Better Auth tables found')
//     } catch {
//       console.log('⚠️ Better Auth tables not found - they will be created automatically')
//     }

//     // 3. Setup system configurations
//     console.log('⚙️ Setting up system configurations...')
    
//     await prisma.systemConfig.upsert({
//       where: { key: 'auth_system_status' },
//       update: {
//         value: {
//           system: 'BETTER_AUTH',
//           setupDate: new Date().toISOString(),
//           features: AUTH_SYSTEM_CONFIG.BETTER_AUTH.features,
//           version: '1.0.0'
//         }
//       },
//       create: {
//         key: 'auth_system_status',
//         value: {
//           system: 'BETTER_AUTH',
//           setupDate: new Date().toISOString(),
//           features: AUTH_SYSTEM_CONFIG.BETTER_AUTH.features,
//           version: '1.0.0'
//         },
//         description: 'Better Auth system status and configuration'
//       }
//     })

//     // 4. Setup default monitoring configurations
//     console.log('📈 Setting up monitoring defaults...')
    
//     await prisma.systemConfig.upsert({
//       where: { key: 'monitoring_defaults' },
//       update: {
//         value: {
//           intervals: AUTH_SYSTEM_CONFIG.MONITORING.intervals,
//           batchSize: AUTH_SYSTEM_CONFIG.MONITORING.batchSize,
//           maxRetries: AUTH_SYSTEM_CONFIG.MONITORING.maxRetries,
//           pointSystem: AUTH_SYSTEM_CONFIG.POINTS
//         }
//       },
//       create: {
//         key: 'monitoring_defaults',
//         value: {
//           intervals: AUTH_SYSTEM_CONFIG.MONITORING.intervals,
//           batchSize: AUTH_SYSTEM_CONFIG.MONITORING.batchSize,
//           maxRetries: AUTH_SYSTEM_CONFIG.MONITORING.maxRetries,
//           pointSystem: AUTH_SYSTEM_CONFIG.POINTS
//         },
//         description: 'Default monitoring and point system configuration'
//       }
//     })

//     // 5. Create admin user if needed
//     const adminWallet = process.env.ADMIN_WALLET_ADDRESS
//     if (adminWallet) {
//       console.log('👨‍💼 Setting up admin user...')
      
//       await prisma.user.upsert({
//         where: { walletAddress: adminWallet },
//         update: { isAdmin: true },
//         create: {
//           walletAddress: adminWallet,
//           isAdmin: true,
//           totalPoints: 0,
//           referralCode: `ADMIN_${Date.now()}`
//         }
//       })
      
//       console.log('✅ Admin user configured')
//     }

//     console.log('🎉 Better Auth setup completed successfully!')
//     console.log('\n📝 Next steps:')
//     console.log('1. Set AUTH_SYSTEM=BETTER_AUTH in your environment')
//     console.log('2. Restart your application')
//     console.log('3. Visit /admin/auth-system to manage the system')
//     console.log('4. Test Twitter authentication flow')

//   } catch (error) {
//     console.error('❌ Setup failed:', error)
//     process.exit(1)
//   } finally {
//     await prisma.$disconnect()
//   }
// }

// // Run setup if called directly
// if (require.main === module) {
//   setupBetterAuth()
// }

// export { setupBetterAuth }
