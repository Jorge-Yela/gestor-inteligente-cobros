import Link from "next/link";
import { CheckCircle2, FileCheck2, FileSearch, FolderOpen } from "lucide-react";

import { UploadInvoicePdf } from "@/app/invoice-files/upload/upload-invoice-pdf";

type UploadInvoiceFilePageProps = {
  searchParams: Promise<{
    customerId?: string;
  }>;
};

export default async function UploadInvoiceFilePage({ searchParams }: UploadInvoiceFilePageProps) {
  const { customerId } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <Link href="/invoices" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Facturas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Subir facturas</h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            Selecciona las facturas PDF desde tu carpeta. Antes de guardarlas definitivamente, podras ver la lista de archivos elegidos y quitar los que no correspondan.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StepCard
            icon={FolderOpen}
            title="1. Selecciona"
            description="Elige una o varias facturas PDF desde tu equipo."
            tone="blue"
          />
          <StepCard
            icon={FileSearch}
            title="2. Revisa"
            description="Comprueba en esta misma pantalla que la seleccion es correcta."
            tone="violet"
          />
          <StepCard
            icon={FileCheck2}
            title="3. Acepta"
            description="Al aceptar, las facturas pasan al listado definitivo."
            tone="emerald"
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Carga de facturas</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Puedes seleccionar hasta 50 PDFs. La subida no empieza hasta que pulses aceptar.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <UploadInvoicePdf customerId={customerId} />
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
  icon: typeof FolderOpen;
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
