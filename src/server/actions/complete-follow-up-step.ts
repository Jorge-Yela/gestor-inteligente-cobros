"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  FollowUpPlanStatus,
  FollowUpStepStatus,
  TimelineEventType,
} from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function completeFollowUpStep(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const stepId = String(formData.get("stepId") || "");

  if (!stepId) {
    throw new Error("Step id is required");
  }

  const step = await prisma.followUpStep.findFirst({
    where: {
      id: stepId,
      plan: {
        organizationId,
      },
    },
    include: {
      plan: true,
    },
  });

  if (!step) {
    throw new Error("Follow up step not found");
  }

  const remainingPendingSteps = await prisma.followUpStep.count({
    where: {
      planId: step.planId,
      id: {
        not: step.id,
      },
      status: {
        not: FollowUpStepStatus.DONE,
      },
    },
  });

  const shouldCompletePlan = remainingPendingSteps === 0;

  await prisma.$transaction([
    prisma.followUpStep.update({
      where: {
        id: step.id,
      },
      data: {
        status: FollowUpStepStatus.DONE,
      },
    }),
    ...(shouldCompletePlan
      ? [
          prisma.followUpPlan.update({
            where: {
              id: step.planId,
            },
            data: {
              status: FollowUpPlanStatus.COMPLETED,
            },
          }),
        ]
      : []),
    prisma.timelineEvent.create({
      data: {
        organizationId,
        invoiceId: step.plan.invoiceId,
        type: TimelineEventType.INVOICE_UPDATED,
        title: shouldCompletePlan
          ? "Plan de seguimiento completado"
          : "Tarea de seguimiento completada",
        description: step.title,
      },
    }),
  ]);

  revalidatePath("/follow-ups");
  revalidatePath(`/invoices/${step.plan.invoiceId}`);
  revalidatePath("/timeline");

  redirect("/follow-ups");
}
