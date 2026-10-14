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
  const billingAddress = String(formData.get("billingAddress") || "").trim();
  const billingCity = String(formData.get("billingCity") || "").trim();
  const billingPostalCode = String(formData.get("billingPostalCode") || "").trim();

  if (!name) {
    throw new Error("El nombre de la organizacion es obligatorio");
  }

  if (billingAddress.length > 191 || billingCity.length > 191) {
    throw new Error("La direccion y la localidad no pueden superar 191 caracteres");
  }

  if (billingPostalCode && !/^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/.test(billingPostalCode)) {
    throw new Error("Introduce un codigo postal espanol valido de cinco digitos");
  }

  await prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      name,
      taxId: taxId || null,
      billingEmail: billingEmail || null,
      billingAddress: billingAddress || null,
      billingCity: billingCity || null,
      billingPostalCode: billingPostalCode || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");

  redirect("/settings");
}
