import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { 
  createSignerFromKeypair, 
  signerIdentity, 
  generateSigner, 
  percentAmount,
  publicKey as umiPublicKey
} from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata, fetchMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { getOrCreateAssociatedTokenAccount, transfer, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import axios from 'axios'

export interface NFTMintResult {
  mintAddress: string
  createSignature: string
  transferSignature?: string
  recipient?: string
  metadata: {
    name: string
    symbol: string
    image: string
    description?: string
  }
}

export interface PaymentTransactionData {
  transaction: string
  requiredSol: number
  lamports: number
  solPrice: number
  adminWallet: string
  message: string
}

export class NFTMintingService {
  private connection: Connection
  private umi: any
  private adminKeypair: Keypair
  private adminSigner: any

  constructor(rpcEndpoint: string, adminPrivateKey: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed')
    this.umi = createUmi(rpcEndpoint)
    
    this.adminKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(adminPrivateKey))
    )
    
    // Setup UMI with admin keypair
    const umiKeypair = this.umi.eddsa.createKeypairFromSecretKey(this.adminKeypair.secretKey)
    this.adminSigner = createSignerFromKeypair(this.umi, umiKeypair)
    this.umi.use(signerIdentity(this.adminSigner))
    this.umi.use(mplTokenMetadata())
  }

  /**
   * Get current SOL price from CoinGecko
   */
  async getSolPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        { timeout: 5000 }
      )
      return response.data.solana.usd
    } catch (error) {
      console.error('Error fetching SOL price:', error)
      // Fallback price
      return 100
    }
  }

  /**
   * Calculate SOL amount needed for USD value
   */
  async calculateSolAmount(usdAmount: number): Promise<{ solAmount: number; solPrice: number }> {
    const solPrice = await this.getSolPrice()
    const solAmount = usdAmount / solPrice
    
    return {
      solAmount: parseFloat(solAmount.toFixed(6)),
      solPrice
    }
  }

  /**
   * Create payment transaction for user to sign
   */
  async createPaymentTransaction(
    userWallet: string, 
    usdAmount: number = 7
  ): Promise<PaymentTransactionData> {
    const { solAmount, solPrice } = await this.calculateSolAmount(usdAmount)
    const lamportsRequired = Math.floor(solAmount * LAMPORTS_PER_SOL)
    
    const userPublicKey = new PublicKey(userWallet)
    const adminWallet = this.adminKeypair.publicKey
    
    // Create payment transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: adminWallet,
        lamports: lamportsRequired,
      })
    )
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    
    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')
    
    return {
      transaction: serializedTransaction,
      requiredSol: solAmount,
      lamports: lamportsRequired,
      solPrice,
      adminWallet: adminWallet.toString(),
      message: `Please pay ${solAmount} SOL ($${usdAmount.toFixed(2)}) to mint your NFT`
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(signature: string, expectedLamports?: number): Promise<boolean> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      })
      
      if (!transaction) {
        console.log('Transaction not found:', signature)
        return false
      }
      
      if (transaction.meta?.err) {
        console.log('Transaction failed:', transaction.meta.err)
        return false
      }
      
      // Verify payment was to admin wallet
      const adminWallet = this.adminKeypair.publicKey
      const accountKeys = transaction.transaction.message.staticAccountKeys || []
      
      const adminIndex = accountKeys.findIndex(key => key.equals(adminWallet))
      if (adminIndex === -1) {
        console.log('Payment not sent to admin wallet')
        return false
      }
      
      // Check balance changes if expectedLamports provided
      if (expectedLamports && transaction.meta?.postBalances && transaction.meta?.preBalances) {
        const balanceChange = transaction.meta.postBalances[adminIndex] - transaction.meta.preBalances[adminIndex]
        if (balanceChange < expectedLamports * 0.95) { // Allow 5% tolerance
          console.log(`Insufficient payment: ${balanceChange} < ${expectedLamports}`)
          return false
        }
      }
      
      console.log('✅ Payment verified successfully')
      return true
    } catch (error) {
      console.error('Error verifying payment:', error)
      return false
    }
  }

  /**
   * Mint NFT using Metaplex
   */
  async mintNFT(
    name: string,
    symbol: string,
    imageUri: string,
    description?: string
  ): Promise<{ mintAddress: string; signature: string }> {
    const mint = generateSigner(this.umi)
    
    const createTx = await createNft(this.umi, {
      mint,
      name,
      symbol,
      uri: imageUri,
      sellerFeeBasisPoints: percentAmount(5, 2), // 5% royalty
      creators: [
        {
          address: this.adminSigner.publicKey,
          share: 100,
          verified: true,
        },
      ],
    })

    const result = await createTx.sendAndConfirm(this.umi)
    
    return {
      mintAddress: mint.publicKey.toString(),
      signature: result.signature.toString()
    }
  }

  /**
   * Transfer NFT to recipient
   */
  async transferNFT(
    mintAddress: string,
    recipientAddress: string
  ): Promise<string> {
    const mintPublicKey = new PublicKey(mintAddress)
    const recipientPublicKey = new PublicKey(recipientAddress)
    
    // Get or create token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.adminKeypair,
      mintPublicKey,
      this.adminKeypair.publicKey
    )

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.adminKeypair,
      mintPublicKey,
      recipientPublicKey
    )

    // Transfer the NFT
    const transferSignature = await transfer(
      this.connection,
      this.adminKeypair,
      fromTokenAccount.address,
      toTokenAccount.address,
      this.adminKeypair.publicKey,
      1 // NFT amount is always 1
    )

    return transferSignature
  }

  /**
   * Complete mint and transfer process
   */
  async mintAndTransferNFT(
    recipientAddress: string,
    nftNumber: number,
    imageUri: string
  ): Promise<NFTMintResult> {
    const name = `Connect Pass #${nftNumber}`
    const symbol = "$connect"
    const description = `Exclusive Connect Pass NFT #${nftNumber} - Your gateway to the Connect ecosystem`
    
    // Step 1: Mint NFT
    const mintResult = await this.mintNFT(name, symbol, imageUri, description)
    
    // Step 2: Transfer to recipient
    const transferSignature = await this.transferNFT(mintResult.mintAddress, recipientAddress)
    
    return {
      mintAddress: mintResult.mintAddress,
      createSignature: mintResult.signature,
      transferSignature,
      recipient: recipientAddress,
      metadata: {
        name,
        symbol,
        image: imageUri,
        description
      }
    }
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(mintAddress: string) {
    try {
      const mint = umiPublicKey(mintAddress)
      const metadata = await fetchMetadata(this.umi, mint)
      return metadata
    } catch (error) {
      console.error('Error fetching NFT metadata:', error)
      return null
    }
  }

  /**
   * Check if wallet owns specific NFT
   */
  async checkNFTOwnership(walletAddress: string, mintAddresses: string[]): Promise<boolean> {
    try {
      const wallet = new PublicKey(walletAddress)
      
      for (const mintAddress of mintAddresses) {
        const mint = new PublicKey(mintAddress)
        
        try {
          const tokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            this.adminKeypair, // Payer (not the owner)
            mint,
            wallet,
            false // Don't create if it doesn't exist
          )
          
          if (tokenAccount.amount > 0) {
            return true
          }
        } catch (error) {
          // Token account doesn't exist, continue checking other NFTs
          continue
        }
      }
      
      return false
    } catch (error) {
      console.error('Error checking NFT ownership:', error)
      return false
    }
  }

  /**
   * Get wallet's SOL balance
   */
  async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress)
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Error getting wallet balance:', error)
      return 0
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateTransactionFee(): Promise<number> {
    try {
      const recentBlockhash = await this.connection.getLatestBlockhash()
      const testTransaction = new Transaction()
      testTransaction.recentBlockhash = recentBlockhash.blockhash
      
      const fee = await this.connection.getFeeForMessage(
        testTransaction.compileMessage(),
        'confirmed'
      )
      
      return fee?.value || 5000 // Default fee in lamports
    } catch (error) {
      console.error('Error estimating transaction fee:', error)
      return 5000 // Default fee
    }
  }
}

