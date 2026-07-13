"use client";

import { useRouter } from "next/navigation";

import { UploadDropzone } from "@/lib/uploadthing/client";

type UploadInvoicePdfProps = {
  customerId?: string;
};

export function UploadInvoicePdf({ customerId }: UploadInvoicePdfProps) {
  const router = useRouter();

  return (
    <UploadDropzone
      endpoint="invoicePdf"
      input={customerId ? { customerId } : { }}
      onClientUploadComplete={() => {
        router.push("/invoice-files");
        router.refresh();
      }}
      onUploadError={(error: Error) => {
        alert(`Error al subir el PDF: ${error.message}`);
      }}
      appearance={{
        container:
          "min-h-[150px] rounded-lg border border-dashed bg-muted/30 px-5 py-6",
        label: "text-sm font-medium",
        uploadIcon: "size-6",
        allowedContent: "text-xs text-muted-foreground",
        button:
          "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
      }}
      content={{
        label: "Arrastra aqui tus facturas PDF o selecciona archivos",
        allowedContent: "Hasta 10 PDFs de 16 MB cada uno. No se enviara ninguna reclamacion automaticamente.",
        button: "Seleccionar PDFs",
      }}
    />
  );
}
