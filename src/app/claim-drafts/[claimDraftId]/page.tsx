import Link from "next/link";
import { Mail, Send, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { ClaimDraftStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatStatus(status: ClaimDraftStatus) {
  const labels: Record<ClaimDraftStatus, string> = {
    DRAFT: "Preparada",
    READY: "Lista para enviar",
    SENT: "Registrada",
    CANCELLED: "Cancelada",
  };

  return labels[status];
}

type ClaimDraftDetailPageProps = {
  params: Promise<{
    claimDraftId: string;
  }>;
};

export default async function ClaimDraftDetailPage({ params }: ClaimDraftDetailPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { claimDraftId } = await params;

  const draft = await prisma.claimDraft.findFirst({
    where: {
      id: claimDraftId,
      organizationId,
    },
    include: {
      customer: true,
      invoice: true,
      template: true,
    },
  });

  if (!draft) {
    notFound();
  }

  const emailTo = draft.customer.email || "";
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/claim-drafts" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Volver a reclamaciones
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Detalle de reclamacion</h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Revisa el contenido preparado antes de enviarlo desde el correo del usuario.
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {formatStatus(draft.status)}
          </span>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Mail className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Mensaje de reclamacion</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {draft.template?.name || "Sin plantilla asociada"}
                </p>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Para</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {draft.customer.email || "Cliente sin email registrado"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Factura</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {draft.invoice.invoiceNumber}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Asunto</p>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900">
                  {draft.subject}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Mensaje</p>
                <div className="mt-2 min-h-[320px] whitespace-pre-line rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
                  {draft.body}
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-5">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold">Envio controlado</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                El boton abre Gmail con el destinatario, asunto y mensaje ya preparados. Tu decides y confirmas el envio final.
              </p>
              <Button asChild disabled={!draft.customer.email} className="mt-5 w-full">
                <a href={gmailHref} target="_blank" rel="noreferrer">
                  <Send className="mr-2 size-4" />
                  Enviar desde mi correo
                </a>
              </Button>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Resumen</h2>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-sm text-slate-500">Cliente</dt>
                  <dd className="mt-1 font-medium">{draft.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Factura</dt>
                  <dd className="mt-1 font-medium">{draft.invoice.invoiceNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Creada</dt>
                  <dd className="mt-1 font-medium">{formatDate(draft.createdAt)}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link href={`/invoices/${draft.invoiceId}`}>Ver factura</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/claim-drafts">Volver al listado</Link>
                </Button>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
