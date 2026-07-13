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

  const dashboardInvoices = invoices.slice(0, 6).map((invoice) => ({
    id: invoice.id,
    customer: invoice.customer.name,
    number: invoice.invoiceNumber,
    amount: formatAmount(invoice.amountCents),
    status: formatInvoiceStatus(invoice.status),
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

  return (
    <AppShell
      stats={stats}
      quickLinks={quickLinks}
      invoices={dashboardInvoices}
      events={dashboardEvents}
    />
  );
}
