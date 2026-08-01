"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

async function getInvoiceForPaymentAction(invoiceId: string, organizationId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return invoice;
}

function revalidateInvoicePaymentPaths(invoiceId: string) {
  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/customers");
}

export async function markInvoiceAsPaid(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const invoiceId = String(formData.get("invoiceId") || "");
  const redirectTo = String(formData.get("redirectTo") || `/invoices/${invoiceId}`);

  if (!invoiceId) {
    throw new Error("Invoice id is required");
  }

  const invoice = await getInvoiceForPaymentAction(invoiceId, organizationId);

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

  revalidateInvoicePaymentPaths(invoice.id);

  redirect(redirectTo);
}

export async function unmarkInvoiceAsPaid(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const invoiceId = String(formData.get("invoiceId") || "");
  const redirectTo = String(formData.get("redirectTo") || `/invoices/${invoiceId}`);

  if (!invoiceId) {
    throw new Error("Invoice id is required");
  }

  const invoice = await getInvoiceForPaymentAction(invoiceId, organizationId);

  await prisma.$transaction([
    prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: InvoiceStatus.ACTIVE,
        paymentStatus: PaymentStatus.UNPAID,
        paidAt: null,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        type: TimelineEventType.NOTE_ADDED,
        title: "Factura desmarcada como cobrada",
        description: "El usuario corrigio manualmente el estado de cobro de la factura.",
      },
    }),
  ]);

  revalidateInvoicePaymentPaths(invoice.id);

  redirect(redirectTo);
}
