// import { PublicKey } from '@solana/web3.js';
// import axios from 'axios';
// import fs from 'fs';


// // TYPES

// type Email = string;
// type StringPubKey = string;
// type Destination = Email | StringPubKey;

// interface NftMetadata {
//     name: string,
//     image: string,
//     description: string
//     attributes: {trait_type: string, value: string}[],
//     properties: {
//         files: {uri: string, type: string}[],
//         category: string
//     }
// }

// interface MintNftProps {
//     destination: Destination,
//     qnEndpoint: string,
//     collectionId: string,
//     nftInfo: NftMetadata
// }

// interface FetchMintProps {
//     qnEndpoint: string,
//     collectionId: string,
//     crossmintId: string
// }

// interface MintResult {
//     destination: string, 
//     crossmintId: string, 
//     mint: string
// }




// // CONSTANTS

// const QUICKNODE_RPC = 'https://example.solana-devnet.quiknode.pro/0123456/';
// const COLLECTION_ID = 'default-solana';
// const DROP_LIST: Destination[] = [
//     'quickguides@test.com',
//     'CTrLzkrcnqgqSTmzJ146ZTRkLAvwcjnxGSZBvqC5BH3w',
//     'quickdemo@test.com',
//     'DemoKMZWkk483hX4mUrcJoo3zVvsKhm8XXs28TuwZw9H'
// ];
// const DELAY = 1000; 





// async function wait(ms: number):Promise<void> {
//     return new Promise<void>((resolve) => {
//       setTimeout(() => {
//         resolve();
//       }, ms);
//     });
// }




// const requestCrossMintNft = async ({ destination, qnEndpoint, collectionId, nftInfo }: MintNftProps) => {
//     // Regular expression to validate an email address
//     const emailRegex: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

//     // Validate & define recipient (as either email address or Solana wallet else throw an error)
//     let recipient: string;
//     if (emailRegex.test(destination)) {
//         recipient = `email:${destination}:sol`;
//     } else if (new PublicKey(destination)) {
//         recipient = `solana:${destination}`;
//     }
//     else {
//         throw new Error('Invalid destination address (must be a valid email address or a Solana Wallet address).');
//     }

//     // Assemble POST Request
//     const metadata = {
//         "name": nftInfo.name,
//         "image": nftInfo.image,
//         "description": nftInfo.description
//     };
//     const data = {
//         jsonrpc: "2.0",
//         id: 1,
//         method: "cm_mintNFT",
//         params: [collectionId, recipient, metadata], // https://docs.crossmint.com/docs/cm-mintnft
//     };
//     const config = {
//         headers: {
//             "Content-Type": "application/json",
//         },
//     };

//     // Send Post Request
//     return new Promise<string>(async (resolve, reject) => {
//         try {
//           let response =  await axios.post(qnEndpoint, data, config);
//           resolve(response.data.result.id as string);
//         } catch (error) {
//           reject("Error sending request to CrossMint. Check your inputs.");
//         }
//       });
// }



// const fetchMintAddress = async ({ collectionId, qnEndpoint, crossmintId }: FetchMintProps) => {

//     // Assemble POST Request
//     const data = {
//         jsonrpc: "2.0",
//         id: 1,
//         method: "cm_getNFTMintStatus",
//         params: [collectionId,crossmintId], //https://docs.crossmint.com/docs/cm-getnftmintstatus
//     };
//     const config = {
//         headers: {
//             "Content-Type": "application/json",
//         },
//     };

//     // Send POST Request
//     return new Promise<string>(async (resolve, _reject) => {
//         try {
//           let response =  await axios.post(qnEndpoint, data, config);
//           resolve(response.data.result.onChain.mintHash as string);
//         } catch (error) {
//           //reject("Error fetching mint address.");
//         }
//       });
// }






