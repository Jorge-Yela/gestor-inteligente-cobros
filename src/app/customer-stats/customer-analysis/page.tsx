import Link from "next/link";
import { BarChart3, Clock, CreditCard, Percent, TrendingUp, Users } from "lucide-react";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatAmount(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function formatPercentage(value: number) {
  return `${value}%`;
}

function getDaysBetween(start: Date | null, end: Date | null) {
  if (!start || !end) {
    return null;
  }

  return Math.max(
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );
}

export default async function CustomerAnalysisPage() {
  const organizationId = await getCurrentOrganizationId();
  const today = new Date();

  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      invoices: {
        include: {
          claimDrafts: true,
        },
      },
    },
  });

  const allInvoices = customers.flatMap((customer) => customer.invoices);
  const totalInvoicedCents = allInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );

  const customerRanking = customers
    .map((customer) => {
      const invoicedCents = customer.invoices.reduce(
        (total, invoice) => total + invoice.amountCents,
        0,
      );

      return {
        id: customer.id,
        name: customer.name,
        invoiceCount: customer.invoices.length,
        invoicedCents,
        invoicedAmount: formatAmount(invoicedCents),
        percentage:
          totalInvoicedCents > 0
            ? Math.round((invoicedCents / totalInvoicedCents) * 100)
            : 0,
      };
    })
    .filter((customer) => customer.invoicedCents > 0)
    .sort((first, second) => second.invoicedCents - first.invoicedCents);

  const topCustomer = customerRanking[0];
  const topCustomerPercentage = topCustomer?.percentage || 0;
  const concentrationLabel =
    topCustomerPercentage >= 45
      ? "Dependencia alta"
      : topCustomerPercentage >= 25
        ? "Concentracion moderada"
        : "Ingresos diversificados";

  const paidInvoicesWithDates = allInvoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.PAID && invoice.issueDate && invoice.paidAt,
  );

  const averageCollectionDays =
    paidInvoicesWithDates.length > 0
      ? Math.round(
          paidInvoicesWithDates.reduce((total, invoice) => {
            const days = getDaysBetween(invoice.issueDate, invoice.paidAt);

            return total + (days || 0);
          }, 0) / paidInvoicesWithDates.length,
        )
      : 0;

  const claimedOrRiskInvoices = allInvoices.filter(
    (invoice) =>
      invoice.claimDrafts.length > 0 ||
      invoice.paymentStatus === PaymentStatus.DISPUTED ||
      invoice.status === InvoiceStatus.OVERDUE,
  );
  const delinquencyRatio =
    allInvoices.length > 0
      ? Math.round((claimedOrRiskInvoices.length / allInvoices.length) * 100)
      : 0;

  const delayByCustomer = customers
    .map((customer) => {
      const delays = customer.invoices
        .map((invoice) => {
          if (!invoice.dueDate) {
            return null;
          }

          const endDate = invoice.paidAt || today;

          return Math.max(
            Math.floor((endDate.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
            0,
          );
        })
        .filter((days): days is number => days !== null);

      const averageDelay =
        delays.length > 0
          ? Math.round(delays.reduce((total, days) => total + days, 0) / delays.length)
          : null;

      return {
        id: customer.id,
        name: customer.name,
        invoiceCount: customer.invoices.length,
        averageDelay,
      };
    })
    .filter((customer) => customer.invoiceCount > 0)
    .sort((first, second) => (second.averageDelay || 0) - (first.averageDelay || 0))
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 print:bg-white">
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 12mm;
            }

            body,
            main {
              background: white !important;
              color: #0f172a;
            }

            .print-hidden {
              display: none !important;
            }

            .print-report {
              border: 0 !important;
              box-shadow: none !important;
              break-inside: avoid;
            }

            .print-report + .print-report {
              margin-top: 18px;
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
              Analisis de clientes y rentabilidad
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Vision comercial y financiera de clientes, concentracion de ingresos, rentabilidad y comportamiento de pago.
            </p>
          </div>

        </div>

        <section className="print-hidden grid gap-4 lg:grid-cols-3">
          <MetricCard
            label="Periodo medio de cobro"
            value={`${averageCollectionDays} dias`}
            detail="Promedio desde emision hasta cobro"
            tone="blue"
            icon={Clock}
          />
          <MetricCard
            label="Ratio de morosidad"
            value={formatPercentage(delinquencyRatio)}
            detail="Facturas vencidas, disputadas o reclamadas"
            tone="amber"
            icon={Percent}
          />
          <MetricCard
            label="Concentracion de ingresos"
            value={formatPercentage(topCustomerPercentage)}
            detail={topCustomer ? `${topCustomer.name} concentra mas facturacion` : "Sin facturacion registrada"}
            tone={topCustomerPercentage >= 45 ? "red" : "emerald"}
            icon={TrendingUp}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] print:block">
          <article className="print-report rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">Ranking de clientes por volumen de facturacion</h2>
                    <Link href="/customer-stats/customer-analysis/ranking-report" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                      Imprimir / Guardar PDF
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Identifica tus clientes VIP y los que generan mayor parte de tus ingresos.
                  </p>
                </div>
              </div>
            </div>

            {customerRanking.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">Todavia no hay facturacion registrada.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {customerRanking.slice(0, 8).map((customer, index) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[40px_1fr_140px_80px]"
                  >
                    <span className="font-semibold text-slate-400">{index + 1}</span>
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${customer.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-semibold">{customer.invoicedAmount}</span>
                    <span className="text-sm font-semibold text-blue-700">{customer.percentage}%</span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="print-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Users className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Concentracion de ingresos</h2>
                <p className="mt-1 text-sm text-slate-500">{concentrationLabel}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-500">Cliente principal</span>
                <span className="text-3xl font-bold">{topCustomerPercentage}%</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${topCustomerPercentage >= 45 ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${topCustomerPercentage}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {topCustomer
                  ? `${topCustomer.name} representa ${topCustomerPercentage}% del volumen facturado.`
                  : "Cuando haya facturas, aqui veras si dependes demasiado de pocos clientes."}
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-slate-400" />
                <h3 className="font-semibold">Metodos de pago</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Todavia no hay metodos de pago registrados en las facturas. Cuando se añada ese campo, aqui se mostrara el reparto entre transferencia, tarjeta o domiciliacion.
              </p>
            </div>
          </article>
        </section>

        <section className="print-report rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="size-5" />
                </div>
                <h2 className="font-semibold">Tasa de retraso por cliente</h2>
              </div>
              <Link href="/customer-stats/customer-analysis/delay-report" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                Imprimir / Guardar PDF
              </Link>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Estadisticas individuales sobre cuantos dias tarde paga cada cliente frente a la fecha acordada.
            </p>
          </div>

          {delayByCustomer.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              No hay datos suficientes de vencimiento y cobro para calcular retrasos por cliente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="print-table w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Facturas</th>
                    <th className="px-5 py-3 font-medium text-right">Retraso medio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {delayByCustomer.map((customer) => (
                    <tr key={customer.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <Link href={`/customers/${customer.id}`} className="font-semibold hover:text-blue-600 hover:underline">
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{customer.invoiceCount}</td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {customer.averageDelay === null ? "Sin datos" : `${customer.averageDelay} dias`}
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

function MetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "amber" | "emerald" | "red";
  icon: typeof BarChart3;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex size-11 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
      </div>
    </article>
  );
}
