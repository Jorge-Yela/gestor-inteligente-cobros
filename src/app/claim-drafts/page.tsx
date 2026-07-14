import Link from "next/link";
import { CheckCircle2, FileText, Mail, PencilLine, XCircle } from "lucide-react";

import { ClaimDraftStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

function formatStatus(status: ClaimDraftStatus) {
  const labels: Record<ClaimDraftStatus, string> = {
    DRAFT: "Preparada",
    READY: "Lista",
    SENT: "Registrada",
    CANCELLED: "Cancelada",
  };

  return labels[status];
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export default async function ClaimDraftsPage() {
  const organizationId = await getCurrentOrganizationId();

  const drafts = await prisma.claimDraft.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      invoice: true,
      customer: true,
      template: true,
    },
  });

  const preparedCount = drafts.filter((draft) => draft.status === ClaimDraftStatus.DRAFT).length;
  const readyCount = drafts.filter((draft) => draft.status === ClaimDraftStatus.READY).length;
  const sentCount = drafts.filter((draft) => draft.status === ClaimDraftStatus.SENT).length;
  const cancelledCount = drafts.filter((draft) => draft.status === ClaimDraftStatus.CANCELLED).length;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Reclamaciones</h1>
          <p className="mt-2 text-slate-500">
            Comunicaciones preparadas para reclamar facturas pendientes. Nada se envia automaticamente.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Preparadas" value={String(preparedCount)} detail="Pendientes de revisar" tone="blue" icon={PencilLine} />
          <SummaryCard label="Listas" value={String(readyCount)} detail="Con contenido validado" tone="emerald" icon={CheckCircle2} />
          <SummaryCard label="Registradas" value={String(sentCount)} detail="Marcadas como realizadas" tone="violet" icon={Mail} />
          <SummaryCard label="Canceladas" value={String(cancelledCount)} detail="Sin accion prevista" tone="red" icon={XCircle} />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Reclamaciones registradas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Vista global de reclamaciones preparadas, listas o archivadas por el usuario.
            </p>
          </div>

          {drafts.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              Todavia no hay reclamaciones registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">Asunto</th>
                    <th className="px-5 py-3 font-medium">Plantilla</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Creado</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold">{draft.customer.name}</td>
                      <td className="px-5 py-4 text-slate-500">{draft.invoice.invoiceNumber}</td>
                      <td className="px-5 py-4">{draft.subject}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {draft.template?.name || "Sin plantilla"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {formatStatus(draft.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(draft.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                          <Link href={`/invoices/${draft.invoiceId}`}>Ver factura</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "emerald" | "violet" | "red";
  icon: typeof FileText;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex size-11 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </article>
  );
}