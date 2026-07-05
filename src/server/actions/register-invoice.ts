"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { registerInvoiceSchema } from "@/modules/invoices/schemas/invoice.schema";

function parseOptionalDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function parseAmountToCents(value: string) {
  const normalizedValue = value.replace(",", ".").trim();
  const amount = Number(normalizedValue);

  return Math.round(amount * 100);
}

export async function registerInvoice(formData: FormData) {
  const result = registerInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    invoiceNumber: formData.get("invoiceNumber"),
    amount: formData.get("amount"),
    issueDate: formData.get("issueDate"),
    controlDate: formData.get("controlDate"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    throw new Error("Invoice registration form is invalid");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: result.data.customerId,
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
      invoiceNumber: result.data.invoiceNumber,
      amountCents: parseAmountToCents(result.data.amount),
      issueDate: parseOptionalDate(result.data.issueDate),
      dueDate: parseOptionalDate(result.data.controlDate),
      status: result.data.controlDate ? InvoiceStatus.ACTIVE : InvoiceStatus.PENDING_REVIEW,
      paymentStatus: PaymentStatus.UNPAID,
      notes: result.data.notes,
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
