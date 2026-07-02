import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
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
    return "Sin fecha asignada";
  }

  return dateFormatter.format(date);
}

function formatInvoiceStatus(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    PENDING_REVIEW: "Pendiente de revision",
    ACTIVE: "En seguimiento",
    OVERDUE: "Vencida",
    PAID: "Cobrada",
    CANCELLED: "Cancelada",
    ARCHIVED: "Archivada",
  };

  return labels[status];
}

function formatPaymentStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    UNPAID: "No cobrada",
    PAID: "Cobrada",
    DISPUTED: "En disputa",
  };

  return labels[status];
}

type CustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = await params;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: "demo-organization",
    },
    include: {
      invoices: {
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const pendingAmountCents = customer.invoices
    .filter((invoice) => invoice.paymentStatus === PaymentStatus.UNPAID)
    .reduce((total, invoice) => total + invoice.amountCents, 0);

  const overdueCount = customer.invoices.filter(
    (invoice) => invoice.status === InvoiceStatus.OVERDUE,
  ).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/customers" className="text-sm text-muted-foreground hover:text-foreground">
              Volver a clientes
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{customer.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Ficha del cliente y facturas asociadas.
            </p>
          </div>

          <Button>Editar cliente</Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <article className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Datos del cliente</h2>

              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-sm text-muted-foreground">CIF/NIF</dt>
                  <dd className="mt-1 font-medium">{customer.taxId || "Sin dato"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Contacto</dt>
                  <dd className="mt-1 font-medium">{customer.contactName || "Sin contacto"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="mt-1 font-medium">{customer.email || "Sin email"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Telefono</dt>
                  <dd className="mt-1 font-medium">{customer.phone || "Sin telefono"}</dd>
                </div>
              </dl>
            </article>

            <article className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Resumen</h2>

              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Facturas</dt>
                  <dd className="mt-1 text-2xl font-semibold">{customer.invoices.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Pendiente</dt>
                  <dd className="mt-1 text-2xl font-semibold">{formatAmount(pendingAmountCents)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Vencidas</dt>
                  <dd className="mt-1 text-2xl font-semibold">{overdueCount}</dd>
                </div>
              </dl>
            </article>
          </aside>

          <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Facturas del cliente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                La fecha mostrada es la fecha de control asignada para seguimiento.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">Fecha control</th>
                    <th className="px-5 py-3 font-medium">Importe</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Cobro</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customer.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-5 py-4 font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                      <td className="px-5 py-4 font-medium">{formatAmount(invoice.amountCents)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                          {formatInvoiceStatus(invoice.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatPaymentStatus(invoice.paymentStatus)}
                      </td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/invoices/${invoice.id}`}>Ver factura</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
