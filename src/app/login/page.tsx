import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Gestor Inteligente de Cobros</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Acceso a la plataforma</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Entra para controlar facturas existentes, seguimientos, clientes y borradores de reclamacion.
          </p>
        </div>

        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@empresa.com"
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="password">
              Contrasena
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <Button className="w-full" type="button">
            Entrar
          </Button>
        </form>

        <div className="mt-6 border-t pt-5">
          <p className="text-center text-sm text-muted-foreground">
            Acceso real pendiente de configurar.{" "}
            <Link href="/" className="font-medium text-foreground hover:underline">
              Volver al dashboard
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
