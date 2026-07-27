import Link from "next/link";
import { Mail, Send, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { renderTemplate } from "@/modules/templates/render-template";

import { Button } from "@/components/ui/button";
import { createClaimDraft } from "@/server/actions/create-claim-draft";

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
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const template = await prisma.template.findFirst({
    where: {
      organizationId,
      isDefault: true,
    },
  });

  if (!template) {
    notFound();
  }

  const variables = {
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: formatAmount(invoice.amountCents),
    controlDate: formatDate(invoice.dueDate),
  };

  const subject = renderTemplate(template.subject, variables);
  const body = renderTemplate(template.body, variables);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href={`/invoices/${invoice.id}`}
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              Volver a la factura
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Preparar reclamacion
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Revisa el mensaje antes de guardarlo. Nada se envia automaticamente desde la plataforma.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Cliente: <span className="font-semibold">{invoice.customer.name}</span>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Mail className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Mensaje preparado</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Plantilla aplicada: {template.name}
                </p>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Para</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {invoice.customer.email || "Cliente sin email registrado"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Factura</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {invoice.invoiceNumber} · {formatAmount(invoice.amountCents)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Asunto</p>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900">
                  {subject}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Mensaje</p>
                <div className="mt-2 min-h-[320px] whitespace-pre-line rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
                  {body}
                </div>
              </div>

              <form action={createClaimDraft} className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <input type="hidden" name="templateId" value={template.id} />
                <input type="hidden" name="subject" value={subject} />
                <input type="hidden" name="body" value={body} />
                <Button asChild variant="outline">
                  <Link href={`/invoices/${invoice.id}`}>Cancelar</Link>
                </Button>
                <Button type="submit">
                  <Send className="mr-2 size-4" />
                  Guardar reclamacion
                </Button>
              </form>
            </div>
          </article>

          <aside className="space-y-5">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold">Control del usuario</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Este paso solo guarda la reclamacion preparada. El envio real por email se conectara en la siguiente fase.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Resumen</h2>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-sm text-slate-500">Cliente</dt>
                  <dd className="mt-1 font-medium">{invoice.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Fecha de control</dt>
                  <dd className="mt-1 font-medium">{formatDate(invoice.dueDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Importe</dt>
                  <dd className="mt-1 font-medium">{formatAmount(invoice.amountCents)}</dd>
                </div>
              </dl>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
