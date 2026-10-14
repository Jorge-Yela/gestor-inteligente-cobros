-- AlterTable
ALTER TABLE `Organization`
    ADD COLUMN `subscriptionCancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false;
