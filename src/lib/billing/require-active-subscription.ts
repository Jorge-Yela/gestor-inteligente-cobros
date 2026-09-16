import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

export async function requireActiveSubscription(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      subscriptionStatus: true,
    },
  });

  const allowedStatuses = ["active", "trialing"];

  if (!organization?.subscriptionStatus || !allowedStatuses.includes(organization.subscriptionStatus)) {
    redirect("/settings/billing");
  }
}
