"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  InvoiceStatus,
  PaymentStatus,
  TimelineEventType,
} from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

function parseAmountToCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El importe no es valido");
  }

  return Math.round(amount * 100);
}

export async function createInvoiceFromOcr(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para crear seguimientos");
  }

  const organizationId = await getCurrentOrganizationId();

  const fileId = String(formData.get("fileId") || "");
  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim();
  const issueDateValue = String(formData.get("issueDate") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const customerTaxId = String(formData.get("customerTaxId") || "").trim();
  const customerEmail = String(formData.get("customerEmail") || "").trim();
  const amountValue = String(formData.get("amount") || "").trim();
  const currency = String(formData.get("currency") || "EUR").trim().toUpperCase();

  if (!fileId) {
    throw new Error("File id is required");
  }

  if (!invoiceNumber || !customerName || !amountValue) {
    throw new Error("Faltan datos obligatorios para crear el seguimiento");
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

  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber,
    },
  });

  if (existingInvoice) {
    redirect(`/invoice-files/${fileId}/review?error=duplicate-invoice`);
  }

  const amountCents = parseAmountToCents(amountValue);
  const issueDate = issueDateValue ? new Date(`${issueDateValue}T00:00:00.000Z`) : null;

  const invoice = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: {
        id: await findExistingCustomerId(organizationId, customerTaxId, customerEmail),
      },
      update: {
        name: customerName,
        taxId: customerTaxId || null,
        email: customerEmail || null,
      },
      create: {
        organizationId,
        name: customerName,
        taxId: customerTaxId || null,
        email: customerEmail || null,
      },
    });

    const createdInvoice = await tx.invoice.create({
      data: {
        organizationId,
        customerId: customer.id,
        invoiceNumber,
        issueDate,
        amountCents,
        currency,
        status: InvoiceStatus.PENDING_REVIEW,
        paymentStatus: PaymentStatus.UNPAID,
        notes: "Seguimiento creado desde revision OCR.",
      },
    });

    await tx.invoiceFile.update({
      where: {
        id: file.id,
      },
      data: {
        invoiceId: createdInvoice.id,
      },
    });

    await tx.timelineEvent.create({
      data: {
        organizationId,
        invoiceId: createdInvoice.id,
        type: TimelineEventType.INVOICE_CREATED,
        title: "Seguimiento creado desde OCR",
        description: "El usuario reviso los datos OCR y creo el seguimiento de la factura.",
      },
    });

    return createdInvoice;
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/invoice-files");
  revalidatePath(`/invoice-files/${file.id}`);
  revalidatePath(`/invoice-files/${file.id}/review`);

  redirect(`/invoices/${invoice.id}`);
}

async function findExistingCustomerId(
  organizationId: string,
  taxId: string,
  email: string
) {
  const customer = await prisma.customer.findFirst({
    where: {
      organizationId,
      OR: [
        ...(taxId ? [{ taxId }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
    select: {
      id: true,
    },
  });

  return customer?.id || "__create_new_customer__";
}
