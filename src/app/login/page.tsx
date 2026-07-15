import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { auth } from "@/../auth";
import { signInWithCredentials } from "@/server/actions/sign-in";

import { Button } from "@/components/ui/button";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[40%_60%]">
        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-16 flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-blue-200">
                N
              </div>
              <div>
                <p className="text-4xl font-bold tracking-tight text-[#071a3d]">NEXUM</p>
                <p className="text-sm font-medium text-slate-500">Invoice & Payment Management</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-9 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
              <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
                <p className="mt-3 text-sm text-slate-500">
                  Inicia sesión para continuar en NEXUM
                </p>
              </div>

              <form action={signInWithCredentials} className="mt-9 space-y-6">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-slate-800">
                    Correo electrónico
                  </label>
                  <div className="mt-2 flex h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                    <Mail className="size-5 text-slate-300" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue="demo@gestorcobros.local"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="text-sm font-medium text-slate-800">
                    Contraseña
                  </label>
                  <div className="mt-2 flex h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                    <LockKeyhole className="size-5 text-slate-300" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      defaultValue="demo1234"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-300"
                      required
                    />
                    <Eye className="size-5 text-slate-300" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-700">
                    <span className="size-5 rounded-md border border-slate-200 bg-white" />
                    Recordarme
                  </label>
                  <span className="font-medium text-blue-600">¿Olvidaste tu contraseña?</span>
                </div>

                <Button type="submit" className="h-13 w-full rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
                  Iniciar sesión
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Demo: demo@gestorcobros.local · demo1234
              </div>
            </div>

            <p className="mt-9 text-center text-sm text-slate-500">
              ¿No tienes cuenta? <span className="font-semibold text-blue-600">Crear cuenta</span>
            </p>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-100 via-[#eef5ff] to-slate-50 lg:block">
          <div className="absolute -right-24 -top-40 size-[520px] rounded-full bg-white/70" />
          <div className="absolute -bottom-40 right-0 size-[420px] rounded-full border-[70px] border-blue-100/80" />
          <div className="absolute left-16 top-28 size-32 rounded-full bg-blue-200/30" />

          <div className="relative h-full px-16 py-16">
            <div className="absolute left-28 top-24 rotate-[-10deg] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(37,99,235,0.18)]">
              <p className="text-sm font-bold text-blue-600">FACTURA</p>
              <div className="mt-5 space-y-3">
                <div className="h-3 w-36 rounded-full bg-slate-100" />
                <div className="h-3 w-28 rounded-full bg-slate-100" />
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="h-5 rounded bg-slate-100" />
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-5 -right-5 flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200">
                <CheckCircle2 className="size-8" />
              </div>
            </div>

            <div className="absolute left-36 top-[46%] rounded-3xl bg-white p-8 shadow-[0_24px_80px_rgba(37,99,235,0.16)]">
              <BarChart3 className="size-32 text-blue-500" />
            </div>

            <div className="absolute bottom-20 left-24 flex size-28 items-center justify-center rounded-full border-[10px] border-blue-600 bg-white text-3xl font-bold text-blue-600 shadow-xl shadow-blue-100">
              75%
            </div>

            <div className="absolute bottom-20 left-[42%] flex items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-600 text-white">
                €
              </div>
              <div className="space-y-2">
                <div className="h-3 w-36 rounded-full bg-slate-100" />
                <div className="h-3 w-24 rounded-full bg-slate-100" />
              </div>
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>

            <div className="absolute right-28 top-40 flex items-center gap-8">
              <div className="flex size-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-100">
                <Clock3 className="size-11 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold leading-tight text-[#071a3d]">
                Controla tus cobros<br />
                <span className="text-blue-600">en tiempo real</span>
              </h2>
            </div>

            <div className="absolute right-28 top-[43%] flex items-center gap-8">
              <div className="flex size-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-100">
                <BarChart3 className="size-11 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold leading-tight text-[#071a3d]">
                Reduce la morosidad<br />
                hasta un <span className="text-blue-600">40%</span>
              </h2>
            </div>

            <div className="absolute right-28 bottom-28 flex items-center gap-8">
              <div className="flex size-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-100">
                <ShieldCheck className="size-11 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold leading-tight text-[#071a3d]">
                Ahorra <span className="text-blue-600">15 horas</span><br />
                semanales en gestión
              </h2>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
