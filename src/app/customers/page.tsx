import Link from "next/link";
import { Building2, CircleDollarSign, Plus, Users } from "lucide-react";

import { PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

export default async function CustomersPage() {
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

  const rows = customers.map((customer) => {
    const unpaidInvoices = customer.invoices.filter(
      (invoice) => invoice.paymentStatus === PaymentStatus.UNPAID,
    );

    const pendingAmountCents = unpaidInvoices.reduce(
      (total, invoice) => total + invoice.amountCents,
      0,
    );
    const totalAmountCents = customer.invoices.reduce(
      (total, invoice) => total + invoice.amountCents,
      0,
    );
    const debtProgress = totalAmountCents > 0
      ? Math.round((pendingAmountCents / totalAmountCents) * 100)
      : 0;

    return {
      id: customer.id,
      name: customer.name,
      contactName: customer.contactName || "Sin contacto",
      email: customer.email || "Sin email",
      phone: customer.phone || "Sin telefono",
      invoiceCount: customer.invoices.length,
      unpaidCount: unpaidInvoices.length,
      pendingAmountCents,
      pendingAmount: formatAmount(pendingAmountCents),
      debtProgress,
    };
  });

  const totalCustomers = rows.length;
  const totalPendingCents = rows.reduce((total, customer) => total + customer.pendingAmountCents, 0);
  const totalInvoices = rows.reduce((total, customer) => total + customer.invoiceCount, 0);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="mt-2 text-slate-500">
              Empresas, contactos y deuda pendiente agrupada por cliente.
            </p>
          </div>

          <Button asChild className="bg-blue-600 shadow-sm hover:bg-blue-700">
            <Link href="/customers/new">
              <Plus className="size-4" />
              Nuevo cliente
            </Link>
          </Button>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total clientes" value={String(totalCustomers)} detail="Registrados en la plataforma" tone="blue" icon={Users} />
          <SummaryCard label="Pendiente total" value={formatAmount(totalPendingCents)} detail="Por cobrar" tone="amber" icon={CircleDollarSign} />
          <SummaryCard label="Facturas" value={String(totalInvoices)} detail="Asociadas a clientes" tone="emerald" icon={Building2} />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Cartera de clientes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Entra en cada cliente para ver recomendaciones y subir nuevas facturas.
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              Todavia no hay clientes registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Deuda</th>
                    <th className="px-5 py-3 font-medium">Facturas</th>
                    <th className="px-5 py-3 font-medium">Pendiente</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((customer) => (
                    <tr key={customer.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{customer.unpaidCount} facturas pendientes</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[180px] items-center gap-3">
                          <div className="h-2 flex-1 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-amber-500"
                              style={{ width: `${customer.debtProgress}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold text-slate-600">
                            {customer.debtProgress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium">{customer.invoiceCount}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {customer.pendingAmount}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                          <Link href={`/customers/${customer.id}`}>Ver detalle</Link>
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
  tone: "blue" | "red" | "amber" | "emerald";
  icon: typeof Users;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
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