"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ClaimDraftStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function createBulkClaimDrafts(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const customerId = String(formData.get("customerId") || "");
  const templateId = String(formData.get("templateId") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const gmailHref = String(formData.get("gmailHref") || "");
  const invoiceIds = formData
    .getAll("invoiceIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!customerId || invoiceIds.length === 0) {
    throw new Error("Customer and invoices are required");
  }

  if (!subject || !body || !gmailHref) {
    throw new Error("Claim content is required");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      id: {
        in: invoiceIds,
      },
      customerId,
      organizationId,
    },
  });

  if (invoices.length === 0) {
    throw new Error("No invoices found");
  }

  await prisma.$transaction([
    ...invoices.map((invoice) =>
      prisma.claimDraft.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          customerId,
          templateId: templateId || null,
          subject,
          body,
          status: ClaimDraftStatus.SENT,
        },
      }),
    ),
    ...invoices.map((invoice) =>
      prisma.timelineEvent.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          type: TimelineEventType.NOTE_ADDED,
          title: "Reclamacion conjunta preparada",
          description: "Se preparo una reclamacion conjunta para este cliente.",
        },
      }),
    ),
  ]);

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/claim-drafts");
  revalidatePath("/claim-drafts/sent");
  revalidatePath("/timeline");

  invoices.forEach((invoice) => {
    revalidatePath(`/invoices/${invoice.id}`);
  });

  redirect(gmailHref);
}
