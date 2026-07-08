import Link from "next/link";

import { ClaimDraftStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

function formatStatus(status: ClaimDraftStatus) {
  const labels: Record<ClaimDraftStatus, string> = {
    DRAFT: "Preparada",
    READY: "Listo",
    SENT: "Enviado",
    CANCELLED: "Cancelado",
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Reclamaciones</h1>
          <p className="mt-2 text-muted-foreground">
            Reclamaciones preparadas o registradas por el usuario. Ninguna se envia automaticamente.
          </p>
        </div>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Reclamaciones registradas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vista global de reclamaciones preparadas, listas, enviadas o canceladas.
            </p>
          </div>

          {drafts.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted-foreground">
              Todavia no hay reclamaciones registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
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
                <tbody className="divide-y">
                  {drafts.map((draft) => (
                    <tr key={draft.id}>
                      <td className="px-5 py-4 font-medium">{draft.customer.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{draft.invoice.invoiceNumber}</td>
                      <td className="px-5 py-4">{draft.subject}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {draft.template?.name || "Sin plantilla"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                          {formatStatus(draft.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDate(draft.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm">
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
