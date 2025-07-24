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


