import Link from "next/link";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

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

export default async function InvoicesPage() {
  const organizationId = await getCurrentOrganizationId();

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      dueDate: "asc",
    },
    include: {
      customer: true,
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Volver al dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Facturas</h1>
            <p className="mt-2 text-muted-foreground">
              Listado inicial de facturas controladas por la plataforma.
            </p>
          </div>

          <Button asChild>
            <Link href="/invoices/new">Registrar factura</Link>
          </Button>
        </div>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Facturas en seguimiento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Datos leidos desde PostgreSQL mediante Prisma.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Factura</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Vencimiento</th>
                  <th className="px-5 py-3 font-medium">Importe</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Cobro</th>
                  <th className="px-5 py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-4 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-5 py-4">{invoice.customer.name}</td>
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
                        <Link href={`/invoices/${invoice.id}`}>Ver detalle</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
