"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

export async function markInvoiceAsPaid(formData: FormData) {
  const organizationId = await getCurrentOrganizationId();
  const invoiceId = String(formData.get("invoiceId") || "");

  if (!invoiceId) {
    throw new Error("Invoice id is required");
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  await prisma.$transaction([
    prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: InvoiceStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        type: TimelineEventType.INVOICE_MARKED_PAID,
        title: "Factura marcada como cobrada",
        description: "El usuario marco manualmente la factura como cobrada.",
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/customers");

  redirect(`/invoices/${invoice.id}`);
}
