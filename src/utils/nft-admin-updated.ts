// /utils/nft-admin-updated.ts
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

/**
 * Admin utility to create NFT pass collection (using existing schema)
 */
export async function createNFTPassCollection() {
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed')
    
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      throw new Error('Admin wallet not configured')
    }

    const adminWallet = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(adminPrivateKey))
    )

    // Get or create admin user
    const adminUser = await prisma.user.upsert({
      where: { walletAddress: adminWallet.publicKey.toString() },
      update: { isAdmin: true },
      create: {
        walletAddress: adminWallet.publicKey.toString(),
        isAdmin: true,
        totalPoints: 100000,
        totalEarnedTokens: 0
      }
    })

    const metadata = {
      name: 'CONNECT Pass',
      symbol: 'CPASS',
      uri: 'https://your-metadata-uri.com/nft-pass.json',
      description: 'NFT pass required for CONNECT token claiming'
    }

    const mintAddress = await createAndMintNftCollection(
      connection,
      adminWallet,
      metadata
    )

    // Store NFT collection in database
    await prisma.nftCollection.create({
      data: {
        mintAddress: mintAddress.toBase58(),
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        uri: metadata.uri,
        supply: 1000,
        createdBy: adminUser.id,
        metadata: metadata
      }
    })

    console.log('NFT Pass Collection Created!')
    console.log('Mint Address:', mintAddress.toBase58())
    console.log('Add this to your .env.local as NEXT_PUBLIC_NFT_MINT_ADDRESS')

    return mintAddress.toBase58()
  } catch (error) {
    console.error('Error creating NFT pass collection:', error)
    throw error
  }
}

/**
 * Admin utility to create initial airdrop season
 */
export async function createInitialAirdropSeason(adminUserId: string) {
  try {
    // End any existing active seasons
    await prisma.airdropSeason.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'ENDED' }
    })

    const season = await prisma.airdropSeason.create({
      data: {
        name: 'Season 1 Airdrop',
        description: 'First season of CONNECT token airdrop',
        status: 'ACTIVE',
        totalAllocation: BigInt(400000000), // 400M tokens
        nftPassRequired: true,
        requireApproval: false,
        feeAmount: 4.00,
        createdBy: adminUserId
      }
    })

    console.log('Initial airdrop season created:', season.id)
    return season
  } catch (error) {
    console.error('Error creating airdrop season:', error)
    throw error
  }
}

/**
 * Admin utility to initialize system settings using existing SystemConfig
 */
export async function initializeSystemSettings() {
  try {
    const defaultSettings = [
      { key: 'claimingEnabled', value: false, description: 'Enable/disable token claiming globally' },
      { key: 'nftPassRequired', value: true, description: 'Require NFT pass for token claims' },
      { key: 'requireApproval', value: false, description: 'Require admin approval for claims' },
      { key: 'minimumSolBalance', value: 0.01, description: 'Minimum SOL balance required' },
      { key: 'claimFeeSOL', value: 0.001, description: 'SOL fee for token claims' },
      { key: 'minimumConnectTokens', value: 100, description: 'Minimum tokens required to claim' },
      { key: 'cooldownPeriod', value: 24, description: 'Cooldown period in hours' },
      { key: 'dailyLimit', value: 10000, description: 'Daily claim limit per user' },
      { key: 'kycRequired', value: false, description: 'Require KYC verification' },
      { 
        key: 'requiredNftPasses', 
        value: [process.env.NEXT_PUBLIC_NFT_MINT_ADDRESS || ''], 
        description: 'Array of required NFT pass mint addresses' 
      }
    ]

    for (const setting of defaultSettings) {
      await prisma.systemConfig.upsert({
        where: { key: setting.key },
        update: { 
          description: setting.description
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description
        }
      })
    }

    console.log('System settings initialized successfully!')
  } catch (error) {
    console.error('Error initializing system settings:', error)
    throw error
  }
}

/**
 * Admin utility to set up initial admin user
 */
export async function setupAdminUser(walletAddress: string, email?: string) {
  try {
    const adminUser = await prisma.user.upsert({
      where: { walletAddress },
      update: { 
        isAdmin: true
      },
      create: {
        walletAddress,
        email: email || `admin@${walletAddress.slice(0, 8)}.local`,
        isAdmin: true,
        totalPoints: 100000,
        totalEarnedTokens: 0,
        level: 10,
        twitterActivity: 'HIGH'
      }
    })

    console.log('Admin user created/updated:', adminUser.id)
    return adminUser
  } catch (error) {
    console.error('Error setting up admin user:', error)
    throw error
  }
}

/**
 * Admin utility to bulk approve users for NFT claiming
 */
