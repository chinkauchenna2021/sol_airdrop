/*
  Warnings:

  - You are about to drop the column `claimingStartedAt` on the `AirdropSeason` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AirdropSeason` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `AirdropSeason` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `AirdropSeason` table. All the data in the column will be lost.
  - You are about to drop the column `totalAllocation` on the `AirdropSeason` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `AirdropSeason` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_allocation` to the `AirdropSeason` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `AirdropSeason` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AirdropSeason" DROP COLUMN "claimingStartedAt",
DROP COLUMN "createdAt",
DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "totalAllocation",
ADD COLUMN     "claimed_amount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "fee_amount" DECIMAL(65,30) NOT NULL DEFAULT 4.00,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nft_pass_required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "require_approval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "total_allocation" BIGINT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "nft_passes" JSONB,
ADD COLUMN     "type" TEXT DEFAULT 'TOKEN',
ADD COLUMN     "user_tier" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "claimsEnabled" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "nft_collections" (
    "id" TEXT NOT NULL,
    "mint_address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "uri" TEXT NOT NULL,
    "supply" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_distributions" (
    "id" TEXT NOT NULL,
    "mint_address" TEXT NOT NULL,
    "distributed_by" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL,
    "nfts_per_user" INTEGER NOT NULL,
    "results" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_claim_approvals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_claim_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_nft_holdings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mint_address" TEXT NOT NULL,
    "token_account" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_nft_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nft_collections_mint_address_key" ON "nft_collections"("mint_address");

-- CreateIndex
CREATE UNIQUE INDEX "nft_claim_approvals_user_id_key" ON "nft_claim_approvals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_nft_holdings_user_id_mint_address_token_account_key" ON "user_nft_holdings"("user_id", "mint_address", "token_account");

-- AddForeignKey
ALTER TABLE "AirdropSeason" ADD CONSTRAINT "AirdropSeason_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_collections" ADD CONSTRAINT "nft_collections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_distributions" ADD CONSTRAINT "nft_distributions_mint_address_fkey" FOREIGN KEY ("mint_address") REFERENCES "nft_collections"("mint_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_distributions" ADD CONSTRAINT "nft_distributions_distributed_by_fkey" FOREIGN KEY ("distributed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_claim_approvals" ADD CONSTRAINT "nft_claim_approvals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_claim_approvals" ADD CONSTRAINT "nft_claim_approvals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_nft_holdings" ADD CONSTRAINT "user_nft_holdings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
