import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { AppShell } from "@/components/layout/app-shell";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

function formatInvoiceStatus(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    PENDING_REVIEW: "Revision",
    ACTIVE: "Seguimiento",
    OVERDUE: "Vencida",
    PAID: "Cobrada",
    CANCELLED: "Cancelada",
    ARCHIVED: "Archivada",
  };

  return labels[status];
}

export default async function Home() {
  const organization = await prisma.organization.findFirst({
    where: {
      id: "demo-organization",
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
  });

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
      detail: "Con facturas en seguimiento",
    },
  ];

  const dashboardInvoices = invoices.map((invoice) => ({
    customer: invoice.customer.name,
    number: invoice.invoiceNumber,
    amount: formatAmount(invoice.amountCents),
    status: formatInvoiceStatus(invoice.status),
  }));

  return <AppShell stats={stats} invoices={dashboardInvoices} />;
}
