import Link from "next/link";
import { FileUp, ShieldCheck, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UploadInvoiceFilePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a facturas
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Subir factura PDF</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Sube una factura existente para preparar su seguimiento. La plataforma no emite facturas ni cambia tu ERP.
          </p>
        </div>

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Archivo de factura</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aceptaremos un PDF por subida, con un maximo de 16 MB.
            </p>
          </div>

          <div className="p-5">
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-lg border bg-background">
                <FileUp className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Subida preparada</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                La configuracion tecnica ya esta creada. Activaremos el selector real de PDF cuando añadamos las claves de UploadThing.
              </p>
              <div className="mt-6">
                <Button disabled>Seleccionar PDF</Button>
              </div>
            </div>
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
            <h2 className="mt-4 font-semibold">3. Confirmar seguimiento</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nada se reclama ni se envia sin aprobacion del usuario.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
