"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function registerInvoiceCall(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

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
    select: {
      id: true,
      customerId: true,
    },
  });

  if (!invoice) {
    throw new Error("Factura no encontrada");
  }

  await prisma.timelineEvent.create({
    data: {
      organizationId,
      invoiceId: invoice.id,
      type: TimelineEventType.NOTE_ADDED,
      title: "Llamada realizada",
      description: "Se registro una llamada de seguimiento relacionada con esta factura.",
    },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath(`/customers/${invoice.customerId}`);

  redirect(`/invoices/${invoice.id}`);
}
