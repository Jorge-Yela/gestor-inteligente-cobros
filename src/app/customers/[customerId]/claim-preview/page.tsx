import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { notFound } from "next/navigation";

import { PaymentStatus, TemplateTone } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { renderTemplate } from "@/modules/templates/render-template";
import { createBulkClaimDrafts } from "@/server/actions/create-bulk-claim-drafts";

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
  return date ? dateFormatter.format(date) : "Sin fecha";
}

function formatTone(tone: TemplateTone) {
  const labels: Record<TemplateTone, string> = {
    FRIENDLY: "Recordatorio amable",
    FIRM: "Recordatorio firme",
    FINAL_NOTICE: "Ultimo aviso",
  };

  return labels[tone];
}

type CustomerClaimPreviewPageProps = {
  params: Promise<{
    customerId: string;
  }>;
  searchParams: Promise<{
    invoiceIds?: string | string[];
  }>;
};

export default async function CustomerClaimPreviewPage({
  params,
  searchParams,
}: CustomerClaimPreviewPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { customerId } = await params;
  const { invoiceIds } = await searchParams;

  const selectedInvoiceIds = Array.isArray(invoiceIds)
    ? invoiceIds
    : invoiceIds
      ? [invoiceIds]
      : [];

  if (selectedInvoiceIds.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link href={`/customers/${customerId}`} className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Volver al cliente
          </Link>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Selecciona al menos una factura</h1>
            <p className="mt-2 text-sm text-slate-500">
              Vuelve a la ficha del cliente y marca las facturas que quieres reclamar conjuntamente.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    include: {
      invoices: {
        where: {
          id: {
            in: selectedInvoiceIds,
          },
          paymentStatus: PaymentStatus.UNPAID,
        },
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const templates = await prisma.template.findMany({
    where: {
      organizationId,
      archivedAt: null,
    },
    orderBy: [
      {
        tone: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  const totalAmountCents = customer.invoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );

  const invoiceLines = customer.invoices
    .map(
      (invoice) =>
        `- Factura ${invoice.invoiceNumber}: ${formatAmount(invoice.amountCents)} · Fecha de control: ${formatDate(invoice.dueDate)}`,
    )
    .join("\n");

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Volver al cliente
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Reclamacion conjunta</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Elige la plantilla que quieres usar para reclamar varias facturas de {customer.name}.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Facturas seleccionadas</h2>
              <p className="mt-2 text-sm text-slate-500">
                {customer.invoices.length} facturas pendientes incluidas.
              </p>
              <p className="mt-4 text-3xl font-bold">{formatAmount(totalAmountCents)}</p>

              <div className="mt-5 space-y-3">
                {customer.invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatAmount(invoice.amountCents)} · {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </aside>

          <section className="space-y-5">
            {templates.map((template) => {
              const subject = renderTemplate(template.subject, {
                customerName: customer.name,
                invoiceNumber: `${customer.invoices.length} facturas pendientes`,
                amount: formatAmount(totalAmountCents),
                controlDate: "varias fechas",
              });

              const baseBody = renderTemplate(template.body, {
                customerName: customer.name,
                invoiceNumber: `${customer.invoices.length} facturas pendientes`,
                amount: formatAmount(totalAmountCents),
                controlDate: "varias fechas",
              });

              const body = `${baseBody}

Detalle de facturas:
${invoiceLines}

Importe total pendiente: ${formatAmount(totalAmountCents)}`;

              const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customer.email || "")}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

              return (
                <article key={template.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {formatTone(template.tone)}
                      </span>
                      <h2 className="mt-3 font-semibold">{template.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{subject}</p>
                    </div>
                    <form action={createBulkClaimDrafts}>
                      <input type="hidden" name="customerId" value={customer.id} />
                      <input type="hidden" name="templateId" value={template.id} />
                      <input type="hidden" name="subject" value={subject} />
                      <input type="hidden" name="body" value={body} />
                      <input type="hidden" name="gmailHref" value={gmailHref} />
                      {customer.invoices.map((invoice) => (
                        <input key={invoice.id} type="hidden" name="invoiceIds" value={invoice.id} />
                      ))}
                      <Button type="submit" disabled={!customer.email} className="bg-blue-600 shadow-sm hover:bg-blue-700">
                        <Send className="mr-2 size-4" />
                        Enviar correo
                      </Button>
                    </form>
                  </div>

                  <div className="mt-5 whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {body}
                  </div>
                </article>
              );
            })}

            {templates.length === 0 ? (
              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Mail className="size-6 text-slate-400" />
                <h2 className="mt-4 font-semibold">No hay plantillas disponibles</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Crea una plantilla antes de preparar una reclamacion conjunta.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/templates/new">Crear plantilla</Link>
                </Button>
              </article>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
