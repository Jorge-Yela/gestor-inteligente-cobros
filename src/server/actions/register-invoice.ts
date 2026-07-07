"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { registerInvoiceSchema } from "@/modules/invoices/schemas/invoice.schema";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

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
  const organizationId = await getCurrentOrganizationId();
  const result = registerInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    invoiceNumber: formData.get("invoiceNumber"),
    amount: formData.get("amount"),
    issueDate: formData.get("issueDate"),
    controlDate: formData.get("controlDate"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    redirect("/invoices/new?error=invalid-form");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: result.data.customerId,
      organizationId,
    },
  });

  if (!customer) {
    redirect("/invoices/new?error=customer-not-found");
  }

  const existingInvoice = await prisma.invoice.findUnique({
    where: {
      organizationId_invoiceNumber: {
        organizationId,
        invoiceNumber: result.data.invoiceNumber,
      },
    },
  });

  if (existingInvoice) {
    redirect("/invoices/new?error=duplicate-invoice");
  }

  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
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
          organizationId,
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
