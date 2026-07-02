"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

export async function addInvoiceNote(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") || "");
  const note = String(formData.get("note") || "").trim();

  if (!invoiceId) {
    throw new Error("Invoice id is required");
  }

  if (!note) {
    throw new Error("Note is required");
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

  const nextNotes = invoice.notes ? `${invoice.notes}\n\n${note}` : note;

  await prisma.$transaction([
    prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        notes: nextNotes,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        type: TimelineEventType.NOTE_ADDED,
        title: "Nota interna anadida",
        description: note,
      },
    }),
  ]);

  revalidatePath(`/invoices/${invoice.id}`);

  redirect(`/invoices/${invoice.id}`);
}
