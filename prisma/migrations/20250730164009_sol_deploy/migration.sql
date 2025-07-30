/*
  Warnings:

  - Added the required column `updated_at` to the `AirdropClaim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AirdropClaim" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "feesPaid" DECIMAL(20,10) NOT NULL DEFAULT 0;
