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
  const oldestUnpaidDays = unpaidInvoices.reduce((maxDays, invoice) => {
    if (!invoice.issueDate) {
      return maxDays;
    }

    const diffDays = Math.max(Math.floor((now.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)), 0);

    return Math.max(maxDays, diffDays);
  }, 0);
  const agePenalty = Math.min(30, Math.floor(oldestUnpaidDays / 3));
  const portfolioHealthScore = Math.max(
    0,
    Math.min(100, Math.round(100 - unpaidRatio * 55 + paidRatio * 20 - agePenalty)),
  );
  const portfolioHealthTone =
    portfolioHealthScore >= 80 ? "green" : portfolioHealthScore >= 50 ? "amber" : "red";
  const portfolioHealthLabel =
    portfolioHealthScore >= 80 ? "Cartera sana" : portfolioHealthScore >= 50 ? "Atencion recomendada" : "Riesgo alto";
  const portfolioHealthDetail =
    portfolioHealthScore >= 80
      ? "Los cobros evolucionan bien."
      : portfolioHealthScore >= 50
        ? "Conviene mantener el seguimiento activo."
        : "Hay facturas pendientes que requieren accion prioritaria.";

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
    .slice(0, 4);

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
