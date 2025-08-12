// /app/api/claim/process/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js'
import { createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import prisma from '@/lib/prisma'

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
const ADMIN_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY
const TOKEN_MINT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS

if (!ADMIN_PRIVATE_KEY || !TOKEN_MINT_ADDRESS) {
  throw new Error('Missing required environment variables for token claiming')
}

const connection = new Connection(RPC_ENDPOINT, 'confirmed')
const adminKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY)))
const tokenMint = new PublicKey(TOKEN_MINT_ADDRESS)

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { amount, walletAddress, hasNFTPass } = await req.json()

    if (!amount || !walletAddress) {
      return NextResponse.json({ error: 'Amount and wallet address required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        claims: {
          where: { status: 'COMPLETED' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check claim controls
    const controls = await prisma.systemConfig.findMany({
      where: {
        key: { in: ['claimingEnabled', 'minClaimAmount', 'maxClaimAmount'] }
      }
    })

    const controlsMap = controls.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, any>)

    if (!controlsMap.claimingEnabled) {
      return NextResponse.json({ error: 'Token claiming is currently disabled' }, { status: 403 })
    }

    if (amount < (controlsMap.minClaimAmount ?? 1)) {
      return NextResponse.json({ 
        error: `Minimum claim amount is ${controlsMap.minClaimAmount ?? 1}` 
      }, { status: 400 })
    }

    if (amount > (controlsMap.maxClaimAmount ?? 10000)) {
      return NextResponse.json({ 
        error: `Maximum claim amount is ${controlsMap.maxClaimAmount ?? 10000}` 
      }, { status: 400 })
    }

    // Check available balance
    const totalClaimed = user.claims.reduce((sum, claim) => sum + claim.amount, 0)
    const available = user.totalPoints - totalClaimed

    if (amount > available) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: ${available}` 
      }, { status: 400 })
    }

    // Apply NFT pass multiplier if applicable
    let finalAmount = amount
    let multiplier = 1.0
    if (hasNFTPass) {
      multiplier = 1.2 // 20% bonus for NFT pass holders
      finalAmount = Math.floor(amount * multiplier)
    }

    // Create claim record
    const claim = await prisma.claim.create({
      data: {
        userId: user.id,
        amount: finalAmount,
        type: 'TOKEN',
        status: 'PROCESSING',
        paymentMethod: 'SOLANA',
        metadata: {
          originalAmount: amount,
          multiplier,
          hasNFTPass,
          walletAddress
        }
      }
    })

    try {
      // Process token transfer
      const recipientWallet = new PublicKey(walletAddress)
      
      // Get token accounts
      const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        adminKeypair,
        tokenMint,
        adminKeypair.publicKey
      )

      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        adminKeypair,
        tokenMint,
        recipientWallet
      )

      // Create transfer transaction
      const transaction = new Transaction().add(
        createTransferInstruction(
          adminTokenAccount.address,
          recipientTokenAccount.address,
          adminKeypair.publicKey,
          finalAmount * Math.pow(10, 9), // Convert to token decimals
          [],
          TOKEN_PROGRAM_ID
        )
      )

      // Send transaction
      const signature = await connection.sendTransaction(transaction, [adminKeypair])
      await connection.confirmTransaction(signature, 'confirmed')

      // Update claim with success
      await prisma.claim.update({
        where: { id: claim.id },
        data: {
          status: 'COMPLETED',
          transactionHash: signature,
          feesPaid: 0 // No fees for token claims in this implementation
        }
      })

      return NextResponse.json({
        success: true,
        claimedAmount: finalAmount,
        transactionHash: signature,
        multiplier,
        message: `Successfully claimed ${finalAmount} CONNECT tokens!`
      })

    } catch (error: any) {
      // Update claim with failure
      await prisma.claim.update({
        where: { id: claim.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...claim.metadata as any,
            error: error.message
          }
        }
      })

      throw error
    }

  } catch (error: any) {
    console.error('Token claim processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process token claim' },
      { status: 500 }
    )
  }
}