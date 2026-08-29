import Link from "next/link";
import { ArrowDown, ArrowUp, CircleDollarSign, FileText, TrendingUp } from "lucide-react";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodDates(period: string) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (period === "month") {
    return {
      from: new Date(currentYear, currentMonth, 1),
      to: now,
    };
  }

  if (period === "quarter") {
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;

    return {
      from: new Date(currentYear, quarterStartMonth, 1),
      to: now,
    };
  }

  if (period === "year") {
    return {
      from: new Date(currentYear, 0, 1),
      to: now,
    };
  }

  return {
    from: null,
    to: null,
  };
}

type CustomerStatsPageProps = {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
    customerId?: string;
    status?: string;
  }>;
};

export default async function CustomerStatsPage({ searchParams }: CustomerStatsPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const {
    period = "all",
    from = "",
    to = "",
    customerId = "all",
    status = "all",
  } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      invoices: true,
    },
  });

  const periodDates = getPeriodDates(period);
  const fromDate = from ? new Date(`${from}T00:00:00`) : periodDates.from;
  const toDate = to ? new Date(`${to}T23:59:59`) : periodDates.to;

  const filteredCustomers =
    customerId === "all"
      ? customers
      : customers.filter((customer) => customer.id === customerId);

  const customerRows = filteredCustomers.map((customer) => {
    const invoices = customer.invoices.filter((invoice) => {
      const invoiceDate = invoice.issueDate || invoice.createdAt;
      const matchesFrom = fromDate ? invoiceDate >= fromDate : true;
      const matchesTo = toDate ? invoiceDate <= toDate : true;
      const matchesStatus =
        status === "paid"
          ? invoice.paymentStatus === PaymentStatus.PAID
          : status === "pending"
            ? invoice.paymentStatus !== PaymentStatus.PAID
            : true;

      return matchesFrom && matchesTo && matchesStatus;
    });

    return {
      ...customer,
      invoices,
    };
  });

  const stats = customerRows
    .map((customer) => {
      const unpaidInvoices = customer.invoices.filter(
        (invoice) => invoice.paymentStatus !== PaymentStatus.PAID,
      );

      const priorityInvoices = unpaidInvoices.filter(
        (invoice) =>
          invoice.status === InvoiceStatus.OVERDUE ||
          invoice.status === InvoiceStatus.ACTIVE,
      );

      const pendingCents = unpaidInvoices.reduce(
        (total, invoice) => total + invoice.amountCents,
        0,
      );

      const lastControlDate =
        customer.invoices
          .map((invoice) => invoice.dueDate)
          .filter((date): date is Date => Boolean(date))
          .sort((a, b) => b.getTime() - a.getTime())[0] || null;

      const riskLevel =
        pendingCents >= 1000000 || priorityInvoices.length >= 3
          ? "Alto"
          : pendingCents > 0 || priorityInvoices.length > 0
            ? "Medio"
            : "Bajo";

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        invoiceCount: customer.invoices.length,
        unpaidCount: unpaidInvoices.length,
        priorityCount: priorityInvoices.length,
        pendingCents,
        lastControlDate,
        riskLevel,
      };
    })
    .sort((a, b) => b.pendingCents - a.pendingCents);

  const allInvoices = customerRows.flatMap((customer) => customer.invoices);
  const paidInvoices = allInvoices.filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID);
  const totalInvoicedCents = allInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );
  const totalCollectedCents = paidInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );
  const collectedPercentage =
    totalInvoicedCents > 0
      ? Math.round((totalCollectedCents / totalInvoicedCents) * 100)
      : 0;
  const totalPendingCents = stats.reduce((total, customer) => total + customer.pendingCents, 0);
  const paidInvoicesWithDates = paidInvoices.filter(
    (invoice) => invoice.issueDate && invoice.paidAt,
  );
  function getAverageCollectionDays(invoices: typeof paidInvoicesWithDates) {
    return invoices.length > 0
      ? Math.round(
          invoices.reduce((total, invoice) => {
            if (!invoice.issueDate || !invoice.paidAt) {
              return total;
            }

            const diffMs = invoice.paidAt.getTime() - invoice.issueDate.getTime();

            return total + Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
          }, 0) / invoices.length,
        )
      : 0;
  }

  const averageCollectionDays = getAverageCollectionDays(paidInvoicesWithDates);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonthName = new Intl.DateTimeFormat("es-ES", {
    month: "long",
  }).format(previousMonthDate);

  const currentMonthPaidInvoices = paidInvoicesWithDates.filter(
    (invoice) =>
      invoice.paidAt?.getMonth() === currentMonth &&
      invoice.paidAt?.getFullYear() === currentYear,
  );
  const previousMonthPaidInvoices = paidInvoicesWithDates.filter(
    (invoice) =>
      invoice.paidAt?.getMonth() === previousMonthDate.getMonth() &&
      invoice.paidAt?.getFullYear() === previousMonthDate.getFullYear(),
  );

  const currentMonthAverageDays = getAverageCollectionDays(currentMonthPaidInvoices);
  const previousMonthAverageDays = getAverageCollectionDays(previousMonthPaidInvoices);
  const collectionDaysDifference = currentMonthAverageDays - previousMonthAverageDays;
  const collectionDaysComparison = previousMonthPaidInvoices.length > 0
    ? `${Math.abs(collectionDaysDifference)} dias vs ${previousMonthName}`
    : `Sin datos de ${previousMonthName}`;
  const hasFilters =
    period !== "all" ||
    Boolean(from) ||
    Boolean(to) ||
    customerId !== "all" ||
    status !== "all";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Panel de control
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Informes</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Vision agregada de clientes, importes pendientes y prioridad de gestion.
          </p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[160px_1fr_1fr_220px_180px_auto] lg:items-end">
            <div>
              <label htmlFor="period" className="text-xs font-medium text-slate-500">
                Periodo
              </label>
              <select
                id="period"
                name="period"
                defaultValue={period}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">Todo</option>
                <option value="month">Este mes</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Año</option>
              </select>
            </div>

            <div>
              <label htmlFor="from" className="text-xs font-medium text-slate-500">
                Desde
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={from}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="to" className="text-xs font-medium text-slate-500">
                Hasta
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={to}
                max={formatDateInput(new Date())}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="customerId" className="text-xs font-medium text-slate-500">
                Cliente
              </label>
              <select
                id="customerId"
                name="customerId"
                defaultValue={customerId}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">Todos los clientes</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="text-xs font-medium text-slate-500">
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">Total</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Cobrado</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Aplicar
              </button>
              {hasFilters ? (
                <Link
                  href="/customer-stats"
                  className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
                >
                  Limpiar
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total facturado" value={formatCurrency(totalInvoicedCents)} detail="Importe total emitido" tone="blue" icon={FileText} />
          <SummaryCard label="Total cobrado" value={formatCurrency(totalCollectedCents)} detail={`${collectedPercentage}% del total facturado`} tone="emerald" icon={TrendingUp} />
          <SummaryCard label="Total pendiente" value={formatCurrency(totalPendingCents)} detail="Importe por cobrar" tone="amber" icon={CircleDollarSign} />
          <SummaryCard
            label="Plazo medio de cobro"
            value={`${averageCollectionDays} dias`}
            detail={collectionDaysComparison}
            tone="violet"
            icon={collectionDaysDifference <= 0 ? ArrowDown : ArrowUp}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Ranking de clientes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ordenado por importe pendiente de cobro.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <TrendingUp className="size-3.5" />
              Actualizado con datos actuales
            </div>
          </div>

          {stats.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              Todavia no hay clientes registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Pendiente</th>
                    <th className="px-5 py-3 font-medium">Facturas</th>
                    <th className="px-5 py-3 font-medium">No cobradas</th>
                    <th className="px-5 py-3 font-medium">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.map((customer) => (
                    <tr key={customer.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {customer.email || "Sin email"}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold">{formatCurrency(customer.pendingCents)}</td>
                      <td className="px-5 py-4 text-slate-500">{customer.invoiceCount}</td>
                      <td className="px-5 py-4 text-slate-500">{customer.unpaidCount}</td>
                      <td className="px-5 py-4">
                        <span className={getRiskBadgeClassName(customer.riskLevel)}>
                          {customer.riskLevel}
                        </span>
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

function getRiskBadgeClassName(riskLevel: string) {
  const classes: Record<string, string> = {
    Alto: "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700",
    Medio: "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700",
    Bajo: "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700",
  };

  return classes[riskLevel] || classes.Bajo;
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
  tone: "amber" | "blue" | "violet" | "red" | "emerald";
  icon: typeof FileText;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
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
