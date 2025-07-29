import { Connection, PublicKey, LAMPORTS_PER_SOL,  Keypair } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  setAuthority,
} from "@solana/spl-token";
import axios from "axios";
import NodeCache from 'node-cache';
import rateLimit from 'axios-rate-limit';


const SHYFT_API_KEY = process.env.NEXT_PUBLIC_SHYFT_API_KEY;
const QUICKNODE_ENDPOINT = process.env.NEXT_PUBLIC_QUICKNODE_ENDPOINT;
const NFT_MINT_ADDRESS = process.env.NEXT_PUBLIC_NFT_MINT_ADDRESS;
const SERVICE_FEE_SOL = 4; // $4 worth of SOL

/**
 * Transfer NFT to user after verifying they have enough SOL to cover the fee
 * @param userWallet PublicKey of the user's wallet
 * @param connection Solana connection
 * @param fromWallet Keypair of the service wallet
 * @returns Transaction signature if successful, false otherwise
 */
export async function transferNftWithSolCheck(
  userWallet: PublicKey,
  connection: Connection,
  fromWallet: any // Keypair type from @solana/web3.js
): Promise<string | false> {
  try {
    // 1. Check user's SOL balance
    const balance = await connection.getBalance(userWallet);
    // const solBalance = balance / LAMPORTS_PER_SOL;
    
    // Current SOL price could be fetched from an API here for accurate $4 conversion
    const { solAmount } = await getSolAmountForUsd(4);
    const requiredLamports = solAmount * LAMPORTS_PER_SOL;
    // const requiredLamports = SERVICE_FEE_SOL * LAMPORTS_PER_SOL;
    
    if (balance < requiredLamports) {
      console.error("Insufficient SOL balance");
      return false;
    }

    // 2. Prepare NFT transfer
    const mint = new PublicKey(NFT_MINT_ADDRESS!);
    
    // Get or create token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mint,
      fromWallet.publicKey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mint,
      userWallet
    );

    // 3. Mint NFT to service account (if not already minted)
    await mintTo(
      connection,
      fromWallet,
      mint,
      fromTokenAccount.address,
      fromWallet,
      1
    );

    // 4. Transfer NFT to user
    const signature = await transfer(
      connection,
      fromWallet,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      1
    );

    return signature;
  } catch (error) {
    console.error("Error in transferNftWithSolCheck:", error);
    return false;
  }
}




/**
 * Check if a wallet contains at least one of the required NFTs
 * @param walletAddress PublicKey or string of the wallet to check
 * @param requiredNftMints Array of NFT mint addresses to check for
 * @param network Solana network (mainnet-beta, devnet, etc.)
 * @returns Boolean indicating if wallet has at least one required NFT
 */
export async function checkNftOwnership(
  walletAddress: PublicKey | string,
  requiredNftMints: string[],
  network: string = "devnet"
): Promise<boolean> {
  try {
    const address = typeof walletAddress === "string" 
      ? walletAddress 
      : walletAddress.toString();

    // Call Shyft API to get all NFTs in wallet
    const response = await axios.get(
      `https://api.shyft.to/sol/v1/nft/read_all`,
      {
        params: {
          network,
          address,
          refresh: true
        },
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SHYFT_API_KEY,
        },
      }
    );

    if (!response.data.success || !response.data.result) {
      return false;
    }

    const userNfts = response.data.result;
    const userNftMints = userNfts.map((nft: any) => nft.mint);

    // Check if any required NFT exists in user's wallet
    return requiredNftMints.some(mint => userNftMints.includes(mint));
  } catch (error) {
    console.error("Error in checkNftOwnership:", error);
    return false;
  }
}




/**
 * Combined function that checks NFT ownership and transfers new NFT with SOL payment
 * @param userWallet PublicKey of the user's wallet
 * @param connection Solana connection
 * @param fromWallet Keypair of the service wallet
 * @param requiredNftMints Array of NFT mint addresses required to claim
 * @param network Solana network
 * @returns Object with success status and transaction signature or error message
 */
