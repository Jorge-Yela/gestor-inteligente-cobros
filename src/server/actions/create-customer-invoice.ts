"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

function parseAmountToCents(value: string) {
  const amount = Number(
    value
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", "."),
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El importe no es valido");
  }

  return Math.round(amount * 100);
}

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

async function getUniqueInvoiceNumber(organizationId: string, invoiceNumber: string) {
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber,
    },
    select: {
      id: true,
    },
  });

  if (!existingInvoice) {
    return invoiceNumber;
  }

  for (let index = 2; index < 100; index++) {
    const candidate = `${invoiceNumber}-${index}`;
    const duplicate = await prisma.invoice.findFirst({
      where: {
        organizationId,
        invoiceNumber: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!duplicate) {
      return candidate;
    }
  }

  return `${invoiceNumber}-${Date.now()}`;
}

export async function createCustomerInvoice(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para crear facturas");
  }

  const organizationId = await getCurrentOrganizationId();
  const customerId = String(formData.get("customerId") || "");
  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim();
  const issueDate = String(formData.get("issueDate") || "");
  const amount = String(formData.get("amount") || "");
  const notes = String(formData.get("notes") || "").trim();
  const submitAction = String(formData.get("submitAction") || "save");

  if (!customerId || !invoiceNumber || !issueDate || !amount) {
    throw new Error("Faltan datos obligatorios");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    throw new Error("Cliente no encontrado");
  }

  const uniqueInvoiceNumber = await getUniqueInvoiceNumber(organizationId, invoiceNumber);

  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
      data: {
        organizationId,
        customerId: customer.id,
        invoiceNumber: uniqueInvoiceNumber,
        issueDate: parseDate(issueDate),
        dueDate: null,
        amountCents: parseAmountToCents(amount),
        currency: "EUR",
        status: InvoiceStatus.PENDING_REVIEW,
        paymentStatus: PaymentStatus.UNPAID,
        notes: notes || null,
      },
    });

    await tx.timelineEvent.create({
      data: {
        organizationId,
        invoiceId: createdInvoice.id,
        type: TimelineEventType.INVOICE_CREATED,
        title: "Factura creada manualmente",
        description: "La factura se registro manualmente desde la ficha del cliente.",
      },
    });

    return createdInvoice;
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customer.id}`);
  revalidatePath(`/invoices/${invoice.id}`);

  if (submitAction === "save-and-new") {
    redirect(`/customers/${customer.id}/invoices/new`);
  }

  redirect(`/customers/${customer.id}`);
}
