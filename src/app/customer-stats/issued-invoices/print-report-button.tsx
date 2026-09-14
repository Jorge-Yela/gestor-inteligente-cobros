"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return (
    <Button
      type="button"
      className="bg-blue-600 hover:bg-blue-700 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Imprimir / Guardar PDF
    </Button>
  );
}
