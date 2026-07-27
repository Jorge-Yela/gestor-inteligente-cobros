import Link from "next/link";
import { Archive, FileText, Plus, ShieldCheck } from "lucide-react";

import { TemplateTone } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";

function formatTone(tone: TemplateTone) {
  const labels: Record<TemplateTone, string> = {
    FRIENDLY: "Amable",
    FIRM: "Firme",
    FINAL_NOTICE: "Ultimo aviso",
  };

  return labels[tone];
}

const toneGroups = [
  {
    tone: TemplateTone.FRIENDLY,
    title: "Recordatorio amable",
    description: "Primer contacto cordial para recordar una factura pendiente.",
    badge: "Amable",
    icon: FileText,
    className: "bg-blue-50 text-blue-700",
  },
  {
    tone: TemplateTone.FIRM,
    title: "Recordatorio firme",
    description: "Mensaje mas directo cuando ya existe retraso o falta de respuesta.",
    badge: "Firme",
    icon: ShieldCheck,
    className: "bg-amber-50 text-amber-700",
  },
  {
    tone: TemplateTone.FINAL_NOTICE,
    title: "Ultimo aviso",
    description: "Comunicacion formal antes de tomar medidas adicionales.",
    badge: "Ultimo aviso",
    icon: Archive,
    className: "bg-red-50 text-red-700",
  },
];

export default async function TemplatesPage() {
  const organizationId = await getCurrentOrganizationId();

  const templates = await prisma.template.findMany({
    where: {
      organizationId,
      archivedAt: null,
    },
    orderBy: [
      {
        tone: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });


  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
              Panel de control
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Plantillas</h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Biblioteca de mensajes para preparar reclamaciones segun el nivel del recordatorio.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-lg border-slate-200 bg-white">
              <Link href="/templates/archived">
                <Archive className="mr-2 size-4" />
                Archivadas
              </Link>
            </Button>
            <Button asChild className="rounded-lg bg-blue-600 shadow-sm hover:bg-blue-700">
              <Link href="/templates/new">
                <Plus className="mr-2 size-4" />
                Nueva plantilla
              </Link>
            </Button>
          </div>
        </div>

        <section className="space-y-5">
          {toneGroups.map((group) => {
            const groupTemplates = templates.filter((template) => template.tone === group.tone);
            const Icon = group.icon;

            return (
              <article key={group.tone} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${group.className}`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{group.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                    </div>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${group.className}`}>
                    {groupTemplates.length} versiones
                  </span>
                </div>

                {groupTemplates.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-slate-500">
                    Todavia no hay plantillas para este nivel.
                  </div>
                ) : (
                  <div className="grid gap-4 p-5 lg:grid-cols-2 xl:grid-cols-3">
                    {groupTemplates.map((template) => (
                      <div key={template.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {formatTone(template.tone)}
                            </p>
                          </div>

                          {template.isDefault ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Defecto
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">Asunto</p>
                            <p className="mt-1 line-clamp-2 text-sm font-medium">{template.subject}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">Mensaje</p>
                            <p className="mt-1 line-clamp-5 whitespace-pre-line text-sm leading-6 text-slate-500">
                              {template.body}
                            </p>
                          </div>
                        </div>

                        <Button asChild variant="outline" size="sm" className="mt-5 rounded-lg border-slate-200 bg-white">
                          <Link href={`/templates/${template.id}`}>Editar plantilla</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
