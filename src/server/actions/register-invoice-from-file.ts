"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

type ExtractedInvoiceData = {
  invoiceNumber?: string;
  issueDate?: string;
  amountCents?: number;
  currency?: string;
};

function getExtractedData(value: unknown): ExtractedInvoiceData {
  return value && typeof value === "object" ? value as ExtractedInvoiceData : {};
}

function getFallbackInvoiceNumber(fileName: string) {
  return fileName.replace(/\.pdf$/i, "").replace(/\s+/g, "-").trim();
}

async function getUniqueInvoiceNumber(organizationId: string, invoiceNumber: string) {
  const existing = await prisma.invoice.findFirst({
    where: { organizationId, invoiceNumber },
    select: { id: true },
  });

  if (!existing) {
    return invoiceNumber;
  }

  for (let index = 2; index < 100; index++) {
    const candidate = `${invoiceNumber}-${index}`;
    const duplicate = await prisma.invoice.findFirst({
      where: { organizationId, invoiceNumber: candidate },
      select: { id: true },
    });

    if (!duplicate) {
      return candidate;
    }
  }

  return `${invoiceNumber}-${Date.now()}`;
}

export async function registerInvoiceFromFile(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para registrar facturas");
  }

  const organizationId = await getCurrentOrganizationId();
  const fileId = String(formData.get("fileId") || "");

  if (!fileId) {
    throw new Error("Falta el archivo de factura");
  }

  const file = await prisma.invoiceFile.findFirst({
    where: { id: fileId, organizationId },
  });

  if (!file) {
    throw new Error("Archivo no encontrado");
  }

  if (!file.customerId) {
    redirect(`/customers/new?invoiceFileId=${file.id}`);
  }

  if (file.invoiceId) {
    redirect(`/invoices/${file.invoiceId}`);
  }

  const extractedData = getExtractedData(file.extractedData);
  const invoiceNumber = await getUniqueInvoiceNumber(
    organizationId,
    extractedData.invoiceNumber || getFallbackInvoiceNumber(file.fileName),
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
      data: {
        organizationId,
        customerId: file.customerId!,
        invoiceNumber,
        issueDate: extractedData.issueDate ? new Date(`${extractedData.issueDate}T00:00:00.000Z`) : null,
        amountCents: extractedData.amountCents || 1,
        currency: extractedData.currency || "EUR",
        status: InvoiceStatus.PENDING_REVIEW,
        paymentStatus: PaymentStatus.UNPAID,
        notes: "Factura registrada desde interpretacion IA.",
      },
    });

    await tx.invoiceFile.update({
      where: { id: file.id },
      data: {
        invoiceId: createdInvoice.id,
      },
    });

    await tx.timelineEvent.create({
      data: {
        organizationId,
        invoiceId: createdInvoice.id,
        type: TimelineEventType.INVOICE_CREATED,
        title: "Factura registrada desde IA",
        description: "La factura se registro desde la interpretacion automatica del PDF.",
      },
    });

    return createdInvoice;
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/customers");
  revalidatePath(`/customers/${invoice.customerId}`);
  revalidatePath(`/invoice-files/import-review`);

  redirect(`/invoices/${invoice.id}`);
}