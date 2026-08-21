import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { updateCustomer } from "@/server/actions/update-customer";

type EditCustomerPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const organizationId = await getCurrentOrganizationId();
  const { customerId } = await params;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    include: {
      contacts: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-slate-500 hover:text-blue-600">
            Volver al cliente
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Editar cliente</h1>
          <p className="mt-2 text-slate-500">
            Actualiza los datos principales de {customer.name}.
          </p>
        </div>

        <form action={updateCustomer} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="customerId" value={customer.id} />

          <div className="grid gap-5">
            <Field label="Nombre de empresa" name="name" required defaultValue={customer.name} />
            <Field label="CIF/NIF" name="taxId" defaultValue={customer.taxId || ""} />
            <Field label="Persona de contacto" name="contactName" defaultValue={customer.contactName || ""} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email" name="email" type="email" defaultValue={customer.email || ""} />
              <Field label="Telefono" name="phone" defaultValue={customer.phone || ""} />
            </div>

            <Field label="Direccion" name="address" defaultValue={customer.address || ""} />

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-semibold">Contactos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Puedes editar contactos existentes y dejar filas vacias para no guardarlas.
              </p>

              <div className="mt-4 space-y-4">
                {[...customer.contacts, null, null].map((contact, index) => (
                  <div key={contact?.id || `new-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
                    <input type="hidden" name="contactId" value={contact?.id || ""} />
                    <Field label="Nombre" name="contactNameList" defaultValue={contact?.name || ""} />
                    <Field label="Email" name="contactEmail" type="email" defaultValue={contact?.email || ""} />
                    <Field label="Telefono" name="contactPhone" defaultValue={contact?.phone || ""} />
                  </div>
                ))}
              </div>
            </section>

            <div>
              <label className="text-sm font-medium" htmlFor="notes">
                Notas internas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={customer.notes || ""}
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
            <Button asChild variant="outline" className="rounded-lg border-slate-200">
              <Link href={`/customers/${customer.id}`}>Cancelar</Link>
            </Button>
            <Button type="submit" className="bg-blue-600 shadow-sm hover:bg-blue-700">
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}
