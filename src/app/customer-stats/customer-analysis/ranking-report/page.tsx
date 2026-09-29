import Link from "next/link";

import { PaymentStatus } from "@/generated/prisma/enums";
import { PrintReportButton } from "@/app/customer-stats/issued-invoices/print-report-button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatAmount(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export default async function CustomerRankingReportPage() {
  const organizationId = await getCurrentOrganizationId();

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { invoices: true },
  });

  const totalInvoicedCents = customers.reduce(
    (total, customer) =>
      total + customer.invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0),
    0,
  );

  const rows = customers
    .map((customer) => {
      const invoicedCents = customer.invoices.reduce(
        (total, invoice) => total + invoice.amountCents,
        0,
      );
      const paidCents = customer.invoices
        .filter((invoice) => invoice.paymentStatus === PaymentStatus.PAID)
        .reduce((total, invoice) => total + invoice.amountCents, 0);

      return {
        id: customer.id,
        name: customer.name,
        invoiceCount: customer.invoices.length,
        invoicedCents,
        paidCents,
        percentage: totalInvoicedCents > 0 ? Math.round((invoicedCents / totalInvoicedCents) * 100) : 0,
      };
    })
    .filter((customer) => customer.invoicedCents > 0)
    .sort((first, second) => second.invoicedCents - first.invoicedCents);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 print:min-h-0 print:bg-white">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 12mm; }
            .print-hidden { display: none !important; }
            .print-table { width: 100%; min-width: 0 !important; border-collapse: collapse; font-size: 11px; }
            .print-table th { border: 1px solid #cbd5e1; background: #e2e8f0; padding: 8px; text-align: left; }
            .print-table thead { display: table-header-group; }
           .print-table tr { break-inside: avoid; }
           .print-table td { border: 1px solid #e2e8f0; padding: 8px; }
            .amount { text-align: right; font-weight: 700; }
          }
        `}
      </style>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 print:max-w-none print:p-0">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link href="/customer-stats/customer-analysis" className="print-hidden text-sm text-slate-500 hover:text-blue-600">
              Volver al análisis
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-normal">Ranking por facturación</h1>
            <p className="mt-1 text-sm text-slate-500">
              Clientes ordenados por volumen total facturado.
            </p>
          </div>

          <PrintReportButton />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white print:overflow-visible print:border-0">
       <table className="print-table w-full min-w-[800px] text-left text-sm print:min-w-0">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Posición</th>
              <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
              <th scope="col" className="px-5 py-3 font-medium">Facturas</th>
              <th scope="col" className="amount px-5 py-3 text-right font-medium">Facturado</th>
              <th scope="col" className="amount px-5 py-3 text-right font-medium">Cobrado</th>
              <th scope="col" className="amount px-5 py-3 text-right font-medium">% sobre total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((customer, index) => (
              <tr key={customer.id} className="transition hover:bg-slate-50">
                <td className="px-5 py-4 [overflow-wrap:anywhere]">{index + 1}</td>
                <td className="px-5 py-4 [overflow-wrap:anywhere]">{customer.name}</td>
                <td className="px-5 py-4 [overflow-wrap:anywhere]">{customer.invoiceCount}</td>
                <td className="amount whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums">{formatAmount(customer.invoicedCents)}</td>
                <td className="amount whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums">{formatAmount(customer.paidCents)}</td>
                <td className="amount whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums">{customer.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </div>
    </main>
  );
}
