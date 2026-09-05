import Link from "next/link";
import { AlertTriangle, CalendarClock, CircleDollarSign } from "lucide-react";
import { notFound } from "next/navigation";

import {
  InvoiceStatus,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { AttachInvoicePdf } from "@/app/invoices/[invoiceId]/attach-invoice-pdf";
import { deleteInvoice } from "@/server/actions/delete-invoice";
import { markInvoiceAsPaid, unmarkInvoiceAsPaid } from "@/server/actions/mark-invoice-paid";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

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
      customer: true,
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
                  <Button asChild size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                    <Link href={`/invoices/${invoice.id}/claim-preview`}>Preparar reclamacion</Link>
                  </Button>
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
                  <dt className="text-sm text-slate-500">Estado</dt>
                  <dd className="mt-1">
                    <span className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium">
                      {formatInvoiceStatus(invoice.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Cobro</dt>
                  <dd className="mt-1 font-medium">{formatPaymentStatus(invoice.paymentStatus)}</dd>
                </div>
              </dl>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">PDF asociado</h2>
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
            </article>



            

          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Cronologia de reclamaciones</h2>
            <p className="mt-2 text-sm text-slate-500">
              Seguimiento de las reclamaciones preparadas para esta factura.
            </p>

            <div className="mt-5 space-y-4">
              {sentClaimDrafts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Todavia no hay reclamaciones preparadas.
                </p>
              ) : (
                sentClaimDrafts.map((draft) => (
                  <div key={draft.id} className="border-l border-blue-200 pl-4">
                    <p className="text-sm font-medium">{draft.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {draft.status === "SENT" ? "Enviada" : "Preparada"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(draft.createdAt)}
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
