import Link from "next/link";
import { BarChart3, Bot, CheckCircle2, FileText, PencilLine } from "lucide-react";

import { ClaimDraftStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

export default async function ClaimDraftsPage() {
  const organizationId = await getCurrentOrganizationId();

  const [drafts, unpaidInvoices] = await Promise.all([
    prisma.claimDraft.findMany({
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
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        paymentStatus: PaymentStatus.UNPAID,
      },
      include: {
        customer: true,
        claimDrafts: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    }),
  ]);

  const sentDrafts = drafts.filter((draft) => draft.status === ClaimDraftStatus.SENT);
  const collectedSentDrafts = sentDrafts.filter(
    (draft) => draft.invoice.paymentStatus === PaymentStatus.PAID,
  );
  const pendingSentDrafts = sentDrafts.filter(
    (draft) => draft.invoice.paymentStatus !== PaymentStatus.PAID,
  );

  const collectedClaimedCents = collectedSentDrafts.reduce(
    (total, draft) => total + draft.invoice.amountCents,
    0,
  );
  const pendingClaimedCents = pendingSentDrafts.reduce(
    (total, draft) => total + draft.invoice.amountCents,
    0,
  );

  const monthlyClaimedAmounts = sentDrafts.reduce<Map<string, { label: string; amountCents: number }>>(
    (months, draft) => {
      const monthKey = `${draft.createdAt.getFullYear()}-${String(draft.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = new Intl.DateTimeFormat("es-ES", {
        month: "short",
        year: "2-digit",
      }).format(draft.createdAt);

      const currentMonth = months.get(monthKey) || {
        label: monthLabel,
        amountCents: 0,
      };

      currentMonth.amountCents += draft.invoice.amountCents;
      months.set(monthKey, currentMonth);

      return months;
    },
    new Map(),
  );

  const claimedMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = new Intl.DateTimeFormat("es-ES", {
      month: "short",
      year: "2-digit",
    }).format(date);

    return monthlyClaimedAmounts.get(monthKey) || {
      label: monthLabel,
      amountCents: 0,
    };
  });

  const totalClaimedCents = claimedMonths.reduce(
    (total, month) => total + month.amountCents,
    0,
  );
  const maxClaimedCents = Math.max(
    ...claimedMonths.map((month) => month.amountCents),
    1,
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const unreclaimedMonthlyAmounts = unpaidInvoices.reduce<Map<string, { label: string; amountCents: number }>>(
    (months, invoice) => {
      if (invoice.claimDrafts.length > 0) {
        return months;
      }

      const date = invoice.issueDate || invoice.createdAt;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = new Intl.DateTimeFormat("es-ES", {
        month: "short",
        year: "2-digit",
      }).format(date);

      const currentMonth = months.get(monthKey) || {
        label: monthLabel,
        amountCents: 0,
      };

      currentMonth.amountCents += invoice.amountCents;
      months.set(monthKey, currentMonth);

      return months;
    },
    new Map(),
  );

  const unreclaimedMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = new Intl.DateTimeFormat("es-ES", {
      month: "short",
      year: "2-digit",
    }).format(date);

    return unreclaimedMonthlyAmounts.get(monthKey) || {
      label: monthLabel,
      amountCents: 0,
    };
  });

  const maxUnreclaimedCents = Math.max(
    ...unreclaimedMonths.map((month) => month.amountCents),
    1,
  );

  const recommendedInvoices = unpaidInvoices
    .map((invoice) => {
      const lastClaim = invoice.claimDrafts[0];
      const shouldClaim = !lastClaim || lastClaim.createdAt <= sevenDaysAgo;

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customer.name,
        amountCents: invoice.amountCents,
        dueDate: invoice.dueDate,
        lastClaimDate: lastClaim?.createdAt || null,
        reason: lastClaim
          ? "Última reclamación hace más de 7 días"
          : "Sin reclamaciones previas",
        shouldClaim,
      };
    })
    .filter((invoice) => invoice.shouldClaim)
    .sort((first, second) => second.amountCents - first.amountCents);

  const recommendedAmountCents = recommendedInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Inicio
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Reclamaciones</h1>
          <p className="mt-2 text-slate-500">
            Comunicaciones preparadas para reclamar facturas pendientes. Nada se envía automáticamente.
          </p>
        </div>

        <section className="grid items-start gap-4 lg:grid-cols-2">
          <div className="min-w-0 space-y-3">
            <Link href="/claim-drafts/sent" className="block">
              <SummaryCard label="Reclamaciones realizadas" value={String(sentDrafts.length)} detail="Correos enviados o registrados" tone="blue" icon={PencilLine} />
            </Link>
            <ClaimCollectionCard
              collectedCount={collectedSentDrafts.length}
              pendingCount={pendingSentDrafts.length}
              collectedAmount={collectedClaimedCents}
              pendingAmount={pendingClaimedCents}
            />
          </div>
          <ClaimedAmountChart
            months={claimedMonths}
            totalAmount={totalClaimedCents}
            maxAmount={maxClaimedCents}
            unreclaimedMonths={unreclaimedMonths}
            maxUnreclaimedAmount={maxUnreclaimedCents}
          />
          <RecommendedClaimsCard
            invoices={recommendedInvoices}
            amount={recommendedAmountCents}
          />
        </section>


        

        
      </div>
    </main>
  );
}

function ClaimCollectionCard({
  collectedCount,
  pendingCount,
  collectedAmount,
  pendingAmount,
}: {
  collectedCount: number;
  pendingCount: number;
  collectedAmount: number;
  pendingAmount: number;
}) {
  const totalCount = collectedCount + pendingCount;
  if (totalCount === 0) {
    return <div className="border-t border-slate-200 px-4 py-6 text-sm text-slate-500">
      Todavía no hay reclamaciones enviadas o registradas.
    </div>;
  }
  const maxCount = Math.max(collectedCount, pendingCount, 1);
  const bars = [
    {
      label: "Cobradas",
      count: collectedCount,
      amount: collectedAmount,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
    },
    {
      label: "Pendientes",
      count: pendingCount,
      amount: pendingAmount,
      color: "bg-amber-500",
      textColor: "text-amber-700",
    },
  ];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Reclamaciones hechas</p>
          <p className="mt-0.5 text-xs text-slate-500">{totalCount} reclamaciones registradas</p>
        </div>
      </div>

      <div className="mt-4 flex h-32 items-end justify-between gap-4">
        {bars.map((bar) => {
          const height = (bar.count / maxCount) * 100;

          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-20 w-full items-end justify-center rounded-md bg-slate-50 px-3">
                <div
                  className={`w-full rounded-t-md ${bar.color}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${bar.textColor}`}>{bar.count}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{bar.label}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-700">{formatAmount(bar.amount)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ClaimedAmountChart({
  months,
  totalAmount,
  maxAmount,
  unreclaimedMonths,
  maxUnreclaimedAmount,
}: {
  months: Array<{
    label: string;
    amountCents: number;
  }>;
  totalAmount: number;
  maxAmount: number;
  unreclaimedMonths: Array<{
    label: string;
    amountCents: number;
  }>;
  maxUnreclaimedAmount: number;
}) {
  const bars = months.length > 0
    ? months
    : [{ label: "Sin datos", amountCents: 0 }];
  const unreclaimedBars = unreclaimedMonths.length > 0
    ? unreclaimedMonths
    : [{ label: "Sin datos", amountCents: 0 }];

  return (
    <article className="order-last min-w-0 border-t border-slate-200 py-5 lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Importe reclamado</p>
          <p className="mt-1 text-2xl font-bold">{formatAmount(totalAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">Importe agrupado por mes</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <BarChart3 className="size-5" />
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div>
          <p className="mb-3 text-xs font-semibold text-slate-500">Importe reclamado por mes</p>
          {!bars.some((bar) => bar.amountCents > 0) && (
    <p className="py-6 text-sm text-slate-500">No hay importes reclamados en este período.</p>
  )}
  <div className={bars.some((bar) => bar.amountCents > 0)
    ? "grid grid-flow-col auto-cols-[minmax(100px,1fr)] gap-4 overflow-x-auto pb-3"
    : "hidden"}>
            {bars.map((bar) => {
              const height = (bar.amountCents / maxAmount) * 100;

              return (
                <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-20 w-full items-end justify-center rounded-md bg-slate-50 px-2">
                    <div
                      className="w-full rounded-t-md bg-blue-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-700">{formatAmount(bar.amountCents)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{bar.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold text-slate-500">Importe pendiente no reclamado por mes</p>
          {!unreclaimedBars.some((bar) => bar.amountCents > 0) && (
    <p className="py-6 text-sm text-slate-500">No hay importes pendientes sin reclamar en este período.</p>
  )}
  <div className={unreclaimedBars.some((bar) => bar.amountCents > 0)
    ? "grid grid-flow-col auto-cols-[minmax(100px,1fr)] gap-4 overflow-x-auto pb-3"
    : "hidden"}>
            {unreclaimedBars.map((bar) => {
              const height = (bar.amountCents / maxUnreclaimedAmount) * 100;

              return (
                <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-20 w-full items-end justify-center rounded-md bg-slate-50 px-2">
                    <div
                      className="w-full rounded-t-md bg-amber-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-700">{formatAmount(bar.amountCents)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{bar.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}

function RecommendedClaimsCard({
  invoices,
  amount,
}: {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    amountCents: number;
    dueDate: Date | null;
    lastClaimDate: Date | null;
    reason: string;
  }>;
  amount: number;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Bot className="size-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Recomendadas hoy</p>
          <p className="mt-1 text-2xl font-bold">{invoices.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatAmount(amount)} pendiente de reclamar
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {invoices.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No hay facturas pendientes recomendadas para reclamar hoy.
          </p>
        ) : (
          invoices.slice(0, 3).map((invoice) => (
            <div key={invoice.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/customers/${invoice.customerId}`}
                    className="text-sm font-semibold text-slate-950 transition hover:text-blue-600"
                  >
                    {invoice.customerName}
                  </Link>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="mt-1 block text-xs font-medium text-slate-500 transition hover:text-blue-600"
                  >
                    Factura {invoice.invoiceNumber}
                  </Link>
                </div>
                <p className="text-sm font-bold">{formatAmount(invoice.amountCents)}</p>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-500">
                <p>Última reclamación: {invoice.lastClaimDate ? formatDate(invoice.lastClaimDate) : "Sin reclamaciones"}</p>
              </div>
            </div>
          ))
        )}

        {invoices.length > 3 ? (
          <p className="text-xs font-medium text-slate-500">
            +{invoices.length - 3} facturas recomendadas adicionales
          </p>
        ) : null}
      </div>
    </article>
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