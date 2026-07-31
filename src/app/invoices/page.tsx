import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";

import { PaymentStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { markInvoiceAsPaid } from "@/server/actions/mark-invoice-paid";

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

type InvoicesPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { filter = "all" } = await searchParams;

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      dueDate: "asc",
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

  const filteredInvoices =
    filter === "pending"
      ? unpaidInvoices
      : filter === "paid"
        ? paidInvoices
        : invoices;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Panel de control
            </Link>
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
            <Button asChild variant="outline" className="rounded-lg border-slate-200 bg-white">
              <Link href="/invoices/new">Registrar manualmente</Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            href="/invoices"
            active={filter === "all"}
            label="Total facturas"
            value={String(invoices.length)}
            detail="En la plataforma"
            tone="blue"
            icon={FileText}
          />
          <SummaryCard
            href="/invoices?filter=pending"
            active={filter === "pending"}
            label="Pendiente de cobro"
            value={formatAmount(pendingAmountCents)}
            detail={`${unpaidInvoices.length} facturas`}
            tone="amber"
            icon={AlertTriangle}
          />
          <SummaryCard
            href="/invoices?filter=paid"
            active={filter === "paid"}
            label="Cobradas"
            value={String(paidInvoices.length)}
            detail="Registradas como pagadas"
            tone="emerald"
            icon={CheckCircle2}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Listado de facturas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Filtra por total, pendientes de cobro o cobradas.
              </p>
            </div>
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
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Fecha control</th>
                    <th className="px-5 py-3 font-medium">Importe</th>
                    <th className="px-5 py-3 font-medium">Marcar como cobrada</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold">{invoice.invoiceNumber}</td>
                      <td className="px-5 py-4">{invoice.customer.name}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(invoice.dueDate)}</td>
                      <td className="px-5 py-4 font-semibold">{formatAmount(invoice.amountCents)}</td>
                      <td className="px-5 py-4">
                        <form action={markInvoiceAsPaid}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={filter === "all" ? "/invoices" : `/invoices?filter=${filter}`}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            disabled={invoice.paymentStatus === PaymentStatus.PAID}
                            className="rounded-lg border-slate-200"
                          >
                            {invoice.paymentStatus === PaymentStatus.PAID ? "Ya cobrada" : "Marcar como cobrada"}
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
