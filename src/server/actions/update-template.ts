"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TemplateTone } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { prisma } from "@/lib/db/prisma";

export async function updateTemplate(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();

  const templateId = String(formData.get("templateId") || "");
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const toneValue = String(formData.get("tone") || TemplateTone.FRIENDLY);

  if (!templateId) {
    throw new Error("Template id is required");
  }

  if (!name || !subject || !body) {
    redirect(`/templates/${templateId}?error=missing-fields`);
  }

  const validTones = Object.values(TemplateTone);
  const tone = validTones.includes(toneValue as TemplateTone)
    ? (toneValue as TemplateTone)
    : TemplateTone.FRIENDLY;

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
      name,
      subject,
      body,
      tone,
    },
  });

  revalidatePath("/templates");
  revalidatePath(`/templates/${template.id}`);

  redirect("/templates");
}
