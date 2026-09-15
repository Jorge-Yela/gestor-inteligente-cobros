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

  const dailyTasks = unpaidInvoices
    .map((invoice) => {
      const lastClaim = invoice.claimDrafts?.[0] || null;
      const claimCount = invoice.claimDrafts?.length || 0;
      const daysOpen = invoice.issueDate
        ? Math.max(Math.floor((now.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)), 0)
        : 0;
      const daysSinceLastClaim = lastClaim
        ? Math.max(Math.floor((now.getTime() - lastClaim.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0)
        : null;

      let priority = 0;
      const reasons = [];

      if (invoice.amountCents >= 500000) {
        priority += 35;
        reasons.push("importe alto");
      } else if (invoice.amountCents >= 150000) {
        priority += 20;
        reasons.push("importe relevante");
      }

      if (daysOpen >= 60) {
        priority += 45;
        reasons.push("mas de 60 dias abierta");
      } else if (daysOpen >= 30) {
        priority += 25;
        reasons.push("mas de 30 dias abierta");
      } else if (daysOpen >= 15) {
        priority += 10;
        reasons.push("seguimiento preventivo");
      }

      if (claimCount === 0) {
        priority += 20;
        reasons.push("sin reclamacion enviada");
      } else if (daysSinceLastClaim !== null && daysSinceLastClaim >= 14) {
        priority += 15;
        reasons.push("reclamacion sin respuesta reciente");
      }

      const customerPendingCount = unpaidInvoices.filter(
        (pendingInvoice) => pendingInvoice.customerId === invoice.customerId,
      ).length;

      if (customerPendingCount >= 3) {
        priority += 20;
        reasons.push(`${customerPendingCount} facturas pendientes del cliente`);
      }

      if (priority < 25) {
        return null;
      }

      const action =
        priority >= 80
          ? "Enviar reclamacion"
          : claimCount === 0
            ? "Enviar recordatorio"
            : "Revisar seguimiento";

      const tone = priority >= 80 ? "red" : priority >= 50 ? "amber" : "blue";

      return {
        id: invoice.id,
        title: `${invoice.customer.name} · Factura ${invoice.invoiceNumber}`,
        detail: `${formatAmount(invoice.amountCents)} pendiente · ${daysOpen} dias abierta · ${reasons.slice(0, 3).join(", ")}`,
        action,
        href: `/invoices/${invoice.id}`,
        priority,
        tone,
      };
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
        trendLabel:
          collectionTrend > 0
            ? `+${collectionTrend}% vs mes anterior`
            : collectionTrend < 0
              ? `${collectionTrend}% vs mes anterior`
              : "Sin cambio vs mes anterior",
        trendDetail: `Este mes se han cobrado ${formatAmount(paidThisMonthAmountCents)} y quedan ${formatAmount(pendingAmountCents)} pendientes. La tendencia compara el cobro reciente con el mes anterior.`,
        concentrationLabel: `${topDebtConcentration}% en top 3 clientes`,
        concentrationDetail: `Los 3 clientes con mayor deuda concentran el ${topDebtConcentration}% del total pendiente. Si este dato es alto, la cartera depende demasiado de pocos clientes.`,
        followUpLabel: `${silentInvoicesCount} sin reclamacion`,
        followUpDetail: silentInvoicesCount > 0
          ? `${silentInvoicesCount} factura${silentInvoicesCount === 1 ? "" : "s"} pendiente${silentInvoicesCount === 1 ? "" : "s"} no tienen reclamacion reciente. Son candidatas para revisar o reclamar.`
          : "Todas las facturas pendientes tienen seguimiento reciente.",
        ageLabel: `${oldestUnpaidDays} dias max.`,
        ageDetail: oldestUnpaidDays > 0
          ? `La deuda pendiente mas antigua lleva ${oldestUnpaidDays} dias abierta. Reparto actual: ${unpaidAgeBuckets.recent} facturas entre 0-30 dias, ${unpaidAgeBuckets.warning} entre 31-60 dias y ${unpaidAgeBuckets.critical} con mas de 60 dias.`
          : "No hay deuda antigua pendiente.",
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
