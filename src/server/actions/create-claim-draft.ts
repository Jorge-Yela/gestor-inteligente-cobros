"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

export async function createClaimDraft(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") || "");
  const templateId = String(formData.get("templateId") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!invoiceId) {
    throw new Error("Invoice id is required");
  }

  if (!subject || !body) {
    throw new Error("Claim draft content is required");
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: "demo-organization",
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  await prisma.$transaction([
    prisma.claimDraft.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        templateId: templateId || null,
        subject,
        body,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        type: TimelineEventType.NOTE_ADDED,
        title: "Borrador de reclamacion creado",
        description: "Se preparo un borrador de reclamacion. No se envio ningun email.",
      },
    }),
  ]);

  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath(`/invoices/${invoice.id}/claim-preview`);

  redirect(`/invoices/${invoice.id}`);
}
