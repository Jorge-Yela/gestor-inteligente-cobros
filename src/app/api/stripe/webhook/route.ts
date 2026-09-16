import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;

  return periodEnd ? new Date(periodEnd * 1000) : null;
}

async function updateOrganizationSubscription(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  if (!organizationId) {
    return;
  }

  await prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: getSubscriptionPeriodEnd(subscription),
    },
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await updateOrganizationSubscription(event.data.object as Stripe.Subscription);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await updateOrganizationSubscription(subscription);
    }
  }

  return NextResponse.json({ received: true });
}
