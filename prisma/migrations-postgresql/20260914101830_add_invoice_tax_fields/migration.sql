-- Recovered migration already applied in local database.
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxableBaseCents" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "vatRate" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "vatAmountCents" INTEGER;
