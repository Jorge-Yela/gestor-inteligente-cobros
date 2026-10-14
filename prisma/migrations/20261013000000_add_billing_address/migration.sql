-- AlterTable
ALTER TABLE `Organization`
    ADD COLUMN `billingAddress` VARCHAR(191) NULL,
    ADD COLUMN `billingCity` VARCHAR(191) NULL,
    ADD COLUMN `billingPostalCode` VARCHAR(191) NULL;
