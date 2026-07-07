"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function updateInvoiceControlDate(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const invoiceId = String(formData.get("invoiceId") || "");
  const controlDateValue = String(formData.get("controlDate") || "");

  if (!invoiceId) {
    throw new Error("Invoice id is required");
  }

  if (!controlDateValue) {
    throw new Error("Control date is required");
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

  const controlDate = new Date(`${controlDateValue}T00:00:00.000Z`);

  await prisma.$transaction([
    prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        dueDate: controlDate,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        type: TimelineEventType.INVOICE_UPDATED,
        title: "Fecha de control actualizada",
        description: `Nueva fecha de control: ${controlDateValue}.`,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/customers");

  redirect(`/invoices/${invoice.id}`);
}