export async function claimAirdropWithChecks(
  userWallet: PublicKey,
  connection: Connection,
  fromWallet: any,
  requiredNftMints: string[],
  network: string = "devnet"
): Promise<{
  success: boolean;
  signature?: string;
  message?: string;
}> {
  try {
    // 1. Check NFT ownership
    const hasRequiredNft = await checkNftOwnership(
      userWallet,
      requiredNftMints,
      network
    );

    if (!hasRequiredNft) {
      return {
        success: false,
        message: "Wallet doesn't contain the required NFTs for this airdrop",
      };
    }

    // 2. Transfer NFT with SOL check
    const signature = await transferNftWithSolCheck(
      userWallet,
      connection,
      fromWallet
    );

    if (!signature) {
      return {
        success: false,
        message: "Failed to transfer NFT or insufficient SOL balance",
      };
    }

    return {
      success: true,
      signature,
    };
  } catch (error) {
    console.error("Error in claimAirdropWithChecks:", error);
    return {
      success: false,
      message: "An unexpected error occurred during the airdrop claim",
    };
  }
}




// Example usage in a Next.js component
// const handleClaimAirdrop = async () => {
//   if (!wallet.publicKey || !connection) return;
  
//   const requiredNfts = [
//     "3iRECKHPvnfkH5wF6ZCTM4e9nULSevJJiCrxCfgG9eM7",
//     "BMv5StFwfJsXmMmehYATuytfhkmANvfhUHpu6YQHF1pX"
//   ];
  
//   const result = await claimAirdropWithChecks(
//     wallet.publicKey,
//     connection,
//     fromWalletKeypair,
//     requiredNfts,
//     "devnet"
//   );
  
//   if (result.success) {
//     alert(`Airdrop claimed! TX: ${result.signature}`);
//   } else {
//     alert(`Error: ${result.message}`);
//   }
// };







/**
 * Creates a new NFT collection and mints tokens to admin wallet
 * @param connection Solana connection
 * @param adminWallet Keypair of the admin wallet
 * @param metadata NFT metadata (name, symbol, uri)
 * @returns Mint address of the created NFT
 */
export async function createAndMintNftCollection(
  connection: Connection,
  adminWallet: Keypair,
  metadata?: {
    name: string;
    symbol: string;
    uri: string;
  }
): Promise<PublicKey> {
  try {
    // Create new mint
    const mint = await createMint(
      connection,
      adminWallet,
      adminWallet.publicKey, // Mint authority
      null, // Freeze authority
      0 // Decimals (0 for NFTs)
    );

    // Create token account for admin wallet
    const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminWallet,
      mint,
      adminWallet.publicKey
    );

    // Mint initial supply to admin wallet
    await mintTo(
      connection,
      adminWallet,
      mint,
      adminTokenAccount.address,
      adminWallet, // Mint authority
      1000 // Initial supply (adjust as needed)
    );

    // Optionally revoke minting authority
    await setAuthority(
      connection,
      adminWallet,
      mint,
      adminWallet.publicKey,
      0, // Mint tokens authority type
      null // New authority (null to revoke)
    );

    // Here you would typically upload metadata to Arweave/IPFS
    // and associate it with the mint using Metaplex or similar

    return mint;
  } catch (error) {
    console.error("Error in createAndMintNftCollection:", error);
    throw new Error("Failed to create and mint NFT collection");
  }
}

/**
 * Mints additional NFTs to admin wallet from existing collection
 * @param connection Solana connection
 * @param adminWallet Keypair of the admin wallet
 * @param mintAddress Mint address of the NFT collection
 * @param amount Number of NFTs to mint
 * @returns Transaction signature
 */
export async function mintAdditionalNftsToAdmin(
  connection: Connection,
  adminWallet: Keypair,
  mintAddress: PublicKey,
  amount: number
): Promise<string> {
  try {
    // Get or create admin's token account
    const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminWallet,
      mintAddress,
      adminWallet.publicKey
    );

    // Mint additional tokens
    const signature = await mintTo(
      connection,
      adminWallet,
      mintAddress,
      adminTokenAccount.address,
      adminWallet, // Mint authority
      amount
    );

    return signature;
  } catch (error) {
    console.error("Error in mintAdditionalNftsToAdmin:", error);
    throw new Error("Failed to mint additional NFTs");
  }
}



