import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL! || 'https://api.devnet.solana.com'
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!
const AIRDROP_WALLET = process.env.NEXT_PUBLIC_AIRDROP_WALLET_ADDRESS!
const PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY!

export const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

export const getAirdropKeypair = () => {
  if (!PRIVATE_KEY) {
    throw new Error('Airdrop wallet private key not configured')
  }
  const secretKey = Uint8Array.from(JSON.parse(PRIVATE_KEY))
  return Keypair.fromSecretKey(secretKey)
}

export const validateSolanaAddress = (address: string): boolean => {
  console.log('🔍 Validating Solana address:', address)
  
  try {
    if (!address || typeof address !== 'string') {
      console.log('❌ Invalid address type or empty')
      return false
    }

    // Trim whitespace
    const trimmedAddress = address.trim()
    if (trimmedAddress.length === 0) {
      console.log('❌ Empty address after trim')
      return false
    }

    // Check basic format (Base58, correct length)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedAddress)) {
      console.log('❌ Address format validation failed')
      return false
    }

    // Validate with Solana PublicKey
    new PublicKey(trimmedAddress)
    console.log('✅ Solana address validation passed')
    return true
    
  } catch (error) {
    console.error('❌ Solana address validation error:', error)
    return false
  }
}

export const getSolanaBalance = async (address: string): Promise<number> => {
  try {
    const publicKey = new PublicKey(address)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error('Error getting balance:', error)
    return 0
  }
}

export const getTokenBalance = async (walletAddress: string): Promise<number> => {
  try {
    if (!TOKEN_MINT) throw new Error('Token mint not configured')
    
    const wallet = new PublicKey(walletAddress)
    const mint = new PublicKey(TOKEN_MINT)
    const tokenAccount = await getAssociatedTokenAddress(mint, wallet)
    
    const accountInfo = await getAccount(connection, tokenAccount)
    const decimals = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '9')
    return Number(accountInfo.amount) / Math.pow(10, decimals)
  } catch (error) {
    console.error('Error getting token balance:', error)
    return 0
  }
}

export const createTokenTransfer = async (
  recipientAddress: string,
  amount: number
): Promise<string> => {
  try {
    if (!TOKEN_MINT || !AIRDROP_WALLET) {
      throw new Error('Token mint or airdrop wallet not configured')
    }

    const airdropKeypair = getAirdropKeypair()
    const recipient = new PublicKey(recipientAddress)
    const mint = new PublicKey(TOKEN_MINT)
    const decimals = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '9')
    const adjustedAmount = amount * Math.pow(10, decimals)

    // Get or create associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mint,
      airdropKeypair.publicKey
    )
    const toTokenAccount = await getAssociatedTokenAddress(mint, recipient)

    const transaction = new Transaction()

    // Check if recipient token account exists
    try {
      await getAccount(connection, toTokenAccount)
    } catch {
      // Create associated token account for recipient
      transaction.add(
        createAssociatedTokenAccountInstruction(
          airdropKeypair.publicKey,
          toTokenAccount,
          recipient,
          mint
        )
      )
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        airdropKeypair.publicKey,
        BigInt(adjustedAmount),
        [],
        TOKEN_PROGRAM_ID
      )
    )

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [airdropKeypair],
      {
        commitment: 'confirmed',
      }
    )

    return signature
  } catch (error) {
    console.error('Error creating token transfer:', error)
    throw error
  }
}

export const createSolTransfer = async (
  recipientAddress: string,
  amount: number
): Promise<string> => {
  try {
    const airdropKeypair = getAirdropKeypair()
    const recipient = new PublicKey(recipientAddress)
    const lamports = amount * LAMPORTS_PER_SOL

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: airdropKeypair.publicKey,
        toPubkey: recipient,
        lamports,
      })
    )

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [airdropKeypair],
      {
        commitment: 'confirmed',
      }
    )

    return signature
  } catch (error) {
    console.error('Error creating SOL transfer:', error)
    throw error
  }
}

export const getTransactionStatus = async (signature: string) => {
  try {
    const status = await connection.getSignatureStatus(signature)
    return {
      confirmed: status.value?.confirmationStatus === 'confirmed',
      finalized: status.value?.confirmationStatus === 'finalized',
      err: status.value?.err,
    }
  } catch (error) {
    console.error('Error getting transaction status:', error)
    return null
  }
}

export const estimateTransactionFee = async (): Promise<number> => {
  try {
    const recentBlockhash = await connection.getLatestBlockhash()
    const fees = await connection.getFeeForMessage(
      {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        staticAccountKeys: [
            //@ts-ignore
          PublicKey.default.toString(),
           //@ts-ignore
          PublicKey.default.toBase58(),
        ],
        recentBlockhash: recentBlockhash.blockhash,
        compiledInstructions: [{
          programIdIndex: 0,
          accountKeyIndexes: [0, 1],
          data: new Uint8Array(0),
        }],
        addressTableLookups: [],
      },
      'confirmed'
    )
    return (fees?.value || 5000) / LAMPORTS_PER_SOL
  } catch {
    return 0.000005 // Default fee
  }
}