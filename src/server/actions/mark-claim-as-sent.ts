"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ClaimDraftStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { prisma } from "@/lib/db/prisma";

export async function markClaimAsSent(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const claimId = String(formData.get("claimId") || "");

  if (!claimId) {
    throw new Error("Claim id is required");
  }

  const claim = await prisma.claimDraft.findFirst({
    where: {
      id: claimId,
      organizationId,
    },
  });

  if (!claim) {
    throw new Error("Claim not found");
  }

  await prisma.$transaction([
    prisma.claimDraft.update({
      where: {
        id: claim.id,
      },
      data: {
        status: ClaimDraftStatus.SENT,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId,
        invoiceId: claim.invoiceId,
        type: TimelineEventType.INVOICE_UPDATED,
        title: "Reclamacion marcada como enviada",
        description: "Registro manual. No se envio ningun email desde la plataforma.",
      },
    }),
  ]);

  revalidatePath("/claim-drafts");
  revalidatePath(`/invoices/${claim.invoiceId}`);
  revalidatePath("/timeline");

  redirect("/claim-drafts");
}
