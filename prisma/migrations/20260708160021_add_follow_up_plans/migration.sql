-- CreateEnum
CREATE TYPE "FollowUpPlanStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpStepType" AS ENUM ('REVIEW', 'FRIENDLY_CLAIM', 'FIRM_CLAIM', 'FINAL_NOTICE', 'MANUAL_TASK');

-- CreateEnum
CREATE TYPE "FollowUpStepStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "FollowUpPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" "FollowUpPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL DEFAULT 'Plan de seguimiento',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" "FollowUpStepType" NOT NULL,
    "status" "FollowUpStepStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpPlan_invoiceId_key" ON "FollowUpPlan"("invoiceId");

-- CreateIndex
CREATE INDEX "FollowUpPlan_organizationId_idx" ON "FollowUpPlan"("organizationId");

-- CreateIndex
CREATE INDEX "FollowUpPlan_status_idx" ON "FollowUpPlan"("status");

-- CreateIndex
CREATE INDEX "FollowUpStep_planId_idx" ON "FollowUpStep"("planId");

-- CreateIndex
CREATE INDEX "FollowUpStep_status_idx" ON "FollowUpStep"("status");

-- CreateIndex
CREATE INDEX "FollowUpStep_dueDate_idx" ON "FollowUpStep"("dueDate");

-- AddForeignKey
ALTER TABLE "FollowUpPlan" ADD CONSTRAINT "FollowUpPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpPlan" ADD CONSTRAINT "FollowUpPlan_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpStep" ADD CONSTRAINT "FollowUpStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FollowUpPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
