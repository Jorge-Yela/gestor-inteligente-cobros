"use client";

import { FileText, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing/client";

type UploadInvoicePdfProps = {
  customerId?: string;
};

function formatFileSize(size: number) {
  const megabytes = size / 1024 / 1024;

  return `${megabytes.toFixed(2)} MB`;
}

export function UploadInvoicePdf({ customerId }: UploadInvoicePdfProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("Todavia no has seleccionado ninguna factura.");
  const [progress, setProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing("invoicePdf", {
    onUploadBegin: () => {
      setMessage("Subiendo facturas...");
      setProgress(5);
    },
    onUploadProgress: (value) => {
      setProgress(value);
      setMessage(`Subiendo facturas... ${value}%`);
    },
    onClientUploadComplete: () => {
      setMessage("Facturas aceptadas correctamente. Abriendo listado de facturas...");
      setProgress(100);
      setFiles([]);
      router.push("/invoices");
      router.refresh();
    },
    onUploadError: (error) => {
      setMessage(`No se han podido subir las facturas: ${error.message}`);
      setProgress(0);
    },
  });

  const selectedSize = files.reduce((total, file) => total + file.size, 0);

  function handleSelectFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf");

    setFiles((currentFiles) => {
      const nextFiles = [...currentFiles];

      for (const file of pdfFiles) {
        const alreadySelected = nextFiles.some(
          (item) => item.name === file.name && item.size === file.size,
        );

        if (!alreadySelected && nextFiles.length < 50) {
          nextFiles.push(file);
        }
      }

      return nextFiles;
    });

    if (pdfFiles.length === 0) {
      setMessage("No se ha seleccionado ningun PDF.");
    } else if (pdfFiles.length !== selectedFiles.length) {
      setMessage("Solo se han añadido archivos PDF. Revisa la lista antes de aceptar.");
    } else {
      setMessage("Facturas seleccionadas. Revisa la lista antes de aceptar.");
    }

    event.target.value = "";
  }

  function removeFile(fileToRemove: File) {
    setFiles((currentFiles) =>
      currentFiles.filter(
        (file) => !(file.name === fileToRemove.name && file.size === fileToRemove.size),
      ),
    );
  }

  async function uploadSelectedFiles() {
    if (files.length === 0 || isUploading) {
      return;
    }

    await startUpload(files, customerId ? { customerId } : {});
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Seleccionar facturas</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Abre tu carpeta, elige los PDFs y confirma la seleccion. Los archivos apareceran debajo antes de subirlos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleSelectFiles}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-slate-200 bg-white"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              Seleccionar facturas
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-blue-600 hover:bg-blue-700"
              onClick={uploadSelectedFiles}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? "Subiendo..." : "Aceptar facturas"}
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Facturas seleccionadas</h3>
            <p className="mt-1 text-sm text-slate-500">
              Puedes quitar cualquier archivo antes de aceptar.
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {files.length} PDF{files.length === 1 ? "" : "s"} · {formatFileSize(selectedSize)}
          </p>
        </div>

        {files.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-500">
            No hay facturas seleccionadas.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {files.map((file) => (
              <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeFile(file)}
                  disabled={isUploading}
                  aria-label={`Eliminar ${file.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <p>{message}</p>
          {isUploading ? (
            <span className="text-xs font-semibold">{progress}%</span>
          ) : null}
        </div>

        {isUploading ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
