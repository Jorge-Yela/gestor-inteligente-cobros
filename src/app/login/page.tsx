import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { signInWithCredentials } from "@/server/actions/sign-in";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    label: "Cobros priorizados",
    detail: "Consulta que facturas necesitan acción hoy.",
    icon: Clock3,
  },
  {
    label: "Reclamaciones preparadas",
    detail: "Centraliza avisos, llamadas y seguimiento por factura.",
    icon: FileText,
  },
  {
    label: "Visión financiera",
    detail: "Mide deuda pendiente, cobrado y riesgo por cliente.",
    icon: BarChart3,
  },
];

export default async function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[46%_54%]">
        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <div className="flex items-center gap-3">
                <Image src="/norvalor-logo.png" alt="" width={64} height={64} className="size-16 shrink-0 object-contain" priority />
                <div>
                  <p className="text-3xl font-bold tracking-tight text-[#071a3d]">NORVALOR</p>
                  <p className="text-sm font-medium text-slate-500">Gestión inteligente de cobros</p>
                </div>
              </div>

              <h1 className="mt-8 text-3xl font-bold tracking-tight">Bienvenido de nuevo</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Inicia sesión para continuar gestionando tus clientes, facturas y reclamaciones.
              </p>
            </div>

            <form action={signInWithCredentials} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-800">
                  Correo electrónico
                </label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Mail className="size-5 text-slate-300" />
                  <input
                    id="email"
                    name="email"
                    type="email"

                                     className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-800">
                  Contraseña
                </label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <LockKeyhole className="size-5 text-slate-300" />
                  <input
                    id="password"
                    name="password"
                    type="password"

                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
                Entrar en NORVALOR
                <ArrowRight className="size-4" />
              </Button>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Introduce tu correo y contraseña.
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>

        <section className="hidden bg-[#071a3d] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">NORVALOR</p>
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-blue-100">
                Panel de cobros
              </div>
            </div>

            <div className="mt-20 max-w-xl">
              <h2 className="text-5xl font-bold leading-tight">
                Vuelve al control de tu cartera de cobros.
              </h2>
              <p className="mt-6 text-lg leading-8 text-blue-100">
                Revisa deuda pendiente, prepara reclamaciones y decide la siguiente acción con información clara.
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {[
                "Facturas pendientes ordenadas por riesgo",
                "Clientes con deuda localizada",
                "Reclamaciones y llamadas registradas",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm font-medium text-blue-50">
                  <CheckCircle2 className="size-5 text-emerald-300" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-blue-950/20">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-blue-100">{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-emerald-300" />
                <p className="font-semibold">Acceso privado para equipos de gestión de cobros.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
