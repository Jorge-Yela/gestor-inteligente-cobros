import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createStripeCheckoutSession } from "@/server/actions/create-stripe-checkout-session";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

type BillingPageProps = {
  searchParams?: Promise<{
    success?: string;
    canceled?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const organizationId = await getCurrentOrganizationId();
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });
  const subscriptionActive = organization?.subscriptionStatus === "active" || organization?.subscriptionStatus === "trialing";
  const pageTitle =
    organization?.subscriptionStatus === "trialing"
      ? "Período de prueba activo"
      : organization?.subscriptionStatus === "active"
        ? "Suscripción activa"
        : "Activa tu prueba gratuita";
  const pageDescription =
    organization?.subscriptionStatus === "trialing"
      ? "Tu cuenta está en período de prueba. Podrás usar NORVALOR sin cargo hasta que finalicen los 20 días."
      : organization?.subscriptionStatus === "active"
        ? "Tu suscripción mensual está activa. Puedes seguir usando NORVALOR con normalidad."
        : "Activa tu prueba gratuita de 20 días. No se realizará ningún cargo hasta que termine el período de prueba.";
  const planLabel =
    organization?.subscriptionStatus === "active"
      ? "Plan mensual activo"
      : "Plan mensual · 20 días gratis";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
          <Image
            src="/norvalor-logo.png"
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 object-contain"
            priority
          />
          <div>
            <p className="text-2xl font-bold">NORVALOR</p>
            <p className="text-sm text-slate-600">Gestión inteligente de cobros</p>
          </div>
        </div>
        <div>
          {subscriptionActive ? (
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              Ir a Inicio
            </Link>
          ) : null}
          <h1 className={`${subscriptionActive ? "mt-3" : ""} text-3xl font-bold tracking-normal`}>{pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            {pageDescription}
          </p>
        </div>

        {params?.success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
            Pago de prueba completado correctamente.
          </div>
        ) : null}

        {params?.canceled ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            Has cancelado el proceso de suscripción.
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CreditCard className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{planLabel}</p>
                <h2 className="mt-1 text-2xl font-bold">NORVALOR</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Acceso mensual a la gestión de clientes, facturas, reclamaciones, tareas del día e informes.
                </p>
              </div>
            </div>

            {subscriptionActive ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                {organization?.subscriptionStatus === "trialing" ? "Período de prueba activo" : "Suscripción activa"}
                {organization?.subscriptionCurrentPeriodEnd ? (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    Activa hasta el {organization.subscriptionCurrentPeriodEnd.toLocaleDateString("es-ES")}
                  </p>
                ) : null}
              </div>
            ) : (
              <form action={createStripeCheckoutSession}>
                <Button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                  Empezar prueba gratuita
                </Button>
              </form>
            )}
          </div>

          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
            {[
              "Panel inteligente de cobros",
              "Reclamaciones y avisos personalizados",
              "Informes financieros",
              "Seguimiento por cliente y factura",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="size-4 text-emerald-600" />
                {feature}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
