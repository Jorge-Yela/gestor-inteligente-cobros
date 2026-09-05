"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing/client";

type AttachInvoicePdfProps = {
  invoiceId: string;
};

export function AttachInvoicePdf({ invoiceId }: AttachInvoicePdfProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const { startUpload, isUploading } = useUploadThing("invoicePdf", {
    onUploadBegin: () => {
      setMessage("Subiendo PDF...");
    },
    onClientUploadComplete: () => {
      setMessage("PDF asociado correctamente.");
      router.refresh();
    },
    onUploadError: (error) => {
      setMessage(`No se ha podido subir el PDF: ${error.message}`);
    },
  });

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isUploading) {
      return;
    }

    await startUpload([file], { invoiceId });
    event.target.value = "";
  }

  return (
    <div className="mt-5 space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      <Button
        type="button"
        className="rounded-lg bg-blue-600 hover:bg-blue-700"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="size-4" />
        {isUploading ? "Subiendo..." : "Subir PDF"}
      </Button>

      {message ? (
        <p className="text-sm text-slate-500">{message}</p>
      ) : null}
    </div>
  );
}
