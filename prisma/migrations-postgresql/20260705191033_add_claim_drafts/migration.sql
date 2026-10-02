-- CreateEnum
CREATE TYPE "ClaimDraftStatus" AS ENUM ('DRAFT', 'READY', 'SENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "ClaimDraft" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ClaimDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClaimDraft_organizationId_idx" ON "ClaimDraft"("organizationId");

-- CreateIndex
CREATE INDEX "ClaimDraft_invoiceId_idx" ON "ClaimDraft"("invoiceId");

-- CreateIndex
CREATE INDEX "ClaimDraft_customerId_idx" ON "ClaimDraft"("customerId");

-- CreateIndex
CREATE INDEX "ClaimDraft_status_idx" ON "ClaimDraft"("status");

-- AddForeignKey
ALTER TABLE "ClaimDraft" ADD CONSTRAINT "ClaimDraft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDraft" ADD CONSTRAINT "ClaimDraft_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDraft" ADD CONSTRAINT "ClaimDraft_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDraft" ADD CONSTRAINT "ClaimDraft_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
