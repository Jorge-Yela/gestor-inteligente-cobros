import Link from "next/link";
import { CheckCircle2, FileUp, ShieldCheck, Sparkles } from "lucide-react";

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
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div>
          <Link href="/invoices" className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Facturas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Subir facturas PDF</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Sube una o varias facturas existentes. La plataforma lee los datos y las deja preparadas para registrar y revisar.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Archivos de factura</h2>
            <p className="mt-1 text-sm text-slate-500">
              Hasta 10 PDFs por subida, con un maximo de 16 MB por archivo.
            </p>
          </div>

          <div className="p-5">
            <UploadInvoicePdf customerId={customerId} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StepCard
            icon={FileUp}
            title="1. Subir PDFs"
            description="Selecciona facturas de uno o varios clientes."
            tone="blue"
          />
          <StepCard
            icon={Sparkles}
            title="2. Leer datos"
            description="La plataforma prepara la informacion para revisar."
            tone="violet"
          />
          <StepCard
            icon={ShieldCheck}
            title="3. Registrar factura"
            description="El usuario valida antes de reclamar o marcar acciones."
            tone="emerald"
          />
        </section>

        <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Flujo seguro</h2>
              <p className="mt-1 text-sm text-slate-500">
                Subir una factura no envia reclamaciones ni modifica tu ERP. Todo queda listo para revisar antes de actuar.
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
  icon: typeof FileUp;
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
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}