/**
 * Transfers NFTs from admin wallet to user wallet
 * @param connection Solana connection
 * @param adminWallet Keypair of the admin wallet
 * @param userWallet PublicKey of the user's wallet
 * @param mintAddress Mint address of the NFT
 * @param amount Number of NFTs to transfer
 * @returns Transaction signature
 */
export async function transferNftFromAdmin(
  connection: Connection,
  adminWallet: Keypair,
  userWallet: PublicKey,
  mintAddress: PublicKey,
  amount: number
): Promise<string> {
  try {
    // Get or create token accounts
    const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminWallet,
      mintAddress,
      adminWallet.publicKey
    );

    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminWallet,
      mintAddress,
      userWallet
    );

    // Transfer NFT
    const signature = await transfer(
      connection,
      adminWallet,
      adminTokenAccount.address,
      userTokenAccount.address,
      adminWallet.publicKey,
      amount
    );

    return signature;
  } catch (error) {
    console.error("Error in transferNftFromAdmin:", error);
    throw new Error("Failed to transfer NFT from admin");
  }
}






/**
 * Complete admin workflow: mint NFTs to admin wallet then distribute to users
 * @param connection Solana connection
 * @param adminWallet Keypair of the admin wallet
 * @param userWallets Array of user wallet PublicKeys
 * @param nftMetadata NFT metadata for creation
 * @param nftsPerUser Number of NFTs to distribute to each user
 * @returns Object with mint address and distribution results
 */
export async function adminMintAndDistributeWorkflow(
  connection: Connection,
  adminWallet: Keypair,
  userWallets: PublicKey[],
  nftMetadata: {
    name: string;
    symbol: string;
    uri: string;
  },
  nftsPerUser: number
): Promise<{
  mintAddress: PublicKey;
  distributionResults: {
    user: string;
    success: boolean;
    signature?: string;
    error?: string;
  }[];
}> {
  try {
    // 1. Create and mint NFT collection to admin wallet
    const mintAddress = await createAndMintNftCollection(
      connection,
      adminWallet,
      nftMetadata
    );

    // 2. Distribute NFTs to users
    const distributionResults = await Promise.all(
      userWallets.map(async (userWallet) => {
        try {
          const signature = await transferNftFromAdmin(
            connection,
            adminWallet,
            userWallet,
            mintAddress,
            nftsPerUser
          );
          return {
            user: userWallet.toString(),
            success: true,
            signature,
          };
        } catch (error: any) {
          return {
            user: userWallet.toString(),
            success: false,
            error: error.message,
          };
        }
      })
    );

    return {
      mintAddress,
      distributionResults,
    };
  } catch (error) {
    console.error("Error in adminMintAndDistributeWorkflow:", error);
    throw new Error("Failed to complete admin mint and distribute workflow");
  }
}






/**
 * Complete airdrop workflow: admin mints, then users claim with SOL payment
 * @param connection Solana connection
 * @param adminWallet Keypair of the admin wallet
 * @param userWallet PublicKey of the user's wallet
 * @param requiredNftMints Array of required NFT mints for eligibility
 * @param nftMetadata Metadata for the airdrop NFT
 * @param network Solana network
 * @returns Object with success status and transaction details
 */
