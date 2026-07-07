import Link from "next/link";

import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserRole } from "@/lib/permissions/current-role";

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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ajustes</h1>
          <p className="mt-2 text-muted-foreground">
            Datos de la organizacion activa y usuarios conectados.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Organizacion</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Informacion principal de la empresa.
              </p>
            </div>

            <dl className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Nombre</dt>
                <dd className="mt-1 font-medium">{organization.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">NIF/CIF</dt>
                <dd className="mt-1 font-medium">{organization.taxId || "No indicado"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email de facturacion</dt>
                <dd className="mt-1 font-medium">{organization.billingEmail || "No indicado"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Moneda</dt>
                <dd className="mt-1 font-medium">{organization.defaultCurrency}</dd>
              </div>
            </dl>
          </section>

          <aside className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Tu acceso</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Rol actual dentro de esta organizacion.
            </p>
            <p className="mt-5 w-fit rounded-md border px-3 py-1.5 text-sm font-medium">
              {formatRole(role)}
            </p>
          </aside>
        </div>

        <section className="mt-6 rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Usuarios</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Miembros vinculados a la organizacion.
            </p>
          </div>

          <div className="divide-y">
            {organization.members.map((member) => (
              <div key={member.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-medium">{member.user.name || "Usuario sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
                <span className="w-fit rounded-md border px-2.5 py-1 text-xs font-medium">
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