// const dropNfts = async (dropList: Destination[], qnEndpoint: string, collectionId: string) => {
//     console.log('Generating promises...');
//     let promises = dropList.map((drop, i) => {
//         // 1-Define Custom Metadata
//         const nftNumber = (i+1).toString();
//         const nftInfo = {
//             name: `Demo Airdrop # ${nftNumber}`,
//             image: 'https://arweave.net/UTFFfaVA3HoFcxwoMHEcvBLq19HrW6FuzpyygXqxduk',
//             description: 'Demo airdrop NFT using Crossmint Mint API via the Quicknode add-on',
//             attributes: [
//                 {
//                     trait_type: "background",
//                     value: "blue"
//                 },
//                 {
//                     trait_type: "type",
//                     value: "pixel"
//                 },
//                 {
//                     trait_type: "id",
//                     value: nftNumber
//                 }
//             ],
//             properties: {
//                 files: [
//                     {
//                         "uri": "https://arweave.net/UTFFfaVA3HoFcxwoMHEcvBLq19HrW6FuzpyygXqxduk",
//                         "type": "image/png"
//                     }
//                 ],
//                 category: "image"
//             }
//         };
//         // 2-Create Promise
//         return new Promise< MintResult >(async (resolve, reject)=>{
//             setTimeout(async ()=>{
//                 try {
//                     let crossmintId = await requestCrossMintNft({
//                       destination: drop,
//                       qnEndpoint,
//                       collectionId,
//                       nftInfo
//                     });
//                     if (!crossmintId) throw new Error('No CrossMint ID received.');
//                     await wait(60000); // wait 1 min
//                     let mint = await fetchMintAddress({
//                         collectionId,
//                         qnEndpoint,
//                         crossmintId
//                     });
//                     resolve({
//                         destination: drop,
//                         crossmintId: crossmintId, 
//                         mint: mint ?? ''
//                     });
//                 } catch (error) {
//                     reject('Unknown Error sending request to CrossMint.');
//                 }
//             },i * DELAY);
//         })
//     });
//     // 3-Execute Promises
//     console.log('Executing promises...(this will take 1min +)');
//     let results = await Promise.allSettled(promises);
//     // 4-Save Results
//     console.log('Writing results to ./results/results.json');
//     let data = JSON.stringify(results);
//     fs.writeFileSync('./results/results.json',data);
// }




// // Drop Your NFTs 🪂​
// // At the end of your app.ts, call your dropNfts function:


// dropNfts(DROP_LIST, QUICKNODE_RPC, COLLECTION_ID);














// // After about a minute, you should see a new results.json generated that contains an array of your mint results:

// [
//     {
//         "status": "fulfilled",
//         "value": {
//             "destination": "quickguides@test.com",
//             "crossmintId": "60f33f72-a8d8-41ce-b28a-bc899aa7b929",
//             "mint": "AbJjT4j9MYQTya9aZ9qmCd36dspwoMnhfsEpZL91sFwG"
//         }
//     },
//     {
//         "status": "fulfilled",
//         "value": {
//             "destination": "DemoKMZWkk483hX4mUrcJoo3zVvsKhm8XXs28TuwZw9H",
//             "crossmintId": "0c4836cb-26dc-48a2-a55f-5d3ca40699da",
//             "mint": "5RRDSrq6ME5Yz9qXcKRvSQeGD1F2AEnURnjfCs7BTEvN"
//         }
//     },
//     // etc.
// ]




















// import { Connection, Keypair } from  "@solana/web3.js";
// import { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, transfer } from  "@solana/spl-token";

// const quicknodeEndpoint = 'https://example.solana-devnet.quiknode.pro/0123456/';
// const connection = new Connection(quicknodeEndpoint, "confirmed");

// const secret=[0...0]; // Replace with your secret key
// const fromWallet = Keypair.fromSecretKey(new Uint8Array(secret));

// (async () => {
//   // Create a new token 
//   const mint = await createMint(
//     connection, 
//     fromWallet,            // Payer of the transaction
//     fromWallet.publicKey,  // Account that will control the minting 
//     null,                  // Account that will control the freezing of the token 
//     0                      // Location of the decimal place 
//   );

//   // Get the token account of the fromWallet Solana address. If it does not exist, create it.
//   const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
//     connection,
//     fromWallet,
//     mint,
//     fromWallet.publicKey
//   );

//   // Generate a new wallet to receive the newly minted token
//   const toWallet = Keypair.generate();

//   // Get the token account of the toWallet Solana address. If it does not exist, create it.
//   const toTokenAccount = await getOrCreateAssociatedTokenAccount(
//     connection,
//     fromWallet,
//     mint,
//     toWallet.publicKey
//   );

//   // Minting 1 new token to the "fromTokenAccount" account we just returned/created.
//   let signature = await mintTo(
//     connection,
//     fromWallet,               // Payer of the transaction fees 
//     mint,                     // Mint for the account 
//     fromTokenAccount.address, // Address of the account to mint to 
//     fromWallet.publicKey,     // Minting authority
//     1                         // Amount to mint 
//   );

//   await setAuthority(
//     connection,
//     fromWallet,            // Payer of the transaction fees
//     mint,                  // Account 
//     fromWallet.publicKey,  // Current authority 
//     0,                     // Authority type: "0" represents Mint Tokens 
//     null                   // Setting the new Authority to null
//   );

//   signature = await transfer(
//     connection,
//     fromWallet,               // Payer of the transaction fees 
//     fromTokenAccount.address, // Source account 
//     toTokenAccount.address,   // Destination account 
//     fromWallet.publicKey,     // Owner of the source account 
//     1                         // Number of tokens to transfer 
//   );

//   console.log("SIGNATURE", signature);

// })();