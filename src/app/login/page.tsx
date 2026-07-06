import { redirect } from "next/navigation";

import { auth } from "@/../auth";
import { signInWithCredentials } from "@/server/actions/sign-in";

import { Button } from "@/components/ui/button";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Gestor Inteligente de Cobros</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Acceso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso temporal de desarrollo.
          </p>
        </div>

        <form action={signInWithCredentials} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="demo@gestorcobros.local"
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue="demo1234"
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>

        <div className="mt-6 rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p>Email: demo@gestorcobros.local</p>
          <p>Contraseña: demo1234</p>
        </div>
      </section>
    </main>
  );
}
