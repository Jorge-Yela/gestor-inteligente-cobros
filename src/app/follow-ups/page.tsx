import Link from "next/link";

import { PaymentStatus } from "@/generated/prisma/enums";
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

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Sin fecha";
  }

  return dateFormatter.format(date);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export default async function FollowUpsPage() {
  const today = startOfToday();
  const nextSevenDays = addDays(today, 7);

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: "demo-organization",
      paymentStatus: PaymentStatus.UNPAID,
    },
    orderBy: {
      dueDate: "asc",
    },
    include: {
      customer: true,
    },
  });

  const overdueInvoices = invoices.filter(
    (invoice) => invoice.dueDate && invoice.dueDate < today,
  );

  const upcomingInvoices = invoices.filter(
    (invoice) =>
      invoice.dueDate && invoice.dueDate >= today && invoice.dueDate <= nextSevenDays,
  );

  const withoutControlDate = invoices.filter((invoice) => !invoice.dueDate);

  const groups = [
    {
      title: "Vencidas",
      description: "Facturas cuya fecha de control ya ha pasado.",
      invoices: overdueInvoices,
    },
    {
      title: "Proximos 7 dias",
      description: "Facturas que requieren atencion pronto.",
      invoices: upcomingInvoices,
    },
    {
      title: "Sin fecha de control",
      description: "Facturas que necesitan que el usuario asigne una fecha.",
      invoices: withoutControlDate,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Seguimientos</h1>
          <p className="mt-2 text-muted-foreground">
            Vista operativa para decidir que facturas requieren atencion.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {groups.map((group) => (
            <article key={group.title} className="rounded-lg border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{group.title}</p>
              <p className="mt-3 text-3xl font-semibold">{group.invoices.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 space-y-6">
          {groups.map((group) => (
            <article key={group.title} className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">{group.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
              </div>

              {group.invoices.length === 0 ? (
                <p className="px-5 py-5 text-sm text-muted-foreground">
                  No hay facturas en este grupo.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="border-b bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-medium">Factura</th>
                        <th className="px-5 py-3 font-medium">Cliente</th>
                        <th className="px-5 py-3 font-medium">Fecha control</th>
                        <th className="px-5 py-3 font-medium">Importe</th>
                        <th className="px-5 py-3 font-medium">Accion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {group.invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-5 py-4 font-medium">{invoice.invoiceNumber}</td>
                          <td className="px-5 py-4">{invoice.customer.name}</td>
                          <td className="px-5 py-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                          <td className="px-5 py-4 font-medium">{formatAmount(invoice.amountCents)}</td>
                          <td className="px-5 py-4">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/invoices/${invoice.id}`}>Revisar</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
