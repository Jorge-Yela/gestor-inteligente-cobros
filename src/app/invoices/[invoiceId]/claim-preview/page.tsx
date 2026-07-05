import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { renderTemplate } from "@/modules/templates/render-template";

import { Button } from "@/components/ui/button";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Sin fecha asignada";
  }

  return dateFormatter.format(date);
}

type ClaimPreviewPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function ClaimPreviewPage({ params }: ClaimPreviewPageProps) {
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: "demo-organization",
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const template = await prisma.template.findFirst({
    where: {
      organizationId: "demo-organization",
      isDefault: true,
    },
  });

  if (!template) {
    notFound();
  }

  const variables = {
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: formatAmount(invoice.amountCents),
    controlDate: formatDate(invoice.dueDate),
  };

  const subject = renderTemplate(template.subject, variables);
  const body = renderTemplate(template.body, variables);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <Link
            href={`/invoices/${invoice.id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Volver a la factura
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Previsualizacion de reclamacion
          </h1>
          <p className="mt-2 text-muted-foreground">
            Este borrador no se envia automaticamente. El usuario siempre decide si usarlo.
          </p>
        </div>

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">{template.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Plantilla aplicada a {invoice.customer.name}.
            </p>
          </div>

          <div className="space-y-6 p-5">
            <div>
              <p className="text-sm font-medium">Para</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {invoice.customer.email || "Cliente sin email registrado"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Asunto</p>
              <div className="mt-2 rounded-md border bg-background p-3 text-sm">
                {subject}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Mensaje</p>
              <div className="mt-2 whitespace-pre-line rounded-md border bg-background p-4 text-sm leading-6">
                {body}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-5">
              <Button asChild variant="outline">
                <Link href={`/invoices/${invoice.id}`}>Cancelar</Link>
              </Button>
              <Button disabled>Enviar mas adelante</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
