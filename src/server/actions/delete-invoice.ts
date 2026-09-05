"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function deleteInvoice(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para borrar facturas");
  }

  const organizationId = await getCurrentOrganizationId();
  const invoiceId = String(formData.get("invoiceId") || "");

  if (!invoiceId) {
    throw new Error("Falta la factura");
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

  await prisma.invoice.delete({
    where: {
      id: invoice.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/customers");
  revalidatePath(`/customers/${invoice.customerId}`);
  revalidatePath("/customer-stats");

  redirect("/invoices");
}
