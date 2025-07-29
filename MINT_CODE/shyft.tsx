// // https://docs.shyft.to/




// https://api.shyft.to/sol/v1/nft/read_all?network=devnet&address=wallet_address&update_authority=update_authority_of_the_nft&refresh=refresh`
// useEffect(() => {
//         let nftUrl = `https://api.shyft.to/sol/v1/nft/read_all?network=devnet&address=${walletId}&update_authority=wallet_address_which_you_will_use_for_auth&refresh=refresh`;
//         //add the wallet address which you want to check as an authentication parameter
//         //access will be granted if and only if an NFT with this update authority is present in your wallet
//         const xKey = 'your-x-api-key-from-shyft-website'
// axios({
//           // Endpoint to get NFTs
//           url: nftUrl,
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": xKey,
//           },
//         })
//           // Handle the response from backend here
//           .then((res) => {
//             console.log(res.data);
//             if (res.data.success === true) {
//               setNfts(res.data.result);
//               //or check the length of the nfts array over here,
//               // if greater than zero, it will imply atleast one NFT with the 
//               //required update_authority is present
//             } 
//           })
//           // Catch errors if any
//           .catch((err) => {
//             console.warn(err);
            
//           });
    
     
//     }, [walletId]);
// // If the response from this API is true, we should have a response that looks somewhat like this.

// {
//     "success": true,
//     "message": "All NFTS in your wallet",
//     "result": [
//         {
//             "name": "Girish",
//             "symbol": "GN",
//             "royalty": 5,
//             "image_uri": "https://nftstorage.link/ipfs/bafybeidf3jfdczfu56knpfsqbcveks62xy44uognecz64kxvmaowqyg23q",
//             "description": "Serial Entrepreneur ",
//             "mint": "3iRECKHPvnfkH5wF6ZCTM4e9nULSevJJiCrxCfgG9eM7",
//             "owner": "BvzKvn6nUUAYtKu2pH3h5SbUkUNcRPQawg4bURBiojJx",
//             "attributes": {
//                 "girish": "true"
//             },
//             "update_authority": "BvzKvn6nUUAYtKu2pH3h5SbUkUNcRPQawg4bURBiojJx"
//         },
//         {
//             "name": "Cool Monkry",
//             "symbol": "CMY",
//             "royalty": 5,
//             "image_uri": "https://nftstorage.link/ipfs/bafkreie2ef3z2cixfnxby5zfprv2xa7lydy5biky34v2p2fgsb5b4mcfaa",
//             "description": "Shyft makes web3 development so easy.",
//             "mint": "BMv5StFwfJsXmMmehYATuytfhkmANvfhUHpu6YQHF1pX",
//             "owner": "BvzKvn6nUUAYtKu2pH3h5SbUkUNcRPQawg4bURBiojJx",
//             "attributes": {
//                 "edification": "100"
//             },
//             "update_authority": "BFefyp7jNF5Xq2A4JDLLFFGpxLq5oPEFKBAQ46KJHW2R"
//         },
//         {
//             "name": "GUMBALL #247475",
//             "symbol": "GUMBALL",
//             "royalty": 1,
//             "image_uri": "",
//             "description": "Celebrate the new era of compressed NFTs",
//             "mint": "6jhqJGJreGpQEP73ey5as7UBCzeRSWuLSM8m1V3pdBHb",
//             "owner": "BvzKvn6nUUAYtKu2pH3h5SbUkUNcRPQawg4bURBiojJx",
//             "attributes": {
//                 "Vibe Check": "Passed",
//                 "Solana Summer": "🔥 Started 🔥",
//                 "NFTs": "Compressed"
//             },
//             "update_authority": "2GDAzSBsMiS44gJzSEqH3APkabHGZcicNM9G7cmUo9hE"
//         }
//     ]
// }
// // NFT Access Check
// // If successful and the length of the nfts the array is greater than 0, it would imply that we have at least one NFT whose update_authority is the wallet address which we are using for authentication (update_authority = AagBXTi3HHFNMqTcWm3oYoQYSuUj1LGvb12vsPB if AagBXTi3HHFNMqTcWm3oYoQYSuUj1LGvb12vsPB is the wallet address we are using for authentication). We can also perform checking on NFTs with specific attributes, and check if the user's wallet has one NFT with some specified value such as "health:50" or "Power: 100", or maybe an attribute as a password, for that we would need to iterate through the nfts array and check if any element of the array has an attribute.

// let flag = 0;
// nfts.forEach((element) => {
//   if (
//     //check if element has an attribute that is equal to the attribute you are looking for authentication
//   ) {
//     flag = 1;
//   }
// });
// if (flag === 1) {
//     setAccess(true);
//     //redirect user from here
// } else {
//     //dont redirect, and display the error message
//     setAccess(false);
//     setMsg('You do not have access');
// }


// https://docs.shyft.to/solana-apis/nft