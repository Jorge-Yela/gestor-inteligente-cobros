import Link from "next/link";
import { Calculator, FileSpreadsheet, ReceiptText } from "lucide-react";

export default function CustomerStatsPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Informes</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">
                Informes contables y financieros
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Consulta informes fiscales, financieros y de rentabilidad para analizar la cartera de clientes.
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calculator className="size-6" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Link
              href="/customer-stats/issued-invoices"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                <ReceiptText className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold group-hover:text-blue-600">
                Libro registro de facturas emitidas
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Lista obligatoria por ley que detalla fecha, numero de factura, NIF del cliente,
                base imponible, tipo de IVA, cuota repercutida y total factura.
              </p>
            </Link>

            <Link
              href="/customer-stats/financial-summary"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                <Calculator className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold group-hover:text-emerald-700">
                Resumen financiero
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Informes financieros y de tesoreria para saber cuanto dinero ha ingresado
                y que importes siguen pendientes de cobro.
              </p>
            </Link>

            <Link
              href="/customer-stats/customer-analysis"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-amber-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                <FileSpreadsheet className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold group-hover:text-amber-700">
                Analisis de clientes y rentabilidad
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Informes para identificar que clientes aportan mas ingresos, cuales concentran deuda
                y donde conviene enfocar la gestion comercial y de cobros.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
