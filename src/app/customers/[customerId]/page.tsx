import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Mail,
  Phone,
  Upload,
} from "lucide-react";

import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
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

function formatInvoiceStatus(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    PENDING_REVIEW: "Revision",
    ACTIVE: "Activa",
    OVERDUE: "Vencida",
    PAID: "Cobrada",
    CANCELLED: "Cancelada",
    ARCHIVED: "Archivada",
  };

  return labels[status];
}

function formatPaymentStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    UNPAID: "Pendiente",
    PAID: "Cobrada",
    DISPUTED: "En disputa",
  };

  return labels[status];
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

type CustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { customerId } = await params;

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
      },
      invoiceFiles: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          invoice: true,
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

  const overdueCount = customer.invoices.filter(
    (invoice) => invoice.status === InvoiceStatus.OVERDUE,
  ).length;

  const today = startOfToday();

  const invoicesToClaim = customer.invoices.filter(
    (invoice) =>
      invoice.paymentStatus === PaymentStatus.UNPAID &&
      invoice.dueDate &&
      invoice.dueDate <= today,
  );

  const invoicesWithoutControlDate = customer.invoices.filter(
    (invoice) =>
      invoice.paymentStatus === PaymentStatus.UNPAID &&
      !invoice.dueDate,
  );

  const suggestedInvoices = [...invoicesToClaim, ...invoicesWithoutControlDate];
  const unpaidInvoices = customer.invoices.filter(
    (invoice) => invoice.paymentStatus === PaymentStatus.UNPAID,
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/customers" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Clientes
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{customer.name}</h1>
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
            <Button variant="outline" className="rounded-lg border-slate-200 bg-white">
              Editar cliente
            </Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Pendiente" value={formatAmount(pendingAmountCents)} detail="Importe por cobrar" tone="amber" icon={CircleDollarSign} />
          <SummaryCard label="Facturas" value={String(customer.invoices.length)} detail="Asociadas al cliente" tone="blue" icon={FileText} />
          <SummaryCard label="Vencidas" value={String(overdueCount)} detail="Requieren revision" tone="red" icon={AlertTriangle} />
          <SummaryCard label="PDFs subidos" value={String(customer.invoiceFiles.length)} detail="Documentos vinculados" tone="emerald" icon={Upload} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-6">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Datos del cliente</h2>
                  <p className="text-sm text-slate-500">{customer.taxId || "Sin CIF/NIF"}</p>
                </div>
              </div>

              <dl className="mt-6 space-y-4">
                <InfoRow label="Contacto" value={customer.contactName || "Sin contacto"} />
                <InfoRow label="Email" value={customer.email || "Sin email"} icon={Mail} />
                <InfoRow label="Telefono" value={customer.phone || "Sin telefono"} icon={Phone} />
                <InfoRow label="Direccion" value={customer.address || "Sin direccion"} />
              </dl>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Prioridad</h2>
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Acciones recomendadas</p>
                <p className="mt-2 text-3xl font-bold">{suggestedInvoices.length}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Facturas vencidas o pendientes de fecha de control.
                </p>
              </div>
            </article>
          </aside>

          <section className="space-y-6">
            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">Facturas pendientes</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Selecciona varias facturas para preparar una reclamacion conjunta.
                    </p>
                  </div>
                  <Button form="bulk-claim-form" type="submit" className="bg-blue-600 shadow-sm hover:bg-blue-700" disabled={unpaidInvoices.length === 0}>
                    Preparar reclamacion conjunta
                  </Button>
                </div>
              </div>

              {unpaidInvoices.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">
                  Este cliente no tiene facturas pendientes.
                </p>
              ) : (
                <form id="bulk-claim-form" action={`/customers/${customer.id}/claim-preview`} className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Seleccionar</th>
                        <th className="px-5 py-3 font-medium">Factura</th>
                        <th className="px-5 py-3 font-medium">Fecha control</th>
                        <th className="px-5 py-3 font-medium">Importe</th>
                        <th className="px-5 py-3 font-medium">Estado</th>
                        <th className="px-5 py-3 font-medium">Cobro</th>
                        <th className="px-5 py-3 font-medium">Accion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unpaidInvoices.map((invoice) => (
                        <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              name="invoiceIds"
                              value={invoice.id}
                              className="size-4 rounded border-slate-300 text-blue-600"
                            />
                          </td>
                          <td className="px-5 py-4 font-semibold">{invoice.invoiceNumber}</td>
                          <td className="px-5 py-4 text-slate-500">{formatDate(invoice.dueDate)}</td>
                          <td className="px-5 py-4 font-semibold">{formatAmount(invoice.amountCents)}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {formatInvoiceStatus(invoice.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {formatPaymentStatus(invoice.paymentStatus)}
                            </span>
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
                </form>
              )}
            </article>

            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-semibold">PDFs del cliente</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Archivos subidos desde la ficha de este cliente o asociados despues.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                  <Link href={"/invoice-files/upload?customerId=" + customer.id}>Subir PDF</Link>
                </Button>
              </div>

              {customer.invoiceFiles.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">
                  Todavia no hay PDFs asociados a este cliente.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customer.invoiceFiles.map((file) => (
                    <div key={file.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{file.fileName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {file.invoice ? "Factura " + file.invoice.invoiceNumber : "Pendiente de registrar como factura"}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
                        <Link href={`/invoice-files/${file.id}`}>Ver archivo</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
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
  tone: "amber" | "blue" | "red" | "emerald";
  icon: typeof FileText;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
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