import Link from "next/link";
import { ArrowRight, Calculator, FileSpreadsheet, ReceiptText } from "lucide-react";

export default function CustomerStatsPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">Inicio</Link>
              <h1 className="mt-3 text-3xl font-bold tracking-normal">
                Informes
              </h1>
              <p className="mt-2 max-w-3xl text-slate-500">
                Facturas emitidas, cobros y análisis de la cartera de clientes.
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Calculator className="size-6" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Link
              href="/customer-stats/issued-invoices"
              className="group flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 hover:border-blue-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                <ReceiptText className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold group-hover:text-blue-600">
                Libro registro de facturas emitidas
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Registro de fecha, número de factura, NIF del cliente,
                base imponible, tipo de IVA, cuota repercutida y total de factura.
              </p>
            <div className="mt-auto flex justify-end pt-5">
              <ArrowRight className="size-5 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true" />
            </div>
          </Link>

            <Link
              href="/customer-stats/financial-summary"
              className="group flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                <Calculator className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold group-hover:text-emerald-700">
                Resumen financiero
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Informes financieros y de tesorería para saber cuánto dinero ha ingresado
                y qué importes siguen pendientes de cobro.
              </p>
            <div className="mt-auto flex justify-end pt-5">
              <ArrowRight className="size-5 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true" />
            </div>
          </Link>

            <Link
              href="/customer-stats/customer-analysis"
              className="group flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 hover:border-amber-200 hover:bg-white hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                <FileSpreadsheet className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold group-hover:text-amber-700">
                Análisis de clientes y rentabilidad
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Informes para identificar qué clientes aportan más ingresos, cuáles concentran deuda
                y dónde conviene enfocar la gestión comercial y de cobros.
              </p>
            <div className="mt-auto flex justify-end pt-5">
              <ArrowRight className="size-5 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true" />
            </div>
          </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
