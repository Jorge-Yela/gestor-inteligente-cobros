"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function deleteTemplate(formData: FormData) {
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

  await prisma.$transaction([
    prisma.claimDraft.updateMany({
      where: {
        templateId: template.id,
        organizationId,
      },
      data: {
        templateId: null,
      },
    }),
    prisma.template.delete({
      where: {
        id: template.id,
      },
    }),
  ]);

  revalidatePath("/templates");
  revalidatePath("/templates/archived");
  revalidatePath("/claim-drafts");

  redirect("/templates");
}
