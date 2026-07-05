import Link from "next/link";

import { createCustomer } from "@/server/actions/create-customer";

import { Button } from "@/components/ui/button";

export default function NewCustomerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <Link href="/customers" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a clientes
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Nuevo cliente</h1>
          <p className="mt-2 text-muted-foreground">
            Crea un cliente para asociarlo despues a facturas en seguimiento.
          </p>
        </div>

        <form action={createCustomer} className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="grid gap-5">
            <div>
              <label className="text-sm font-medium" htmlFor="name">
                Nombre de empresa
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Ejemplo: Acme Servicios SL"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="taxId">
                CIF/NIF
              </label>
              <input
                id="taxId"
                name="taxId"
                placeholder="Ejemplo: B12345678"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="contactName">
                Persona de contacto
              </label>
              <input
                id="contactName"
                name="contactName"
                placeholder="Ejemplo: Maria Lopez"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="administracion@cliente.com"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="phone">
                  Telefono
                </label>
                <input
                  id="phone"
                  name="phone"
                  placeholder="+34 600 000 000"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="notes">
                Notas internas
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Notas internas sobre el cliente."
                className="mt-2 min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t pt-5">
            <Button asChild variant="outline">
              <Link href="/customers">Cancelar</Link>
            </Button>
            <Button type="submit">Guardar cliente</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
