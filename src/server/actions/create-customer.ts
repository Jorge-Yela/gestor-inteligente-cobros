"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCustomerSchema } from "@/modules/customers/schemas/customer.schema";
import { prisma } from "@/lib/db/prisma";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function createCustomer(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const invoiceFileId = String(formData.get("invoiceFileId") || "");
  const result = createCustomerSchema.safeParse({
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    contactName: formData.get("contactName"),
    address: formData.get("address"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    throw new Error("Customer form is invalid");
  }

  const customer = await prisma.customer.create({
    data: {
      organizationId,
      name: result.data.name,
      taxId: result.data.taxId,
      contactName: result.data.contactName,
      address: result.data.address,
      email: result.data.email,
      phone: result.data.phone,
      notes: result.data.notes,
    },
  });

  if (invoiceFileId) {
    await prisma.invoiceFile.updateMany({
      where: {
        id: invoiceFileId,
        organizationId,
      },
      data: {
        customerId: customer.id,
      },
    });
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customer.id}`);
  revalidatePath("/invoice-files/import-review");
  revalidatePath("/");

  if (invoiceFileId) {
    redirect(`/invoice-files/import-review?fileIds=${invoiceFileId}`);
  }

  redirect("/customers");
}