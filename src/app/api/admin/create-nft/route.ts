// /api/admin/create-nft/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { metadata, initialSupply, adminWallet } = await req.json()

    // Validation
    if (!metadata?.name || !metadata?.symbol || !metadata?.uri) {
      return NextResponse.json({ error: 'Missing required metadata fields' }, { status: 400 })
    }

    if (!initialSupply || initialSupply < 1) {
      return NextResponse.json({ error: 'Invalid initial supply' }, { status: 400 })
    }

    // Create connection
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed')
    
    // Get admin wallet from environment
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      return NextResponse.json({ error: 'Admin wallet not configured' }, { status: 500 })
    }

    const adminWalletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(adminPrivateKey))
    )

    // Create NFT collection
    const mintAddress = await createAndMintNftCollection(
      connection,
      adminWalletKeypair,
      metadata
    )

    // Save to database
    await prisma.nftCollection.create({
      data: {
        mintAddress: mintAddress.toBase58(),
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description || '',
        uri: metadata.uri,
        supply: initialSupply,
        createdBy: session.user.id,
        metadata: JSON.stringify(metadata)
      }
    })

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'NFT_COLLECTION_CREATED',
        metadata: {
          mintAddress: mintAddress.toBase58(),
          collectionName: metadata.name,
          initialSupply,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      mintAddress: mintAddress.toBase58(),
      message: 'NFT collection created successfully'
    })

  } catch (error: any) {
    console.error('Create NFT error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create NFT collection' },
      { status: 500 }
    )
  }
}












