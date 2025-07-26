## Wallet Balance

import {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const address = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const balance = await connection.getBalance(address);
console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);



## Transaction 

import {
  Connection,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";

const fromKeypair = Keypair.generate();
const toKeypair = Keypair.generate();

const connection = new Connection("http://localhost:8899", "confirmed");

const airdropSignature = await connection.requestAirdrop(
  fromKeypair.publicKey,
  LAMPORTS_PER_SOL
);

await connection.confirmTransaction(airdropSignature);

const lamportsToSend = 1_000_000;

const transferTransaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: fromKeypair.publicKey,
    toPubkey: toKeypair.publicKey,
    lamports: lamportsToSend
  })
);

const signature = await sendAndConfirmTransaction(
  connection,
  transferTransaction,
  [fromKeypair]
);
console.log("Transaction Signature:", signature);







import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

const NFT_COLLECTION_ADDRESS = new PublicKey('YOUR_NFT_COLLECTION_PUBLIC_KEY');

function MyAuthComponent() {
  const { publicKey, connected } = useWallet();
  const [hasAuthNFT, setHasAuthNFT] = useState(false);
  const connection = new Connection('YOUR_SOLANA_RPC_URL'); // e.g., clusterApiUrl('mainnet-beta')

  useEffect(() => {
    const checkNFT = async () => {
      if (!connected || !publicKey) {
        setHasAuthNFT(false);
        return;
      }

      try {
        // Fetch NFTs owned by the user (simplified example, consider using an API for efficiency)
        const nfts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });

        const ownsAuthNFT = nfts.value.some(account => {
          const mintAddress = account.account.data.parsed.info.mint;
          // In a real scenario, you'd fetch metadata to verify collection/creator
          // For simplicity, this checks if a token account exists for the collection
          return mintAddress === NFT_COLLECTION_ADDRESS.toBase58();
        });
        setHasAuthNFT(ownsAuthNFT);
      } catch (error) {
        console.error('Error checking NFT ownership:', error);
        setHasAuthNFT(false);
      }
    };

    checkNFT();
  }, [connected, publicKey, connection]);

  return (
    <div>
      {connected ? (
        hasAuthNFT ? (
          <p>Welcome, you are authenticated with your NFT!</p>
        ) : (
          <p>You do not own the required NFT for access.</p>
        )
      ) : (
        <p>Please connect your Solana wallet to authenticate.</p>
      )}
    </div>
  );
}



NFT WALLET NFT AUTH

https://blogs.shyft.to/build-nft-gated-dapp-397ee39dc033



https://medium.com/@accesstoarpan/how-to-airdrop-solana-nfts-with-crossmints-minting-api-5e09c295437e