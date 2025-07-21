-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginReward" TIMESTAMP(3),
ADD COLUMN     "totalEarnedTokens" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DailyEarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokens" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirdropSeason" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalAllocation" BIGINT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "claimingStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirdropSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirdropClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "tokens" DOUBLE PRECISION NOT NULL,
    "tier" TEXT NOT NULL,
    "paymentSignature" TEXT NOT NULL,
    "transactionSignature" TEXT,
    "status" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirdropClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyEarning_userId_claimedAt_idx" ON "DailyEarning"("userId", "claimedAt");

-- CreateIndex
CREATE INDEX "AirdropClaim_seasonId_status_idx" ON "AirdropClaim"("seasonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AirdropClaim_userId_seasonId_key" ON "AirdropClaim"("userId", "seasonId");

-- AddForeignKey
ALTER TABLE "DailyEarning" ADD CONSTRAINT "DailyEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirdropClaim" ADD CONSTRAINT "AirdropClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirdropClaim" ADD CONSTRAINT "AirdropClaim_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "AirdropSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
