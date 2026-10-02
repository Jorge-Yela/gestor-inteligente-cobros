/*
  Warnings:

  - You are about to drop the column `taxableBaseCents` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `vatAmountCents` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `vatRate` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "taxableBaseCents",
DROP COLUMN "vatAmountCents",
DROP COLUMN "vatRate";
