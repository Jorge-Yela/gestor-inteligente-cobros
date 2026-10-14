"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { canManageSettings, getCurrentUserRole } from "@/lib/permissions/current-role";
import { prisma } from "@/lib/db/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function createStripeCheckoutSession() {
  const role = await getCurrentUserRole();

  if (!canManageSettings(role)) {
    throw new Error("No tienes permisos para gestionar la suscripcion");
  }

  const organizationId = await getCurrentOrganizationId();
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    throw new Error("Faltan variables de entorno de Stripe");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (
    organization?.subscriptionStatus === "active" ||
    organization?.subscriptionStatus === "trialing"
  ) {
    redirect("/settings/billing");
  }

  if (
    !organization?.taxId?.trim() ||
    !organization.billingEmail?.trim() ||
    !organization.billingAddress?.trim() ||
    !organization.billingCity?.trim() ||
    !organization.billingPostalCode?.trim()
  ) {
    redirect("/settings?billingError=missing_details");
  }

  const postalCode = organization.billingPostalCode.trim();
  const validPostalCode = /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/.test(postalCode);
  const excludedProvince = ["07", "35", "38", "51", "52"].includes(postalCode.slice(0, 2));

  if (!validPostalCode || excludedProvince) {
    redirect("/settings?billingError=unsupported_region");
  }

  let customerId = organization.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create(
      { metadata: { organizationId } },
      { idempotencyKey: `organization-customer-${organizationId}` },
    );
    customerId = customer.id;

    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customerId },
    });
  }

  await stripe.customers.update(customerId, {
    name: organization.name,
    email: organization.billingEmail.trim(),
    address: {
      line1: organization.billingAddress.trim(),
      city: organization.billingCity.trim(),
      postal_code: postalCode,
      country: "ES",
    },
    metadata: {
      organizationId,
      taxId: organization.taxId.trim(),
    },
  });

  const pendingSessions = await stripe.checkout.sessions.list({
    customer: customerId,
    status: "open",
    limit: 100,
  });

  for (const pending of pendingSessions.data) {
    if (
      pending.mode !== "subscription" ||
      pending.metadata?.organizationId !== organizationId ||
      !pending.url
    ) {
      continue;
    }

    const items = await stripe.checkout.sessions.listLineItems(pending.id);
    if (items.data.length === 1 && items.data[0].price?.id === priceId) {
      redirect(pending.url);
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: organizationId,
    metadata: {
      organizationId,
    },
    subscription_data: {
      trial_period_days: 20,
      metadata: {
        organizationId,
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/settings/billing?success=1`,
    cancel_url: `${appUrl}/settings/billing?canceled=1`,
  });

  if (!session.url) {
    throw new Error("No se pudo crear la sesion de pago");
  }

  redirect(session.url);
}
