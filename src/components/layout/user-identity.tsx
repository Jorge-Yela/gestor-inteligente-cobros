import { auth } from "@/../auth";
import { prisma } from "@/lib/db/prisma";

export async function UserIdentity() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const membership = await prisma.organizationMember.findFirst({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "asc" },
    select: { role: true, user: { select: { name: true } } },
  });

  const roles = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    VIEWER: "Solo lectura",
  };

  return (
    <div className="min-w-0 max-w-56 break-words">
      <p className="text-sm font-semibold">
        {membership?.user.name || session.user.name || session.user.email}
      </p>
      <p className="text-xs text-slate-500">
        {membership ? roles[membership.role] : "Sin organización"}
      </p>
    </div>
  );
}
