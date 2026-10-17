import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

export async function requireActiveSubscription(
  organizationId: string,
  onDenied: () => never = () => redirect("/settings/billing"),
) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });

  const allowedStatuses = ["active", "trialing"];
  const cancellationExpired = Boolean(
    organization?.subscriptionCancelAtPeriodEnd &&
    organization.subscriptionCurrentPeriodEnd &&
    organization.subscriptionCurrentPeriodEnd.getTime() <= Date.now()
  );

  if (!organization?.subscriptionStatus || !allowedStatuses.includes(organization.subscriptionStatus) || cancellationExpired) {
    onDenied();
  }
}
