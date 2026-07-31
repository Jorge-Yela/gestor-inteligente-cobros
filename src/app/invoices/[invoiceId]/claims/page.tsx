import Link from "next/link";
import { CalendarClock, FileText } from "lucide-react";
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

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatStatus(status: ClaimDraftStatus) {
  const labels: Record<ClaimDraftStatus, string> = {
    DRAFT: "Preparada",
    READY: "Lista",
    SENT: "Enviada",
    CANCELLED: "Cancelada",
  };

  return labels[status];
}

type InvoiceClaimsPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function InvoiceClaimsPage({
  params,
  searchParams,
}: InvoiceClaimsPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { invoiceId } = await params;
  const { date } = await searchParams;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
    },
    include: {
      customer: true,
      claimDrafts: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          template: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const filteredClaims = date
    ? invoice.claimDrafts.filter((claim) => formatDateInputValue(claim.createdAt) === date)
    : invoice.claimDrafts;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Volver a la factura
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Reclamaciones de la factura</h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Historial cronologico de reclamaciones individuales y conjuntas asociadas a {invoice.invoiceNumber}.
            </p>
          </div>

        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total reclamaciones</p>
                <p className="mt-1 text-2xl font-bold">{invoice.claimDrafts.length}</p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ultima reclamacion</p>
                <p className="mt-1 text-lg font-bold">
                  {invoice.claimDrafts[0] ? formatDate(invoice.claimDrafts[0].createdAt) : "Sin fecha"}
                </p>
              </div>
            </div>
          </article>

        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Historial cronologico</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ordenado desde la reclamacion mas reciente a la mas antigua.
              </p>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row">
              <input
                type="date"
                name="date"
                defaultValue={date || ""}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
              <Button type="submit" variant="outline" className="rounded-lg border-slate-200">
                Buscar por fecha
              </Button>
              {date ? (
                <Button asChild variant="outline" className="rounded-lg border-slate-200">
                  <Link href={`/invoices/${invoice.id}/claims`}>Limpiar</Link>
                </Button>
              ) : null}
            </form>
          </div>

          {filteredClaims.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              No hay reclamaciones para esa fecha.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredClaims.map((claim) => (
                <article key={claim.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{claim.subject}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(claim.createdAt)} · {claim.template?.name || "Sin plantilla"}
                      </p>
                    </div>
                    <span className="w-fit rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium">
                      {formatStatus(claim.status)}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {claim.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
