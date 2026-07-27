import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createInvoiceFromOcr } from "@/server/actions/create-invoice-from-ocr";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

type ReviewInvoiceFilePageProps = {
  params: Promise<{
    fileId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    "duplicate-invoice": "Ya existe una factura con ese numero. Puedes revisar el numero detectado automaticamente antes de registrar la factura.",
  };

  return error ? messages[error] : null;
}

type ExtractedInvoiceData = {
  invoiceNumber?: string;
  customerName?: string;
  customerTaxId?: string;
  customerEmail?: string;
  issueDate?: string;
  amountCents?: number;
  currency?: string;
};

function getExtractedData(value: unknown): ExtractedInvoiceData {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as ExtractedInvoiceData;
}

function formatAmountForInput(amountCents?: number) {
  if (!amountCents) {
    return "";
  }

  return (amountCents / 100).toFixed(2);
}

export default async function ReviewInvoiceFilePage({ params, searchParams }: ReviewInvoiceFilePageProps) {
  const { fileId } = await params;
  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);
  const organizationId = await getCurrentOrganizationId();

  const file = await prisma.invoiceFile.findFirst({
    where: {
      id: fileId,
      organizationId,
    },
    include: {
      customer: true,
    },
  });

  if (!file) {
    notFound();
  }

  const extractedData = getExtractedData(file.extractedData);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Link href={`/invoice-files/${file.id}`} className="text-sm text-muted-foreground hover:text-foreground">
            Volver al archivo
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Revisar datos extraidos</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Confirma o corrige los datos extraidos antes de registrar la factura. Nada se reclama ni se envia automaticamente.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Datos detectados</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Estos datos vienen de la lectura automatica y deben ser revisados por el usuario.
              </p>
            </div>

            <form action={createInvoiceFromOcr} className="grid gap-5 p-5 sm:grid-cols-2">
              <input type="hidden" name="fileId" value={file.id} />
              <div>
                <label htmlFor="invoiceNumber" className="text-sm text-muted-foreground">
                  Numero de factura
                </label>
                <input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  defaultValue={extractedData.invoiceNumber || ""}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="issueDate" className="text-sm text-muted-foreground">
                  Fecha de factura
                </label>
                <input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  defaultValue={extractedData.issueDate || ""}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="customerName" className="text-sm text-muted-foreground">
                  Cliente
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  defaultValue={file.customer?.name || extractedData.customerName || ""}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="customerTaxId" className="text-sm text-muted-foreground">
                  NIF/CIF cliente
                </label>
                <input
                  id="customerTaxId"
                  name="customerTaxId"
                  defaultValue={file.customer?.taxId || extractedData.customerTaxId || ""}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="customerEmail" className="text-sm text-muted-foreground">
                  Email cliente
                </label>
                <input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  defaultValue={file.customer?.email || extractedData.customerEmail || ""}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="amount" className="text-sm text-muted-foreground">
                  Importe
                </label>
                <input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  defaultValue={formatAmountForInput(extractedData.amountCents)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="currency" className="text-sm text-muted-foreground">
                  Moneda
                </label>
                <input
                  id="currency"
                  name="currency"
                  defaultValue={extractedData.currency || "EUR"}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div className="sm:col-span-2">
                <Button type="submit">Registrar factura</Button>
              </div>
            </form>
          </section>

          <aside className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Texto extraido</h2>
              <p className="mt-1 text-sm text-muted-foreground">Lectura completa del archivo.</p>
            </div>

            <div className="p-5">
              {file.extractedText ? (
                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
                  {file.extractedText}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este archivo todavia no tiene datos extraidos.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
