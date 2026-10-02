-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `taxId` VARCHAR(191) NULL,
    `billingEmail` VARCHAR(191) NULL,
    `defaultCurrency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `stripeCustomerId` VARCHAR(191) NULL,
    `stripeSubscriptionId` VARCHAR(191) NULL,
    `subscriptionStatus` VARCHAR(191) NULL,
    `subscriptionCurrentPeriodEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationMember` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'MEMBER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrganizationMember_organizationId_idx`(`organizationId`),
    UNIQUE INDEX `OrganizationMember_userId_organizationId_key`(`userId`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `taxId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Customer_organizationId_idx`(`organizationId`),
    INDEX `Customer_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerContact` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CustomerContact_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `issueDate` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `status` ENUM('PENDING_REVIEW', 'ACTIVE', 'OVERDUE', 'PAID', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING_REVIEW',
    `paymentStatus` ENUM('UNPAID', 'PAID', 'DISPUTED') NOT NULL DEFAULT 'UNPAID',
    `paidAt` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Invoice_organizationId_idx`(`organizationId`),
    INDEX `Invoice_customerId_idx`(`customerId`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_paymentStatus_idx`(`paymentStatus`),
    UNIQUE INDEX `Invoice_organizationId_invoiceNumber_key`(`organizationId`, `invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimelineEvent` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `type` ENUM('INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_MARKED_PAID', 'CUSTOMER_CREATED', 'NOTE_ADDED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TimelineEvent_organizationId_idx`(`organizationId`),
    INDEX `TimelineEvent_invoiceId_idx`(`invoiceId`),
    INDEX `TimelineEvent_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Template` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `tone` ENUM('FRIENDLY', 'FIRM', 'FINAL_NOTICE') NOT NULL DEFAULT 'FRIENDLY',
    `language` VARCHAR(191) NOT NULL DEFAULT 'es',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Template_organizationId_idx`(`organizationId`),
    INDEX `Template_tone_idx`(`tone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClaimDraft` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'READY', 'SENT', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClaimDraft_organizationId_idx`(`organizationId`),
    INDEX `ClaimDraft_invoiceId_idx`(`invoiceId`),
    INDEX `ClaimDraft_customerId_idx`(`customerId`),
    INDEX `ClaimDraft_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceFile` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileKey` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NOT NULL DEFAULT 'application/pdf',
    `sizeBytes` INTEGER NULL,
    `status` ENUM('UPLOADED', 'OCR_PENDING', 'OCR_PROCESSING', 'OCR_COMPLETED', 'OCR_FAILED') NOT NULL DEFAULT 'UPLOADED',
    `extractedText` VARCHAR(191) NULL,
    `extractedData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InvoiceFile_invoiceId_key`(`invoiceId`),
    INDEX `InvoiceFile_organizationId_idx`(`organizationId`),
    INDEX `InvoiceFile_invoiceId_idx`(`invoiceId`),
    INDEX `InvoiceFile_customerId_idx`(`customerId`),
    INDEX `InvoiceFile_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpPlan` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `name` VARCHAR(191) NOT NULL DEFAULT 'Plan de seguimiento',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FollowUpPlan_invoiceId_key`(`invoiceId`),
    INDEX `FollowUpPlan_organizationId_idx`(`organizationId`),
    INDEX `FollowUpPlan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpStep` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `type` ENUM('REVIEW', 'FRIENDLY_CLAIM', 'FIRM_CLAIM', 'FINAL_NOTICE', 'MANUAL_TASK') NOT NULL,
    `status` ENUM('PENDING', 'DONE', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `title` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FollowUpStep_planId_idx`(`planId`),
    INDEX `FollowUpStep_status_idx`(`status`),
    INDEX `FollowUpStep_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrganizationMember` ADD CONSTRAINT `OrganizationMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationMember` ADD CONSTRAINT `OrganizationMember_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerContact` ADD CONSTRAINT `CustomerContact_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimelineEvent` ADD CONSTRAINT `TimelineEvent_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimelineEvent` ADD CONSTRAINT `TimelineEvent_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimelineEvent` ADD CONSTRAINT `TimelineEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Template` ADD CONSTRAINT `Template_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClaimDraft` ADD CONSTRAINT `ClaimDraft_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClaimDraft` ADD CONSTRAINT `ClaimDraft_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClaimDraft` ADD CONSTRAINT `ClaimDraft_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClaimDraft` ADD CONSTRAINT `ClaimDraft_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceFile` ADD CONSTRAINT `InvoiceFile_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceFile` ADD CONSTRAINT `InvoiceFile_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceFile` ADD CONSTRAINT `InvoiceFile_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpPlan` ADD CONSTRAINT `FollowUpPlan_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpPlan` ADD CONSTRAINT `FollowUpPlan_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpStep` ADD CONSTRAINT `FollowUpStep_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `FollowUpPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
