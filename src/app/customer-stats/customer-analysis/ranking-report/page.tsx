import Link from "next/link";

import { PaymentStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
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
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-slate-950 print:bg-white">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 12mm; }
            .print-hidden { display: none !important; }
            .print-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .print-table th { border: 1px solid #cbd5e1; background: #e2e8f0; padding: 8px; text-align: left; }
            .print-table td { border: 1px solid #e2e8f0; padding: 8px; }
            .amount { text-align: right; font-weight: 700; }
          }
        `}
      </style>

      <div className="mx-auto max-w-6xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/customer-stats/customer-analysis" className="print-hidden text-sm text-slate-500 hover:text-blue-600">
              Volver al analisis
            </Link>
            <h1 className="mt-3 text-2xl font-bold">Ranking de clientes por volumen de facturacion</h1>
            <p className="mt-1 text-sm text-slate-500">
              Clientes ordenados por volumen total facturado.
            </p>
          </div>

          <Button type="button" onClick={() => window.print()} className="print-hidden bg-blue-600 hover:bg-blue-700">
            Imprimir / Guardar PDF
          </Button>
        </div>

        <table className="print-table w-full text-left text-sm">
          <thead>
            <tr>
              <th>Posicion</th>
              <th>Cliente</th>
              <th>Facturas</th>
              <th className="amount">Facturado</th>
              <th className="amount">Cobrado</th>
              <th className="amount">% sobre total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((customer, index) => (
              <tr key={customer.id}>
                <td>{index + 1}</td>
                <td>{customer.name}</td>
                <td>{customer.invoiceCount}</td>
                <td className="amount">{formatAmount(customer.invoicedCents)}</td>
                <td className="amount">{formatAmount(customer.paidCents)}</td>
                <td className="amount">{customer.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
