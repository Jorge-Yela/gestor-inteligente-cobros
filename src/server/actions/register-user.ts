"use server";

import { hash } from "bcryptjs";
import { signIn } from "@/../auth";
import { redirect } from "next/navigation";

import { OrganizationRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

export async function registerUser(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const organizationName = String(formData.get("organizationName") || "").trim();

  if (!name || !email || !password || !organizationName) {
    redirect("/register?error=missing-fields");
  }

  if (password.length < 8) {
    redirect("/register?error=weak-password");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    redirect("/register?error=user-exists");
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        billingEmail: email,
      },
    });

    await tx.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: OrganizationRole.OWNER,
      },
    });
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/settings/billing",
  });
}
