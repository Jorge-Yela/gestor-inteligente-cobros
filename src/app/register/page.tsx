import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { registerUser } from "@/server/actions/register-user";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    "missing-fields": "Completa todos los campos.",
    "weak-password": "La contraseña debe tener al menos 8 caracteres.",
    "user-exists": "Ya existe una cuenta con ese correo.",
  };

  return error ? messages[error] : null;
}

const benefits = [
  "20 días de prueba gratuita",
  "Sin cargo hasta finalizar la prueba",
  "Acceso completo desde el primer día",
];

const highlights = [
  {
    label: "Facturas bajo control",
    detail: "Importa, revisa y prioriza los cobros pendientes.",
    icon: FileText,
  },
  {
    label: "Reclamaciones listas",
    detail: "Prepara avisos personalizados por cliente y factura.",
    icon: Mail,
  },
  {
    label: "Seguimiento diario",
    detail: "Detecta tareas urgentes y clientes con más riesgo.",
    icon: Clock3,
  },
];

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[46%_54%]">
        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-blue-600">
                Ya tengo cuenta
              </Link>

              <div className="mt-8 flex items-center gap-3">
                <Image src="/norvalor-logo.png" alt="" width={64} height={64} className="size-16 shrink-0 object-contain" priority />
                <div>
                  <p className="text-3xl font-bold tracking-tight text-[#071a3d]">NORVALOR</p>
                  <p className="text-sm font-medium text-slate-500">Gestión inteligente de cobros</p>
                </div>
              </div>

              <h1 className="mt-8 text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Activa NORVALOR para tu empresa y empieza con 20 días de prueba gratuita.
              </p>
            </div>

            {errorMessage ? (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form action={registerUser} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-800">
                  Nombre
                </label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <User className="size-5 text-slate-300" />
                  <input id="name" name="name" required className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="organizationName" className="text-sm font-medium text-slate-800">
                  Empresa
                </label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Building2 className="size-5 text-slate-300" />
                  <input id="organizationName" name="organizationName" required className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-800">
                  Correo electrónico
                </label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Mail className="size-5 text-slate-300" />
                  <input id="email" name="email" type="email" required className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-800">
                  Contraseña
                </label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <LockKeyhole className="size-5 text-slate-300" />
                  <input id="password" name="password" type="password" required minLength={8} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
                Crear cuenta y continuar
                <ArrowRight className="size-4" />
              </Button>

              <p className="text-center text-xs leading-5 text-slate-400">
                Después de crear la cuenta activaras la prueba gratuita con Stripe.
              </p>
            </form>
          </div>
        </section>

        <section className="hidden bg-[#071a3d] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">NORVALOR</p>
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-blue-100">
                Prueba 20 días
              </div>
            </div>

            <div className="mt-20 max-w-xl">
              <h2 className="text-5xl font-bold leading-tight">
                Controla tus cobros antes de que se conviertan en un problema.
              </h2>
              <p className="mt-6 text-lg leading-8 text-blue-100">
                NORVALOR organiza clientes, facturas, reclamaciones y tareas del día para que cada cobro tenga seguimiento.
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {benefits.map((benefit) => (
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
                <p className="font-semibold">Alta segura con suscripción en modo prueba.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
