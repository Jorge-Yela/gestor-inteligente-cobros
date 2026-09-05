import Link from "next/link";
import { Mail, Send, ShieldCheck } from "lucide-react";
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

function formatTone(tone: TemplateTone) {
  const labels: Record<TemplateTone, string> = {
    FRIENDLY: "Recordatorio amable",
    FIRM: "Recordatorio firme",
    FINAL_NOTICE: "Ultimo aviso",
  };

  return labels[tone];
}

type ClaimPreviewPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function ClaimPreviewPage({ params }: ClaimPreviewPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
      paymentStatus: PaymentStatus.UNPAID,
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
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

  const variables = {
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: formatAmount(invoice.amountCents),
    controlDate: formatDate(invoice.dueDate),
  };

  const templateGroups = [
    {
      tone: TemplateTone.FRIENDLY,
      title: "Recordatorio amable",
      description: "Mensajes suaves para primeros avisos o clientes habituales.",
      badgeClassName: "bg-blue-50 text-blue-700",
    },
    {
      tone: TemplateTone.FIRM,
      title: "Reclamacion firme",
      description: "Mensajes mas directos cuando ya existe retraso o falta de respuesta.",
      badgeClassName: "bg-amber-50 text-amber-700",
    },
    {
      tone: TemplateTone.FINAL_NOTICE,
      title: "Ultimo aviso",
      description: "Comunicaciones finales antes de tomar nuevas medidas.",
      badgeClassName: "bg-red-50 text-red-700",
    },
  ].map((group) => ({
    ...group,
    templates: templates.filter((template) => template.tone === group.tone),
  }));

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href={`/invoices/${invoice.id}`}
              className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              Volver a la factura
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Preparar reclamacion
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Elige una plantilla para abrir el correo con destinatario, asunto y mensaje preparados.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Cliente: <span className="font-semibold">{invoice.customer.name}</span>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Factura seleccionada</h2>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatAmount(invoice.amountCents)} · {formatDate(invoice.dueDate)}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold">Envio controlado</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Al pulsar enviar, se registra la reclamacion y se abre Gmail. El envio final lo confirmas tu desde tu correo.
              </p>
            </article>
          </aside>

          <section className="space-y-5">
            {templateGroups.map((group) => (
              <details key={group.tone} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" open={group.templates.length > 0}>
                <summary className="cursor-pointer list-none px-5 py-4 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold">{group.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${group.badgeClassName}`}>
                      {group.templates.length} plantilla{group.templates.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </summary>

                {group.templates.length === 0 ? (
                  <p className="border-t border-slate-100 px-5 py-5 text-sm text-slate-500">
                    No hay plantillas en este grupo.
                  </p>
                ) : (
                  <div className="space-y-4 border-t border-slate-100 p-5">
                    {group.templates.map((template) => {
                      const subject = renderTemplate(template.subject, variables);
                      const body = renderTemplate(template.body, variables);
                      const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(invoice.customer.email || "")}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                      return (
                        <article key={template.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                {formatTone(template.tone)}
                              </span>
                              <h3 className="mt-3 font-semibold">{template.name}</h3>
                              <p className="mt-1 text-sm text-slate-500">{subject}</p>
                            </div>

                            <form action={createBulkClaimDrafts}>
                              <input type="hidden" name="customerId" value={invoice.customerId} />
                              <input type="hidden" name="templateId" value={template.id} />
                              <input type="hidden" name="subject" value={subject} />
                              <input type="hidden" name="body" value={body} />
                              <input type="hidden" name="gmailHref" value={gmailHref} />
                              <input type="hidden" name="invoiceIds" value={invoice.id} />
                              <Button type="submit" disabled={!invoice.customer.email} className="bg-blue-600 shadow-sm hover:bg-blue-700">
                                <Send className="mr-2 size-4" />
                                Enviar correo
                              </Button>
                            </form>
                          </div>

                          <div className="mt-5 whitespace-pre-line rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                            {body}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </details>
            ))}

          {templates.length === 0 ? (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Mail className="size-6 text-slate-400" />
                <h2 className="mt-4 font-semibold">No hay plantillas disponibles</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Crea una plantilla antes de preparar una reclamacion.
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
