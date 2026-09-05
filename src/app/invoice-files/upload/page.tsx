import Link from "next/link";
import { CheckCircle2, FileCheck2, FileSpreadsheet, SearchCheck } from "lucide-react";

import { ImportInvoicesExcel } from "@/app/invoice-files/upload/import-invoices-excel";

export default function UploadInvoiceFilePage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <Link href="/invoices" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Facturas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Subir facturas</h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            Importa un listado Excel con tus facturas pendientes. Podras revisar cada fila antes de registrarlas definitivamente.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StepCard
            icon={FileSpreadsheet}
            title="1. Sube el Excel"
            description="Selecciona un listado exportado desde tu programa de facturacion."
            tone="blue"
          />
          <StepCard
            icon={SearchCheck}
            title="2. Revisa los datos"
            description="Comprueba cliente, numero de factura, fecha e importe antes de guardar."
            tone="violet"
          />
          <StepCard
            icon={FileCheck2}
            title="3. Registra facturas"
            description="Al confirmar, se crean como facturas pendientes de cobro."
            tone="emerald"
          />
        </section>

        <ImportInvoicesExcel />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Campos necesarios</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                El Excel debe incluir cliente, numero de factura, fecha de factura e importe. El CIF, email, telefono, direccion, vencimiento y moneda pueden venir vacios.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StepCard({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: typeof FileSpreadsheet;
  title: string;
  description: string;
  tone: "blue" | "violet" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex size-11 items-center justify-center rounded-full ${tones[tone]}`}>
        <Icon className="size-5" />
      </div>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}
