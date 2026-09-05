import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { registerInvoiceFromFile } from "@/server/actions/register-invoice-from-file";

type ImportReviewPageProps = {
  searchParams: Promise<{
    fileIds?: string;
  }>;
};

type ExtractedInvoiceData = {
  invoiceNumber?: string;
  customerName?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  aiError?: string;
  issueDate?: string;
  amountCents?: number;
  currency?: string;
  confidence?: number;
  notes?: string;
};

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function getExtractedData(value: unknown): ExtractedInvoiceData {
  return value && typeof value === "object" ? value as ExtractedInvoiceData : {};
}

function formatAmount(amountCents?: number) {
  return amountCents ? currencyFormatter.format(amountCents / 100) : "Sin importe";
}

export default async function ImportReviewPage({ searchParams }: ImportReviewPageProps) {
  const { fileIds = "" } = await searchParams;
  const ids = fileIds.split(",").map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    notFound();
  }

  const organizationId = await getCurrentOrganizationId();

  const files = await prisma.invoiceFile.findMany({
    where: {
      organizationId,
      id: { in: ids },
    },
    include: {
      customer: true,
      invoice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <Link href="/invoice-files/upload" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Volver a subir facturas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Facturas interpretadas</h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            La IA ha leído los PDFs. Revisa si el cliente existe o crea uno nuevo antes de registrar la factura.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Resultado de la lectura</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada factura se asociará a un cliente existente o se enviará a crear cliente si no hay coincidencia.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">PDF</th>
                  <th className="px-5 py-3 font-medium">Datos detectados</th>
                  <th className="px-5 py-3 font-medium">Cliente asociado</th>
                  <th className="px-5 py-3 font-medium">Factura</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Importe</th>
                  <th className="px-5 py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((file) => {
                  const extractedData = getExtractedData(file.extractedData);

                  return (
                    <tr key={file.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-medium">{file.fileName}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{extractedData.customerName || "Sin cliente detectado"}</p>
                        <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                          <p>{extractedData.customerTaxId || "Sin CIF/NIF"}</p>
                          <p>{extractedData.customerEmail || "Sin email"}</p>
                          <p>{extractedData.customerPhone || "Sin telefono"}</p>
                          <p>{extractedData.customerAddress || "Sin direccion"}</p>
                        </div>
                        {extractedData.aiError ? (
                          <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            {extractedData.aiError}
                          </p>
                        ) : null}
                        {typeof extractedData.confidence === "number" ? (
                          <p className="mt-2 text-xs text-slate-400">
                            Confianza IA: {Math.round(extractedData.confidence * 100)}%
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        {file.customer ? (
                          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {file.customer.name}
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Necesita cliente
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">{extractedData.invoiceNumber || "Sin numero"}</td>
                      <td className="px-5 py-4 text-slate-500">{extractedData.issueDate || "Sin fecha"}</td>
                      <td className="px-5 py-4 font-semibold">{formatAmount(extractedData.amountCents)}</td>
                      <td className="px-5 py-4">
                        {file.invoice ? (
                          <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                            <Link href={`/invoices/${file.invoice.id}`}>Ver factura</Link>
                          </Button>
                        ) : file.customer ? (
                          <form action={registerInvoiceFromFile}>
                            <input type="hidden" name="fileId" value={file.id} />
                            <Button type="submit" size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                              Registrar factura
                            </Button>
                          </form>
                        ) : (
                          <Button asChild size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                            <Link href={`/customers/new?invoiceFileId=${file.id}`}>Crear cliente</Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

