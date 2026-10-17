import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveSubscription } from "@/lib/billing/require-active-subscription";

export async function getCurrentOrganizationId() {
  const user = await getCurrentUser();

  if (!user.email) {
    redirect("/login");
  }

  const organizationMember = await prisma.organizationMember.findFirst({
    where: {
      user: {
        email: user.email,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!organizationMember) {
    redirect("/login");
  }

  return organizationMember.organizationId;
}

export async function getSubscribedOrganizationId() {
  const organizationId = await getCurrentOrganizationId();
  await requireActiveSubscription(organizationId);

  return organizationId;
}