export async function completeAirdropWorkflow(
  connection: Connection,
  adminWallet: Keypair,
  userWallet: PublicKey,
  requiredNftMints: string[],
  nftMetadata: {
    name: string;
    symbol: string;
    uri: string;
  },
  network: string = "devnet"
): Promise<{
  success: boolean;
  mintAddress?: PublicKey;
  claimResult?: {
    signature?: string;
    message?: string;
  };
  error?: string;
}> {
  try {
    // 1. Admin mints the airdrop NFTs
    const { mintAddress } = await adminMintAndDistributeWorkflow(
      connection,
      adminWallet,
      [adminWallet.publicKey], // Mint to admin wallet first
      nftMetadata,
      1000 // Initial supply
    );

    // 2. User claims NFT with SOL payment and eligibility check
    const claimResult = await claimAirdropWithChecks(
      userWallet,
      connection,
      adminWallet,
      requiredNftMints,
      network
    );

    return {
      success: claimResult.success,
      mintAddress,
      claimResult,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}







// // Example component usage
// const AdminPanel = () => {
//   const { connection } = useConnection();
//   const { publicKey, signTransaction } = useWallet();
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);

//   const handleMintAndDistribute = async () => {
//     if (!publicKey || !signTransaction) return;
//     setLoading(true);
    
//     try {
//       // In a real app, the admin wallet should be securely stored
//       const adminWallet = Keypair.fromSecretKey(
//         new Uint8Array(JSON.parse(process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY!))
//       );

//       const userWallets = [
//         new PublicKey("USER_WALLET_1"),
//         new PublicKey("USER_WALLET_2"),
//       ];

//       const nftMetadata = {
//         name: "Twitter Airdrop NFT",
//         symbol: "TANFT",
//         uri: "https://arweave.net/your-metadata-uri",
//       };

//       const result = await adminMintAndDistributeWorkflow(
//         connection,
//         adminWallet,
//         userWallets,
//         nftMetadata,
//         1 // 1 NFT per user
//       );

//       setResult(result);
//     } catch (error) {
//       console.error(error);
//       setResult({ error: "Failed to mint and distribute NFTs" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <button onClick={handleMintAndDistribute} disabled={loading}>
//         {loading ? "Processing..." : "Mint & Distribute NFTs"}
//       </button>
//       {result && (
//         <div>
//           <h3>Result:</h3>
//           <pre>{JSON.stringify(result, null, 2)}</pre>
//         </div>
//       )}
//     </div>
//   );
// };





// Configure rate-limited HTTP client (3 requests per second)
const http = rateLimit(axios.create(), { maxRequests: 3, perMilliseconds: 1000 });

// Cache with 5-minute TTL
const solPriceCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// List of price APIs to try in order
const PRICE_APIS = [
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price',
    params: { ids: 'solana', vs_currencies: 'usd', precision: 6 },
    transform: (data: any) => data?.solana?.usd
  },
  {
    name: 'CoinMarketCap',
    url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    params: { symbol: 'SOL', convert: 'USD' },
    headers: { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY },
    transform: (data: any) => data?.data?.SOL?.quote?.USD?.price
  },
  {
    name: 'Binance',
    url: 'https://api.binance.com/api/v3/ticker/price',
    params: { symbol: 'SOLUSDT' },
    transform: (data: any) => parseFloat(data?.price)
  }
];

async function getCurrentSolPrice(): Promise<number> {
  const CACHE_KEY = 'sol_price_usd';
  
  // Check cache first
  const cachedPrice = solPriceCache.get<number>(CACHE_KEY);
  if (cachedPrice !== undefined) {
    return cachedPrice;
  }

  let lastError: Error | null = null;
  
  // Try each API in order until one succeeds
  for (const api of PRICE_APIS) {
    try {
      const response = await http.get(api.url, {
        params: api.params,
        headers: api.headers || {},
        timeout: 3000
      });

      const price = api.transform(response.data);
      if (typeof price !== 'number' || price <= 0) {
        throw new Error(`Invalid price data from ${api.name}`);
      }

      // Update cache
      solPriceCache.set(CACHE_KEY, price);
      
      return price;
    } catch (error) {
      console.warn(`Failed to fetch price from ${api.name}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  // If all APIs fail, try to return stale cache
  const stalePrice = solPriceCache.get<number>(CACHE_KEY); // ignore expired
  if (stalePrice !== undefined) {
    console.warn('Using stale cached SOL price due to API failures');
    return stalePrice;
  }

  throw lastError || new Error('All price API attempts failed');
}

export async function getSolAmountForUsd(usdAmount: number): Promise<{ solAmount: number; solPrice: number }> {
  if (usdAmount <= 0) {
    throw new Error('USD amount must be positive');
  }

  try {
    const solPrice = await getCurrentSolPrice();
    const solAmount = usdAmount / solPrice;
    
    return {
      solAmount: parseFloat(solAmount.toFixed(6)),
      solPrice: parseFloat(solPrice.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating SOL amount:', error);
    throw new Error(`Failed to calculate SOL amount: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get $4 worth of SOL
// try {
//   const { solAmount, solPrice } = await getSolAmountForUsd(4);
//   console.log(`Current SOL price: $${solPrice}`);
//   console.log(`$${4} = ${solAmount} SOL`);
// } catch (error) {
//   console.error('Failed to calculate SOL amount:', error);
// }