import { redirect } from "next/navigation";

import { OrganizationRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";

export async function getCurrentUserRole() {
  const user = await getCurrentUser();

  if (!user.email) {
    redirect("/login");
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      user: {
        email: user.email,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!membership) {
    redirect("/login");
  }

  return membership.role;
}

export function canManageData(role: OrganizationRole) {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN || role === OrganizationRole.MEMBER;
}

export function canManageSettings(role: OrganizationRole) {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export function canViewData(role: OrganizationRole) {
  return (
    role === OrganizationRole.OWNER ||
    role === OrganizationRole.ADMIN ||
    role === OrganizationRole.MEMBER ||
    role === OrganizationRole.VIEWER
  );
}
