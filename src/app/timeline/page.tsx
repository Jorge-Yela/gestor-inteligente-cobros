import Link from "next/link";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatEventType(type: string) {
  const labels: Record<string, string> = {
    INVOICE_CREATED: "Factura creada",
    INVOICE_UPDATED: "Factura actualizada",
    INVOICE_MARKED_PAID: "Factura cobrada",
    CUSTOMER_CREATED: "Cliente creado",
    NOTE_ADDED: "Nota o borrador",
  };

  return labels[type] || type;
}

export default async function TimelinePage() {
  const organizationId = await getCurrentOrganizationId();

  const events = await prisma.timelineEvent.findMany({
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
      user: true,
    },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Cronologia</h1>
          <p className="mt-2 text-muted-foreground">
            Actividad reciente de facturas, clientes, notas y borradores.
          </p>
        </div>

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Actuaciones recientes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Registro interno de actividad. No implica ningun envio automatico.
            </p>
          </div>

          {events.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted-foreground">
              Todavia no hay actuaciones registradas.
            </p>
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <article key={event.id} className="grid gap-4 px-5 py-5 md:grid-cols-[180px_1fr_auto]">
                  <div className="text-sm text-muted-foreground">{formatDate(event.createdAt)}</div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                        {formatEventType(event.type)}
                      </span>
                      {event.user ? (
                        <span className="text-xs text-muted-foreground">{event.user.email}</span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 font-medium">{event.title}</h3>
                    {event.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                    ) : null}

                    {event.invoice ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {event.invoice.invoiceNumber} · {event.invoice.customer.name}
                      </p>
                    ) : null}
                  </div>

                  {event.invoice ? (
                    <div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/invoices/${event.invoice.id}`}>Ver factura</Link>
                      </Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
