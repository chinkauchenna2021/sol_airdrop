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

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
const ADMIN_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY // Admin wallet private key
const NFT_IMAGE_URL = "https://devnet.irys.xyz/2L1yiTEdYuV8qU88yGfU4eLqTzaETrF1bv5p5RF7vuu4"

// Initialize connections
const connection = new Connection(RPC_ENDPOINT, 'confirmed')
const umi = createUmi(RPC_ENDPOINT)

if (!ADMIN_PRIVATE_KEY) {
  throw new Error('SOLANA_PRIVATE_KEY environment variable is required')
}

const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY))
)

// Setup UMI with admin keypair
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(adminKeypair.secretKey)
const adminSigner = createSignerFromKeypair(umi, umiKeypair)
umi.use(signerIdentity(adminSigner))
umi.use(mplTokenMetadata())

/**
 * Get current SOL price and calculate amount needed for USD value
 */
export async function getSolAmountForUsd(usdAmount: number = 7) {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
    const solPrice = response.data.solana.usd
    const solAmount = usdAmount / solPrice
    
    return {
      solAmount: parseFloat(solAmount.toFixed(6)),
      solPrice: solPrice
    }
  } catch (error) {
    console.error('Error fetching SOL price:', error)
    // Fallback to approximate price if API fails
    return {
      solAmount: usdAmount / 100, // Approximate fallback
      solPrice: 100
    }
  }
}

/**
 * Generate payment transaction for user to sign
 */

export async function generatePaymentTransaction(userWallet: string) {
  try {
    // Check if user is approved
    const approval = await prisma.nftClaimApproval.findUnique({
      where: { 
        userId: userWallet // Assuming wallet address is used as userId
      }
    })

    if (!approval || !approval.approved) {
      return NextResponse.json({ 
        error: 'User not approved for NFT claiming' 
      }, { status: 403 })
    }

    // Get SOL amount for $7
    const { solAmount, solPrice } = await getSolAmountForUsd(7)
    const lamportsRequired = Math.floor(solAmount * LAMPORTS_PER_SOL)
    
    console.log(`SOL Price: $${solPrice}`)
    console.log(`Required SOL for $7: ${solAmount} SOL (${lamportsRequired} lamports)`)
    
    const userPublicKey = new PublicKey(userWallet)
    const adminWallet = adminKeypair.publicKey
    
    // Create payment transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: adminWallet,
        lamports: lamportsRequired,
      })
    )
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    
    // Serialize transaction for frontend
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')
    
    return NextResponse.json({
      success: true,
      transaction: serializedTransaction,
      requiredSol: solAmount,
      lamports: lamportsRequired,
      solPrice,
      adminWallet: adminWallet.toString(),
      message: `Please pay ${solAmount} SOL ($7.00) to mint your NFT`
    })

  } catch (error: any) {
    console.error('Error generating payment transaction:', error)
    return NextResponse.json({ 
      error: 'Failed to generate payment transaction' 
    }, { status: 500 })
  }
}

