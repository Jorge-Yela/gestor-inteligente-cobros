import Link from "next/link";

import { createCustomer } from "@/server/actions/create-customer";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

type NewCustomerPageProps = {
  searchParams: Promise<{
    invoiceFileId?: string;
  }>;
};

type ExtractedInvoiceData = {
  customerName?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
};

function getExtractedData(value: unknown): ExtractedInvoiceData {
  return value && typeof value === "object" ? value as ExtractedInvoiceData : {};
}

export default async function NewCustomerPage({ searchParams }: NewCustomerPageProps) {
  const { invoiceFileId = "" } = await searchParams;
  const organizationId = await getCurrentOrganizationId();
  const invoiceFile = invoiceFileId
    ? await prisma.invoiceFile.findFirst({
        where: {
          id: invoiceFileId,
          organizationId,
        },
      })
    : null;
  const extractedData = getExtractedData(invoiceFile?.extractedData);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <Link
            href={invoiceFile ? `/invoice-files/import-review?fileIds=${invoiceFile.id}` : "/customers"}
            className="text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            {invoiceFile ? "Volver a la factura interpretada" : "Volver a clientes"}
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Nuevo cliente</h1>
          <p className="mt-2 text-slate-500">
            {invoiceFile
              ? "Completa los datos del cliente detectado para asociarlo a la factura."
              : "Crea un cliente para asociarlo después a facturas en seguimiento."}
          </p>
        </div>

        <form action={createCustomer} className="max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {invoiceFile ? <input type="hidden" name="invoiceFileId" value={invoiceFile.id} /> : null}

          <div className="grid gap-5">
            <div>
              <label className="text-sm font-medium" htmlFor="name">
                Nombre de empresa (obligatorio)
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={extractedData.customerName || ""}
                placeholder="Ejemplo: Acme Servicios SL"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="taxId">
                CIF/NIF
              </label>
              <input
                id="taxId"
                name="taxId"
                defaultValue={extractedData.customerTaxId || ""}
                placeholder="Ejemplo: B12345678"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="contactName">
                Persona de contacto
              </label>
              <input
                id="contactName"
                name="contactName"
                placeholder="Ejemplo: María López"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={extractedData.customerEmail || ""}
                  placeholder="administracion@cliente.com"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="phone">
                  Teléfono
                </label>
                <input
                  id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={extractedData.customerPhone || ""}
                  placeholder="+34 600 000 000"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                name="address"
                defaultValue={extractedData.customerAddress || ""}
                placeholder="Dirección fiscal o postal"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="notes">
                Notas internas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Notas internas sobre el cliente."
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <Button asChild variant="outline" className="min-h-11 px-5">
              <Link href={invoiceFile ? `/invoice-files/import-review?fileIds=${invoiceFile.id}` : "/customers"}>Cancelar</Link>
            </Button>
            <Button type="submit" className="min-h-11 bg-blue-600 px-5 text-white hover:bg-blue-700">Guardar cliente</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
