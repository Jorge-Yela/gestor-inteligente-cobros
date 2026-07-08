"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { prisma } from "@/lib/db/prisma";

export async function archiveTemplate(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const templateId = String(formData.get("templateId") || "");

  if (!templateId) {
    throw new Error("Template id is required");
  }

  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      organizationId,
    },
  });

  if (!template) {
    throw new Error("Template not found");
  }

  await prisma.template.update({
    where: {
      id: template.id,
    },
    data: {
      archivedAt: new Date(),
    },
  });

  revalidatePath("/templates");

  redirect("/templates");
}
