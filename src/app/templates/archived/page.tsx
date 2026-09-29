import Link from "next/link";
import { Archive, ArchiveRestore } from "lucide-react";

import { TemplateTone } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { restoreTemplate } from "@/server/actions/restore-template";

function formatTone(tone: TemplateTone) {
  const labels: Record<TemplateTone, string> = {
    FRIENDLY: "Amable",
    FIRM: "Firme",
    FINAL_NOTICE: "Último aviso",
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
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/templates" className="text-sm text-slate-500 hover:text-blue-600">
              Volver a plantillas
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-normal">Plantillas archivadas</h1>
            <p className="mt-2 text-slate-500">
              Plantillas ocultas de la lista principal. Puedes restaurarlas cuando las necesites.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <section className="border-y border-slate-200 py-10 text-center">
          <Archive className="mx-auto size-8 text-blue-600" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">No hay plantillas archivadas</h2>
          <Button asChild variant="outline" className="mt-5 h-11 rounded-lg border-slate-200 bg-white px-5">
            <Link href="/templates">Volver a plantillas</Link>
          </Button>
        </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <article key={template.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="break-words font-semibold">{template.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{formatTone(template.tone)}</p>
                  </div>

                  <span className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium">
                    Archivada
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-medium">Archivada el</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(template.archivedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Asunto</p>
                    <p className="mt-1 text-sm text-slate-500">{template.subject}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Cuerpo</p>
                    <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm leading-6 text-slate-500">
                      {template.body}
                    </p>
                  </div>

                  <form action={restoreTemplate}>
                    <input type="hidden" name="templateId" value={template.id} />
                    <Button type="submit" variant="outline" className="h-11 rounded-lg border-slate-200">
                      <ArchiveRestore className="size-4" aria-hidden="true" />
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
