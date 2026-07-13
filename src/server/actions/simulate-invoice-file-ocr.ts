"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { readInvoiceFileData } from "@/server/services/read-invoice-file-data";

export async function simulateInvoiceFileOcr(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para leer datos del PDF");
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

  const reading = await readInvoiceFileData({
    fileName: file.fileName,
    fileUrl: file.fileUrl,
  });

  await prisma.invoiceFile.update({
    where: {
      id: file.id,
    },
    data: {
      status: InvoiceFileStatus.OCR_COMPLETED,
      extractedText: reading.extractedText,
      extractedData: reading.extractedData,
    },
  });

  revalidatePath("/invoice-files");
  revalidatePath(`/invoice-files/${file.id}`);

  redirect(`/invoice-files/${file.id}`);
}
