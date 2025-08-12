-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "admin_audit_logs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "nft_claim_approvals" ADD COLUMN     "claimed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "nft_collections" ADD COLUMN     "creatorWallet" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "royaltyPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "nft_distributions" ADD COLUMN     "collectionId" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "nftsPerRecipient" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "recipientWallets" JSONB,
ADD COLUMN     "transactionHash" TEXT,
ALTER COLUMN "results" DROP NOT NULL;

-- CreateTable
CREATE TABLE "nft_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "mintAddress" TEXT,
    "nftNumber" INTEGER,
    "paymentSignature" TEXT NOT NULL,
    "createSignature" TEXT,
    "transferSignature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_claims_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "nft_claims" ADD CONSTRAINT "nft_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
