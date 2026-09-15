import { PaymentStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

import { AppShell } from "@/components/layout/app-shell";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

export default async function Home() {
  const organizationId = await getCurrentOrganizationId();

  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
    },
    include: {
      invoices: {
        orderBy: {
          issueDate: "desc",
        },
        include: {
          customer: true,
          claimDrafts: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  const invoices = organization?.invoices ?? [];

  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.UNPAID,
  );

  const paidInvoices = invoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.PAID,
  );

  const pendingAmountCents = unpaidInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );

  const stats = [
    {
      label: "Pendiente de cobro",
      value: formatAmount(pendingAmountCents),
      detail: `${unpaidInvoices.length} facturas activas`,
    },
  ];

  const topDebtors = Array.from(
    unpaidInvoices.reduce((customers, invoice) => {
      const current = customers.get(invoice.customerId) || {
        id: invoice.customerId,
        name: invoice.customer.name,
        pendingCents: 0,
        unpaidCount: 0,
      };

      current.pendingCents += invoice.amountCents;
      current.unpaidCount += 1;
      customers.set(invoice.customerId, current);

      return customers;
    }, new Map<string, { id: string; name: string; pendingCents: number; unpaidCount: number }>()),
  )
    .map(([, customer]) => ({
      id: customer.id,
      name: customer.name,
      pendingAmount: formatAmount(customer.pendingCents),
      unpaidCount: customer.unpaidCount,
      pendingCents: customer.pendingCents,
    }))
    .sort((first, second) => second.pendingCents - first.pendingCents)
    .slice(0, 3);

  const now = new Date();
  const paidThisMonthInvoices = paidInvoices.filter(
    (invoice) =>
      invoice.paidAt &&
      invoice.paidAt.getMonth() === now.getMonth() &&
      invoice.paidAt.getFullYear() === now.getFullYear(),
  );

  const paidThisMonthAmountCents = paidThisMonthInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );

  const totalPortfolioCents = pendingAmountCents + paidThisMonthAmountCents;
  const paidRatio = totalPortfolioCents > 0 ? paidThisMonthAmountCents / totalPortfolioCents : 1;
  const unpaidRatio = totalPortfolioCents > 0 ? pendingAmountCents / totalPortfolioCents : 0;

  const debtByCustomer = Array.from(
    unpaidInvoices
      .reduce((map, invoice) => {
        const currentAmount = map.get(invoice.customerId) || 0;

        map.set(invoice.customerId, currentAmount + invoice.amountCents);

        return map;
      }, new Map<string, number>())
      .values(),
  ).sort((first, second) => second - first);

  const topThreeDebtCents = debtByCustomer
    .slice(0, 3)
    .reduce((total, amount) => total + amount, 0);
  const topDebtConcentration =
    pendingAmountCents > 0 ? Math.round((topThreeDebtCents / pendingAmountCents) * 100) : 0;

  const silentInvoicesCount = unpaidInvoices.filter(
    (invoice) => invoice.claimDrafts.length === 0,
  ).length;

  const unpaidAgeBuckets = unpaidInvoices.reduce(
    (buckets, invoice) => {
      if (!invoice.issueDate) {
        buckets.recent += 1;

        return buckets;
      }

      const diffDays = Math.max(
        Math.floor((now.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)),
        0,
      );

      if (diffDays > 60) {
        buckets.critical += 1;
      } else if (diffDays > 30) {
        buckets.warning += 1;
      } else {
        buckets.recent += 1;
      }

      return buckets;
    },
    {
      recent: 0,
      warning: 0,
      critical: 0,
    },
  );

  const oldestUnpaidDays = unpaidInvoices.reduce((maxDays, invoice) => {
    if (!invoice.issueDate) {
      return maxDays;
    }

    const diffDays = Math.max(
      Math.floor((now.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    return Math.max(maxDays, diffDays);
  }, 0);

  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthPaidAmountCents = paidInvoices
    .filter(
      (invoice) =>
        invoice.paidAt &&
        invoice.paidAt.getMonth() === previousMonthDate.getMonth() &&
        invoice.paidAt.getFullYear() === previousMonthDate.getFullYear(),
    )
    .reduce((total, invoice) => total + invoice.amountCents, 0);

  const collectionTrend =
    previousMonthPaidAmountCents > 0
      ? Math.round(
          ((paidThisMonthAmountCents - previousMonthPaidAmountCents) / previousMonthPaidAmountCents) * 100,
        )
      : paidThisMonthAmountCents > 0
        ? 100
        : 0;

  const agePenalty = Math.min(25, Math.floor(oldestUnpaidDays / 4));
  const concentrationPenalty =
    topDebtConcentration >= 70 ? 15 : topDebtConcentration >= 50 ? 8 : 0;
  const silentPenalty = Math.min(15, silentInvoicesCount * 3);

  const portfolioHealthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - unpaidRatio * 45 + paidRatio * 15 - agePenalty - concentrationPenalty - silentPenalty),
    ),
  );
  const portfolioHealthTone =
    portfolioHealthScore >= 80 ? "green" : portfolioHealthScore >= 50 ? "amber" : "red";
  const portfolioHealthLabel =
    portfolioHealthScore >= 80 ? "Cartera sana" : portfolioHealthScore >= 50 ? "Atencion recomendada" : "Riesgo alto";
  const portfolioHealthDetail =
    portfolioHealthScore >= 80
      ? "Los cobros evolucionan bien y el riesgo esta controlado."
      : portfolioHealthScore >= 50
        ? "Hay deuda pendiente que conviene seguir de cerca."
        : "Hay facturas antiguas o clientes concentrando demasiado riesgo.";

  const monthlyCollectionChart = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    const monthInvoices = invoices.filter((invoice) => {
      const referenceDate = invoice.issueDate || invoice.createdAt;

      return referenceDate.getMonth() === month && referenceDate.getFullYear() === year;
    });

    const collectedCents = monthInvoices
      .filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID)
      .reduce((total, invoice) => total + invoice.amountCents, 0);

    const pendingCents = monthInvoices
      .filter((invoice) => invoice.paymentStatus !== PaymentStatus.PAID)
      .reduce((total, invoice) => total + invoice.amountCents, 0);

    return {
      label: monthDate.toLocaleDateString("es-ES", { month: "short" }),
      collectedAmount: formatAmount(collectedCents),
      pendingAmount: formatAmount(pendingCents),
      collectedCents,
      pendingCents,
    };
  });

  const maxMonthlyCollectionCents = Math.max(
    1,
    ...monthlyCollectionChart.flatMap((month) => [month.collectedCents, month.pendingCents]),
  );

  const paymentStats = {
    paidThisMonthCount: paidThisMonthInvoices.length,
    unpaidCount: unpaidInvoices.length,
    paidThisMonthAmount: formatAmount(paidThisMonthAmountCents),
    pendingAmount: formatAmount(pendingAmountCents),
  };

  const todayForTasks = new Date();

  const dailyTasks = unpaidInvoices
    .map((invoice) => {
      const claimDrafts = invoice.claimDrafts || [];
      const lastClaim = claimDrafts[0] || null;
      const daysSinceIssue = invoice.issueDate
        ? Math.max(Math.floor((todayForTasks.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)), 0)
        : null;
      const daysSinceLastClaim = lastClaim
        ? Math.max(Math.floor((todayForTasks.getTime() - lastClaim.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0)
        : null;

      if (!invoice.customer.email) {
        return {
          id: `${invoice.id}-email`,
          title: invoice.customer.name,
          detail: `Factura ${invoice.invoiceNumber}: falta email para poder reclamar.`,
          action: "Completar cliente",
          href: `/customers/${invoice.customerId}/edit`,
          priority: 90,
          tone: "amber" as const,
        };
      }

      if (daysSinceIssue === null) {
        return {
          id: `${invoice.id}-date`,
          title: invoice.customer.name,
          detail: `Factura ${invoice.invoiceNumber}: falta fecha de emision.`,
          action: "Revisar factura",
          href: `/invoices/${invoice.id}`,
          priority: 70,
          tone: "amber" as const,
        };
      }

      if (claimDrafts.length === 0 && (daysSinceIssue >= 7 || invoice.amountCents >= 100000)) {
        return {
          id: `${invoice.id}-first`,
          title: invoice.customer.name,
          detail: `Factura ${invoice.invoiceNumber}: ${formatAmount(invoice.amountCents)} pendiente desde hace ${daysSinceIssue} dias.`,
          action: "Enviar recordatorio",
          href: `/invoices/${invoice.id}/claim-preview`,
          priority: invoice.amountCents + daysSinceIssue * 10000,
          tone: "blue" as const,
        };
      }

      if (daysSinceLastClaim !== null && daysSinceLastClaim >= 7) {
        return {
          id: `${invoice.id}-follow`,
          title: invoice.customer.name,
          detail: `Factura ${invoice.invoiceNumber}: ultima reclamacion hace ${daysSinceLastClaim} dias.`,
          action: invoice.amountCents >= 100000 ? "Llamar cliente" : "Hacer seguimiento",
          href: `/invoices/${invoice.id}`,
          priority: invoice.amountCents + daysSinceLastClaim * 12000,
          tone: invoice.amountCents >= 100000 ? "red" as const : "blue" as const,
        };
      }

      return null;
    })
    .filter((task): task is {
      id: string;
      title: string;
      detail: string;
      action: string;
      href: string;
      priority: number;
      tone: "blue" | "amber" | "red";
    } => task !== null)
    .sort((first, second) => second.priority - first.priority)
    .slice(0, 8);

  return (
    <AppShell
      stats={stats}
      paymentStats={paymentStats}
      topDebtors={topDebtors}
      dailyTasks={dailyTasks}
      portfolioHealth={{
        score: portfolioHealthScore,
        tone: portfolioHealthTone,
        label: portfolioHealthLabel,
        detail: portfolioHealthDetail,
        trend:
          collectionTrend > 0
            ? `+${collectionTrend}% vs mes anterior`
            : collectionTrend < 0
              ? `${collectionTrend}% vs mes anterior`
              : "Sin cambio vs mes anterior",
        concentration: `${topDebtConcentration}% de la deuda en top 3 clientes`,
        silentInvoices: `${silentInvoicesCount} factura${silentInvoicesCount === 1 ? "" : "s"} sin reclamacion`,
        oldestDebt: oldestUnpaidDays > 0 ? `${oldestUnpaidDays} dias de deuda mas antigua` : "Sin deuda antigua",
        aging: [
          { label: "0-30 dias", value: unpaidAgeBuckets.recent, tone: "green" },
          { label: "31-60 dias", value: unpaidAgeBuckets.warning, tone: "amber" },
          { label: "+60 dias", value: unpaidAgeBuckets.critical, tone: "red" },
        ],
      }}
      collectionChart={monthlyCollectionChart.map((month) => ({
        label: month.label,
        collectedAmount: month.collectedAmount,
        pendingAmount: month.pendingAmount,
        collectedHeight: Math.max(6, Math.round((month.collectedCents / maxMonthlyCollectionCents) * 100)),
        pendingHeight: Math.max(6, Math.round((month.pendingCents / maxMonthlyCollectionCents) * 100)),
      }))}
    />
  );
}
