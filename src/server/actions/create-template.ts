"use server";

import { redirect } from "next/navigation";

import { TemplateTone } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { prisma } from "@/lib/db/prisma";

export async function createTemplate(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();

  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const toneValue = String(formData.get("tone") || TemplateTone.FRIENDLY);

  if (!name || !subject || !body) {
    redirect("/templates/new?error=missing-fields");
  }

  const validTones = Object.values(TemplateTone);
  const tone = validTones.includes(toneValue as TemplateTone)
    ? (toneValue as TemplateTone)
    : TemplateTone.FRIENDLY;

  await prisma.template.create({
    data: {
      organizationId,
      name,
      subject,
      body,
      tone,
      language: "es",
      isDefault: false,
    },
  });

  redirect("/templates");
}
