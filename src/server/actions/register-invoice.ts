"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

function parseOptionalDate(value: string) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function parseAmountToCents(value: string) {
  const normalizedValue = value.replace(",", ".").trim();
  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  return Math.round(amount * 100);
}

export async function registerInvoice(formData: FormData) {
  const customerId = String(formData.get("customerId") || "");
  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim();
  const amount = String(formData.get("amount") || "");
  const issueDate = String(formData.get("issueDate") || "");
  const controlDate = String(formData.get("controlDate") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!customerId) {
    throw new Error("Customer is required");
  }

  if (!invoiceNumber) {
    throw new Error("Invoice number is required");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: "demo-organization",
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: "demo-organization",
      customerId: customer.id,
      invoiceNumber,
      amountCents: parseAmountToCents(amount),
      issueDate: parseOptionalDate(issueDate),
      dueDate: parseOptionalDate(controlDate),
      status: controlDate ? InvoiceStatus.ACTIVE : InvoiceStatus.PENDING_REVIEW,
      paymentStatus: PaymentStatus.UNPAID,
      notes: notes || null,
      timelineEvents: {
        create: {
          organizationId: "demo-organization",
          type: TimelineEventType.INVOICE_CREATED,
          title: "Factura registrada para seguimiento",
          description: "Se registro una factura existente para controlar su cobro.",
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/follow-ups");
  revalidatePath(`/customers/${customer.id}`);

  redirect(`/invoices/${invoice.id}`);
}
