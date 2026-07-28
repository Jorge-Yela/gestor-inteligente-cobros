import Link from "next/link";
import { AlertTriangle, CircleDollarSign, FileText, TrendingUp, Users } from "lucide-react";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
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

function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Sin fecha";
}

export default async function CustomerStatsPage() {
  const organizationId = await getCurrentOrganizationId();

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

  const stats = customers
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

  const totalPendingCents = stats.reduce((total, customer) => total + customer.pendingCents, 0);
  const totalUnpaidInvoices = stats.reduce((total, customer) => total + customer.unpaidCount, 0);
  const customersWithPending = stats.filter((customer) => customer.pendingCents > 0).length;
  const highRiskCustomers = stats.filter((customer) => customer.riskLevel === "Alto").length;

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

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Pendiente total" value={formatCurrency(totalPendingCents)} detail="Importe por cobrar" tone="amber" icon={CircleDollarSign} />
          <SummaryCard label="Clientes con pendiente" value={String(customersWithPending)} detail="Necesitan seguimiento" tone="blue" icon={Users} />
          <SummaryCard label="Facturas no cobradas" value={String(totalUnpaidInvoices)} detail="Pendientes de resolver" tone="violet" icon={FileText} />
          <SummaryCard label="Clientes prioritarios" value={String(highRiskCustomers)} detail="Mayor riesgo operativo" tone="red" icon={AlertTriangle} />
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
                    <th className="px-5 py-3 font-medium">Ultima fecha de control</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
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
                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(customer.lastControlDate)}
                      </td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                          <Link href={`/customers/${customer.id}`}>Ver cliente</Link>
                        </Button>
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
  tone: "amber" | "blue" | "violet" | "red";
  icon: typeof FileText;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
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
