import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { markInvoiceAsPaid } from "@/server/actions/mark-invoice-paid";
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



export default async function InvoicesPage() {
  const organizationId = await getCurrentOrganizationId();

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

  const unpaidInvoices = invoices.filter((invoice) => invoice.paymentStatus === PaymentStatus.UNPAID);
  const paidInvoices = invoices.filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID);
  const overdueInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.OVERDUE);
  const pendingAmountCents = unpaidInvoices.reduce((total, invoice) => total + invoice.amountCents, 0);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Dashboard
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

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Pendiente de cobro" value={formatAmount(pendingAmountCents)} detail={`${unpaidInvoices.length} facturas`} tone="amber" icon={AlertTriangle} />
          <SummaryCard label="Facturas vencidas" value={String(overdueInvoices.length)} detail="Requieren revision" tone="red" icon={FileText} />
          <SummaryCard label="Cobradas" value={String(paidInvoices.length)} detail="Registradas como pagadas" tone="emerald" icon={CheckCircle2} />
          <SummaryCard label="Total facturas" value={String(invoices.length)} detail="En la plataforma" tone="blue" icon={FileText} />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Listado de facturas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Prioriza las vencidas y revisa cada factura antes de reclamar.
              </p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              Todavia no hay facturas registradas.
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
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold">{invoice.invoiceNumber}</td>
                      <td className="px-5 py-4">{invoice.customer.name}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(invoice.dueDate)}</td>
                      <td className="px-5 py-4 font-semibold">{formatAmount(invoice.amountCents)}</td>
                      <td className="px-5 py-4">
                        <form action={markInvoiceAsPaid}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <input type="hidden" name="redirectTo" value="/invoices" />
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
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
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
