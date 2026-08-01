import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";

import { PaymentStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { markInvoiceAsPaid, unmarkInvoiceAsPaid } from "@/server/actions/mark-invoice-paid";

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

function formatDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function buildInvoicesHref({
  filter,
  column,
  customer,
  issueDate,
  amount,
  amountOrder,
}: {
  filter: string;
  column?: string;
  customer: string;
  issueDate: string;
  amount: string;
  amountOrder: string;
}) {
  const params = new URLSearchParams();

  if (filter !== "all") {
    params.set("filter", filter);
  }

  if (column) {
    params.set("column", column);
  }

  if (customer) {
    params.set("customer", customer);
  }

  if (issueDate) {
    params.set("issueDate", issueDate);
  }

  if (amount) {
    params.set("amount", amount);
  }

  if (amountOrder !== "none") {
    params.set("amountOrder", amountOrder);
  }

  const query = params.toString();

  return query ? `/invoices?${query}` : "/invoices";
}

type InvoicesPageProps = {
  searchParams: Promise<{
    filter?: string;
    column?: string;
    customer?: string;
    issueDate?: string;
    amount?: string;
    amountOrder?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const {
    filter = "all",
    column = "",
    customer = "",
    issueDate = "",
    amount = "",
    amountOrder = "none",
  } = await searchParams;

  const normalizedCustomer = customer.trim().toLowerCase();
  const amountNumber = Number(amount.replace(",", "."));

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      issueDate: "desc",
    },
    include: {
      customer: true,
    },
  });

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
  const paidAmountCents = paidInvoices.reduce(
    (total, invoice) => total + invoice.amountCents,
    0,
  );

  const statusFilteredInvoices =
    filter === "pending"
      ? unpaidInvoices
      : filter === "paid"
        ? paidInvoices
        : invoices;

  const filteredInvoices = [...statusFilteredInvoices]
    .filter((invoice) =>
      normalizedCustomer
        ? invoice.customer.name.toLowerCase().includes(normalizedCustomer)
        : true,
    )
    .filter((invoice) =>
      issueDate ? formatDateInputValue(invoice.issueDate) === issueDate : true,
    )
    .filter((invoice) =>
      amount && !Number.isNaN(amountNumber)
        ? invoice.amountCents >= Math.round(amountNumber * 100)
        : true,
    )
    .sort((first, second) => {
      if (amountOrder === "desc") {
        return second.amountCents - first.amountCents;
      }

      if (amountOrder === "asc") {
        return first.amountCents - second.amountCents;
      }

      return second.issueDate.getTime() - first.issueDate.getTime();
    });

  const baseFilterHref = (nextFilter: string) =>
    buildInvoicesHref({
      filter: nextFilter,
      column,
      customer,
      issueDate,
      amount,
      amountOrder,
    });

  const redirectTo = buildInvoicesHref({
    filter,
    column,
    customer,
    issueDate,
    amount,
    amountOrder,
  });

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="mt-2 text-slate-500">
              Controla facturas cargadas, importes pendientes y acciones de cobro.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-blue-600 shadow-sm hover:bg-blue-700">
              <Link href="/invoice-files/upload">
                <Upload className="size-4" />
                Subir factura
              </Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            href={baseFilterHref("all")}
            active={filter === "all"}
            label="Total facturas"
            value={String(invoices.length)}
            detail="En la plataforma"
            tone="blue"
            icon={FileText}
          />
          <SummaryCard
            href={baseFilterHref("pending")}
            active={filter === "pending"}
            label="Pendiente de cobro"
            value={formatAmount(pendingAmountCents)}
            detail={`${unpaidInvoices.length} facturas`}
            tone="amber"
            icon={AlertTriangle}
          />
          <SummaryCard
            href={baseFilterHref("paid")}
            active={filter === "paid"}
            label="Cobradas"
            value={formatAmount(paidAmountCents)}
            detail={`${paidInvoices.length} facturas cobradas`}
            tone="emerald"
            icon={CheckCircle2}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Listado de facturas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pulsa en Cliente, Fecha de emision o Importe para filtrar.
              </p>
            </div>

            {(customer || issueDate || amount || amountOrder !== "none") ? (
              <Button asChild variant="outline" className="rounded-lg border-slate-200">
                <Link href={filter === "all" ? "/invoices" : `/invoices?filter=${filter}`}>
                  Limpiar filtros
                </Link>
              </Button>
            ) : null}
          </div>

          {filteredInvoices.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              No hay facturas para este filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">
                      <ColumnLink href={buildInvoicesHref({ filter, column: "customer", customer, issueDate, amount, amountOrder })} active={column === "customer"}>
                        Cliente
                      </ColumnLink>
                      {column === "customer" ? (
                        <form className="mt-3 flex gap-2">
                          <input type="hidden" name="filter" value={filter} />
                          <input type="hidden" name="column" value="customer" />
                          <input type="hidden" name="issueDate" value={issueDate} />
                          <input type="hidden" name="amount" value={amount} />
                          <input type="hidden" name="amountOrder" value={amountOrder} />
                          <input
                            name="customer"
                            defaultValue={customer}
                            placeholder="Buscar cliente"
                            className="h-9 w-44 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                          />
                          <button className="rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium">
                            Buscar
                          </button>
                        </form>
                      ) : null}
                    </th>
                    <th className="px-5 py-3 font-medium">
                      <ColumnLink href={buildInvoicesHref({ filter, column: "issueDate", customer, issueDate, amount, amountOrder })} active={column === "issueDate"}>
                        Fecha de emision
                      </ColumnLink>
                      {column === "issueDate" ? (
                        <form className="mt-3 flex gap-2">
                          <input type="hidden" name="filter" value={filter} />
                          <input type="hidden" name="column" value="issueDate" />
                          <input type="hidden" name="customer" value={customer} />
                          <input type="hidden" name="amount" value={amount} />
                          <input type="hidden" name="amountOrder" value={amountOrder} />
                          <input
                            type="date"
                            name="issueDate"
                            defaultValue={issueDate}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                          />
                          <button className="rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium">
                            Buscar
                          </button>
                        </form>
                      ) : null}
                    </th>
                    <th className="px-5 py-3 font-medium">
                      <ColumnLink href={buildInvoicesHref({ filter, column: "amount", customer, issueDate, amount, amountOrder })} active={column === "amount"}>
                        Importe
                      </ColumnLink>
                      {column === "amount" ? (
                        <form className="mt-3 grid w-56 gap-2">
                          <input type="hidden" name="filter" value={filter} />
                          <input type="hidden" name="column" value="amount" />
                          <input type="hidden" name="customer" value={customer} />
                          <input type="hidden" name="issueDate" value={issueDate} />
                          <input
                            name="amount"
                            defaultValue={amount}
                            placeholder="Importe minimo"
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                          />
                          <select
                            name="amountOrder"
                            defaultValue={amountOrder}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                          >
                            <option value="none">Orden normal</option>
                            <option value="desc">Mayor importe</option>
                            <option value="asc">Menor importe</option>
                          </select>
                          <button className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium">
                            Aplicar
                          </button>
                        </form>
                      ) : null}
                    </th>
                    <th className="px-5 py-3 font-medium">Marcar como cobrada</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold">{invoice.invoiceNumber}</td>
                      <td className="px-5 py-4">{invoice.customer.name}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(invoice.issueDate)}</td>
                      <td className="px-5 py-4 font-semibold">{formatAmount(invoice.amountCents)}</td>
                      <td className="px-5 py-4">
                        <form action={invoice.paymentStatus === PaymentStatus.PAID ? unmarkInvoiceAsPaid : markInvoiceAsPaid}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <input type="hidden" name="redirectTo" value={redirectTo} />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-slate-200"
                          >
                            {invoice.paymentStatus === PaymentStatus.PAID ? "Cobrada" : "Marcar como cobrada"}
                          </Button>
                        </form>
                      </td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                          <Link href={`/invoices/${invoice.id}`}>Ver detalle</Link>
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

function ColumnLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-lg px-2 py-1 transition ${
        active ? "bg-blue-50 text-blue-700" : "hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {children}
    </Link>
  );
}

function SummaryCard({
  href,
  active,
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "red" | "emerald" | "blue";
  icon: typeof FileText;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <Link
      href={href}
      className={`rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-blue-300 ring-4 ring-blue-100" : "border-slate-200"
      }`}
    >
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
    </Link>
  );
}