export async function bulkApproveUsers(userIds: string[], adminId: string) {
  try {
    const operations = userIds.map(userId => 
      prisma.nftClaimApproval.upsert({
        where: { userId },
        update: { 
          approved: true, 
          approvedBy: adminId,
          approvedAt: new Date()
        },
        create: {
          userId,
          approved: true,
          approvedBy: adminId,
          approvedAt: new Date()
        }
      })
    )

    await Promise.all(operations)

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'BULK_APPROVED_USERS',
        metadata: {
          userIds,
          count: userIds.length,
          timestamp: new Date().toISOString()
        },
        ipAddress: 'system'
      }
    })

    console.log(`Bulk approved ${userIds.length} users`)
  } catch (error) {
    console.error('Error bulk approving users:', error)
    throw error
  }
}

/**
 * Admin utility to get claiming statistics
 */
export async function getClaimingStats() {
  try {
    const [
      totalUsers,
      eligibleUsers,
      approvedUsers,
      totalAirdropClaims,
      totalNFTPassClaims,
      totalTokensClaimed,
      totalFeesCollected,
      currentSeason
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          AND: [
            { twitterId: { not: null } },
            { walletAddress: { not: '' } },
            { totalPoints: { gte: 100 } }
          ]
        }
      }),
      prisma.nftClaimApproval.count({ where: { approved: true } }),
      prisma.airdropClaim.count(),
      prisma.claim.count({ where: { type: 'NFT_PASS' } }),
      prisma.airdropClaim.aggregate({
        _sum: { tokens: true },
        where: { status: 'COMPLETED' }
      }).then(result => result._sum.tokens || 0),
      prisma.claim.aggregate({
        _sum: { feesPaid: true },
        where: { status: 'COMPLETED' }
      }).then(result => result._sum.feesPaid || 0),
      prisma.airdropSeason.findFirst({
        where: { status: 'ACTIVE' }
      })
    ])

    return {
      totalUsers,
      eligibleUsers,
      approvedUsers,
      totalAirdropClaims,
      totalNFTPassClaims,
      totalTokensClaimed,
      totalFeesCollected: parseFloat(totalFeesCollected.toString()),
      currentSeason: currentSeason ? {
        id: currentSeason.id,
        name: currentSeason.name,
        status: currentSeason.status,
        totalAllocation: Number(currentSeason.totalAllocation),
        claimedAmount: Number(currentSeason.claimedAmount),
        claimedPercentage: currentSeason.totalAllocation > 0 ? 
          (Number(currentSeason.claimedAmount) / Number(currentSeason.totalAllocation)) * 100 : 0
      } : null
    }
  } catch (error) {
    console.error('Error getting claiming stats:', error)
    throw error
  }
}

/**
 * Complete setup script for existing schema
 */
export async function setupNFTClaimingSystemExisting() {
  console.log('🚀 Setting up NFT Claiming System with existing schema...')

  try {
    // 1. Setup admin user first
    const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS || 
                              process.env.ADMIN_PRIVATE_KEY ? 
                               Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.ADMIN_PRIVATE_KEY!))).publicKey.toString() : 
                              null

    if (!adminWalletAddress) {
      throw new Error('Admin wallet address not configured')
    }

    console.log('1. Setting up admin user...')
    const adminUser = await setupAdminUser(adminWalletAddress)
    
    // 2. Create NFT Pass Collection
    console.log('2. Creating NFT Pass Collection...')
    const mintAddress = await createNFTPassCollection()
    
    // 3. Initialize system settings
    console.log('3. Initializing system settings...')
    await initializeSystemSettings()
    
    // 4. Create initial airdrop season
    console.log('4. Creating initial airdrop season...')
    await createInitialAirdropSeason(adminUser.id)

    console.log('✅ NFT Claiming System setup complete!')
    console.log('📝 Next steps:')
    console.log('1. Add the mint address to your .env.local file:')
    console.log(`   NEXT_PUBLIC_NFT_MINT_ADDRESS=${mintAddress}`)
    console.log('2. Update your metadata URI with actual NFT metadata')
    console.log('3. Access /admin to enable claiming when ready')
    console.log('4. Test the system on devnet before going to mainnet')

    return { success: true, mintAddress, adminUserId: adminUser.id }
  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  }
}

/**
 * Utility to enable claiming for testing
 */
export async function enableClaimingForTesting() {
  try {
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: { status: 'ACTIVE' }
    })

    if (currentSeason) {
      // Update season to enable claiming
      await prisma.airdropSeason.update({
        where: { id: currentSeason.id },
        data: { 
          status: 'ACTIVE',
          nftPassRequired: true,
          requireApproval: false
        }
      })

      // Update system config
      await prisma.systemConfig.upsert({
        where: { key: 'claimingEnabled' },
        update: { value: true },
        create: { key: 'claimingEnabled', value: true }
      })

      console.log('✅ Claiming enabled for testing!')
    } else {
      console.log('❌ No active season found')
    }
  } catch (error) {
    console.error('Error enabling claiming:', error)
    throw error
  }
}

