import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { updateInvoice } from "@/server/actions/update-invoice";

import { Button } from "@/components/ui/button";

type EditInvoicePageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAmountForInput(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

function formatDateInputValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    "invalid-form": "Revisa los datos del formulario.",
    "customer-not-found": "El cliente seleccionado no existe.",
    "duplicate-invoice": "Ya existe una factura con ese número.",
  };

  return error ? messages[error] : null;
}

export default async function EditInvoicePage({ params, searchParams }: EditInvoicePageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { invoiceId } = await params;
  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  const [invoice, customers] = await Promise.all([
    prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
      include: {
        customer: true,
      },
    }),
    prisma.customer.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Volver a la factura
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Editar factura</h1>
          <p className="mt-2 text-slate-500">
            Corrige los datos principales si la lectura del PDF o el registro manual contiene algún error.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form action={updateInvoice} className="max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="invoiceId" value={invoice.id} />

          <div className="grid gap-5">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="customerId">
                Cliente
              </label>
              <select
                id="customerId"
                name="customerId"
                required
                defaultValue={invoice.customerId}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="invoiceNumber">
                Número de factura
              </label>
              <input
                id="invoiceNumber"
                name="invoiceNumber"
                required
                defaultValue={invoice.invoiceNumber}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="amount">
                Importe
              </label>
              <input
                id="amount"
                name="amount"
                required
                inputMode="decimal"
                defaultValue={formatAmountForInput(invoice.amountCents)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="issueDate">
                  Fecha de emisión
                </label>
                <input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  defaultValue={formatDateInputValue(invoice.issueDate)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="controlDate">
                  Fecha de control
                </label>
                <input
                  id="controlDate"
                  name="controlDate"
                  type="date"
                  defaultValue={formatDateInputValue(invoice.dueDate)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                Notas internas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={invoice.notes || ""}
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <Button asChild variant="outline" className="min-h-11 rounded-lg border-slate-200 px-5">
              <Link href={`/invoices/${invoice.id}`}>Cancelar</Link>
            </Button>
            <Button type="submit" className="min-h-11 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700">
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
