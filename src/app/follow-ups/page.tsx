import Link from "next/link";

import {
  FollowUpPlanStatus,
  FollowUpStepStatus,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { completeFollowUpStep } from "@/server/actions/complete-follow-up-step";
import { reopenFollowUpStep } from "@/server/actions/reopen-follow-up-step";
import { updateFollowUpPlanStatus } from "@/server/actions/update-follow-up-plan-status";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Sin fecha";
}

function formatPlanStatus(status: FollowUpPlanStatus) {
  const labels: Record<FollowUpPlanStatus, string> = {
    ACTIVE: "Activo",
    PAUSED: "Pausado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

function formatStepStatus(status: FollowUpStepStatus) {
  const labels: Record<FollowUpStepStatus, string> = {
    PENDING: "Pendiente",
    DONE: "Hecho",
    SKIPPED: "Omitido",
  };

  return labels[status];
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

export default async function FollowUpsPage() {
  const organizationId = await getCurrentOrganizationId();
  const today = startOfToday();

  const [plans, invoicesWithoutPlan] = await Promise.all([
    prisma.followUpPlan.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
        steps: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        paymentStatus: PaymentStatus.UNPAID,
        followUpPlan: null,
      },
      orderBy: {
        dueDate: "asc",
      },
      include: {
        customer: true,
      },
    }),
  ]);

  const pendingSteps = plans.flatMap((plan) =>
    plan.steps.filter((step) => step.status === FollowUpStepStatus.PENDING),
  );

  const overdueSteps = pendingSteps.filter(
    (step) => step.dueDate && step.dueDate < today,
  );

  const activePlans = plans.filter((plan) => plan.status === FollowUpPlanStatus.ACTIVE);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Seguimientos</h1>
          <p className="mt-2 text-muted-foreground">
            Planes y tareas internas para decidir que hacer con cada factura.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Planes activos</p>
            <p className="mt-3 text-3xl font-semibold">{activePlans.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Seguimientos abiertos</p>
          </article>
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Tareas pendientes</p>
            <p className="mt-3 text-3xl font-semibold">{pendingSteps.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Acciones internas por revisar</p>
          </article>
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Tareas vencidas</p>
            <p className="mt-3 text-3xl font-semibold">{overdueSteps.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Requieren atencion</p>
          </article>
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Sin plan</p>
            <p className="mt-3 text-3xl font-semibold">{invoicesWithoutPlan.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Facturas pendientes sin seguimiento</p>
          </article>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Planes de seguimiento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada plan contiene tareas internas. No se envia ninguna comunicacion automaticamente.
            </p>
          </div>

          {plans.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted-foreground">
              Todavia no hay planes creados.
            </p>
          ) : (
            <div className="divide-y">
              {plans.map((plan) => (
                <article key={plan.id} className="p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{plan.invoice.invoiceNumber}</h3>
                        <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                          {formatPlanStatus(plan.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {plan.invoice.customer.name} · {formatAmount(plan.invoice.amountCents)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/invoices/${plan.invoice.id}`}>Ver factura</Link>
                      </Button>

                      {plan.status === FollowUpPlanStatus.ACTIVE ? (
                        <form action={updateFollowUpPlanStatus}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input type="hidden" name="status" value={FollowUpPlanStatus.PAUSED} />
                          <Button type="submit" variant="outline" size="sm">
                            Pausar
                          </Button>
                        </form>
                      ) : null}

                      {plan.status === FollowUpPlanStatus.PAUSED ? (
                        <form action={updateFollowUpPlanStatus}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input type="hidden" name="status" value={FollowUpPlanStatus.ACTIVE} />
                          <Button type="submit" variant="outline" size="sm">
                            Reactivar
                          </Button>
                        </form>
                      ) : null}

                      {plan.status !== FollowUpPlanStatus.CANCELLED ? (
                        <form action={updateFollowUpPlanStatus}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input type="hidden" name="status" value={FollowUpPlanStatus.CANCELLED} />
                          <Button type="submit" variant="outline" size="sm">
                            Cancelar
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {plan.steps.map((step) => (
                      <div key={step.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">{step.title}</p>
                          <span className="rounded-md border px-2 py-0.5 text-xs">
                            {formatStepStatus(step.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {step.notes || "Sin notas"}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Fecha: {formatDate(step.dueDate)}
                        </p>
                        {step.status === FollowUpStepStatus.PENDING ? (
                          <form action={completeFollowUpStep} className="mt-4">
                            <input type="hidden" name="stepId" value={step.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Marcar hecho
                            </Button>
                          </form>
                        ) : (
                          <form action={reopenFollowUpStep} className="mt-4">
                            <input type="hidden" name="stepId" value={step.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Reabrir
                            </Button>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Facturas pendientes sin plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Puedes crear el plan entrando en el detalle de cada factura.
            </p>
          </div>

          {invoicesWithoutPlan.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted-foreground">
              Todas las facturas pendientes tienen plan o no hay facturas pendientes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Fecha control</th>
                    <th className="px-5 py-3 font-medium">Importe</th>
                    <th className="px-5 py-3 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoicesWithoutPlan.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-5 py-4 font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-5 py-4">{invoice.customer.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                      <td className="px-5 py-4 font-medium">{formatAmount(invoice.amountCents)}</td>
                      <td className="px-5 py-4">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/invoices/${invoice.id}`}>Crear plan</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
