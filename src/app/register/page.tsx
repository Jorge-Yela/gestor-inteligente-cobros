import Link from "next/link";
import { ArrowRight, Building2, LockKeyhole, Mail, User } from "lucide-react";

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

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-10">
        <div className="w-full">
          <div className="mb-8">
            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Volver a iniciar sesion
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Crear cuenta en NORVALOR</h1>
            <p className="mt-2 text-sm text-slate-500">
              Crea tu cuenta y activa tu suscripcion mensual con 20 dias de prueba.
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form action={registerUser} className="space-y-5 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-slate-800">
                Nombre
              </label>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                <User className="size-5 text-slate-300" />
                <input id="name" name="name" required className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="organizationName" className="text-sm font-medium text-slate-800">
                Empresa
              </label>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                <Building2 className="size-5 text-slate-300" />
                <input id="organizationName" name="organizationName" required className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-800">
                Correo electronico
              </label>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                <Mail className="size-5 text-slate-300" />
                <input id="email" name="email" type="email" required className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-800">
                Contraseña
              </label>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                <LockKeyhole className="size-5 text-slate-300" />
                <input id="password" name="password" type="password" required minLength={8} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>

            <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-700">
              Crear cuenta
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
