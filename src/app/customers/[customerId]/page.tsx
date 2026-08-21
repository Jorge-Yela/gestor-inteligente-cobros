import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Upload,
} from "lucide-react";

import { PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { markInvoiceAsPaid, unmarkInvoiceAsPaid } from "@/server/actions/mark-invoice-paid";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

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

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Sin fecha";
}



type CustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
  searchParams: Promise<{
    invoices?: string;
    issueDate?: string;
    amountOrder?: string;
  }>;
};

export default async function CustomerDetailPage({ params, searchParams }: CustomerDetailPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { customerId } = await params;
  const {
    invoices: invoiceFilter = "pending",
    issueDate = "",
    amountOrder = "",
  } = await searchParams;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    include: {
      invoices: {
        orderBy: {
          dueDate: "asc",
        },
        include: {
          claimDrafts: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
      contacts: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const pendingAmountCents = customer.invoices
    .filter((invoice) => invoice.paymentStatus === PaymentStatus.UNPAID)
    .reduce((total, invoice) => total + invoice.amountCents, 0);

  const paidAmountCents = customer.invoices
    .filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID)
    .reduce((total, invoice) => total + invoice.amountCents, 0);

  const paidCount = customer.invoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.PAID,
  ).length;
  const pendingCount = customer.invoices.filter(
    (invoice) => invoice.paymentStatus !== PaymentStatus.PAID,
  ).length;
  const paidPercentage = customer.invoices.length > 0
    ? Math.round((paidCount / customer.invoices.length) * 100)
    : 0;

  const unpaidInvoices = customer.invoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.UNPAID,
  );
  const baseVisibleInvoices =
    invoiceFilter === "paid"
      ? customer.invoices.filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID)
      : unpaidInvoices;
  const dateFilteredInvoices = issueDate
    ? baseVisibleInvoices.filter(
        (invoice) => invoice.issueDate?.toISOString().slice(0, 10) === issueDate,
      )
    : baseVisibleInvoices;
  const visibleInvoices = [...dateFilteredInvoices].sort((first, second) => {
    if (amountOrder === "desc") {
      return second.amountCents - first.amountCents;
    }

    if (amountOrder === "asc") {
      return first.amountCents - second.amountCents;
    }

    return (first.issueDate?.getTime() ?? 0) - (second.issueDate?.getTime() ?? 0);
  });
  const invoiceListTitle = invoiceFilter === "paid" ? "Facturas cobradas" : "Facturas pendientes";
  const invoiceListDescription =
    invoiceFilter === "paid"
      ? "Facturas registradas como cobradas para este cliente."
      : "Selecciona varias facturas para preparar una reclamacion conjunta.";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/customers" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Clientes
            </Link>
            <div className="group relative mt-3 w-fit">
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <div className="pointer-events-auto invisible absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 text-sm opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 hover:visible hover:opacity-100">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Datos del cliente</p>
                    <p className="text-xs text-slate-500">{customer.taxId || "Sin CIF/NIF"}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-3">
                  <InfoRow label="Persona de contacto" value={customer.contactName || "Sin contacto"} />
                  <InfoRow label="Email" value={customer.email || "Sin email"} />
                  <InfoRow label="Telefono" value={customer.phone || "Sin telefono"} />
                  <InfoRow label="Direccion" value={customer.address || "Sin direccion"} />
                </dl>
              </div>
            </div>
            <p className="mt-2 text-slate-500">
              Ficha del cliente, facturas asociadas y recomendaciones de cobro.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-blue-600 shadow-sm hover:bg-blue-700">
              <Link href={`/invoice-files/upload?customerId=${customer.id}`}>
                <Upload className="size-4" />
                Subir factura
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg border-slate-200 bg-white">
              <Link href={`/customers/${customer.id}/edit`}>Editar cliente</Link>
            </Button>
          </div>
        </div>

        <section className="grid items-stretch gap-4 md:grid-cols-3">
          <Link href={`/customers/${customer.id}?invoices=pending`} className="h-full">
            <SummaryCard label="Deuda pendiente" value={formatAmount(pendingAmountCents)} detail={`${unpaidInvoices.length} facturas pendientes`} tone="amber" icon={CircleDollarSign} />
          </Link>

          <SummaryCard href={`/customers/${customer.id}?invoices=paid`} label="Cobradas" value={formatAmount(paidAmountCents)} detail={`${paidCount} facturas cobradas`} tone="emerald" icon={CheckCircle2} />

          <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Salud del cliente</h2>
            <div className="flex items-center gap-5">
              <div
                className="flex size-28 shrink-0 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(#10b981 ${paidPercentage}%, #f59e0b 0)` }}
              >
                <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-xl font-bold">{paidPercentage}%</span>
                  <span className="text-[11px] font-medium text-slate-500">cobrado</span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="size-2.5 rounded-full bg-blue-500" />
                    Total
                  </span>
                  <span className="font-semibold">{customer.invoices.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    Cobradas
                  </span>
                  <span className="font-semibold">{paidCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    Pendientes
                  </span>
                  <span className="font-semibold">{pendingCount}</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="min-w-0 space-y-6">
            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{invoiceListTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {invoiceListDescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(issueDate || amountOrder) ? (
                      <Button asChild variant="outline" className="rounded-lg border-slate-200">
                        <Link href={`/customers/${customer.id}?invoices=${invoiceFilter}`}>
                          Quitar filtros
                        </Link>
                      </Button>
                    ) : null}
                    {invoiceFilter !== "paid" ? (
                      <Button form="bulk-claim-form" type="submit" className="bg-blue-600 shadow-sm hover:bg-blue-700" disabled={visibleInvoices.length === 0}>
                        Preparar reclamacion conjunta
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              {visibleInvoices.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">
                  {invoiceFilter === "paid" ? "Este cliente no tiene facturas cobradas." : "Este cliente no tiene facturas pendientes."}
                </p>
              ) : (
                <>

                  <form id="bulk-claim-form" action={`/customers/${customer.id}/claim-preview`} className="hidden" />
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        {invoiceFilter !== "paid" ? (
                          <th className="px-5 py-3 font-medium">Seleccionar</th>
                        ) : null}
                        <th className="px-5 py-3 font-medium">Factura</th>
                        <th className="px-5 py-3 font-medium">
                          <details className="relative">
                            <summary className="cursor-pointer list-none rounded-md px-2 py-1 hover:bg-blue-50 hover:text-blue-600">
                              Fecha factura
                            </summary>
                            <form className="fixed left-1/2 top-40 z-50 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                              <input type="hidden" name="invoices" value={invoiceFilter} />
                              <input type="hidden" name="amountOrder" value={amountOrder} />
                              <p className="mb-2 text-xs font-semibold text-slate-600">Buscar por fecha</p>
                              <input
                                name="issueDate"
                                type="date"
                                defaultValue={issueDate}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                              />
                              <Button type="submit" variant="outline" size="sm" className="mt-3 rounded-lg border-slate-200">
                                Aplicar
                              </Button>
                            </form>
                          </details>
                        </th>
                        <th className="px-5 py-3 font-medium">Ultima reclamacion</th>
                        <th className="px-5 py-3 font-medium">
                          <details className="relative">
                            <summary className="cursor-pointer list-none rounded-md px-2 py-1 hover:bg-blue-50 hover:text-blue-600">
                              Importe
                            </summary>
                            <form className="fixed left-1/2 top-40 z-50 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                              <input type="hidden" name="invoices" value={invoiceFilter} />
                              <input type="hidden" name="issueDate" value={issueDate} />
                              <p className="mb-2 text-xs font-semibold text-slate-600">Ordenar importe</p>
                              <select
                                name="amountOrder"
                                defaultValue={amountOrder}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                              >
                                <option value="">Sin ordenar</option>
                                <option value="desc">Mayor a menor</option>
                                <option value="asc">Menor a mayor</option>
                              </select>
                              <Button type="submit" variant="outline" size="sm" className="mt-3 rounded-lg border-slate-200">
                                Aplicar
                              </Button>
                            </form>
                          </details>
                        </th>
                        <th className="px-5 py-3 font-medium">Estado</th>
                        <th className="px-5 py-3 font-medium">Accion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleInvoices.map((invoice) => (
                        <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                          {invoiceFilter !== "paid" ? (
                            <td className="px-5 py-4">
                              <input
                                type="checkbox"
                                form="bulk-claim-form"
                                name="invoiceIds"
                                value={invoice.id}
                                className="size-4 rounded border-slate-300 text-blue-600"
                              />
                            </td>
                          ) : null}
                          <td className="px-5 py-4 font-semibold">{invoice.invoiceNumber}</td>
                          <td className="px-5 py-4 text-slate-500">{formatDate(invoice.issueDate)}</td>
                          <td className="px-5 py-4 text-slate-500">
                            {invoice.claimDrafts[0] ? formatDate(invoice.claimDrafts[0].createdAt) : "Sin reclamaciones"}
                          </td>
                          <td className="px-5 py-4 font-semibold">{formatAmount(invoice.amountCents)}</td>
                          <td className="px-5 py-4">
                            {invoiceFilter !== "paid" ? (
                              <button
                                type="submit"
                                form={`mark-paid-${invoice.id}`}
                                className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                                title="Marcar como cobrada"
                              >
                                Pendiente de cobro
                              </button>
                            ) : (
                              <button
                                type="submit"
                                form={`unmark-paid-${invoice.id}`}
                                className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                title="Pasar a pendiente de cobro"
                              >
                                Cobrada
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                              <Link href={`/invoices/${invoice.id}`}>Ver factura</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}

              <div className="hidden">
                {visibleInvoices.map((invoice) =>
                  invoiceFilter !== "paid" ? (
                    <form key={invoice.id} id={`mark-paid-${invoice.id}`} action={markInvoiceAsPaid}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <input type="hidden" name="customerId" value={customer.id} />
                      <input type="hidden" name="redirectTo" value={`/customers/${customer.id}?invoices=pending`} />
                    </form>
                  ) : (
                    <form key={invoice.id} id={`unmark-paid-${invoice.id}`} action={unmarkInvoiceAsPaid}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <input type="hidden" name="customerId" value={customer.id} />
                      <input type="hidden" name="redirectTo" value={`/customers/${customer.id}?invoices=paid`} />
                    </form>
                  ),
                )}
              </div>
            </article>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  href,
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  href?: string;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "blue" | "red" | "emerald";
  icon: typeof FileText;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  const content = (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
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

  return href ? <Link href={href}>{content}</Link> : content;
}

function InfoRow({
  label,
  value,
  icon: Icon = CalendarClock,
}: {
  label: string;
  value: string;
  icon?: typeof CalendarClock;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 text-slate-400" />
      <div>
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className="mt-1 font-medium">{value}</dd>
      </div>
    </div>
  );
}