// Utility functions for easier usage
export const nftUtils = {
  /**
   * Format SOL amount for display
   */
  formatSol(lamports: number): string {
    return (lamports / LAMPORTS_PER_SOL).toFixed(4)
  },

  /**
   * Format wallet address for display
   */
  formatWalletAddress(address: string, length: number = 8): string {
    if (address.length <= length * 2) return address
    return `${address.slice(0, length)}...${address.slice(-length)}`
  },

  /**
   * Validate Solana wallet address
   */
  isValidWalletAddress(address: string): boolean {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  },

  /**
   * Generate NFT metadata JSON
   */
  generateNFTMetadata(
    name: string,
    description: string,
    imageUri: string,
    attributes: Array<{ trait_type: string; value: string | number }> = []
  ) {
    return {
      name,
      description,
      image: imageUri,
      attributes: [
        ...attributes,
        {
          trait_type: "Collection",
          value: "Connect Pass"
        },
        {
          trait_type: "Created",
          value: new Date().toISOString().split('T')[0]
        }
      ],
      properties: {
        category: "image",
        files: [
          {
            uri: imageUri,
            type: "image/png"
          }
        ]
      }
    }
  },

  /**
   * Validate payment amount
   */
  validatePaymentAmount(amount: number, minAmount: number = 0.001): boolean {
    return amount >= minAmount && amount <= 10 // Max 10 SOL
  },

  /**
   * Get network explorer URL
   */
  getExplorerUrl(signature: string, network: string = 'mainnet'): string {
    const baseUrl = network === 'mainnet-beta' 
      ? 'https://solscan.io' 
      : 'https://solscan.io'
    
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`
    return `${baseUrl}/tx/${signature}${cluster}`
  }
}

export default NFTMintingService