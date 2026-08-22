import Link from "next/link";
import { Search } from "lucide-react";

import { ClaimDraftStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { CustomerSearch } from "./customer-search";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

type SentClaimDraftsPageProps = {
  searchParams: Promise<{
    customer?: string;
    invoice?: string;
    date?: string;
  }>;
};

export default async function SentClaimDraftsPage({ searchParams }: SentClaimDraftsPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const {
    customer = "",
    invoice = "",
    date = "",
  } = await searchParams;

  const normalizedCustomer = customer.trim().toLowerCase();
  const normalizedInvoice = invoice.trim().toLowerCase();

  const [sentDrafts, customers] = await Promise.all([
    prisma.claimDraft.findMany({
      where: {
        organizationId,
        status: ClaimDraftStatus.SENT,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        invoice: true,
        customer: true,
        template: true,
      },
    }),
    prisma.customer.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
      },
    }),
  ]);

  const customerOptions = customers.map((customer) => customer.name);

  const filteredDrafts = sentDrafts.filter((draft) => {
    const matchesCustomer = normalizedCustomer
      ? draft.customer.name.toLowerCase().includes(normalizedCustomer)
      : true;
    const matchesInvoice = normalizedInvoice
      ? draft.invoice.invoiceNumber.toLowerCase().includes(normalizedInvoice)
      : true;
    const matchesDate = date
      ? draft.createdAt.toISOString().slice(0, 10) === date
      : true;

    return matchesCustomer && matchesInvoice && matchesDate;
  });

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <Link href="/claim-drafts" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Volver a reclamaciones
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Reclamaciones realizadas</h1>
          <p className="mt-2 text-slate-500">
            Busca correos enviados o registrados por cliente, factura o fecha.
          </p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Search className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Buscador</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredDrafts.length} reclamaciones encontradas.
              </p>
            </div>
          </div>

          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
            <CustomerSearch defaultValue={customer} customers={customerOptions} />

            <div>
              <label htmlFor="invoice" className="text-xs font-medium text-slate-500">
                Factura
              </label>
              <input
                id="invoice"
                name="invoice"
                defaultValue={invoice}
                placeholder="Buscar factura"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="date" className="text-xs font-medium text-slate-500">
                Fecha
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={date}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" variant="outline" className="rounded-lg border-slate-200">
                Buscar
              </Button>
              {(customer || invoice || date) ? (
                <Button asChild variant="outline" className="rounded-lg border-slate-200">
                  <Link href="/claim-drafts/sent">Quitar filtros</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filteredDrafts.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              No hay reclamaciones realizadas para esta busqueda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">Asunto</th>
                    <th className="px-5 py-3 font-medium">Plantilla</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrafts.map((draft) => (
                    <tr key={draft.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold">{draft.customer.name}</td>
                      <td className="px-5 py-4 text-slate-500">{draft.invoice.invoiceNumber}</td>
                      <td className="px-5 py-4">{draft.subject}</td>
                      <td className="px-5 py-4 text-slate-500">{draft.template?.name || "Sin plantilla"}</td>
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
