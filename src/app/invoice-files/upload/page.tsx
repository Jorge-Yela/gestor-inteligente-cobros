import Link from "next/link";
import { FileUp, ShieldCheck, WandSparkles } from "lucide-react";

import { UploadInvoicePdf } from "@/app/invoice-files/upload/upload-invoice-pdf";

type UploadInvoiceFilePageProps = {
  searchParams: Promise<{
    customerId?: string;
  }>;
};

export default async function UploadInvoiceFilePage({ searchParams }: UploadInvoiceFilePageProps) {
  const { customerId } = await searchParams;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a facturas
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Subir facturas PDF</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Sube una factura existente para registrarla y asociarla a un cliente. La plataforma no emite facturas ni cambia tu ERP.
          </p>
        </div>

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Archivos de factura</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aceptaremos hasta 10 PDFs por subida, con un maximo de 16 MB por archivo.
            </p>
          </div>

          <div className="p-5">
            <UploadInvoicePdf customerId={customerId} />
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <FileUp className="size-5 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">1. Subir PDF</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              El usuario decide que factura quiere controlar.
            </p>
          </article>

          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <WandSparkles className="size-5 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">2. Extraer datos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              El OCR preparara una propuesta de datos para revisar.
            </p>
          </article>

          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <ShieldCheck className="size-5 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">3. Confirmar factura</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nada se reclama ni se envia sin aprobacion del usuario.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
