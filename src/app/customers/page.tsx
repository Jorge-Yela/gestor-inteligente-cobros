import Link from "next/link";
import { Building2, CircleDollarSign, Plus, Search, Users } from "lucide-react";

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

type CustomersPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    sort?: string | string[];
    order?: string | string[];
  }>;
};

function getSearchValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const params = await searchParams;
  const query = getSearchValue(params?.q).trim();
  const sort = getSearchValue(params?.sort);
  const order = getSearchValue(params?.order) === "asc" ? "asc" : "desc";

  function getSortHref(column: "debt" | "pending" | "paid") {
    const nextOrder = sort === column && order === "desc" ? "asc" : "desc";
    const search = new URLSearchParams({
      ...(query ? { q: query } : {}),
      sort: column,
      order: nextOrder,
    });

    return `/customers?${search.toString()}`;
  }

  function getSortLabel(column: "debt" | "pending" | "paid", label: string) {
    if (sort !== column) {
      return label;
    }

    return `${label} ${order === "desc" ? "↓" : "↑"}`;
  }

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

  const filteredCustomers = query
    ? customers.filter((customer) => {
        const searchableText = [
          customer.name,
          customer.contactName,
          customer.email,
          customer.phone,
          customer.taxId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query.toLowerCase());
      })
    : customers;

  const rows = filteredCustomers.map((customer) => {
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
    const paidAmountCents = customer.invoices
      .filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID)
      .reduce((total, invoice) => total + invoice.amountCents, 0);
    const debtProgress = totalAmountCents > 0
      ? Math.round((pendingAmountCents / totalAmountCents) * 100)
      : 0;

    const debtTone =
      debtProgress >= 70
        ? {
            border: "border-red-100",
            side: "border-red-500",
            text: "text-red-700",
            bar: "bg-red-500",
          }
        : debtProgress >= 30
          ? {
              border: "border-amber-100",
              side: "border-amber-500",
              text: "text-amber-700",
              bar: "bg-amber-500",
            }
          : {
              border: "border-emerald-100",
              side: "border-emerald-500",
              text: "text-emerald-700",
              bar: "bg-emerald-500",
            };

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
      paidAmountCents,
      paidAmount: formatAmount(paidAmountCents),
      debtProgress,
      debtTone,
    };
  });

  const sortedRows = [...rows].sort((first, second) => {
    const direction = order === "asc" ? 1 : -1;

    if (sort === "debt") {
      return (first.debtProgress - second.debtProgress) * direction;
    }

    if (sort === "pending") {
      return (first.pendingAmountCents - second.pendingAmountCents) * direction;
    }

    if (sort === "paid") {
      return (first.paidAmountCents - second.paidAmountCents) * direction;
    }

    return first.name.localeCompare(second.name);
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
          <Link href="/invoices" className="group relative block">
            <SummaryCard label="Facturas" value={String(totalInvoices)} detail="Asociadas a clientes" tone="emerald" icon={Building2} />
            <span className="pointer-events-none absolute right-4 top-4 rounded-lg border border-blue-100 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 opacity-0 shadow-sm transition group-hover:opacity-100">
              Ir a facturas
            </span>
          </Link>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Cartera de clientes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Entra en cada cliente para ver recomendaciones y subir nuevas facturas.
              </p>
            </div>

            <form className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Buscar cliente..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </form>
          </div>

          {rows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              {query ? "No hay clientes que coincidan con la busqueda." : "Todavia no hay clientes registrados."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">
                      <Link href={getSortHref("debt")} className="text-blue-600 hover:underline">
                        {getSortLabel("debt", "Deuda")}
                      </Link>
                    </th>
                    <th className="px-5 py-3 font-medium">Facturas</th>
                    <th className="px-5 py-3 font-medium">
                      <Link href={getSortHref("pending")} className="text-blue-600 hover:underline">
                        {getSortLabel("pending", "Pendiente")}
                      </Link>
                    </th>
                    <th className="px-5 py-3 font-medium">
                      <Link href={getSortHref("paid")} className="text-blue-600 hover:underline">
                        {getSortLabel("paid", "Cobrado")}
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedRows.map((customer) => (
                    <tr key={customer.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <Link href={`/customers/${customer.id}`} className="font-semibold text-slate-950 transition hover:text-blue-600 hover:underline">
                          {customer.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{customer.unpaidCount} facturas pendientes</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`min-w-[220px] overflow-hidden rounded-lg border ${customer.debtTone.border} bg-white shadow-sm`}>
                          <div className={`flex border-l-4 ${customer.debtTone.side} px-3 py-2`}>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className={`text-xs font-semibold uppercase tracking-wide ${customer.debtTone.text}`}>
                                  Deuda
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                  {customer.debtProgress}%
                                </span>
                              </div>
                              <p className="mt-1 font-semibold text-slate-950">{customer.pendingAmount}</p>
                              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                                <div
                                  className={`h-1.5 rounded-full ${customer.debtTone.bar}`}
                                  style={{ width: `${customer.debtProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium">{customer.invoiceCount}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold ${customer.debtTone.text}`}>
                          {customer.pendingAmount}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                          {customer.paidAmount}
                        </span>
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