import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { createCustomerInvoice } from "@/server/actions/create-customer-invoice";

type NewCustomerInvoicePageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function NewCustomerInvoicePage({ params }: NewCustomerInvoicePageProps) {
  const { customerId } = await params;
  const organizationId = await getCurrentOrganizationId();

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      taxId: true,
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div>
          <Link
            href={`/customers/${customer.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="size-4" />
            Volver al cliente
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Añadir factura</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Registra una factura pendiente directamente para {customer.name}. El cliente ya queda asociado automaticamente.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FilePlus2 className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Datos de la factura</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Completa los datos principales. Se guardara como pendiente de cobro.
                </p>
              </div>
            </div>
          </div>

          <form action={createCustomerInvoice} className="grid gap-5 p-5">
            <input type="hidden" name="customerId" value={customer.id} />

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold">{customer.name}</p>
              <p className="mt-1 text-xs text-slate-500">{customer.taxId || "Sin CIF/NIF"}</p>
            </div>

            <div>
              <label htmlFor="invoiceNumber" className="text-sm font-medium text-slate-700">
                Numero de factura
              </label>
              <input
                id="invoiceNumber"
                name="invoiceNumber"
                required
                placeholder="Ejemplo: F-2026-001"
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="issueDate" className="text-sm font-medium text-slate-700">
                Fecha factura
              </label>
              <input
                id="issueDate"
                name="issueDate"
                type="date"
                required
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="amount" className="text-sm font-medium text-slate-700">
                Importe
              </label>
              <input
                id="amount"
                name="amount"
                required
                inputMode="decimal"
                placeholder="Ejemplo: 1250,50"
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Notas internas opcionales sobre esta factura."
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" className="rounded-lg border-slate-200">
                <Link href={`/customers/${customer.id}`}>Cancelar</Link>
              </Button>
              <Button
                type="submit"
                name="submitAction"
                value="save-and-new"
                variant="outline"
                className="rounded-lg border-slate-200"
              >
                Guardar y añadir otra
              </Button>
              <Button
                type="submit"
                name="submitAction"
                value="save"
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Guardar factura
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
