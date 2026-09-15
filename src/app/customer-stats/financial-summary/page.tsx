import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PrintReportButton } from "@/app/customer-stats/financial-summary/print-report-button";
import { PaymentStatus } from "@/generated/prisma/enums";
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

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function parseDateInput(value: string, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
}


function parseAmountInputToCents(value: string) {
  if (!value) {
    return undefined;
  }

  const amount = Number(
    value
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", "."),
  );

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return Math.round(amount * 100);
}
function getDelayDays(issueDate: Date | null, today: Date) {
  if (!issueDate) {
    return 0;
  }

  return Math.max(
    Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );
}

type FinancialSummaryPageProps = {
  searchParams?: Promise<{
    customerId?: string | string[];
    from?: string | string[];
    to?: string | string[];
    status?: string | string[];
    amountOrder?: string | string[];
    minAmount?: string | string[];
    maxAmount?: string | string[];
  }>;
};

export default async function FinancialSummaryPage({
  searchParams,
}: FinancialSummaryPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const params = await searchParams;

  const customerId = getSearchValue(params?.customerId);
  const from = getSearchValue(params?.from);
  const to = getSearchValue(params?.to);
  const status = getSearchValue(params?.status);
  const amountOrder = getSearchValue(params?.amountOrder);
  const minAmount = getSearchValue(params?.minAmount);
  const maxAmount = getSearchValue(params?.maxAmount);
  const minAmountCents = parseAmountInputToCents(minAmount);
  const maxAmountCents = parseAmountInputToCents(maxAmount);
  const nextAmountOrder = amountOrder === "desc" ? "asc" : "desc";
  const amountOrderLabel = amountOrder === "desc" ? "Importe ↓" : amountOrder === "asc" ? "Importe ↑" : "Importe";
  const amountOrderHref = `/customer-stats/financial-summary?${new URLSearchParams({
    ...(customerId ? { customerId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(status ? { status } : {}),
    ...(minAmount ? { minAmount } : {}),
    ...(maxAmount ? { maxAmount } : {}),
    amountOrder: nextAmountOrder,
  }).toString()}`;

  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to, true);
  const amountWhere =
    minAmountCents !== undefined || maxAmountCents !== undefined
      ? {
          amountCents: {
            ...(minAmountCents !== undefined ? { gte: minAmountCents } : {}),
            ...(maxAmountCents !== undefined ? { lte: maxAmountCents } : {}),
          },
        }
      : {};
  const today = new Date();

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
      ...amountWhere,
      ...(status === "paid" ? { paymentStatus: PaymentStatus.PAID } : {}),
      ...(status === "pending" ? { paymentStatus: { not: PaymentStatus.PAID } } : {}),
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
        customer: {
          name: "asc",
        },
      },
      {
        issueDate: "asc",
      },
    ],
    include: {
      customer: true,
    },
  });

  const summaryInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      ...(customerId ? { customerId } : {}),
      ...amountWhere,
      ...(fromDate || toDate
        ? {
            issueDate: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
  });

  const sortByAmount = <T extends { amountCents: number }>(items: T[]) =>
    amountOrder === "asc"
      ? [...items].sort((first, second) => first.amountCents - second.amountCents)
      : amountOrder === "desc"
        ? [...items].sort((first, second) => second.amountCents - first.amountCents)
        : items;

  const paidInvoices = sortByAmount(
    invoices.filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID),
  );
  const pendingInvoices = sortByAmount(
    invoices.filter((invoice) => invoice.paymentStatus !== PaymentStatus.PAID),
  );

  const collectedCents = summaryInvoices
    .filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID)
    .reduce((total, invoice) => total + invoice.amountCents, 0);
  const pendingCents = summaryInvoices
    .filter((invoice) => invoice.paymentStatus !== PaymentStatus.PAID)
    .reduce((total, invoice) => total + invoice.amountCents, 0);

  const pendingRows = pendingInvoices
    .map((invoice) => ({
      ...invoice,
      delayDays: getDelayDays(invoice.issueDate, today),
    }))
    .sort((first, second) => second.delayDays - first.delayDays);

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
              Resumen financiero
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Consulta facturas cobradas, importes pendientes y edad de la cartera con filtros por cliente y fecha.
            </p>
          </div>

          <PrintReportButton />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto_auto] lg:items-end">
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


            <div>
              <label htmlFor="minAmount" className="text-sm font-medium text-slate-700">
                Importe minimo
              </label>
              <input
                id="minAmount"
                name="minAmount"
                inputMode="decimal"
                defaultValue={minAmount}
                placeholder="Ej: 1000"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="maxAmount" className="text-sm font-medium text-slate-700">
                Importe maximo
              </label>
              <input
                id="maxAmount"
                name="maxAmount"
                inputMode="decimal"
                defaultValue={maxAmount}
                placeholder="Ej: 5000"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <Button type="submit" className="h-11 bg-blue-600 hover:bg-blue-700">
              Filtrar
            </Button>

            <Button asChild variant="outline" className="h-11 rounded-lg border-slate-200">
              <Link href="/customer-stats/financial-summary">Limpiar</Link>
            </Button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            href={`/customer-stats/financial-summary?status=paid`}
            label="Cobrado"
            value={formatAmount(collectedCents)}
            tone="emerald"
            active={status === "paid"}
          />
          <SummaryCard
            href={`/customer-stats/financial-summary?status=pending`}
            label="Pendiente"
            value={formatAmount(pendingCents)}
            tone="amber"
            active={status === "pending"}
          />
          <SummaryCard
            href="/customer-stats/financial-summary"
            label="Facturas filtradas"
            value={String(invoices.length)}
            tone="blue"
            active={!status}
          />
        </section>

        {status !== "pending" ? (
        <section className="print-report overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Facturas cobradas gracias a Norvalor</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresos registrados como cobrados.
            </p>
          </div>

          {paidInvoices.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No hay facturas cobradas con estos filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="print-table w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 text-right font-medium">
                      <Link href={amountOrderHref} className="inline-flex items-center justify-end text-blue-600 hover:underline">
                        {amountOrderLabel}
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paidInvoices.map((invoice) => (
                    <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 text-slate-500">{formatDate(invoice.paidAt || invoice.issueDate)}</td>
                      <td className="px-5 py-4 font-semibold">
                        <Link href={`/invoices/${invoice.id}`} className="hover:text-blue-600 hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/customers/${invoice.customerId}`} className="font-medium hover:text-blue-600 hover:underline">
                          {invoice.customer.name}
                        </Link>
                      </td>
                      <td className="amount px-5 py-4 text-right font-semibold text-emerald-700">
                        {formatAmount(invoice.amountCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        ) : null}

        {status !== "paid" ? (
        <section className="print-report overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Facturas pendientes de cobro</h2>
            <p className="mt-1 text-sm text-slate-500">
              Edad de la cartera ordenada por dias desde la fecha de factura.
            </p>
          </div>

          {pendingRows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No hay facturas pendientes con estos filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="print-table w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">Fecha factura</th>
                    <th className="px-5 py-3 font-medium text-right">Dias</th>
                    <th className="px-5 py-3 text-right font-medium">
                      <Link href={amountOrderHref} className="inline-flex items-center justify-end text-blue-600 hover:underline">
                        {amountOrderLabel}
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingRows.map((invoice) => (
                    <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <Link href={`/customers/${invoice.customerId}`} className="font-medium hover:text-blue-600 hover:underline">
                          {invoice.customer.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        <Link href={`/invoices/${invoice.id}`} className="hover:text-blue-600 hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(invoice.issueDate)}</td>
                      <td className="px-5 py-4 text-right font-semibold">{invoice.delayDays}</td>
                      <td className="amount px-5 py-4 text-right font-semibold text-amber-700">
                        {formatAmount(invoice.amountCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        ) : null}
      </div>
    </main>
  );
}

function SummaryCard({
  href,
  label,
  value,
  tone,
  active,
}: {
  href: string;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "blue";
  active: boolean;
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <Link
      href={href}
      className={`rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? tones[tone] : "border-slate-200"
      }`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${tones[tone].split(" ")[1]}`}>{value}</p>
    </Link>
  );
}
