import Link from "next/link";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

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
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export default async function InvoiceFilesPage() {
  const organizationId = await getCurrentOrganizationId();

  const files = await prisma.invoiceFile.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      invoice: true,
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Volver al dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Archivos subidos</h1>
            <p className="mt-2 text-muted-foreground">
              PDFs de facturas existentes preparados para OCR y seguimiento.
            </p>
          </div>

          <Button asChild>
            <Link href="/invoice-files/upload">Subir PDF</Link>
          </Button>
        </div>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Facturas recibidas en PDF</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aqui apareceran los archivos subidos cuando activemos la subida real.
            </p>
          </div>

          {files.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-medium">Todavia no hay PDFs subidos</p>
              <p className="mt-2 text-sm text-muted-foreground">
                El primer paso sera subir una factura existente en PDF.
              </p>
              <div className="mt-5">
                <Button asChild variant="outline">
                  <Link href="/invoice-files/upload">Ir a subir PDF</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Archivo</th>
                    <th className="px-5 py-3 font-medium">Tamano</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Factura asociada</th>
                    <th className="px-5 py-3 font-medium">Subido</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td className="px-5 py-4 font-medium">{file.fileName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatFileSize(file.sizeBytes)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                          {formatStatus(file.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {file.invoice ? file.invoice.invoiceNumber : "Sin asociar"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDate(file.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm">
                          <a href={file.fileUrl} target="_blank" rel="noreferrer">
                            Ver PDF
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
