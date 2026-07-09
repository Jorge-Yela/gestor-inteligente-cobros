import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { simulateInvoiceFileOcr } from "@/server/actions/simulate-invoice-file-ocr";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

type InvoiceFileDetailPageProps = {
  params: Promise<{
    fileId: string;
  }>;
};

function formatStatus(status: InvoiceFileStatus) {
  const labels: Record<InvoiceFileStatus, string> = {
    UPLOADED: "Subido",
    OCR_PENDING: "OCR pendiente",
    OCR_PROCESSING: "OCR en proceso",
    OCR_COMPLETED: "OCR completado",
    OCR_FAILED: "OCR fallido",
  };

  return labels[status];
}

function formatFileSize(sizeBytes: number | null) {
  if (!sizeBytes) {
    return "No indicado";
  }

  const megabytes = sizeBytes / 1024 / 1024;
  return `${megabytes.toFixed(2)} MB`;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export default async function InvoiceFileDetailPage({ params }: InvoiceFileDetailPageProps) {
  const { fileId } = await params;
  const organizationId = await getCurrentOrganizationId();

  const file = await prisma.invoiceFile.findFirst({
    where: {
      id: fileId,
      organizationId,
    },
    include: {
      invoice: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!file) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Link href="/invoice-files" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a archivos
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{file.fileName}</h1>
          <p className="mt-2 text-muted-foreground">
            Archivo PDF recibido para preparar OCR, revision y registro.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Estado del archivo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Informacion tecnica del PDF registrado.
              </p>
            </div>

            <dl className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Nombre</dt>
                <dd className="mt-1 font-medium">{file.fileName}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Estado</dt>
                <dd className="mt-1">
                  <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                    {formatStatus(file.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Tamano</dt>
                <dd className="mt-1 font-medium">{formatFileSize(file.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Subido</dt>
                <dd className="mt-1 font-medium">{formatDate(file.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Tipo</dt>
                <dd className="mt-1 font-medium">{file.mimeType}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Factura asociada</dt>
                <dd className="mt-1 space-y-3">
                  {file.invoice ? (
                    <>
                      <div>
                        <p className="font-medium">{file.invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.invoice.customer.name}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/invoices/${file.invoice.id}`}>Ver factura</Link>
                      </Button>
                    </>
                  ) : (
                    <span className="font-medium">Sin asociar</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <aside className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Acciones</h2>
            <div className="mt-5 space-y-3">
              <Button asChild className="w-full">
                <a href={file.fileUrl} target="_blank" rel="noreferrer">
                  Ver PDF
                </a>
              </Button>
              <form action={simulateInvoiceFileOcr}>
                <input type="hidden" name="fileId" value={file.id} />
                <Button type="submit" variant="outline" className="w-full">
                  Simular OCR
                </Button>
              </form>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/invoice-files/${file.id}/review`}>Revisar datos</Link>
              </Button>
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Datos OCR</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aqui apareceran los datos extraidos cuando conectemos OCR.
            </p>
          </div>

          <div className="p-5">
            {file.extractedText ? (
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
                {file.extractedText}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavia no hay texto extraido para este archivo.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
