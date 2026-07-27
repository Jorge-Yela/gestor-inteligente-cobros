import Link from "next/link";
import { Building2, Mail, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserRole } from "@/lib/permissions/current-role";
import { updateOrganizationSettings } from "@/server/actions/update-organization-settings";

function formatRole(role: string) {
  const labels: Record<string, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    VIEWER: "Solo lectura",
  };

  return labels[role] || role;
}

export default async function SettingsPage() {
  const organizationId = await getCurrentOrganizationId();
  const role = await getCurrentUserRole();

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Panel de control
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Configuracion</h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Ajustes de la organizacion, datos de facturacion y accesos del equipo.
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {formatRole(role)}
          </span>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={Building2}
            label="Organizacion"
            value={organization.name}
            detail="Empresa activa"
            tone="blue"
          />
          <SummaryCard
            icon={Mail}
            label="Email facturacion"
            value={organization.billingEmail || "Sin email"}
            detail="Contacto administrativo"
            tone="emerald"
          />
          <SummaryCard
            icon={Users}
            label="Usuarios"
            value={String(organization.members.length)}
            detail="Miembros conectados"
            tone="violet"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Datos de organizacion</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informacion principal usada en facturas y reclamaciones.
                </p>
              </div>
            </div>

            <form action={updateOrganizationSettings} className="grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={organization.name}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="taxId" className="text-sm font-medium text-slate-700">
                  NIF/CIF
                </label>
                <input
                  id="taxId"
                  name="taxId"
                  defaultValue={organization.taxId || ""}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="billingEmail" className="text-sm font-medium text-slate-700">
                  Email de facturacion
                </label>
                <input
                  id="billingEmail"
                  name="billingEmail"
                  type="email"
                  defaultValue={organization.billingEmail || ""}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <span className="text-sm font-medium text-slate-700">Moneda</span>
                <p className="mt-2 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold">
                  {organization.defaultCurrency}
                </p>
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" className="rounded-lg">
                  Guardar cambios
                </Button>
              </div>
            </form>
          </article>

          <aside className="space-y-5">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold">Tu acceso</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Rol actual dentro de esta organizacion.
              </p>
              <p className="mt-5 w-fit rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                {formatRole(role)}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Preferencias</h2>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-sm text-slate-500">Moneda</dt>
                  <dd className="mt-1 font-medium">{organization.defaultCurrency}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Usuarios activos</dt>
                  <dd className="mt-1 font-medium">{organization.members.length}</dd>
                </div>
              </dl>
            </article>
          </aside>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Usuarios</h2>
              <p className="mt-1 text-sm text-slate-500">
                Miembros vinculados a la organizacion.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {organization.members.map((member) => (
              <div key={member.id} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold">{member.user.name || "Usuario sin nombre"}</p>
                  <p className="mt-1 text-sm text-slate-500">{member.user.email}</p>
                </div>
                <span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {formatRole(member.role)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "emerald" | "violet";
  icon: typeof Building2;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex size-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </article>
  );
}
