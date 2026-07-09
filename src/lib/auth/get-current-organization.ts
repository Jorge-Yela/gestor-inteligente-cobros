import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

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
