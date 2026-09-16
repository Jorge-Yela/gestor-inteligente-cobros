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
      ? "Periodo de prueba activo"
      : organization?.subscriptionStatus === "active"
        ? "Suscripcion activa"
        : "Activa tu prueba gratuita";
  const pageDescription =
    organization?.subscriptionStatus === "trialing"
      ? "Tu cuenta esta en periodo de prueba. Podras usar NORVALOR sin cargo hasta que finalicen los 20 dias."
      : organization?.subscriptionStatus === "active"
        ? "Tu suscripcion mensual esta activa. Puedes seguir usando NORVALOR con normalidad."
        : "Activa tu prueba gratuita de 20 dias. No se realizara ningun cargo hasta que termine el periodo de prueba.";
  const planLabel =
    organization?.subscriptionStatus === "active"
      ? "Plan mensual activo"
      : "Plan mensual · 20 dias gratis";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div>
          {subscriptionActive ? (
            <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
              Ir al panel de control
            </Link>
          ) : null}
          <h1 className={`${subscriptionActive ? "mt-3" : ""} text-3xl font-bold tracking-tight`}>{pageTitle}</h1>
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
            Has cancelado el proceso de suscripcion.
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CreditCard className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{planLabel}</p>
                <h2 className="mt-1 text-2xl font-bold">NORVALOR</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Acceso mensual a la gestion de clientes, facturas, reclamaciones, tareas del dia e informes.
                </p>
              </div>
            </div>

            {subscriptionActive ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {organization?.subscriptionStatus === "trialing" ? "Periodo de prueba activo" : "Suscripcion activa"}
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
