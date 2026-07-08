"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  FollowUpStepType,
  TimelineEventType,
} from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function createFollowUpPlan(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const invoiceId = String(formData.get("invoiceId") || "");

  if (!invoiceId) {
    throw new Error("Invoice id is required");
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
    },
    include: {
      followUpPlan: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.followUpPlan) {
    redirect(`/invoices/${invoice.id}`);
  }

  const baseDate = invoice.dueDate || new Date();

  await prisma.$transaction([
    prisma.followUpPlan.create({
      data: {
        organizationId,
        invoiceId: invoice.id,
        name: "Plan de seguimiento inicial",
        steps: {
          create: [
            {
              type: FollowUpStepType.REVIEW,
              title: "Revisar estado de la factura",
              dueDate: baseDate,
              notes: "Comprobar si procede preparar reclamacion.",
            },
            {
              type: FollowUpStepType.FRIENDLY_CLAIM,
              title: "Preparar reclamacion amistosa",
              dueDate: addDays(baseDate, 3),
              notes: "Crear borrador, revisar y decidir si se envia.",
            },
            {
              type: FollowUpStepType.FIRM_CLAIM,
              title: "Preparar reclamacion firme",
              dueDate: addDays(baseDate, 10),
              notes: "Solo preparar borrador. El usuario decide si se envia.",
            },
          ],
        },
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId,
        invoiceId: invoice.id,
        type: TimelineEventType.INVOICE_UPDATED,
        title: "Plan de seguimiento creado",
        description: "Se crearon tareas internas. No se envio ninguna comunicacion.",
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/follow-ups");
  revalidatePath(`/invoices/${invoice.id}`);

  redirect(`/invoices/${invoice.id}`);
}
