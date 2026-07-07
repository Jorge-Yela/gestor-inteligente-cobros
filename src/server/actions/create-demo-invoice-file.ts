"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function createDemoInvoiceFile() {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para subir facturas");
  }

  const organizationId = await getCurrentOrganizationId();
  const timestamp = Date.now();

  await prisma.invoiceFile.create({
    data: {
      organizationId,
      fileName: `factura-demo-${timestamp}.pdf`,
      fileUrl: "https://example.com/factura-demo.pdf",
      fileKey: `demo-${timestamp}`,
      mimeType: "application/pdf",
      sizeBytes: 248000,
      status: InvoiceFileStatus.UPLOADED,
    },
  });

  revalidatePath("/invoice-files");
  revalidatePath("/invoice-files/upload");

  redirect("/invoice-files");
}
