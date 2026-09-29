"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return (
    <Button
      type="button"
      className="min-h-11 shrink-0 self-start rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Imprimir / Guardar PDF
    </Button>
  );
}
