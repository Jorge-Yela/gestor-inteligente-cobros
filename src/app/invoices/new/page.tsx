import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { registerInvoice } from "@/server/actions/register-invoice";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

type RegisterInvoicePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    "invalid-form": "Revisa los datos del formulario.",
    "customer-not-found": "El cliente seleccionado no existe.",
    "duplicate-invoice": "Ya existe una factura con ese numero.",
  };

  return error ? messages[error] : null;
}

export default async function RegisterInvoicePage({ searchParams }: RegisterInvoicePageProps) {
  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a facturas
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Registrar factura</h1>
          <p className="mt-2 text-muted-foreground">
            Esta plataforma no emite facturas. Solo registra facturas existentes para controlar su cobro.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form action={registerInvoice} className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="grid gap-5">
            <div>
              <label className="text-sm font-medium" htmlFor="customerId">
                Cliente
              </label>
              <select
                id="customerId"
                name="customerId"
                required
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option value="">Selecciona un cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="invoiceNumber">
                Numero de factura existente
              </label>
              <input
                id="invoiceNumber"
                name="invoiceNumber"
                required
                placeholder="Ejemplo: FAC-2026-045"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="amount">
                Importe
              </label>
              <input
                id="amount"
                name="amount"
                required
                inputMode="decimal"
                placeholder="Ejemplo: 1250,00"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="issueDate">
                  Fecha de emision
                </label>
                <input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="controlDate">
                  Fecha de control
                </label>
                <input
                  id="controlDate"
                  name="controlDate"
                  type="date"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="notes">
                Notas internas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Notas internas sobre esta factura existente."
                className="mt-2 min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t pt-5">
            <Button asChild variant="outline">
              <Link href="/invoices">Cancelar</Link>
            </Button>
            <Button type="submit">Registrar factura</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
