// /scripts/setup-existing-schema.js
const { setupNFTClaimingSystemExisting } = require('../utils/nft-admin-updated')

async function main() {
  try {
    await setupNFTClaimingSystemExisting()
    process.exit(0)
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { setupNFTClaimingSystemExisting }