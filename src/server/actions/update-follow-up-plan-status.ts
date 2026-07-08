"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  FollowUpPlanStatus,
  TimelineEventType,
} from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { prisma } from "@/lib/db/prisma";

function getTimelineTitle(status: FollowUpPlanStatus) {
  const titles: Record<FollowUpPlanStatus, string> = {
    ACTIVE: "Plan de seguimiento reactivado",
    PAUSED: "Plan de seguimiento pausado",
    COMPLETED: "Plan de seguimiento completado",
    CANCELLED: "Plan de seguimiento cancelado",
  };

  return titles[status];
}

export async function updateFollowUpPlanStatus(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const planId = String(formData.get("planId") || "");
  const status = String(formData.get("status") || "") as FollowUpPlanStatus;

  if (!planId) {
    throw new Error("Plan id is required");
  }

  if (!Object.values(FollowUpPlanStatus).includes(status)) {
    throw new Error("Invalid plan status");
  }

  const plan = await prisma.followUpPlan.findFirst({
    where: {
      id: planId,
      organizationId,
    },
  });

  if (!plan) {
    throw new Error("Follow up plan not found");
  }

  await prisma.$transaction([
    prisma.followUpPlan.update({
      where: {
        id: plan.id,
      },
      data: {
        status,
      },
    }),
    prisma.timelineEvent.create({
      data: {
        organizationId,
        invoiceId: plan.invoiceId,
        type: TimelineEventType.INVOICE_UPDATED,
        title: getTimelineTitle(status),
      },
    }),
  ]);

  revalidatePath("/follow-ups");
  revalidatePath(`/invoices/${plan.invoiceId}`);
  revalidatePath("/timeline");

  redirect("/follow-ups");
}
