// /app/api/nft-claims/paid-mint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { 
  createSignerFromKeypair, 
  signerIdentity, 
  generateSigner, 
  percentAmount 
} from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token"
import prisma from '@/lib/prisma'
import axios from 'axios'
import { generatePaymentTransaction, processPaidMint } from '@/lib/claim-nft'

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
const ADMIN_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY! // Admin wallet private key
// const NFT_IMAGE_URL = "https://devnet.irys.xyz/2L1yiTEdYuV8qU88yGfU4eLqTzaETrF1bv5p5RF7vuu4"
const NDT_IMAGE_URL="https://node1.irys.xyz/MuZo1TfkRG39InK5rQVlK34z-laR7Q4FaWUGvmBjugs"
// Initialize connections
const connection = new Connection(RPC_ENDPOINT, 'confirmed')
const umi = createUmi(RPC_ENDPOINT)

if (!ADMIN_PRIVATE_KEY) {
  throw new Error('SOLANA_PRIVATE_KEY environment variable is required')
}

const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(String(ADMIN_PRIVATE_KEY)))
)

// Setup UMI with admin keypair
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(adminKeypair.secretKey)
const adminSigner = createSignerFromKeypair(umi, umiKeypair)
umi.use(signerIdentity(adminSigner))
umi.use(mplTokenMetadata())



/**
 * Generate payment transaction for user to sign
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { action, ...data } = await req.json()

    switch (action) {
      case 'generate_payment':
        return await generatePaymentTransaction(data.userWallet)
      
      case 'process_mint':
        return await processPaidMint(data.userWallet, data.paymentSignature, session.user.id)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('NFT minting API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

