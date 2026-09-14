"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { InvoiceStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

function parseOptionalDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

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

export async function updateInvoice(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();

  const invoiceId = String(formData.get("invoiceId") || "");
  const customerId = String(formData.get("customerId") || "");
  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim();
  const amount = String(formData.get("amount") || "").trim();
  const issueDate = String(formData.get("issueDate") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!invoiceId || !customerId || !invoiceNumber || !amount) {
    redirect(`/invoices/${invoiceId}/edit?error=invalid-form`);
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
    },
  });

  if (!invoice) {
    redirect("/invoices");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
  });

  if (!customer) {
    redirect(`/invoices/${invoiceId}/edit?error=customer-not-found`);
  }

  const duplicateInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber,
      id: {
        not: invoice.id,
      },
    },
  });

  if (duplicateInvoice) {
    redirect(`/invoices/${invoiceId}/edit?error=duplicate-invoice`);
  }

  await prisma.invoice.update({
    where: {
      id: invoice.id,
    },
    data: {
      customerId: customer.id,
      invoiceNumber,
      amountCents: parseAmountToCents(amount),
      issueDate: parseOptionalDate(issueDate),
      dueDate: parseOptionalDate(controlDate),
      status: controlDate ? InvoiceStatus.ACTIVE : InvoiceStatus.PENDING_REVIEW,
      notes,
      timelineEvents: {
        create: {
          organizationId,
          type: TimelineEventType.INVOICE_UPDATED,
          title: "Factura actualizada",
          description: "Se actualizaron manualmente los detalles de la factura.",
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath(`/invoices/${invoice.id}/edit`);
  revalidatePath(`/customers/${customer.id}`);

  redirect(`/invoices/${invoice.id}`);
}
