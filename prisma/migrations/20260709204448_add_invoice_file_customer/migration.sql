-- AlterTable
ALTER TABLE "InvoiceFile" ADD COLUMN     "customerId" TEXT;

-- CreateIndex
CREATE INDEX "InvoiceFile_customerId_idx" ON "InvoiceFile"("customerId");

-- AddForeignKey
ALTER TABLE "InvoiceFile" ADD CONSTRAINT "InvoiceFile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
