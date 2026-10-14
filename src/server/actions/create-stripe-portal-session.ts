"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageSettings, getCurrentUserRole } from "@/lib/permissions/current-role";
import { prisma } from "@/lib/db/prisma";

export async function createStripePortalSession() {
  const role = await getCurrentUserRole();

  if (!canManageSettings(role)) {
    throw new Error("No tienes permisos para gestionar la suscripcion");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Falta la clave de Stripe");
  }

  const organizationId = await getCurrentOrganizationId();
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization?.stripeCustomerId) {
    redirect("/settings/billing");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/billing`,
  });
  redirect(session.url);
}
