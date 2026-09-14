import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

function getDelayDays(issueDate: Date | null, paidAt: Date | null, today: Date) {
  if (!issueDate) {
    return null;
  }

  const endDate = paidAt || today;

  return Math.max(
    Math.floor((endDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );
}

export default async function CustomerDelayReportPage() {
  const organizationId = await getCurrentOrganizationId();
  const today = new Date();

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { invoices: true },
  });

  const rows = customers
    .map((customer) => {
      const delays = customer.invoices
        .map((invoice) => getDelayDays(invoice.issueDate, invoice.paidAt, today))
        .filter((days): days is number => days !== null);

      const averageDelay =
        delays.length > 0
          ? Math.round(delays.reduce((total, days) => total + days, 0) / delays.length)
          : null;

      return {
        id: customer.id,
        name: customer.name,
        invoiceCount: customer.invoices.length,
        averageDelay,
      };
    })
    .filter((customer) => customer.invoiceCount > 0)
    .sort((first, second) => (second.averageDelay || 0) - (first.averageDelay || 0));

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
            <h1 className="mt-3 text-2xl font-bold">Tasa de retraso por cliente</h1>
            <p className="mt-1 text-sm text-slate-500">
              Promedio de dias desde emision hasta cobro o hasta hoy si sigue pendiente.
            </p>
          </div>

          <Button type="button" onClick={() => window.print()} className="print-hidden bg-blue-600 hover:bg-blue-700">
            Imprimir / Guardar PDF
          </Button>
        </div>

        <table className="print-table w-full text-left text-sm">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Facturas</th>
              <th className="amount">Retraso medio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.invoiceCount}</td>
                <td className="amount">
                  {customer.averageDelay === null ? "Sin datos" : `${customer.averageDelay} dias`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
