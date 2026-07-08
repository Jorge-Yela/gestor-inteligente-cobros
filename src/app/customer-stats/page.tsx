import Link from "next/link";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Sin fecha";
}

export default async function CustomerStatsPage() {
  const organizationId = await getCurrentOrganizationId();

  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      invoices: true,
    },
  });

  const stats = customers
    .map((customer) => {
      const unpaidInvoices = customer.invoices.filter(
        (invoice) => invoice.paymentStatus !== PaymentStatus.PAID
      );

      const overdueInvoices = unpaidInvoices.filter(
        (invoice) => invoice.status === InvoiceStatus.OVERDUE
      );

      const pendingCents = unpaidInvoices.reduce(
        (total, invoice) => total + invoice.amountCents,
        0
      );

      const lastControlDate =
        customer.invoices
          .map((invoice) => invoice.dueDate)
          .filter((date): date is Date => Boolean(date))
          .sort((a, b) => b.getTime() - a.getTime())[0] || null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        invoiceCount: customer.invoices.length,
        unpaidCount: unpaidInvoices.length,
        overdueCount: overdueInvoices.length,
        pendingCents,
        lastControlDate,
      };
    })
    .sort((a, b) => b.pendingCents - a.pendingCents);

  const totalPendingCents = stats.reduce((total, customer) => total + customer.pendingCents, 0);
  const totalUnpaidInvoices = stats.reduce((total, customer) => total + customer.unpaidCount, 0);
  const totalOverdueInvoices = stats.reduce((total, customer) => total + customer.overdueCount, 0);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Estadisticas de clientes</h1>
          <p className="mt-2 text-muted-foreground">
            Vista agregada de deuda pendiente y seguimiento por cliente.
          </p>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Pendiente total</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(totalPendingCents)}</p>
          </article>
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Facturas no cobradas</p>
            <p className="mt-3 text-2xl font-semibold">{totalUnpaidInvoices}</p>
          </article>
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Facturas vencidas</p>
            <p className="mt-3 text-2xl font-semibold">{totalOverdueInvoices}</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Ranking de clientes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ordenado por importe pendiente de cobro.
            </p>
          </div>

          {stats.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted-foreground">
              Todavia no hay clientes registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Pendiente</th>
                    <th className="px-5 py-3 font-medium">Facturas</th>
                    <th className="px-5 py-3 font-medium">No cobradas</th>
                    <th className="px-5 py-3 font-medium">Vencidas</th>
                    <th className="px-5 py-3 font-medium">Ultima fecha de control</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium">{customer.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {customer.email || "Sin email"}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium">{formatCurrency(customer.pendingCents)}</td>
                      <td className="px-5 py-4 text-muted-foreground">{customer.invoiceCount}</td>
                      <td className="px-5 py-4 text-muted-foreground">{customer.unpaidCount}</td>
                      <td className="px-5 py-4 text-muted-foreground">{customer.overdueCount}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(customer.lastControlDate)}
                      </td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/customers/${customer.id}`}>Ver cliente</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
