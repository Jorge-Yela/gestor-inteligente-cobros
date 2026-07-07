"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageSettings, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function updateOrganizationSettings(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageSettings(currentRole)) {
    throw new Error("No tienes permisos para modificar los ajustes");
  }

  const organizationId = await getCurrentOrganizationId();

  const name = String(formData.get("name") || "").trim();
  const taxId = String(formData.get("taxId") || "").trim();
  const billingEmail = String(formData.get("billingEmail") || "").trim();

  if (!name) {
    throw new Error("El nombre de la organizacion es obligatorio");
  }

  await prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      name,
      taxId: taxId || null,
      billingEmail: billingEmail || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");

  redirect("/settings");
}
