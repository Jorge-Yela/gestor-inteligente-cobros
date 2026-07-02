import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { addInvoiceNote } from "@/server/actions/add-invoice-note";
import { markInvoiceAsPaid } from "@/server/actions/mark-invoice-paid";
import { updateInvoiceControlDate } from "@/server/actions/update-invoice-control-date";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "long",
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

function formatDateInputValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
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

function formatTimelineEventType(type: TimelineEventType) {
  const labels: Record<TimelineEventType, string> = {
    INVOICE_CREATED: "Factura creada",
    INVOICE_UPDATED: "Factura actualizada",
    INVOICE_MARKED_PAID: "Marcada como cobrada",
    CUSTOMER_CREATED: "Cliente creado",
    NOTE_ADDED: "Nota anadida",
  };

  return labels[type];
}

type InvoiceDetailPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: "demo-organization",
    },
    include: {
      customer: true,
      timelineEvents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
              Volver a facturas
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ficha de seguimiento de la factura.
            </p>
          </div>

          <div className="flex gap-2">
            <a href="#add-note" className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
              Anadir nota
            </a>
            <form action={markInvoiceAsPaid}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Button type="submit" disabled={invoice.paymentStatus === PaymentStatus.PAID}>
                {invoice.paymentStatus === PaymentStatus.PAID ? "Ya cobrada" : "Marcar como cobrada"}
              </Button>
            </form>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <article className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Datos principales</h2>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Cliente</dt>
                  <dd className="mt-1 font-medium">{invoice.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Importe</dt>
                  <dd className="mt-1 font-medium">{formatAmount(invoice.amountCents)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Fecha de emision</dt>
                  <dd className="mt-1 font-medium">{formatDate(invoice.issueDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Fecha de control</dt>
                  <dd className="mt-1 font-medium">{formatDate(invoice.dueDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Estado</dt>
                  <dd className="mt-1">
                    <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                      {formatInvoiceStatus(invoice.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Cobro</dt>
                  <dd className="mt-1 font-medium">{formatPaymentStatus(invoice.paymentStatus)}</dd>
                </div>
              </dl>
            </article>

            <article className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Fecha de control</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta fecha no tiene que venir en la factura. Sirve para organizar el seguimiento.
              </p>
              <form action={updateInvoiceControlDate} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <input
                  type="date"
                  name="controlDate"
                  required
                  defaultValue={formatDateInputValue(invoice.dueDate)}
                  className="h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <Button type="submit">Guardar fecha</Button>
              </form>
            </article>

            <article className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Notas internas</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {invoice.notes || "Todavia no hay notas internas para esta factura."}
              </p>
            </article>

            <article id="add-note" className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Anadir nota interna</h2>
              <form action={addInvoiceNote} className="mt-5 space-y-4">
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <textarea
                  name="note"
                  required
                  rows={4}
                  placeholder="Ejemplo: Cliente contactado por telefono. Confirma que pagara el viernes."
                  className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <Button type="submit">Guardar nota</Button>
              </form>
            </article>
          </div>

          <aside className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Cronologia</h2>

            <div className="mt-5 space-y-4">
              {invoice.timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavia no hay eventos registrados.
                </p>
              ) : (
                invoice.timelineEvents.map((event) => (
                  <div key={event.id} className="border-l pl-4">
                    <p className="text-sm font-medium">{formatTimelineEventType(event.type)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
