import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

import { AppShell } from "@/components/layout/app-shell";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatInvoiceStatus(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    PENDING_REVIEW: "Revision",
    ACTIVE: "En control",
    OVERDUE: "Vencida",
    PAID: "Cobrada",
    CANCELLED: "Cancelada",
    ARCHIVED: "Archivada",
  };

  return labels[status];
}

export default async function Home() {
  const organizationId = await getCurrentOrganizationId();

  const [organization, pendingFileCount, draftCount, recentEvents] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        id: organizationId,
      },
      include: {
        invoices: {
          orderBy: {
            dueDate: "asc",
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
    }),
    prisma.invoiceFile.count({
      where: {
        organizationId,
        invoiceId: null,
      },
    }),
    prisma.claimDraft.count({
      where: {
        organizationId,
      },
    }),
    prisma.timelineEvent.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
      take: 5,
    }),
  ]);

  const invoices = organization?.invoices ?? [];

  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.UNPAID,
  );

  const paidInvoices = invoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.PAID,
  );

  const overdueInvoices = invoices.filter(
    (invoice) => invoice.status === InvoiceStatus.OVERDUE,
  );

  const pendingAmountCents = unpaidInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );


  const overdueAmountCents = overdueInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );

  const stats = [
    {
      label: "Pendiente de cobro",
      value: formatAmount(pendingAmountCents),
      detail: `${unpaidInvoices.length} facturas activas`,
    },
    {
      label: "Vencido",
      value: formatAmount(overdueAmountCents),
      detail: `${overdueInvoices.length} facturas requieren revision`,
    },
    {
      label: "Clientes controlados",
      value: String(new Set(invoices.map((invoice) => invoice.customerId)).size),
      detail: "Con facturas controladas",
    },
  ];

  const quickLinks = [
    {
      label: "Clientes",
      value: String(new Set(invoices.map((invoice) => invoice.customerId)).size),
      detail: "Ver recomendaciones por cliente",
      href: "/customers",
    },
    {
      label: "Facturas por registrar",
      value: String(pendingFileCount),
      detail: "PDFs pendientes de revisar",
      href: "/invoices",
    },
    {
      label: "Reclamaciones",
      value: String(draftCount),
      detail: "Preparadas o pendientes",
      href: "/claim-drafts",
    },
    {
      label: "Cronologia",
      value: String(recentEvents.length),
      detail: "Ultimas actuaciones",
      href: "/timeline",
    },
    {
      label: "Estadisticas",
      value: "Ver",
      detail: "Ranking y deuda por cliente",
      href: "/customer-stats",
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

  const dashboardToday = new Date();

  const recommendedInvoices = unpaidInvoices
    .map((invoice) => {
      const claimDrafts = invoice.claimDrafts || [];
      const claimCount = claimDrafts.length;
      const lastClaim = claimDrafts[0] || null;
      const daysSinceLastClaim = lastClaim
        ? Math.floor((dashboardToday.getTime() - lastClaim.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: invoice.id,
        customerId: invoice.customerId,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        amountCents: invoice.amountCents,
        amount: formatAmount(invoice.amountCents),
        claimCount,
        shouldClaim: !lastClaim || (daysSinceLastClaim !== null && daysSinceLastClaim >= 7),
        nextStep:
          claimCount === 0
            ? "Enviar recordatorio amable"
            : claimCount === 1
              ? "Enviar reclamacion firme"
              : "Enviar ultimo aviso",
      };
    })
    .filter((invoice) => invoice.shouldClaim)
    .sort((first, second) => second.amountCents - first.amountCents)
    .slice(0, 5);

  const dashboardInvoices = invoices.slice(0, 6).map((invoice) => ({
    id: invoice.id,
    customer: invoice.customer.name,
    number: invoice.invoiceNumber,
    amount: formatAmount(invoice.amountCents),
    status: formatInvoiceStatus(invoice.status),
  }));

  const calendarItems = unpaidInvoices
    .filter((invoice) => invoice.dueDate)
    .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
    .slice(0, 6)
    .map((invoice) => ({
      id: invoice.id,
      customer: invoice.customer.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: formatAmount(invoice.amountCents),
      date: formatDate(invoice.dueDate as Date),
      href: `/invoices/${invoice.id}`,
    }));

  const dashboardEvents = recentEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || "Sin descripcion",
    date: formatDate(event.createdAt),
    invoiceId: event.invoiceId,
    invoiceNumber: event.invoice?.invoiceNumber || null,
    customerName: event.invoice?.customer.name || null,
  }));

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

  const monthlyPaymentStats = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const paidMonthInvoices = paidInvoices.filter(
      (invoice) =>
        invoice.paidAt &&
        invoice.paidAt.getMonth() === date.getMonth() &&
        invoice.paidAt.getFullYear() === date.getFullYear(),
    );

    const amountCents = paidMonthInvoices.reduce(
      (total, invoice) => total + invoice.amountCents,
      0,
    );

    return {
      label: date.toLocaleDateString("es-ES", { month: "short" }),
      paidCount: paidMonthInvoices.length,
      paidAmount: formatAmount(amountCents),
      amountCents,
    };
  });

  const maxMonthlyPaidCents = Math.max(
    1,
    ...monthlyPaymentStats.map((month) => month.amountCents),
  );

  const paymentStats = {
    paidThisMonthCount: paidThisMonthInvoices.length,
    unpaidCount: unpaidInvoices.length,
    paidThisMonthAmount: formatAmount(paidThisMonthAmountCents),
    pendingAmount: formatAmount(pendingAmountCents),
    monthly: monthlyPaymentStats.map((month) => ({
      label: month.label,
      paidCount: month.paidCount,
      paidAmount: month.paidAmount,
      barHeight: Math.max(8, Math.round((month.amountCents / maxMonthlyPaidCents) * 100)),
    })),
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
    .filter((task) => Boolean(task))
    .sort((first, second) => second.priority - first.priority)
    .slice(0, 4);

  return (
    <AppShell
      stats={stats}
      quickLinks={quickLinks}
      invoices={dashboardInvoices}
      events={dashboardEvents}
      paymentStats={paymentStats}
      calendarItems={calendarItems}
          topDebtors={topDebtors}
      dailyTasks={dailyTasks}
      recommendedInvoices={recommendedInvoices}

    />
  );
}
