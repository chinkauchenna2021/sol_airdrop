/*
  Warnings:

  - You are about to drop the column `points` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `TwitterEngagement` table. All the data in the column will be lost.
  - Made the column `type` on table `Claim` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Analytics" ADD COLUMN     "totalTokens" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Claim" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "DailyEarning" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rewardType" TEXT NOT NULL DEFAULT 'POINTS',
ALTER COLUMN "tokens" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PointHistory" ADD COLUMN     "tokens" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'POINTS',
ALTER COLUMN "points" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "points",
ADD COLUMN     "tokens" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "rewardType" TEXT NOT NULL DEFAULT 'POINTS',
ADD COLUMN     "tokens" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "points" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "TaskCompletion" ADD COLUMN     "rewardType" TEXT NOT NULL DEFAULT 'POINTS',
ADD COLUMN     "tokens" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "points" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "TwitterEngagement" DROP COLUMN "points",
ADD COLUMN     "tokens" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totalTokens" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "DailyEarning_rewardType_idx" ON "DailyEarning"("rewardType");

-- CreateIndex
CREATE INDEX "PointHistory_type_idx" ON "PointHistory"("type");

-- CreateIndex
CREATE INDEX "Task_rewardType_idx" ON "Task"("rewardType");

-- CreateIndex
CREATE INDEX "User_totalTokens_idx" ON "User"("totalTokens");
