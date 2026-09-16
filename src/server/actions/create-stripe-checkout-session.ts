"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function createStripeCheckoutSession() {
  const organizationId = await getCurrentOrganizationId();
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    throw new Error("Faltan variables de entorno de Stripe");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
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
