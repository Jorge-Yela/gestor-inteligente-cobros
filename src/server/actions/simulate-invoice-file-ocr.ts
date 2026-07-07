"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function simulateInvoiceFileOcr(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para procesar OCR");
  }

  const organizationId = await getCurrentOrganizationId();
  const fileId = String(formData.get("fileId") || "");

  if (!fileId) {
    throw new Error("File id is required");
  }

  const file = await prisma.invoiceFile.findFirst({
    where: {
      id: fileId,
      organizationId,
    },
  });

  if (!file) {
    throw new Error("Invoice file not found");
  }

  const extractedText = `FACTURA FAC-OCR-2026-001
Cliente: Cliente OCR Demo SL
NIF: B98765432
Email: administracion@clienteocr.local
Fecha factura: 2026-07-01
Importe total: 1.250,00 EUR

Esta lectura es simulada para desarrollar el flujo de revision.`;

  await prisma.invoiceFile.update({
    where: {
      id: file.id,
    },
    data: {
      status: InvoiceFileStatus.OCR_COMPLETED,
      extractedText,
      extractedData: {
        invoiceNumber: "FAC-OCR-2026-001",
        customerName: "Cliente OCR Demo SL",
        customerTaxId: "B98765432",
        customerEmail: "administracion@clienteocr.local",
        issueDate: "2026-07-01",
        amountCents: 125000,
        currency: "EUR",
      },
    },
  });

  revalidatePath("/invoice-files");
  revalidatePath(`/invoice-files/${file.id}`);

  redirect(`/invoice-files/${file.id}`);
}
