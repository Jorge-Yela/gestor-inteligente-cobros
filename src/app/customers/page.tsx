import Link from "next/link";

import { PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatAmount(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

export default async function CustomersPage() {
  const organizationId = await getCurrentOrganizationId();

  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      invoices: true,
    },
  });

  const rows = customers.map((customer) => {
    const unpaidInvoices = customer.invoices.filter(
      (invoice) => invoice.paymentStatus === PaymentStatus.UNPAID,
    );

    const pendingAmountCents = unpaidInvoices.reduce(
      (total, invoice) => total + invoice.amountCents,
      0,
    );

    return {
      id: customer.id,
      name: customer.name,
      contactName: customer.contactName || "Sin contacto",
      email: customer.email || "Sin email",
      phone: customer.phone || "Sin telefono",
      invoiceCount: customer.invoices.length,
      pendingAmount: formatAmount(pendingAmountCents),
    };
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Volver al dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Clientes</h1>
            <p className="mt-2 text-muted-foreground">
              Empresas y contactos asociados a facturas en seguimiento.
            </p>
          </div>

          <Button asChild>
            <Link href="/customers/new">Nuevo cliente</Link>
          </Button>
        </div>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Clientes controlados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Datos iniciales cargados desde PostgreSQL mediante Prisma.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Contacto</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Telefono</th>
                  <th className="px-5 py-3 font-medium">Facturas</th>
                  <th className="px-5 py-3 font-medium">Pendiente</th>
                  <th className="px-5 py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-5 py-4 font-medium">{customer.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{customer.contactName}</td>
                    <td className="px-5 py-4 text-muted-foreground">{customer.email}</td>
                    <td className="px-5 py-4 text-muted-foreground">{customer.phone}</td>
                    <td className="px-5 py-4">{customer.invoiceCount}</td>
                    <td className="px-5 py-4 font-medium">{customer.pendingAmount}</td>
                    <td className="px-5 py-4">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/customers/${customer.id}`}>Ver detalle</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