export async function processPaidMint(userWallet: string, paymentSignature: string, userId: string) {
  try {
    console.log(`Processing paid mint for ${userWallet}`)
    
    // Verify payment transaction
    const paymentVerified = await verifyPayment(paymentSignature)
    
    if (!paymentVerified) {
      return NextResponse.json({ 
        error: 'Payment verification failed' 
      }, { status: 400 })
    }

    // Wait for transaction finality
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate unique NFT number
    const nftCount = await prisma.nftClaim.count()
    const nftNumber = nftCount + 1
    
    // Mint and transfer NFT
    const result = await mintAndTransferNFT(userWallet, nftNumber)
    
    // Record the claim in database
    await prisma.nftClaim.create({
      data: {
        userId,
        userWallet,
        mintAddress: result.mintAddress,
        nftNumber,
        paymentSignature,
        createSignature: result.createSignature as any,
        transferSignature: result.transferSignature,
        status: 'COMPLETED',
        metadata: {
          name: `Connect Pass #${nftNumber}`,
          symbol: "$connect",
          image: NFT_IMAGE_URL,
          paymentAmount: 7, // USD
          solPrice: result.solPrice
        }
      }
    })

    // Update approval status to used
    await prisma.nftClaimApproval.update({
      where: { userId: userWallet },
      data: { 
        claimed: true,
        claimedAt: new Date()
      }
    })

    console.log('✅ Paid NFT mint completed successfully!')
    
    return NextResponse.json({
      success: true,
      mintAddress: result.mintAddress,
      nftNumber,
      createSignature: result.createSignature,
      transferSignature: result.transferSignature,
      message: `NFT #${nftNumber} minted and transferred successfully!`
    })

  } catch (error: any) {
    console.error('❌ Paid NFT mint failed:', error)
    
    // Record failed claim
    await prisma.nftClaim.create({
      data: {
        userId,
        userWallet,
        paymentSignature,
        status: 'FAILED',
        errorMessage: error.message
      }
    }).catch(console.error)

    return NextResponse.json({ 
      error: error.message || 'Failed to process NFT mint' 
    }, { status: 500 })
  }
}

export async function verifyPayment(signature: string): Promise<boolean> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed'
    })
    
    if (!transaction) {
      console.log('Transaction not found')
      return false
    }
    
    if (transaction.meta?.err) {
      console.log('Transaction failed:', transaction.meta.err)
      return false
    }
    
    // Additional verification: check if payment was to admin wallet
    const systemProgramIndex = transaction.transaction.message.accountKeys.findIndex(
      key => key.equals(SystemProgram.programId)
    )
    const transferInstruction = transaction.transaction.message.instructions.find(
      instruction => instruction.programIdIndex === systemProgramIndex
    )
    
    if (transferInstruction) {
      console.log('✅ Payment verified successfully')
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error verifying payment:', error)
    return false
  }
}

export async function mintAndTransferNFT(recipientAddress: string, nftNumber: number) {
  try {
    const mint = generateSigner(umi)
    
    // Step 1: Create/Mint NFT using UMI
    console.log(`Creating NFT ${nftNumber} for ${recipientAddress}...`)
    
    const createTx = await createNft(umi, {
      mint,
      name: `Connect Pass #${nftNumber}`,
      symbol: "$connect",
      uri: NFT_IMAGE_URL,
      sellerFeeBasisPoints: percentAmount(5, 2),
      creators: [
        {
          address: adminSigner.publicKey,
          share: 100,
          verified: true,
        },
      ],
    })

    const createResult = await createTx.sendAndConfirm(umi)
    console.log(`NFT ${nftNumber} created: ${mint.publicKey}`)

    // Step 2: Transfer NFT to recipient
    console.log(`Transferring NFT ${nftNumber} to ${recipientAddress}...`)
    
    const mintPublicKey = new PublicKey(mint.publicKey.toString())
    const recipientPublicKey = new PublicKey(recipientAddress)
    
    // Get or create token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminKeypair,
      mintPublicKey,
      adminKeypair.publicKey
    )

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminKeypair,
      mintPublicKey,
      recipientPublicKey
    )

    // Transfer the NFT
    const transferSignature = await transfer(
      connection,
      adminKeypair,
      fromTokenAccount.address,
      toTokenAccount.address,
      adminKeypair.publicKey,
      1
    )

    console.log(`✅ NFT ${nftNumber} transferred to ${recipientAddress}`)
    
    // Get current SOL price for record keeping
    const { solPrice } = await getSolAmountForUsd(7)
    
    return {
      mintAddress: mint.publicKey.toString(),
      createSignature: createResult.signature,
      transferSignature: transferSignature,
      recipient: recipientAddress,
      solPrice,
      success: true
    }
    
  } catch (error) {
    console.error(`Error minting/transferring NFT ${nftNumber}:`, error)
    throw error
  }
}