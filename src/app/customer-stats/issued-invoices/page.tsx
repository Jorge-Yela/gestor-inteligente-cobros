import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PrintReportButton } from "@/app/customer-stats/issued-invoices/print-report-button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatAmount(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Sin fecha";
}

function getVatBreakdown(totalCents: number) {
  const baseCents = Math.round(totalCents / 1.21);
  const vatCents = totalCents - baseCents;

  return {
    baseCents,
    vatCents,
    vatRate: "21%",
  };
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function parseDateInput(value: string, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
}

type IssuedInvoicesReportPageProps = {
  searchParams?: Promise<{
    customerId?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

export default async function IssuedInvoicesReportPage({
  searchParams,
}: IssuedInvoicesReportPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const params = await searchParams;

  const customerId = getSearchValue(params?.customerId);
  const from = getSearchValue(params?.from);
  const to = getSearchValue(params?.to);

  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to, true);

  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      ...(customerId ? { customerId } : {}),
      ...(fromDate || toDate
        ? {
            issueDate: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: [
      {
        issueDate: "desc",
      },
      {
        invoiceNumber: "asc",
      },
    ],
    include: {
      customer: true,
    },
  });

  const totals = invoices.reduce(
    (summary, invoice) => {
      const vat = getVatBreakdown(invoice.amountCents);

      return {
        baseCents: summary.baseCents + vat.baseCents,
        vatCents: summary.vatCents + vat.vatCents,
        totalCents: summary.totalCents + invoice.amountCents,
      };
    },
    {
      baseCents: 0,
      vatCents: 0,
      totalCents: 0,
    },
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 print:bg-white">
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 12mm;
            }

            body {
              background: white;
              color: #0f172a;
            }

            main {
              background: white !important;
            }

            .print-report {
              border: 0 !important;
              box-shadow: none !important;
            }

            .print-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            .print-table thead {
              background: #e2e8f0 !important;
            }

            .print-table th {
              border: 1px solid #cbd5e1;
              padding: 8px;
              font-weight: 700;
              color: #334155;
              text-align: left;
            }

            .print-table td {
              border: 1px solid #e2e8f0;
              padding: 8px;
              color: #0f172a;
            }

            .print-table .amount {
              text-align: right;
              font-weight: 700;
            }

            .print-summary {
              border: 1px solid #cbd5e1 !important;
              box-shadow: none !important;
              break-inside: avoid;
            }
          }
        `}
      </style>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/customer-stats" className="text-sm font-medium text-slate-500 hover:text-blue-600 print:hidden">
              Volver a informes
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Libro registro de facturas emitidas
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Listado de facturas emitidas con fecha, numero, NIF del cliente, base imponible, tipo de IVA y cuota repercutida.
            </p>
          </div>

          <PrintReportButton />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto] lg:items-end">
            <div>
              <label htmlFor="customerId" className="text-sm font-medium text-slate-700">
                Cliente
              </label>
              <select
                id="customerId"
                name="customerId"
                defaultValue={customerId}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Todos los clientes</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="from" className="text-sm font-medium text-slate-700">
                Desde
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={from}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="to" className="text-sm font-medium text-slate-700">
                Hasta
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={to}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <Button type="submit" className="h-11 bg-blue-600 hover:bg-blue-700">
              Filtrar
            </Button>

            <Button asChild variant="outline" className="h-11 rounded-lg border-slate-200">
              <Link href="/customer-stats/issued-invoices">Limpiar</Link>
            </Button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
          <SummaryCard label="Base imponible" value={formatAmount(totals.baseCents)} />
          <SummaryCard label="Cuota IVA" value={formatAmount(totals.vatCents)} />
          <SummaryCard label="Total facturado" value={formatAmount(totals.totalCents)} />
        </section>

        <section className="print-report overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Facturas emitidas</h2>
              <p className="mt-1 text-sm text-slate-500">
                {invoices.length} factura{invoices.length === 1 ? "" : "s"} encontrada{invoices.length === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              IVA aplicado por defecto: 21%
            </div>
          </div>

          {invoices.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              No hay facturas emitidas con estos filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="print-table w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Numero de factura</th>
                    <th className="px-5 py-3 font-medium">NIF/CIF cliente</th>
                    <th className="px-5 py-3 font-medium text-right">Base imponible</th>
                    <th className="px-5 py-3 font-medium text-right">Tipo IVA</th>
                    <th className="px-5 py-3 font-medium text-right">Cuota repercutida</th>
                    <th className="px-5 py-3 font-medium text-right">Total factura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => {
                    const vat = getVatBreakdown(invoice.amountCents);

                    return (
                      <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4 text-slate-500">{formatDate(invoice.issueDate)}</td>
                        <td className="px-5 py-4 font-semibold">
                          <Link href={`/invoices/${invoice.id}`} className="hover:text-blue-600 hover:underline">
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{invoice.customer.taxId || "Sin CIF/NIF"}</td>
                        <td className="amount px-5 py-4 text-right font-semibold">{formatAmount(vat.baseCents)}</td>
                        <td className="px-5 py-4 text-right text-slate-500">{vat.vatRate}</td>
                        <td className="amount px-5 py-4 text-right font-semibold">{formatAmount(vat.vatCents)}</td>
                        <td className="amount px-5 py-4 text-right font-semibold">{formatAmount(invoice.amountCents)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="print-summary rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </article>
  );
}
