import Link from "next/link";
import { AlertTriangle, CalendarClock, CircleDollarSign, Phone } from "lucide-react";
import { notFound } from "next/navigation";

import { PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { AttachInvoicePdf } from "@/app/invoices/[invoiceId]/attach-invoice-pdf";
import { deleteInvoice } from "@/server/actions/delete-invoice";
import { markInvoiceAsPaid, unmarkInvoiceAsPaid, updateInvoicePaidDate } from "@/server/actions/mark-invoice-paid";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { registerInvoiceCall } from "@/server/actions/register-invoice-call";

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


function formatPaymentStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    UNPAID: "No cobrada",
    PAID: "Cobrada",
    DISPUTED: "En disputa",
  };

  return labels[status];
}

function getDelayTone(delayDays: number | null) {
  if (delayDays === null) {
    return {
      icon: "bg-slate-50 text-slate-500",
      dot: "bg-slate-400",
      text: "text-slate-500",
      label: "Sin fecha",
    };
  }

  if (delayDays <= 15) {
    return {
      icon: "bg-emerald-50 text-emerald-600",
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      label: "Retraso bajo",
    };
  }

  if (delayDays <= 45) {
    return {
      icon: "bg-amber-50 text-amber-600",
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: "Retraso medio",
    };
  }

  return {
    icon: "bg-red-50 text-red-600",
    dot: "bg-red-500",
    text: "text-red-700",
    label: "Retraso alto",
  };
}

type InvoiceDetailPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
    },
    include: {
      customer: {
        include: {
          invoices: {
            orderBy: {
              issueDate: "desc",
            },
          },
        },
      },
      timelineEvents: {
        orderBy: {
          createdAt: "desc",
        },
      },
      claimDrafts: {
        orderBy: {
          createdAt: "desc",
        },
      },
      file: true,
      followUpPlan: {
        include: {
          steps: {
            orderBy: {
              dueDate: "asc",
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const lastClaimDate = invoice.claimDrafts[0]?.createdAt || null;
  const today = new Date();
  const delayDays = invoice.issueDate
    ? Math.max(
        Math.floor((today.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)),
        0,
      )
    : null;
  const delayTone = getDelayTone(delayDays);
  const sentClaimDrafts = invoice.claimDrafts.filter((draft) => draft.status === "SENT");
  const callEvents = invoice.timelineEvents.filter((event) => event.title === "Llamada realizada");
  const claimTimelineItems = [
    ...sentClaimDrafts.map((draft) => ({
      id: draft.id,
      date: draft.updatedAt || draft.createdAt,
      title: draft.subject,
      description: draft.body,
    })),
    ...callEvents.map((event) => ({
      id: event.id,
      date: event.createdAt,
      title: event.title,
      description: event.description || "Llamada de seguimiento registrada.",
    })),
  ].sort((first, second) => second.date.getTime() - first.date.getTime());

  const customerInvoices = invoice.customer.invoices;
  const customerPaidInvoices = customerInvoices.filter(
    (customerInvoice) => customerInvoice.paymentStatus === PaymentStatus.PAID,
  );
  const customerPendingInvoices = customerInvoices.filter(
    (customerInvoice) =>
      customerInvoice.id !== invoice.id &&
      customerInvoice.paymentStatus !== PaymentStatus.PAID,
  );
  const paidInvoicesWithDates = customerPaidInvoices.filter(
    (customerInvoice) => customerInvoice.issueDate && customerInvoice.paidAt,
  );
  const averagePaymentDays = paidInvoicesWithDates.length > 0
    ? Math.round(
        paidInvoicesWithDates.reduce((total, customerInvoice) => {
          if (!customerInvoice.issueDate || !customerInvoice.paidAt) {
            return total;
          }

          const diffDays = Math.max(
            Math.ceil((customerInvoice.paidAt.getTime() - customerInvoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)),
            0,
          );

          return total + diffDays;
        }, 0) / paidInvoicesWithDates.length,
      )
    : null;
  const latePaidInvoices = paidInvoicesWithDates.filter((customerInvoice) => {
    if (!customerInvoice.issueDate || !customerInvoice.paidAt) {
      return false;
    }

    const diffDays = Math.max(
      Math.ceil((customerInvoice.paidAt.getTime() - customerInvoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    return diffDays > 30;
  });
  const customerPaymentSummary =
    paidInvoicesWithDates.length === 0
      ? "Aun no hay historial suficiente de cobros para este cliente."
      : latePaidInvoices.length > paidInvoicesWithDates.length / 2
        ? "Este cliente suele pagar tarde."
        : averagePaymentDays !== null && averagePaymentDays <= 15
          ? "Este cliente suele pagar rapido."
          : "Este cliente tiene un comportamiento de pago estable.";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/invoices" className="text-sm text-slate-500 hover:text-foreground">
              Volver a facturas
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <p className="mt-2 text-slate-500">
              Ficha de seguimiento de la factura.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <form action={invoice.paymentStatus === PaymentStatus.PAID ? unmarkInvoiceAsPaid : markInvoiceAsPaid}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Button type="submit">
                {invoice.paymentStatus === PaymentStatus.PAID ? "Cobrada" : "Marcar como cobrada"}
              </Button>
            </form>

            <form action={deleteInvoice}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Button
                type="submit"
                variant="outline"
                className="rounded-lg border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Borrar factura
              </Button>
            </form>
          </div>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <CircleDollarSign className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Importe</p>
                <p className="mt-1 text-2xl font-bold">{formatAmount(invoice.amountCents)}</p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ultima reclamacion</p>
                <p className="mt-1 text-lg font-bold">{formatDate(lastClaimDate)}</p>
              </div>
            </div>
          </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {invoice.paymentStatus === PaymentStatus.PAID ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Fecha de cobro</p>
                  <p className="mt-1 text-2xl font-bold">{formatDate(invoice.paidAt)}</p>
                </div>
              </div>

              <form action={updateInvoicePaidDate} className="flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <input
                  type="date"
                  name="paidDate"
                  defaultValue={formatDateInputValue(invoice.paidAt)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <Button type="submit" variant="outline" className="h-10 rounded-lg border-slate-200">
                  Cambiar fecha
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className={`flex size-11 items-center justify-center rounded-full ${delayTone.icon}`}>
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Dias de retraso</p>
                <p className="mt-1 text-2xl font-bold">
                  {delayDays === null ? "Sin fecha" : `${delayDays} dias`}
                </p>
                <p className={`mt-1 flex items-center gap-2 text-xs font-semibold ${delayTone.text}`}>
                  <span className={`size-2 rounded-full ${delayTone.dot}`} />
                  {delayTone.label}
                </p>
              </div>
            </div>
          )}
        </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold">Detalles de la factura</h2>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                    <Link href={`/invoices/${invoice.id}/edit`}>Editar detalles</Link>
                  </Button>
                  <div className="flex flex-col gap-2">
                    <Button asChild size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                      <Link href={`/invoices/${invoice.id}/claim-preview`}>Preparar reclamacion</Link>
                    </Button>
                    <form action={registerInvoiceCall}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <Button type="submit" variant="outline" size="sm" className="w-full rounded-lg border-slate-200">
                        <Phone className="mr-2 size-4" />
                        Llamada
                      </Button>
                    </form>
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-500">Cliente</dt>
                  <dd className="mt-1 font-medium">{invoice.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Importe</dt>
                  <dd className="mt-1 font-medium">{formatAmount(invoice.amountCents)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Fecha de emision</dt>
                  <dd className="mt-1 font-medium">{formatDate(invoice.issueDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Ultima reclamacion</dt>
                  <dd className="mt-1 font-medium">{formatDate(lastClaimDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Cobro</dt>
                  <dd className="mt-1 font-medium">{formatPaymentStatus(invoice.paymentStatus)}</dd>
                </div>
              </dl>


              <section className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="font-semibold">PDF asociado</h3>
              {invoice.file ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-medium">{invoice.file.fileName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Archivo usado para crear o revisar esta factura.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={invoice.file.fileUrl} target="_blank" rel="noreferrer">
                        Ver PDF
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mt-5 text-sm text-slate-500">
                    Esta factura no tiene ningun PDF asociado.
                  </p>
                  <AttachInvoicePdf invoiceId={invoice.id} />
                </div>
              )}
              </section>

              <section className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="font-semibold">Relacion con el cliente</h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">Historial de pago</p>
                    <p className="mt-2 text-sm font-semibold">{customerPaymentSummary}</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">Plazo medio</p>
                    <p className="mt-2 text-sm font-semibold">
                      {averagePaymentDays === null ? "Sin datos" : `${averagePaymentDays} dias`}
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-50 px-4 py-3">
                    <p className="text-xs font-medium text-amber-700">Otras pendientes</p>
                    <p className="mt-2 text-sm font-semibold text-amber-800">
                      {customerPendingInvoices.length} factura{customerPendingInvoices.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {customerPendingInvoices.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
                      <span>Factura</span>
                      <span>Fecha</span>
                      <span>Importe</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {customerPendingInvoices.slice(0, 5).map((customerInvoice) => (
                        <Link
                          key={customerInvoice.id}
                          href={`/invoices/${customerInvoice.id}`}
                          className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
                        >
                          <span className="font-medium">{customerInvoice.invoiceNumber}</span>
                          <span className="text-slate-500">{formatDate(customerInvoice.issueDate)}</span>
                          <span className="font-semibold">{formatAmount(customerInvoice.amountCents)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Este cliente no tiene otras facturas pendientes.
                  </p>
                )}
              </section>
            </article>




            

          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Cronologia de reclamaciones</h2>
            <p className="mt-2 text-sm text-slate-500">
              Seguimiento de las reclamaciones preparadas para esta factura.
            </p>

            <div className="mt-5 space-y-4">
              {claimTimelineItems.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Todavia no hay reclamaciones preparadas.
                </p>
              ) : (
                claimTimelineItems.map((item) => (
                  <div key={item.id} className="border-l border-blue-200 pl-4">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.title === "Llamada realizada" ? "Llamada registrada" : "Enviada"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(item.date)}
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
