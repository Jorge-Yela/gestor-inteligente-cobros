import Link from "next/link";

import { TemplateTone } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { restoreTemplate } from "@/server/actions/restore-template";

function formatTone(tone: TemplateTone) {
  const labels: Record<TemplateTone, string> = {
    FRIENDLY: "Amistoso",
    FIRM: "Firme",
    FINAL_NOTICE: "Ultimo aviso",
  };

  return labels[tone];
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Sin fecha";
}

export default async function ArchivedTemplatesPage() {
  const organizationId = await getCurrentOrganizationId();

  const templates = await prisma.template.findMany({
    where: {
      organizationId,
      archivedAt: {
        not: null,
      },
    },
    orderBy: {
      archivedAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
              Volver a plantillas
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Plantillas archivadas</h1>
            <p className="mt-2 text-muted-foreground">
              Plantillas ocultas de la lista principal. Puedes restaurarlas cuando las necesites.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              No hay plantillas archivadas.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            {templates.map((template) => (
              <article key={template.id} className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{template.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{formatTone(template.tone)}</p>
                  </div>

                  <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                    Archivada
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-medium">Archivada el</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(template.archivedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Asunto</p>
                    <p className="mt-1 text-sm text-muted-foreground">{template.subject}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Cuerpo</p>
                    <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {template.body}
                    </p>
                  </div>

                  <form action={restoreTemplate}>
                    <input type="hidden" name="templateId" value={template.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Restaurar
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
